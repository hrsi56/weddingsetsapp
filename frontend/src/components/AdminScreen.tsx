// src/components/AdminScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Input,
    Select,
    Button,
    SimpleGrid,
    FormControl,
    FormLabel,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Spinner,
    Alert,
    AlertIcon,
    useToast,
} from "@chakra-ui/react";

/* ------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------ */
interface User {
    id: number;
    name: string;
    phone: string;
    is_coming: "כן" | "לא" | null;
    user_type: string;
    num_guests: number;
    reserve_count: number;
    area: string | null;
}

interface Seat {
    id: number;
    row: number;
    col: number;
    area: string;
    status: "free" | "taken";
    owner_id: number | null;
}

/* ------------------------------------------------------------
 * API CALLS
 * ------------------------------------------------------------ */
const BASE = "/api";

async function fetchUsers(): Promise<User[]> {
    try {
        const r = await fetch(`${BASE}/users`);
        if (!r.ok) throw new Error(`HTTP ${r.status} from /users`);
        return (await r.json()) as User[];
    } catch (e) {
        console.error("fetchUsers failed:", e);
        return [];
    }
}

async function createUser(u: Partial<User>): Promise<User | null> {
    try {
        const r = await fetch(`${BASE}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(u),
        });
        if (!r.ok) {
            const errorData = await r.json().catch(() => ({ detail: "Unknown error" }));
            throw new Error(`HTTP ${r.status} from POST /users: ${errorData.detail}`);
        }
        return (await r.json()) as User;
    } catch (e) {
        console.error("createUser failed:", e);
        return null;
    }
}

async function updateUser(
    id: number,
    data: Partial<User> & { seat_ids?: number[] }
): Promise<User | null> {
    try {
        const r = await fetch(`${BASE}/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!r.ok) {
            const errorData = await r.json().catch(() => ({ detail: "Unknown error" }));
            throw new Error(`HTTP ${r.status} from PUT /users/${id}: ${errorData.detail}`);
        }
        return (await r.json()) as User;
    } catch (e) {
        console.error(`updateUser ${id} failed:`, e);
        return null;
    }
}

async function fetchSeats(): Promise<Seat[]> {
    try {
        const r = await fetch(`${BASE}/seats`);
        if (!r.ok) throw new Error(`HTTP ${r.status} from /seats`);
        return (await r.json()) as Seat[];
    } catch (e) {
        console.error("fetchSeats failed:", e);
        return [];
    }
}

/* ------------------------------------------------------------
 * HELPER: תצוגת מושבים למשתמש
 * ------------------------------------------------------------ */
const getSeatDisplayForUser = (user: User | null, seats: Seat[]): string => {
    if (!user) return "לא נבחר משתמש";
    const userSeats = seats.filter((s) => s.owner_id === user.id);
    if (userSeats.length === 0) return "לא שובצו כיסאות";

    const seatsByTable: Record<string, number> = {};
    userSeats.forEach((seat) => {
        const key = `אזור ${seat.area}, שולחן ${seat.col}`;
        seatsByTable[key] = (seatsByTable[key] || 0) + 1;
    });

    return Object.entries(seatsByTable)
        .map(([tableKey, count]) => `${count} מקומות ב${tableKey}`)
        .join(" | ");
};

/* ------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------ */
const AdminScreen: React.FC = () => {
    const toast = useToast();

    // Loading & error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Data
    const [users, setUsers] = useState<User[]>([]);
    const [seats, setSeats] = useState<Seat[]>([]);

    // Search & selection
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [selected, setSelected] = useState<User | null>(null);

    // For new user creation
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newUserName, setNewUserName] = useState("");
    const [newUserPhone, setNewUserPhone] = useState("");
    const [createUserError, setCreateUserError] = useState<string | null>(null);

    // Edit stages: details → seats → confirmed
    type EditStage = "details" | "seats" | "confirmed" | null;
    const [editStage, setEditStage] = useState<EditStage>(null);

    // Inputs for editing selected user
    const [numGuestsInput, setNumGuestsInput] = useState<number>(1);
    const [areaInput, setAreaInput] = useState<string>("");
    const [isComingInput, setIsComingInput] = useState<"כן" | "לא" | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<Set<number>>(new Set());
    const [seatSelectionWarning, setSeatSelectionWarning] = useState<string | null>(null);

    const hebrewNameRegex = /^[א-ת]{2,}(?: [א-ת]{2,})+$/;

    // חישוב אזורים ייחודיים (Memo)
    const availableAreas = useMemo(() => Array.from(new Set(seats.map((s) => s.area))).sort(), [seats]);

    // טעינת נתונים ראשונית
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [usersData, seatsData] = await Promise.all([fetchUsers(), fetchSeats()]);
                setUsers(usersData);
                setSeats(seatsData);
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to load data";
                setError(msg);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // סינון משתמשים לפי חיפוש
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers([]);
            return;
        }
        const q = searchQuery.trim().toLowerCase();
        const result = users.filter(
            (u) => u.name.toLowerCase().includes(q) || u.phone.includes(q)
        );
        setFilteredUsers(result);
    }, [searchQuery, users]);

    // אם טוען או יש שגיאה
    if (loading) {
        return (
            <Box p={4} textAlign="center" dir="rtl">
                <Spinner size="xl" color="brand.sunriseGold" />
                <Text mt={2}>טוען נתונים...</Text>
            </Box>
        );
    }
    if (error) {
        return (
            <Alert status="error" variant="subtle" justifyContent="center" alignItems="center" flexDirection="column" m={4}>
                <AlertIcon boxSize="40px" mr={0} />
                <Text fontSize="lg">שגיאה: {error}</Text>
            </Alert>
        );
    }

    /* --------------------------------------------------------
     * כשנבחר משתמש – פונקציה זו קוראת
     */
    const handleSelectUser = (user: User) => {
        setSelected(user);
        setShowCreateForm(false);
        setSearchQuery("");
        // מגדירים מושבים נבחרים לפי המידע הנוכחי
        const takenSeats = seats
            .filter((s) => s.owner_id === user.id)
            .map((s) => s.id);
        setSelectedSeats(new Set(takenSeats));
        // מאתחלים ערכים לשדות עריכה
        setNumGuestsInput(user.num_guests || 1);
        setAreaInput(user.area || "");
        setIsComingInput(user.is_coming);
        setEditStage("details");
        setSeatSelectionWarning(null);
    };

    /* --------------------------------------------------------
     * יצירת משתמש חדש
     */
    const handleCreateUser = async () => {
        setCreateUserError(null);

        if (!newUserName.trim() || !newUserPhone.trim()) {
            setCreateUserError("שם וטלפון הם שדות חובה.");
            return;
        }
        if (!hebrewNameRegex.test(newUserName.trim())) {
            setCreateUserError(
                "שם חייב להיות בעברית ולהכיל שם פרטי ושם משפחה (לפחות 2 אותיות כל אחד)."
            );
            return;
        }
        if (!/^\d{10}$/.test(newUserPhone.trim())) {
            setCreateUserError("מספר טלפון חייב להכיל 10 ספרות בדיוק.");
            return;
        }

        const newUserPartial: Partial<User> = {
            name: newUserName.trim(),
            phone: newUserPhone.trim(),
            user_type: "אורח",
            is_coming: null,
            num_guests: 1,
            reserve_count: 0,
            area: "",
        };

        const created = await createUser(newUserPartial);
        if (created) {
            setUsers((prev) => [...prev, created]);
            handleSelectUser(created);
            setShowCreateForm(false);
            setNewUserName("");
            setNewUserPhone("");
            toast({
                title: "משתמש נוצר בהצלחה",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
        } else {
            setCreateUserError("שגיאה ביצירת המשתמש. נסו שוב.");
        }
    };

    /* --------------------------------------------------------
     * שמירת עדכון פרטי משתמש (שלב 1)
     */
    const handleUpdateSelectedUserDetails = async () => {
        if (!selected) return;

        const updates: Partial<User> = {};
        if (numGuestsInput !== selected.num_guests) updates.num_guests = numGuestsInput;
        if (areaInput !== selected.area) updates.area = areaInput;
        if (isComingInput !== selected.is_coming) updates.is_coming = isComingInput;

        if (Object.keys(updates).length > 0) {
            const updatedUser = await updateUser(selected.id, updates);
            if (updatedUser) {
                setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
                setSelected(updatedUser);
                // אם שינה אזור והיו כבר מושבים, מאפס בחירה
                if (updates.area && updates.area !== selected.area) {
                    setSelectedSeats(new Set());
                }
            }
        }
        setEditStage("seats");
    };

    /* --------------------------------------------------------
     * לחיצה על מושב
     */
    const toggleSeat = (seatId: number) => {
        if (!selected || editStage !== "seats") return;

        const current = new Set(selectedSeats);
        let warning: string | null = null;

        if (current.has(seatId)) {
            current.delete(seatId);
        } else {
            if (current.size >= (numGuestsInput || 0)) {
                warning = `ניתן לבחור עד ${numGuestsInput || 0} מושבים.`;
            } else {
                current.add(seatId);
            }
        }
        setSelectedSeats(current);
        setSeatSelectionWarning(warning);
    };

    /* --------------------------------------------------------
     * אשרת בחירת מושבים (שלב 2)
     */
    const confirmSeats = async () => {
        if (!selected) return;
        if (selectedSeats.size > (numGuestsInput || 0) || selectedSeats.size === 0) {
            setSeatSelectionWarning(
                `יש לבחור בין 1 ל-${numGuestsInput || 0} מושבים בהתאם לכמות האורחים.`
            );
            return;
        }
        setSeatSelectionWarning(null);

        const reserve_count = Math.max(0, (numGuestsInput || 0) - selectedSeats.size);

        const finalUserData: Partial<User> & { seat_ids: number[] } = {
            seat_ids: Array.from(selectedSeats),
            num_guests: numGuestsInput,
            reserve_count: reserve_count,
            area: areaInput,
            is_coming: isComingInput,
        };

        const updatedUser = await updateUser(selected.id, finalUserData);
        if (updatedUser) {
            setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
            setSelected(updatedUser);
            const newSeats = await fetchSeats();
            setSeats(newSeats);
            setEditStage("confirmed");
            toast({
                title: "שמירה בוצעה בהצלחה",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
        }
    };

    /* --------------------------------------------------------
     * JSX התחזית
     */
    return (
        <Box p={{ base: 4, md: 8 }} dir="rtl" textAlign="right">
            {/* כותרת ראשית */}
            <Heading as="h2" size="xl" mb={6} fontFamily="heading" color="brand.text">
                🎩 מסך אדמין – ניהול האולם
            </Heading>

            {/* --- Search & Create Section --- */}
            {!selected && (
                <VStack
                    bg="brand.pureWhite"
                    p={4}
                    borderRadius="xlRounded"
                    boxShadow="soft-lg"
                    gap={4}
                    mb={6}
                >
                    <FormControl w="full">
                        <Input
                            placeholder="הקלד שם או טלפון לחיפוש..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            focusBorderColor="brand.sunriseGold"
                        />
                    </FormControl>

                    {searchQuery.trim() !== "" && (
                        <Box
                            w="full"
                            maxH="240px"
                            overflowY="auto"
                            border="1px"
                            borderColor="gray.200"
                            borderRadius="md"
                        >
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <Box
                                        key={user.id}
                                        px={3}
                                        py={2}
                                        borderBottom="1px"
                                        borderColor="gray.100"
                                        cursor="pointer"
                                        _hover={{ bg: "gray.50" }}
                                        onClick={() => handleSelectUser(user)}
                                    >
                                        <Text fontFamily="body">{user.name} ({user.phone})</Text>
                                    </Box>
                                ))
                            ) : (
                                <Text p={3} color="gray.500">
                                    לא נמצאו משתמשים.
                                </Text>
                            )}
                        </Box>
                    )}

                    <Button
                        colorScheme="blue"
                        onClick={() => {
                            setShowCreateForm(true);
                            setSelected(null);
                            setEditStage(null);
                        }}
                    >
                        רישום משתמש חדש
                    </Button>
                </VStack>
            )}

            {/* --- Create New User Form --- */}
            {showCreateForm && !selected && (
                <VStack
                    bg="brand.pureWhite"
                    p={4}
                    borderRadius="xlRounded"
                    boxShadow="soft-lg"
                    gap={4}
                    mb={6}
                >
                    <Heading as="h3" size="lg" fontFamily="heading">
                        יצירת משתמש חדש
                    </Heading>
                    <FormControl w="full">
                        <FormLabel>שם מלא (עברית)</FormLabel>
                        <Input
                            placeholder="שם מלא"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            focusBorderColor="brand.sunriseGold"
                        />
                    </FormControl>
                    <FormControl w="full">
                        <FormLabel>טלפון (10 ספרות)</FormLabel>
                        <Input
                            placeholder="05XXXXXXXX"
                            value={newUserPhone}
                            onChange={(e) => setNewUserPhone(e.target.value)}
                            focusBorderColor="brand.sunriseGold"
                        />
                    </FormControl>
                    {createUserError && (
                        <Text color="red.500" fontSize="sm">
                            {createUserError}
                        </Text>
                    )}
                    <HStack gap={3}>
                        <Button colorScheme="green" onClick={handleCreateUser}>
                            צור משתמש
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCreateForm(false);
                                setCreateUserError(null);
                            }}
                        >
                            ביטול
                        </Button>
                    </HStack>
                </VStack>
            )}

            {/* --- Selected User Management --- */}
            {selected && (
                <VStack
                    bg="brand.pureWhite"
                    p={4}
                    borderRadius="xlRounded"
                    boxShadow="soft-lg"
                    gap={4}
                    mb={6}
                >
                    {/* כותרת עם שם המשתמש */}
                    <HStack justifyContent="space-between" w="full" gap={2}>
                        <Heading as="h3" size="lg" fontFamily="heading" color="blue.700">
                            {selected.name} ({selected.phone})
                        </Heading>
                        <Button
                            variant="link"
                            color="blue.500"
                            onClick={() => {
                                setSelected(null);
                                setEditStage(null);
                                setShowCreateForm(false);
                            }}
                        >
                            בחר משתמש אחר / חדש
                        </Button>
                    </HStack>

                    {/* מסך האישור לאחר שמירה */}
                    {editStage === "confirmed" && (
                        <VStack
                            w="full"
                            bg="green.50"
                            border="1px"
                            borderColor="green.200"
                            p={4}
                            borderRadius="md"
                            gap={2}
                        >
                            <Heading as="h4" size="md" fontFamily="heading" color="green.700">
                                ✔️ נשמר בהצלחה!
                            </Heading>
                            <Text>
                                <Text as="span" fontWeight="bold">
                                    משתמש:
                                </Text>{" "}
                                {selected.name}
                            </Text>
                            <Text>
                                <Text as="span" fontWeight="bold">
                                    מגיע/ה:
                                </Text>{" "}
                                {selected.is_coming || "לא צוין"}
                            </Text>
                            <Text>
                                <Text as="span" fontWeight="bold">
                                    אורחים:
                                </Text>{" "}
                                {selected.num_guests}
                            </Text>
                            <Text>
                                <Text as="span" fontWeight="bold">
                                    רזרבות:
                                </Text>{" "}
                                {selected.reserve_count}
                            </Text>
                            <Text>
                                <Text as="span" fontWeight="bold">
                                    אזור:
                                </Text>{" "}
                                {selected.area || "לא נבחר"}
                            </Text>
                            <Text>
                                <Text as="span" fontWeight="bold">
                                    סידור ישיבה:
                                </Text>{" "}
                                {getSeatDisplayForUser(selected, seats)}
                            </Text>
                            <Button
                                size="sm"
                                onClick={() => setEditStage("details")}
                                colorScheme="blue"
                            >
                                ערוך שוב
                            </Button>
                        </VStack>
                    )}

                    {/* מסך עריכת פרטי משתמש (details) */}
                    {editStage === "details" && (
                        <VStack w="full" alignItems="flex-start" gap={4}>
                            <Heading as="h4" size="md" fontFamily="heading">
                                עדכון פרטי משתמש:
                            </Heading>

                            <FormControl w="full">
                                <FormLabel>סטטוס הגעה</FormLabel>
                                <Select
                                    placeholder="בחר..."
                                    value={isComingInput || ""}
                                    onChange={(e) => setIsComingInput(e.target.value as "כן" | "לא" | null)}
                                    focusBorderColor="brand.sunriseGold"
                                >
                                    <option value="כן">כן</option>
                                    <option value="לא">לא</option>
                                </Select>
                            </FormControl>

                            <FormControl w="full">
                                <FormLabel>מספר אורחים כולל</FormLabel>
                                <Input
                                    type="number"
                                    min={0}
                                    value={numGuestsInput}
                                    onChange={(e) =>
                                        setNumGuestsInput(parseInt(e.target.value, 10) || 0)
                                    }
                                    focusBorderColor="brand.sunriseGold"
                                />
                            </FormControl>

                            <FormControl w="full">
                                <FormLabel>אזור מועדף</FormLabel>
                                <Select
                                    placeholder="בחר אזור..."
                                    value={areaInput || ""}
                                    onChange={(e) => setAreaInput(e.target.value)}
                                    focusBorderColor="brand.sunriseGold"
                                >
                                    {availableAreas.map((area) => (
                                        <option key={area} value={area}>
                                            {area}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <HStack gap={3}>
                                <Button colorScheme="green" onClick={handleUpdateSelectedUserDetails}>
                                    שמור פרטים והמשך לבחירת מושבים
                                </Button>
                                <Button variant="outline" onClick={() => setSelected(null)}>
                                    ביטול
                                </Button>
                            </HStack>
                        </VStack>
                    )}

                    {/* מסך בחירת מושבים (seats) */}
                    {editStage === "seats" && selected.is_coming === "כן" && numGuestsInput > 0 && (
                        <VStack w="full" alignItems="flex-start" gap={4}>
                            <Heading as="h4" size="md" fontFamily="heading">
                                בחירת מושבים עבור {selected.name} ({numGuestsInput} אורחים, אזור:{" "}
                                {areaInput || "כללי"})
                            </Heading>

                            {seatSelectionWarning && (
                                <Alert status="warning" variant="subtle">
                                    <AlertIcon />
                                    {seatSelectionWarning}
                                </Alert>
                            )}

                            {/* מציגים את המושבים לפי אזור ושולחן */}
                            {availableAreas
                                .filter((a) => !areaInput || a === areaInput)
                                .map((area) => (
                                    <Box key={area} w="full">
                                        <Heading
                                            as="h5"
                                            size="sm"
                                            fontFamily="heading"
                                            bg="gray.100"
                                            p={2}
                                            borderRadius="md"
                                        >
                                            אזור {area}
                                        </Heading>

                                        {Array.from(new Set(seats.filter((s) => s.area === area).map((s) => s.col)))
                                            .sort((a, b) => a - b)
                                            .map((colNum) => (
                                                <Box key={colNum} w="full" p={2} mt={2} borderWidth="1px" borderRadius="md">
                                                    <Text mb={1} fontWeight="semibold" fontSize="sm">
                                                        שולחן {colNum}
                                                    </Text>
                                                    <SimpleGrid columns={{ base: 4, sm: 6, md: 8, lg: 10 }} gap={1}>
                                                        {seats
                                                            .filter((s) => s.area === area && s.col === colNum)
                                                            .sort((a, b) => a.row - b.row)
                                                            .map((seat) => {
                                                                const isDisabled =
                                                                    seat.status === "taken" && seat.owner_id !== selected.id;
                                                                const isChecked =
                                                                    selectedSeats.has(seat.id) ||
                                                                    (seat.status === "taken" && seat.owner_id === selected.id);

                                                                const owner = users.find((u) => u.id === seat.owner_id);
                                                                const seatLabel = isDisabled
                                                                    ? owner
                                                                        ? owner.name.substring(0, 3) + "."
                                                                        : "תפוס"
                                                                    : `R${seat.row}`;

                                                                return (
                                                                    <Button
                                                                        key={seat.id}
                                                                        size="xs"
                                                                        px={1}
                                                                        py={1}
                                                                        fontSize="xs"
                                                                        borderRadius="md"
                                                                        bg={
                                                                            isDisabled
                                                                                ? "red.300"
                                                                                : isChecked
                                                                                    ? "blue.500"
                                                                                    : "gray.200"
                                                                        }
                                                                        color={isChecked || isDisabled ? "white" : "black"}
                                                                        _hover={!isDisabled ? { bg: "gray.300" } : {}}
                                                                        onClick={() => !isDisabled && toggleSeat(seat.id)}
                                                                        isDisabled={isDisabled}
                                                                        title={
                                                                            isDisabled
                                                                                ? `תפוס ע"י ${owner?.name || "אחר"}`
                                                                                : `מושב ${seat.row} בשולחן ${seat.col}`
                                                                        }
                                                                    >
                                                                        {seatLabel}
                                                                    </Button>
                                                                );
                                                            })}
                                                    </SimpleGrid>
                                                </Box> // Closes Table Box (original line 731)
                                            ))}
                                    </Box> // Closes Area Box (original line 733) - CHECK THIS LINE IN YOUR FILE
                                ))}
                            <HStack gap={3} mt={4}>
                                <Button
                                    colorScheme="green"
                                    onClick={confirmSeats}
                                    isDisabled={
                                        selectedSeats.size === 0 || selectedSeats.size > (numGuestsInput || 0)
                                    }
                                >
                                    אשר בחירת {selectedSeats.size} מושבים
                                </Button>
                                <Button variant="outline" onClick={() => setEditStage("details")}>
                                    חזור לעריכת פרטים
                                </Button>
                            </HStack>
                        </VStack>
                    )}

                    {/* אם המשתמש לא מגיע או אין אורחים, אין אפשרות לבחור מושבים */}
                    {editStage === "seats" &&
                        (selected.is_coming !== "כן" || numGuestsInput === 0) && (
                            <Box w="full" p={4} borderWidth="1px" borderRadius="md">
                                <Text color="orange.600">
                                    יש לסמן שהמשתמש מגיע ו/או להגדיר מספר אורחים גדול מ-0 כדי לבחור מושבים.
                                </Text>
                                <Button
                                    mt={2}
                                    variant="outline"
                                    onClick={() => setEditStage("details")}
                                >
                                    חזור לעריכת פרטים
                                </Button>
                            </Box>
                        )}
                </VStack>
            )}

            {/* --- Summary Tables --- */}
            <Box mb={8}>
                <Heading as="h3" size="lg" mb={4} fontFamily="heading">
                    📋 משתמשים ברזרבה
                </Heading>
                <TableContainer>
                    <Table variant="striped" colorScheme="gray" size="sm">
                        <Thead>
                            <Tr>
                                <Th textAlign="right">שם</Th>
                                <Th textAlign="right">טלפון</Th>
                                <Th textAlign="right">אורחים</Th>
                                <Th textAlign="right">רזרבות</Th>
                                <Th textAlign="right">אזור</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {users
                                .filter((u) => u.reserve_count > 0)
                                .map((u) => (
                                    <Tr key={u.id}>
                                        <Td>{u.name}</Td>
                                        <Td>{u.phone}</Td>
                                        <Td>{u.num_guests}</Td>
                                        <Td>{u.reserve_count}</Td>
                                        <Td>{u.area || "-"}</Td>
                                    </Tr>
                                ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            </Box>

            <Box>
                <Heading as="h3" size="lg" mb={4} fontFamily="heading">
                    📋 כל המשתמשים
                </Heading>
                <TableContainer>
                    <Table variant="striped" colorScheme="gray" size="sm">
                        <Thead>
                            <Tr>
                                <Th textAlign="right">שם</Th>
                                <Th textAlign="right">טלפון</Th>
                                <Th textAlign="right">מגיע?</Th>
                                <Th textAlign="right">אורחים</Th>
                                <Th textAlign="right">רזרבות</Th>
                                <Th textAlign="right">אזור</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {users.map((u) => (
                                <Tr key={u.id}>
                                    <Td>{u.name}</Td>
                                    <Td>{u.phone}</Td>
                                    <Td>{u.is_coming || "-"}</Td>
                                    <Td>{u.num_guests}</Td>
                                    <Td>{u.reserve_count}</Td>
                                    <Td>{u.area || "-"}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export default AdminScreen;