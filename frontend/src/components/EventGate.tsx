import React from "react";
import {
  Box,
  Text,
  Heading,
  VStack,
  Link as ChakraLink,
  Button,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { EVENT_DATE , venue, eventSchedule} from "../eventD";


/* ------------------------------------------------------------
 * HELPER — Hebrew Gematria (ללא שינוי)
 * ---------------------------------------------------------- */
const letters1to9 = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"] as const;

const numberToHebrewGematriaDay = (day: number): string => {
  const map = [
    "", // index 0 – לא שימושי
    ...letters1to9,                 // 1-9
    "י", "יא", "יב", "יג", "יד",    // 10-14
    "טו", "טז", "יז", "יח", "יט",   // 15-19
    "כ", "כא", "כב", "כג", "כד",
    "כה", "כו", "כז", "כח", "כט", "ל",
  ] as const;

  const raw = map[day] ?? day.toString();
  return raw.length > 1
    ? `${raw.slice(0, -1)}״${raw.slice(-1)}`
    : `${raw}׳`;
};

const numberToHebrewGematriaYear = (y: number): string => {
  const thousands = Math.floor(y / 1000);
  const thousandsStr = thousands ? `${"אבגדהוזחט"[thousands - 1]}׳` : "";
  let n = y % 1000;
  let out = "";

  const hundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
  const tens     = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];

  if (n >= 100) {
    out += hundreds[Math.floor(n / 100)];
    n %= 100;
  }
  if (n === 15) out += "טו";
  else if (n === 16) out += "טז";
  else {
    if (n >= 10) {
      out += tens[Math.floor(n / 10)];
      n %= 10;
    }
    if (n) out += letters1to9[n - 1];   // ‎1→א, 2→ב …
  }

  return thousandsStr + (
    out.length > 1
      ? `${out.slice(0, -1)}״${out.slice(-1)}`
      : `${out}׳`
  );
};

const getHebrewDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    calendar: "hebrew",
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const base = new Intl.DateTimeFormat("he-u-ca-hebrew", options).format(date);
  const day   = Number(base.match(/^(\d+)/)?.[1] ?? 0);
  const yearN = Number(base.match(/(\d{4})$/)?.[1] ?? 0);
  return base
    .replace(/^(\d+)/, numberToHebrewGematriaDay(day))
    .replace(/(\d{4})$/, numberToHebrewGematriaYear(yearN));
};

/* ------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------- */
const EventGate: React.FC = () => {

  // --- לוגיקה לחישוב תאריך עברי "אור ל..." ---
  const dayOfWeek = EVENT_DATE.getDay(); // 0=Sunday, 1=Monday...
  // אם היום הוא ראשון (0) עד חמישי (4), אנחנו רוצים להציג את התאריך של מחר
  const isSunToThu = dayOfWeek >= 0 && dayOfWeek <= 4;

  // חישוב התאריך העברי: אם יום חול -> מחר, אחרת -> היום
  const hebrewDateTarget = new Date(EVENT_DATE);
  if (isSunToThu) {
    hebrewDateTarget.setDate(hebrewDateTarget.getDate() + 1);
  }

  const baseHebrewDate = getHebrewDate(hebrewDateTarget);
  const hebrewDateDisplay = isSunToThu ? `אור ל${baseHebrewDate}` : baseHebrewDate;
  // -------------------------------------------

  const eventWeekday = EVENT_DATE.toLocaleDateString("he-IL", {
    weekday: "long",
  });

  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    venue.address
  )}`;
  const wazeLink = `https://waze.com/ul?q=${encodeURIComponent(
    venue.address
  )}&navigate=yes`;

  /* theme-aware colours */
  const cardBg = useColorModeValue("bg.canvas", "gray.800");

  return (
    <Box
      layerStyle="card"
      bg={cardBg}
      maxW="lg"
      mx="auto"
      textAlign="center"
      dir="rtl"
      position="relative"
    >
      {/* בס״ד */}
        {/* ציטוט */}
        <Text fontSize="md"  color="primary">
          "מתנה כזאת של פעם בחיים<br/>
          צריך לשמור עליה עולמי עולמים..."
        </Text>

      <VStack gap={2} color="text.primary">
        <Text fontSize="lg">אנו מתכבדים להזמינכם לחתונתם של</Text>
        {/* שמות */}
        <Heading fontSize="4xl" color="primary" fontWeight="semibold">
            טובת וירדן (ויקו)
        </Heading>

        {/* תאריך ומיקום */}
        <VStack gap={2} mt={2}>
          {/* כאן השינוי: פיצול הטקסט כדי להגדיל את היום בשבוע */}
          <Text fontSize="xl">
            אשר תיערך, אי״ה,
            <Text as="span" fontSize="2xl" fontWeight="bold">
              ב{eventWeekday}
            </Text>
            ,
          </Text>

          <HStack gap={2}>
            <Text fontSize="2xl" fontWeight="semibold">
              {hebrewDateDisplay}
            </Text>
            <Text fontSize="2xl" fontWeight="semibold">
              |
            </Text>
            <Text fontSize="2xl" fontWeight="semibold">
              {EVENT_DATE.toLocaleDateString("he-IL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
          </HStack>
          <HStack gap={2} mt={1}>
            <Text fontSize="2xl">
              <strong>ב{venue.name}</strong>
            </Text>
            <Text fontSize="lg">
              {venue.address}
            </Text>
          </HStack>
        </VStack>

        {/* לו"ז */}
        <VStack mt={1} alignItems="flex-start">
          {eventSchedule.map((item, i) => (
            <Text key={i}>
              <strong>{item.time}</strong> – {item.label}
            </Text>
          ))}
        </VStack>


        {/* START: הודעות עם אפקט זכוכית */}
        <Heading fontSize="xl" color="primary" fontWeight="semibold">
            נשמח בבואכם, משפחות רייטר ודג׳ורנו
        </Heading>


        {/* קישורי ניווט */}
        <VStack gap={2}>
          <HStack>
            <ChakraLink href={googleMapsLink} isExternal _hover={{ textDecoration: "none" }}>
              <Button variant="outline" colorScheme="brand">
                Google Maps
              </Button>
            </ChakraLink>
            <ChakraLink href={wazeLink} isExternal _hover={{ textDecoration: "none" }}>
              <Button variant="outline" colorScheme="brand">
                Waze
              </Button>
            </ChakraLink>
          </HStack>
        </VStack>

        {/* END: הודעות עם אפקט זכוכית */}
      </VStack>

    </Box>
  );
};

export default EventGate;