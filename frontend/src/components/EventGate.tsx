// src/components/EventGate.tsx
import React from "react";
import {
    Box,
    Text,
    Heading,
    VStack,
    Link as ChakraLink,
    Button,
    Stack,
} from "@chakra-ui/react";
import { EVENT_DATE } from "../eventDate"; // וודאו שקיים קובץ src/eventDate.ts שמייצא את EVENT_DATE

/**
 * ממיר מספר ביום (1–30) לאות עברית בגימטריה פשוטה
 */
const numberToHebrewGematriaDay = (day: number): string => {
    // פונקציה זו נשארת כפי שהיא, היא מטפלת היטב בימים 1-30
    const hebrewLetters = [
        "", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י",
        "יא", "יב", "יג", "יד", "טו", "טז", "יז", "יח", "יט", "כ",
        "כא", "כב", "כג", "כד", "כה", "כו", "כז", "כח", "כט", "ל",
    ];
    if (day >= 1 && day <= 30) {
        // הוספת גרשיים לפני האות האחרונה אם יש יותר מאות אחת
        const dayStr = hebrewLetters[day];
        if (dayStr.length > 1) {
            return dayStr.slice(0, -1) + '״' + dayStr.slice(-1);
        }
        return dayStr + '׳'; // הוספת גרש אם יש אות אחת
    }
    return String(day);
};

/**
 * פונקציית עזר להמרת מספר לגימטריה (עבור שנים)
 * @param {number} num - המספר המלא של השנה (למשל 5786)
 * @returns {string} - השנה בגימטריה (למשל "ה׳תשפ״ו")
 */
const numberToHebrewGematriaYear = (num: number): string => {
    if (num <= 0) {
        return "";
    }

    // הוספת אות לאלפים (ה' לאלף החמישי)
    const thousands = Math.floor(num / 1000);
    let hebrewYear = "";
    if (thousands > 0) {
        hebrewYear = "אבגדהוזחט"[thousands - 1] + "׳";
    }

    let n = num % 1000;
    let str = "";

    const hundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
    const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
    const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];

    if (n >= 100) {
        str += hundreds[Math.floor(n / 100)];
        n %= 100;
    }

    // טיפול במקרים מיוחדים של ט"ו ו-ט"ז
    if (n === 15) {
        str += "טו";
    } else if (n === 16) {
        str += "טז";
    } else {
        if (n >= 10) {
            str += tens[Math.floor(n / 10)];
            n %= 10;
        }
        if (n >= 1) {
            str += ones[n];
        }
    }

    // הוספת גרשיים לפני האות האחרונה אם יש יותר מאות אחת
    if (str.length > 1) {
        return hebrewYear + str.slice(0, -1) + '״' + str.slice(-1);
    }
    // הוספת גרש אם יש אות בודדת
    if (str.length === 1) {
        return hebrewYear + str + '׳';
    }

    return hebrewYear; // במקרה של שנה עגולה כמו 5000
};


/**
 * מחזיר תאריך עברי, כשהיום והשנה מוצגים בגימטריה
 */
const getHebrewDate = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "תאריך לא תקין";
    }
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        calendar: "hebrew",
        timeZone: "UTC", // חשוב לקבוע TimeZone כדי למנוע אי-דיוקים
    };
    try {
        const formattedDate = new Intl.DateTimeFormat(
            "he-u-ca-hebrew",
            options
        ).format(date);

        // משתנה שיכיל את התאריך הסופי
        let finalDateStr = formattedDate;

        // 1. המרת היום לגימטריה (כמו בקוד המקורי)
        const dayMatch = finalDateStr.match(/^(\d+)/);
        if (dayMatch && dayMatch[1]) {
            const numericDay = parseInt(dayMatch[1], 10);
            const gematriaDay = numberToHebrewGematriaDay(numericDay);
            finalDateStr = finalDateStr.replace(/^(\d+)/, gematriaDay);
        }

        // 2. המרת השנה לגימטריה
        const yearMatch = finalDateStr.match(/(\d{4})$/); // חיפוש 4 ספרות בסוף המחרוזת
        if (yearMatch && yearMatch[1]) {
            const numericYear = parseInt(yearMatch[1], 10);
            const gematriaYear = numberToHebrewGematriaYear(numericYear);
            finalDateStr = finalDateStr.replace(/(\d{4})$/, gematriaYear);
        }

        return finalDateStr;

    } catch (e) {
        console.error("Error formatting Hebrew date:", e);
        return "שגיאה בהמרת התאריך";
    }
};

// --- דוגמת שימוש ---
// שימוש בתאריך של היום (יוני 2025) לצורך הדגמה
const today = new Date(); // למשל: 7 ביוני 2025
// התאריך העברי המקביל הוא א' בסיוון ה'תשפ"ה
const hebrewDate = getHebrewDate(today);
console.log(`התאריך הלועזי: ${today.toDateString()}`);
console.log(`התאריך העברי: ${hebrewDate}`);

// דוגמה נוספת עבור שנה עתידית
const futureDate = new Date('2026-09-23T12:00:00Z'); // י"ב בתשרי ה'תשפ"ז
console.log(`\nהתאריך הלועזי: ${futureDate.toDateString()}`);
console.log(`התאריך העברי: ${getHebrewDate(futureDate)}`);

const EventGate: React.FC = () => {
    const eventDate = EVENT_DATE;
    const hebrewDate = getHebrewDate(eventDate);

    const venueName = "אולמי אודיאסה";
    const venueAddress = "הנרייטה סולד 4, באר שבע";
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        venueAddress
    )}`;
    const wazeLink = `https://waze.com/ul?q=${encodeURIComponent(venueAddress)}&navigate=yes`;

    return (
        <Box
            bg="brand.pureWhite"
            borderRadius="xlRounded"
            boxShadow="soft-lg"
            maxW="lg"
            mx="auto"
            p={6}
            position="relative"
            mt={4}
        >
            {/* בס"ד בצד ימין */}
            <Text
                position="absolute"
                top={4}
                right={4}
                fontSize="lg"
                fontWeight="bold"
            >
                בס"ד
            </Text>

            {/* ציטוט פתיחה */}
            <Box mb={8}>
                <Text
                    as="blockquote"
                    fontStyle="italic"
                    fontSize="xl"
                    color="gray.600"
                    lineHeight="tall"
                >

                    <br />
                    "מתנה כזאת של פעם בחיים
                    <br />
                    צריך לשמור עליה עולמי עולמים..."
                </Text>
            </Box>

            <VStack gap={6} textAlign="center" color="gray.800">
                {/* ברכת פתיחה */}
                <Text fontSize="2xl" lineHeight="short">
                    אנו מתכבדים להזמינכם לחגוג עמנו
                    <br />
                    את יום נישואינו
                </Text>

                {/* שמות החתן והכלה */}
                <VStack gap={1}>
                    <Heading fontSize="4xl" fontFamily="heading" color="brand.sunriseGold">
                        טובת רייטר
                    </Heading>
                    <Text fontSize="2xl" color="gray.700">
                        &amp;
                    </Text>
                    <Heading fontSize="4xl" fontFamily="heading" color="brand.sunriseGold">
                        ירדן ויקטור דג׳ורנו
                    </Heading>
                </VStack>

                {/* ברכת ההורים */}
                <Text fontSize="lg" color="gray.800">
                    הבונים בית נאמן בישראל
                    <br />
                    בעזרת ה&apos; יתברך
                </Text>

                {/* פרטי האירוע ותאריך */}
                <VStack gap={2}>
                    <Text>החתונה תתקיים אי״ה ביום חמישי,</Text>
                    <VStack>
                        <Text fontSize="2xl" fontWeight="semibold">
                            {eventDate.toLocaleDateString("he-IL", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })}
                        </Text>
                        <Text fontSize="2xl" fontWeight="semibold">
                            {hebrewDate}
                        </Text>
                    </VStack>
                    <Text>
                        באולמי <strong>{venueName}</strong>, {venueAddress}
                    </Text>
                </VStack>

                {/* לו״ז האירוע */}
                <VStack gap={1}>
                    <Text>
                        <Text as="strong">18:00</Text> - כיסא כלה
                    </Text>
                    <Text>
                        <Text as="strong">18:30</Text> - קבלת פנים
                    </Text>
                    <Text>
                        <Text as="strong">19:00</Text> - חופה וקידושין
                    </Text>
                </VStack>

                {/* מידע נוסף */}
                <Box
                    bg="brand.pureWhite"
                    p={4}
                    borderRadius="xlRounded"
                    boxShadow="soft-lg"
                    w="100%"
                >
                    <VStack gap={2}>
                        <Text>הקהל מתבקש להגיע בלבוש צנוע.</Text>
                        <Text>ולידעתכם: רחבת הריקודים תהיה בהפרדה.</Text>
                    </VStack>
                </Box>

                {/* קישורי ניווט */}
                <VStack gap={2}>
                    <Text fontWeight="semibold">להגעה נוחה:</Text>
                    <Stack
                        direction={["column", "row"]}
                        gap={3}
                        align="center"
                        justify="center"
                    >
                        <ChakraLink href={googleMapsLink} isExternal _hover={{ textDecoration: "none" }}>
                            <Button variant="secondary">ניווט עם Google Maps</Button>
                        </ChakraLink>
                        <ChakraLink href={wazeLink} isExternal _hover={{ textDecoration: "none" }}>
                            <Button variant="secondary">ניווט עם Waze</Button>
                        </ChakraLink>
                    </Stack>
                </VStack>

                {/* קריאת סיום */}
                <Text fontSize="2xl" fontFamily="heading" color="brand.sunriseGold">
                    נשמח לראותכם!
                </Text>
            </VStack>

            {/* Footer פשוט עם שמות */}
            <Box
                mt={8}
                pt={4}
                borderTopWidth="1px"
                borderColor="brand.lightGray"
                textAlign="center"
            >
                <Text color="gray.800">טובת וירדן</Text>
            </Box>
        </Box>
    );
};

export default EventGate;