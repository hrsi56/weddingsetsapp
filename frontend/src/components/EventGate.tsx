import React from "react";
import {
  Box,
  Text,
  List, ListItem, ListIcon, Center,
  Heading,
  VStack,
  Link as ChakraLink,
  Button,
  Stack, HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaHeart } from "react-icons/fa";
import { EVENT_DATE , venue, eventSchedule} from "../eventD";


/* ------------------------------------------------------------
 *  HELPER — Hebrew Gematria (fixed)
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

/** מחזיר תאריך עברי מלא בגימטריה */
const getHebrewDate = (date: Date): string => {
  // אזור-זמן ישראל מונע קפיצות יום ב-UTC
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
 *  COMPONENT
 * ---------------------------------------------------------- */
const EventGate: React.FC = () => {
  const hebrewDate = getHebrewDate(EVENT_DATE);

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
  const quoteClr = useColorModeValue("gray.600", "gray.400");
  const bgco = useColorModeValue ("#F5F8F3",  "rgba(230, 255, 251, 0.2)");
  const textColor = useColorModeValue("primary", "#B5F2F0");

  return (
    <Box
      layerStyle="card"
      bg={cardBg}
      maxW="lg"
      mx="auto"
      mt={6}
      textAlign="center"
      dir="rtl"
      position="relative"
    >
      {/* בס״ד */}
      <Text position="absolute" top={4} right={4} fontWeight="bold">
        בס״ד
      </Text>

      {/* ציטוט */}
      <Text as="blockquote" fontSize="xl" color={quoteClr} mb={10} lineHeight="tall">
        "מתנה כזאת של פעם בחיים<br />
        צריך לשמור עליה עולמי עולמים..."
      </Text>

      <VStack gap={6} color="text.primary">
        {/* שמות */}
        <VStack gap={1}>
          <Heading fontSize="4xl" color="primary">
            טובת רייטר
          </Heading>
          <Heading fontSize="4xl" color="primary">
            ירדן ויקטור דג׳ורנו
          </Heading>
        </VStack>

        {/* תאריך ומיקום */}
        <VStack gap={2}>
          <Text fontSize="lg">{eventWeekday},</Text>
          <VStack>
            <Text fontSize="xl" fontWeight="semibold">
              {EVENT_DATE.toLocaleDateString("he-IL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
            <Text fontSize="xl" fontWeight="semibold">
              {hebrewDate}
            </Text>
          </VStack>
          <Text fontSize="lg">
            באולמי <strong>{venue.name}</strong>, {venue.address}
          </Text>
        </VStack>

        {/* לו"ז */}
        <VStack gap={1}>
          {eventSchedule.map((item, i) => (
            <Text key={i}>
              <strong>{item.time}</strong> – {item.label}
            </Text>
          ))}
        </VStack>

        {/* קישורי ניווט */}
        <VStack gap={2}>
          <Text fontWeight="semibold">להגעה נוחה:</Text>
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

        {/* הודעות */}
        <Box w="auto" bg={bgco} py={4} borderRadius="xl">
          <Center>
            <List spacing={2} px={4} textAlign="right" dir="rtl" color={textColor}>
              <ListItem>
                <ListIcon as={FaHeart} color={textColor} />
                הקהל מתבקש להגיע בלבוש צנוע.
              </ListItem>
              <ListItem>
                <ListIcon as={FaHeart} color={textColor} />
                רחבת הריקודים תהיה בהפרדה.
              </ListItem>
            </List>
          </Center>
        </Box>
      </VStack>

    </Box>
  );
};

export default EventGate;