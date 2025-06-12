// src/components/RSVPScreen.tsx

import React, { useEffect, useState, useMemo } from "react";
import {
    VStack,
    HStack,
    Heading,
    Text,
    Input,
    Select,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Center,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  TYPES                                                             */
/* ------------------------------------------------------------------ */
interface User {
    id: number;
    name: string;
    phone: string;
    user_type: string;
    is_coming: "כן" | "לא" | null;
    num_guests: number;
    reserve_count: number;
    area: string | null;
}

interface Seat {
    id: number;
    row: string;
    col: number;
    area: string;
    status: "free" | "taken";
    owner_id: number | null;
}

interface TableRowData {
    טלפון: number;
    כיסא: string;
    שולחן: number | string;
    איזור: string | null;
    אורחים: number;
    שם: string;
}

/* ------------------------------------------------------------------ */
/*  API HELPERS                                                       */
/* ------------------------------------------------------------------ */
const BASE_URL = "/api";

// מחפש משתמשים לפי q
const searchGuest = async (query: string): Promise<User[]> => {
    const res = await fetch(`${BASE_URL}/users?q=${encodeURIComponent(query)}`);
    return res.json();
};

// משיכה של כיסאות לפי המשתמש
const getSeatsByUser = async (userId: number): Promise<Seat[]> => {
    const res = await fetch(`${BASE_URL}/seats/user/${userId}`);
    return res.json();
};

const loginOrCreate = async (name: string, phone: string): Promise<User> => {
    const r = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
    });
    return r.json();
};

const updateComing = async (userId: number, coming: boolean) => {
    await fetch(`${BASE_URL}/users/${userId}/coming`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coming }),
    });
};

const updateUser = async (userId: number, data: Partial<User>) => {
    await fetch(`${BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
};

const getAllSeats = async (): Promise<Seat[]> => {
    const res = await fetch(`${BASE_URL}/seats`);
    return res.json();
};

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                         */
/* ------------------------------------------------------------------ */
const RSVPScreen: React.FC = () => {
    const navigate = useNavigate();

    /* ------------------- GLOBAL UI STATE ------------------- */
    const [finished, setFinished] = useState<"תודה" | "מצטערים" | null>(null);

    // ברירת מחדל: מציגים את מסך ההתחברות
    const [showLogin, setShowLogin] = useState(true);
    const [showSearch, setShowSearch] = useState(false);

    /* ------------------- SEARCH STATE ---------------------- */
    const [query, setQuery] = useState("");
    const [tableData, setTableData] = useState<TableRowData[]>([]);

    /* ------------------- LOGIN STATE ----------------------- */
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loggedUser, setLoggedUser] = useState<User | null>(null);

    /* ------------------- RSVP STATE ------------------------ */
    const [comingChoice, setComingChoice] = useState<"כן" | "לא" | null>(null);
    const [numGuests, setNumGuests] = useState(1);
    const [areaOptions, setAreaOptions] = useState<string[]>([]);
    const [areaChoice, setAreaChoice] = useState("");

    /* -------------------------------------------------------- */
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [finished]);

    /* טעינת אזורים פעם אחת */
    useEffect(() => {
        getAllSeats().then((seats) => {
            const uniqueAreas = Array.from(new Set(seats.map((s) => s.area))).sort();
            setAreaOptions(uniqueAreas);
        });
    }, []);

    /* -------------------------------------------------------- */
    const handleSearch = async () => {
        if (query.trim().length < 2) return;
        const res = await searchGuest(query.trim());
        const rows: TableRowData[] = [];
        for (const user of res) {
            const seats = await getSeatsByUser(user.id);
            if (seats.length) {
                seats.forEach((s) =>
                    rows.push({
                        טלפון: Number(user.phone),
                        כיסא: s.row,
                        שולחן: s.col,
                        איזור: user.area,
                        אורחים: user.num_guests,
                        שם: user.name,
                    })
                );
            } else {
                rows.push({
                    טלפון: Number(user.phone),
                    כיסא: "נא לגשת לכניסה לקבלת מקומות",
                    שולחן: "—",
                    איזור: user.area,
                    אורחים: user.num_guests,
                    שם: user.name,
                });
            }
        }
        setTableData(rows);
    };

    /* -------------------------------------------------------- */
    const validateHebrew = (v: string) =>
        /^[\u0590-\u05FF]{2,}( [\u0590-\u05FF]{2,})+$/.test(v);
    const validatePhone = (v: string) => /^\d{10}$/.test(v);

    const handleLogin = async () => {
        if (!validateHebrew(name.trim())) {
            alert("שם מלא בעברית בלבד");
            return;
        }
        if (!validatePhone(phone.trim())) {
            alert("טלפון 10 ספרות");
            return;
        }

        // קיצור דרך לאדמין
        if (name.trim() === "ירדן" && phone.trim() === "0547957141") {
            navigate("/admin");
            return;
        }

        const user = await loginOrCreate(name.trim(), phone.trim());
        setLoggedUser(user);
        setShowLogin(false);
    };

    /* --- שמירת בחירת כן/לא --- */
    useEffect(() => {
        if (!loggedUser || !comingChoice) return;
        updateComing(loggedUser.id, comingChoice === "כן");
        if (comingChoice === "לא") setFinished("מצטערים");
    }, [comingChoice, loggedUser]);

    /* --- שמירת אזור + כמות אורחים --- */
    const handleSaveDetails = async () => {
        if (!loggedUser) return;
        await updateUser(loggedUser.id, {
            num_guests: numGuests,
            reserve_count: numGuests,
            area: areaChoice,
        });
        setFinished("תודה");
    };

    /* -------------------------------------------------------- */
    const renderTable = useMemo(() => {
        if (!tableData.length) {
            return (
                <Center>
                    <Text color="gray.500">לא נמצאו תוצאות.</Text>
                </Center>
            );
        }

        return (
            <TableContainer overflowX="auto">
                <Table size="sm" variant="striped">
                    <Thead>
                        <Tr bg="gray.200">
                            {Object.keys(tableData[0]).map((h) => (
                                <Th key={h} textAlign="center">
                                    {h}
                                </Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {tableData.map((row, idx) => (
                            <Tr key={idx} textAlign="center">
                                {Object.values(row).map((v, i) => (
                                    <Td key={i}>{v as string | number}</Td>
                                ))}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
        );
    }, [tableData]);

    /* ------------------- FINISH SCREENS -------------------- */
    if (finished === "תודה") {
        return (
            <Center mt={40}>
                <Text fontSize="2xl" fontWeight="bold" color="brand.sunriseGold">
                    תודה רבה! המקומות נשמרו בהצלחה 💖
                </Text>
            </Center>
        );
    }
    if (finished === "מצטערים") {
        return (
            <Center mt={40}>
                <Text fontSize="2xl" fontWeight="bold" color="red.600">
                    מצטערים שלא תוכלו להגיע. תודה על העדכון 💔
                </Text>
            </Center>
        );
    }

    /* --------------------------- RENDER -------------------- */
    return (
        <VStack gap={8} maxW="2xl" mx="auto" p={4} align="stretch" textAlign="right">
            {/* -- מסך התחברות -- */}
            {showLogin && !loggedUser && (
                <VStack
                    bg="brand.pureWhite"
                    boxShadow="soft-lg"
                    borderRadius="xlRounded"
                    maxW="md"
                    mx="auto"
                    gap={4}
                    p={6}
                >
                    <Heading as="h2" size="lg" textAlign="center" color="brand.sunriseGold" fontFamily="heading">
                        אישור הגעה
                    </Heading>
                    <Input
                        placeholder="שם מלא"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        variant="outline"
                        focusBorderColor="brand.sunriseGold"
                        dir="rtl"
                    />
                    <Input
                        placeholder="טלפון"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        variant="outline"
                        focusBorderColor="brand.sunriseGold"
                        dir="rtl"
                    />
                    <Button onClick={handleLogin} colorScheme="brand" variant="solid" w="full">
                        המשך
                    </Button>
                    {/* כפתור לעבור למסך חיפוש */}
                    <Button
                        onClick={() => {
                            setShowLogin(false);
                            setShowSearch(true);
                            setTableData([]);
                            setQuery("");
                        }}
                        colorScheme="brand"
                        variant="solid"
                        w="full"
                    >
                        חיפוש ברשומות
                    </Button>
                </VStack>
            )}

            {/* -- מסך חיפוש -- */}
            {showSearch && !loggedUser && (
                <VStack
                    bg="brand.pureWhite"
                    boxShadow="soft-lg"
                    borderRadius="xlRounded"
                    maxW="md"
                    mx="auto"
                    gap={4}
                    p={6}
                >
                    <Input
                        placeholder="🔍 חפש לפי שם או טלפון"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        variant="outline"
                        focusBorderColor="brand.sunriseGold"
                        dir="rtl"
                    />
                    <Button onClick={handleSearch} colorScheme="brand" variant="solid" w="full">
                        חפש/י
                    </Button>
                    {renderTable}
                    {/* כפתור “אישור הגעה” העובר למסך ההתחברות */}
                    <Button
                        onClick={() => {
                            setShowSearch(false);
                            setShowLogin(true);
                            setTableData([]);
                            setQuery("");
                        }}
                        colorScheme="brand"
                        variant="solid"
                        w="full"
                    >
                        אישור הגעה
                    </Button>
                </VStack>
            )}

            {/* -- אחרי התחברות -- */}
            {loggedUser && (
                <VStack
                    bg="brand.pureWhite"
                    boxShadow="soft-lg"
                    borderRadius="xlRounded"
                    maxW="md"
                    mx="auto"
                    gap={6}
                    p={6}
                >
                    <Heading as="h3" size="lg" textAlign="center" color="brand.sunriseGold" fontFamily="heading">
                        היי {loggedUser.name}!
                    </Heading>

                    {/* בחירת כן/לא */}
                    {!comingChoice && (
                        <HStack gap={6} justify="center">
                            <Button onClick={() => setComingChoice("כן")} colorScheme="brand" variant="solid" px={6} py={2}>
                                נגיע
                            </Button>
                            <Button colorScheme="red" variant="solid" px={6} py={2} onClick={() => setComingChoice("לא")}>
                                לא נגיע
                            </Button>
                        </HStack>
                    )}

                    {/* אם בחר "כן" */}
                    {comingChoice === "כן" && (
                        <>
                            <VStack gap={4} w="full">
                                <Text color="gray.700">כמה אורחים מגיעים?</Text>
                                <Input
                                    type="number"
                                    min={1}
                                    value={numGuests}
                                    onChange={(e) => setNumGuests(+e.target.value)}
                                    variant="outline"
                                    focusBorderColor="brand.sunriseGold"
                                />

                                <Text color="gray.700">בחר/י איזור ישיבה:</Text>
                                <Select
                                    placeholder="בחר/י..."
                                    value={areaChoice}
                                    onChange={(e) => setAreaChoice(e.target.value)}
                                    variant="outline"
                                    focusBorderColor="brand.sunriseGold"
                                >
                                    {areaOptions.map((a) => (
                                        <option key={a} value={a}>
                                            {a}
                                        </option>
                                    ))}
                                </Select>

                                <Button
                                    onClick={handleSaveDetails}
                                    colorScheme="brand"
                                    variant="solid"
                                    w="full"
                                    isDisabled={!areaChoice}
                                >
                                    שמור/י
                                </Button>
                            </VStack>
                        </>
                    )}
                </VStack>
            )}
        </VStack>
    );
};

export default RSVPScreen;