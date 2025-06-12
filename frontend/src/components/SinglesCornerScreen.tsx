// src/components/SinglesCornerScreen.tsx
import React, { useEffect, useState } from "react";
import {
    Box,
    VStack,
    Heading,
    Text,
    Input,
    Select,
    Textarea,
    Button,
    SimpleGrid,
    FormControl,
} from "@chakra-ui/react";

/* --------------------------------------------------------------------
 *  TYPES
 * ------------------------------------------------------------------*/
interface Single {
    name: string;
    gender: "זכר" | "נקבה";
    about: string;
}

/* --------------------------------------------------------------------
 *  API HELPERS
 * ------------------------------------------------------------------*/
const BASE = "/api";

// endpoint שמחזיר { men: Single[], women: Single[] }
const fetchSingles = async (): Promise<{ men: Single[]; women: Single[] }> => {
    const res = await fetch(`${BASE}/singles`);
    if (!res.ok) {
        throw new Error("Failed to fetch singles");
    }
    return res.json();
};

const addSingle = async (payload: Single) => {
    await fetch(`${BASE}/singles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
};

const addFeedback = async (name: string, feedback: string) => {
    await fetch(`${BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, feedback }),
    });
};

/* --------------------------------------------------------------------
 *  COMPONENT
 * ------------------------------------------------------------------*/
const SinglesCornerScreen: React.FC = () => {
    /* --------------------------- DATA --------------------------- */
    const [men, setMen] = useState<Single[]>([]);
    const [women, setWomen] = useState<Single[]>([]);

    /* ---------------------- ADD SINGLE FORM --------------------- */
    const [sName, setSName] = useState("");
    const [gender, setGender] = useState<"" | "זכר" | "נקבה">("");
    const [about, setAbout] = useState("");
    const [sStatus, setSStatus] = useState<null | "ok" | "err">(null);

    /* ---------------------- FEEDBACK FORM ---------------------- */
    const [fName, setFName] = useState("");
    const [feedback, setFeedback] = useState("");
    const [fStatus, setFStatus] = useState<null | "ok" | "err">(null);

    /* -----------------------------------------------------------------
     * Fetch initial lists on mount
     * ----------------------------------------------------------------- */
    useEffect(() => {
        (async () => {
            try {
                const data = await fetchSingles();
                setMen(data.men);
                setWomen(data.women);
            } catch {
                // אפשר להוסיף טיפול בשגיאה
            }
        })();
    }, []);

    /* -----------------------------------------------------------------
     *  HANDLE ADD SINGLE
     * ----------------------------------------------------------------- */
    const handleAddSingle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sName.trim() || !gender || !about.trim()) {
            setSStatus("err");
            return;
        }
        try {
            await addSingle({ name: sName.trim(), gender, about: about.trim() });
            setSName("");
            setGender("");
            setAbout("");
            setSStatus("ok");
            const data = await fetchSingles();
            setMen(data.men);
            setWomen(data.women);
        } catch {
            setSStatus("err");
        }
    };

    /* -----------------------------------------------------------------
     *  HANDLE FEEDBACK
     * ----------------------------------------------------------------- */
    const handleFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fName.trim() || !feedback.trim()) {
            setFStatus("err");
            return;
        }
        try {
            await addFeedback(fName.trim(), feedback.trim());
            setFName("");
            setFeedback("");
            setFStatus("ok");
        } catch {
            setFStatus("err");
        }
    };

    /* -----------------------------------------------------------------
     *  JSX
     * ----------------------------------------------------------------- */
    return (
        <Box
            id="singles"
            maxW="5xl"
            mx="auto"
            p={6}
            bg="brand.pureWhite"
            boxShadow="soft-lg"
            borderRadius="xlRounded"
            textAlign="right"
            dir="rtl"
            mb={12}
        >
            {/* כותרת המסך */}
            <Heading
                as="h2"
                size="2xl"
                fontFamily="heading"
                color="brand.sunriseGold"
                textAlign="center"
                mb={8}
            >
                💙 פינת ההיכרויות 💙
            </Heading>

            {/* -------- טופס “קיר הרווקים/ות” -------- */}
            <Box as="form" onSubmit={handleAddSingle} mb={10}>
                <VStack gap={4}>
                    <Heading
                        as="h3"
                        size="lg"
                        fontFamily="heading"
                        color="brand.sunriseGold"
                        textAlign="center"
                    >
                        💞 קיר הרווקים והרווקות 💞
                    </Heading>

                    <FormControl>
                        <Input
                            placeholder="שם"
                            value={sName}
                            onChange={(e) => setSName(e.target.value)}
                            focusBorderColor="brand.sunriseGold"
                        />
                    </FormControl>

                    <FormControl>
                        <Select
                            placeholder="בחר/י מין"
                            value={gender}
                            onChange={(e) => setGender(e.target.value as any)}
                            focusBorderColor="brand.sunriseGold"
                        >
                            <option value="זכר">זכר</option>
                            <option value="נקבה">נקבה</option>
                        </Select>
                    </FormControl>

                    <FormControl>
                        <Textarea
                            placeholder="קצת עליי"
                            value={about}
                            onChange={(e) => setAbout(e.target.value)}
                            focusBorderColor="brand.sunriseGold"
                            minH="24"
                        />
                    </FormControl>

                    <Button type="submit" w="full" variant="solid" colorScheme="brand">
                        שלח/י
                    </Button>

                    {sStatus === "ok" && (
                        <Text color="green.500" textAlign="center">
                            ✅ נשלח בהצלחה!
                        </Text>
                    )}
                    {sStatus === "err" && (
                        <Text color="red.500" textAlign="center">
                            🛑 יש למלא את כל השדות (וגם לבחור מין).
                        </Text>
                    )}
                </VStack>
            </Box>

            {/* -------- רשימות רווקים / רווקות -------- */}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={10}>
                {/* --- גברים --- */}
                <Box>
                    <Heading
                        as="h4"
                        size="lg"
                        fontFamily="heading"
                        color="brand.sunriseGold"
                        textAlign="center"
                        mb={4}
                    >
                        👨 רווקים
                    </Heading>
                    {men.length === 0 ? (
                        <Text textAlign="center" color="gray.500">
                            אין נתונים.
                        </Text>
                    ) : (
                        <VStack gap={3}>
                            {men.map((s, i) => (
                                <Box
                                    key={i}
                                    w="full"
                                    bg="brand.pureWhite"
                                    boxShadow="soft-lg"
                                    borderRadius="xlRounded"
                                    p={4}
                                    textAlign="right"
                                >
                                    <Text fontFamily="heading" fontWeight="semibold">
                                        {s.name}
                                    </Text>
                                    <Text fontFamily="body" color="gray.700" whiteSpace="pre-wrap">
                                        {s.about}
                                    </Text>
                                </Box>
                            ))}
                        </VStack>
                    )}
                </Box>

                {/* --- נשים --- */}
                <Box>
                    <Heading
                        as="h4"
                        size="lg"
                        fontFamily="heading"
                        color="brand.sunriseGold"
                        textAlign="center"
                        mb={4}
                    >
                        👩 רווקות
                    </Heading>
                    {women.length === 0 ? (
                        <Text textAlign="center" color="gray.500">
                            אין נתונים.
                        </Text>
                    ) : (
                        <VStack gap={3}>
                            {women.map((s, i) => (
                                <Box
                                    key={i}
                                    w="full"
                                    bg="brand.pureWhite"
                                    boxShadow="soft-lg"
                                    borderRadius="xlRounded"
                                    p={4}
                                    textAlign="right"
                                >
                                    <Text fontFamily="heading" fontWeight="semibold">
                                        {s.name}
                                    </Text>
                                    <Text fontFamily="body" color="gray.700" whiteSpace="pre-wrap">
                                        {s.about}
                                    </Text>
                                </Box>
                            ))}
                        </VStack>
                    )}
                </Box>
            </SimpleGrid>

            {/* -------- טופס “נדאג לברר אם הדדי” -------- */}
            <Box as="form" onSubmit={handleFeedback}>
                <VStack gap={4}>
                    <Heading
                        as="h3"
                        size="lg"
                        fontFamily="heading"
                        color="brand.sunriseGold"
                        textAlign="center"
                    >
                        מישהו/י מצא/ה חן בעיניך? כתבו לנו ונדאג לברר אם זה הדדי
                    </Heading>

                    <FormControl>
                        <Input
                            placeholder="שם"
                            value={fName}
                            onChange={(e) => setFName(e.target.value)}
                            focusBorderColor="brand.sunriseGold"
                        />
                    </FormControl>

                    <FormControl>
                        <Textarea
                            placeholder="ההודעה שלך"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            focusBorderColor="brand.sunriseGold"
                            minH="24"
                        />
                    </FormControl>

                    <Button type="submit" w="full" variant="solid" colorScheme="brand">
                        שלח/י
                    </Button>

                    {fStatus === "ok" && (
                        <Text color="green.500" textAlign="center">
                            ✅ נשלח בהצלחה!
                        </Text>
                    )}
                    {fStatus === "err" && (
                        <Text color="red.500" textAlign="center">
                            🛑 יש למלא את כל השדות.
                        </Text>
                    )}
                </VStack>
            </Box>
        </Box>
    );
};

export default SinglesCornerScreen;