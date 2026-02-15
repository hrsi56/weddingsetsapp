// src/components/AdminScreen.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  useColorModeValue,
} from "@chakra-ui/react";
import RSVPScreen from "./RSVPScreen";

/* ------------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------- */
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
 * API HELPERS
 * ---------------------------------------------------------- */
const BASE = "/api";
const jsonHeaders = { "Content-Type": "application/json" } as const;

async function safeFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err =
      (await res.json().catch(() => null))?.detail ??
      `HTTP ${res.status} – ${url}`;
    throw new Error(err);
  }
  return res.json();
}

const fetchUsers = (): Promise<User[]> => safeFetch(`${BASE}/users`);
const fetchSeats = (): Promise<Seat[]> => safeFetch(`${BASE}/seats`);
const createUser = (u: Partial<User>): Promise<User> =>
  safeFetch(`${BASE}/users`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(u),
  });
const updateUser = (
  id: number,
  data: Partial<User> & { seat_ids?: number[] }
): Promise<User> =>
  safeFetch(`${BASE}/users/${id}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });

/* ------------------------------------------------------------
 * UTILITIES
 * ---------------------------------------------------------- */
const hebrewNameRegex = /^[א-ת]{2,}(?: [א-ת]{2,})+$/;
const phoneRegex = /^\d{10}$/;

const seatSummary = (user: User | null, seats: Seat[]): string => {
  if (!user) return "לא נבחר משתמש";
  const owned = seats.filter((s) => s.owner_id === user.id);
  if (!owned.length) return "לא שובצו כיסאות";

  const tables: Record<string, number> = {};
  owned.forEach((s) => {
    const key = `אזור ${s.area}, שולחן ${s.col}`;
    tables[key] = (tables[key] || 0) + 1;
  });

  return Object.entries(tables)
    .map(([k, c]) => `${c} מקומות ב${k}`)
    .join(" | ");
};

/* ------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------- */
const AdminScreen: React.FC = () => {
  const toast = useToast();

  /* ---------------- theme colours (once!) ---------------- */
  const cardBg       = useColorModeValue("bg.canvas", "gray.800");
  const listHoverBg  = useColorModeValue("gray.50",   "gray.700");
  const seatHoverBg  = useColorModeValue("gray.300",  "gray.600");

  /* ---------------- state ---------------- */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);

  const [selected, setSelected] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // create-form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [createErr, setCreateErr] = useState<string | null>(null);

  // edit-form
  type Stage = "details" | "seats" | "confirmed" | null;
  const [stage, setStage] = useState<Stage>(null);

  const [numGuests, setNumGuests] = useState(1);
  const [areaIn, setAreaIn] = useState("");
  const [comingIn, setComingIn] = useState<"כן" | "לא" | null>(null);

  const [pickedSeats, setPickedSeats] = useState<Set<number>>(new Set());
  const [seatWarn, setSeatWarn] = useState<string | null>(null);

  /* ---------------- derived ---------------- */
  const areas = useMemo(
    () => Array.from(new Set(seats.map((s) => s.area))).sort(),
    [seats]
  );

  /* ---------------- load data ---------------- */
  useEffect(() => {
    (async () => {
      try {
        const [u, s] = await Promise.all([fetchUsers(), fetchSeats()]);
        setUsers(u);
        setSeats(s);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------------- helpers ---------------- */
  const resetSelection = () => {
    setSelected(null);
    setStage(null);
    setShowCreate(false);
    setPickedSeats(new Set());
  };

  const pickUser = useCallback(
    (u: User) => {
      setSelected(u);
      setStage("details");
      setNumGuests(u.num_guests);
      setAreaIn(u.area || "");
      setComingIn(u.is_coming);
      setPickedSeats(
        new Set(seats.filter((s) => s.owner_id === u.id).map((s) => s.id))
      );
      // גלילה חלקה למעלה כדי לראות את טופס העריכה
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [seats]
  );

  /* ---------------- create user ---------------- */
  const handleCreate = async () => {
    setCreateErr(null);

    if (!newName.trim() || !newPhone.trim())
      return setCreateErr("שם וטלפון חובה.");
    if (!hebrewNameRegex.test(newName.trim()))
      return setCreateErr("השם חייב להיות בעברית (שם + משפחה).");
    if (!phoneRegex.test(newPhone.trim()))
      return setCreateErr("טלפון – 10 ספרות.");

    try {
      const created = await createUser({
        name: newName.trim(),
        phone: newPhone.trim(),
        user_type: "אורח",
        is_coming: null,
        num_guests: 1,
        reserve_count: 0,
        area: "",
      });
      setUsers((p) => [...p, created]);
      toast({ title: "נוצר בהצלחה", status: "success", duration: 2500 });
      pickUser(created);
      setShowCreate(false);
      setNewName("");
      setNewPhone("");
    } catch (e) {
      setCreateErr((e as Error).message);
    }
  };

  /* ---------------- save details (stage 1) ---------------- */
  const saveDetails = async () => {
    if (!selected) return;
    const diff: Partial<User> = {};
    if (numGuests !== selected.num_guests) diff.num_guests = numGuests;
    if (areaIn !== selected.area) diff.area = areaIn;
    if (comingIn !== selected.is_coming) diff.is_coming = comingIn;

    if (Object.keys(diff).length) {
      const updated = await updateUser(selected.id, diff);
      setUsers((u) => u.map((x) => (x.id === updated.id ? updated : x)));
      setSelected(updated);
      if (diff.area && diff.area !== selected.area) setPickedSeats(new Set());
    }
    setStage("seats");
  };

  /* ---------------- seat click ---------------- */
  const toggleSeat = (id: number) => {
    if (!selected || stage !== "seats") return;
    const next = new Set(pickedSeats);
    let warn: string | null = null;

    if (next.has(id)) next.delete(id);
    else {
      if (next.size >= numGuests) warn = `מקסימום ${numGuests} מושבים.`;
      else next.add(id);
    }
    setSeatWarn(warn);
    setPickedSeats(next);
  };

  /* ---------------- confirm seats (stage 2) ---------------- */
  const confirmSeats = async () => {
    if (!selected) return;

    if (pickedSeats.size !== numGuests) {
      return setSeatWarn(`יש לשבץ בדיוק ${numGuests} מושבים.`);
    }

    const reserve_count = 0;

    const payload = {
      seat_ids: [...pickedSeats],
      num_guests: numGuests,
      reserve_count,
      area: areaIn,
      is_coming: comingIn,
    };

    try {
      const updated = await updateUser(selected.id, payload);

      setUsers((u) => u.map((x) => (x.id === updated.id ? updated : x)));
      setSelected(updated);
      setSeats(await fetchSeats());
      setStage("confirmed");
      toast({ title: "נשמר בהצלחה", status: "success", duration: 2500 });

    } catch (error) {
      console.error("Failed to confirm seats:", error);
      toast({ title: "שגיאה בשמירה", description: "לא ניתן היה לשמור את שיבוץ המושבים.", status: "error", duration: 4000 });
    }
  };


  /* ---------------- render ---------------- */
  if (loading)
    return (
      <Box p={8} textAlign="center" dir="rtl">
        <Spinner size="xl" color="primary" />
        <Text mt={2}>טוען...</Text>
      </Box>
    );

  if (error)
    return (
      <Alert
        status="error"
        variant="subtle"
        flexDir="column"
        alignItems="center"
        textAlign="center"
        dir="rtl"
        m={8}
      >
        <AlertIcon boxSize={10} mr={0} />
        <Heading size="md" mb={2}>
          {error}
        </Heading>
      </Alert>
    );

    /* ---------------- JSX ---------------- */
    return (
      <Box p={{ base: 4, md: 8 }} dir="rtl" textAlign="right">
        <Heading textStyle="h1" mb={8}>
          🎩 מסך אדמין – ניהול האולם
        </Heading>

        {/* ---------- create form ---------- */}
        {showCreate && !selected && (
          <VStack layerStyle="card" bg={cardBg} gap={4} mb={8}>
            <Heading size="lg">יצירת משתמש חדש</Heading>

            <FormControl>
              <FormLabel>שם מלא (עברית)</FormLabel>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                focusBorderColor="primary"
              />
            </FormControl>

            <FormControl>
              <FormLabel>טלפון (10 ספרות)</FormLabel>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                focusBorderColor="primary"
              />
            </FormControl>

            {createErr && <Text color="red.500">{createErr}</Text>}

            <HStack>
              <Button colorScheme="brand" onClick={handleCreate}>
                צור
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                ביטול
              </Button>
            </HStack>
          </VStack>
        )}

        {/* ---------- selected user ---------- */}
        {selected && (
          <VStack layerStyle="card" bg={cardBg} gap={6} mb={8}>
            <HStack w="full" justify="space-between">
              <Heading size="lg">
                {selected.name} ({selected.phone})
              </Heading>
              <Button variant="link" onClick={resetSelection}>
                החלף משתמש / סגור
              </Button>
            </HStack>

            {/* ---------- confirmed stage ---------- */}
            {stage === "confirmed" && (
              <VStack w="full" bg="green.50" p={4} borderRadius="md" gap={2}>
                <Heading size="md" color="green.700">
                  ✔️ נשמר בהצלחה
                </Heading>
                <Text> {seatSummary(selected, seats)}</Text>
                <Button size="sm" onClick={() => setStage("details")}>
                  ערוך שוב
                </Button>
              </VStack>
            )}

            {/* ---------- details stage ---------- */}
            {stage === "details" && (
              <VStack w="full" align="flex-start" gap={4}>
                <Heading size="md">עדכון פרטים</Heading>

                <FormControl>
                  <FormLabel>סטטוס הגעה</FormLabel>
                  <Select
                    placeholder="בחר..."
                    value={comingIn ?? ""}
                    onChange={(e) =>
                      setComingIn(e.target.value as "כן" | "לא" | null)
                    }
                    focusBorderColor="primary"
                  >
                    <option value="כן">כן</option>
                    <option value="לא">לא</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>מספר אורחים</FormLabel>
                  <Input
                    type="number"
                    min={0}
                    value={numGuests}
                    onChange={(e) => setNumGuests(Number(e.target.value))}
                    focusBorderColor="primary"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>אזור</FormLabel>
                  <Select
                    placeholder="בחר אזור..."
                    value={areaIn}
                    onChange={(e) => setAreaIn(e.target.value)}
                    focusBorderColor="primary"
                  >
                    {areas.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </Select>
                </FormControl>

                <HStack>
                  <Button colorScheme="brand" onClick={saveDetails}>
                    שמור והמשך
                  </Button>
                  <Button variant="outline" onClick={resetSelection}>
                    ביטול
                  </Button>
                </HStack>
              </VStack>
            )}

            {/* ---------- seats stage ---------- */}
            {stage === "seats" && comingIn === "כן" && numGuests > 0 && (
              <VStack w="full" align="flex-start" gap={4}>
                <Heading size="md">
                  בחירת מושבים ({pickedSeats.size}/{numGuests})
                </Heading>

                {seatWarn && (
                  <Alert status="warning" variant="subtle">
                    <AlertIcon />
                    {seatWarn}
                  </Alert>
                )}

                {areas
                  .filter((a) => !areaIn || a === areaIn)
                  .map((area) => (
                    <Box key={area} w="full">
                      <Heading size="sm" bg="bg.muted" p={2} borderRadius="md">
                        אזור {area}
                      </Heading>

                      {Array.from(
                        new Set(
                          seats.filter((s) => s.area === area).map((s) => s.col)
                        )
                      )
                        .sort((a, b) => a - b)
                        .map((col) => (
                          <Box
                            key={col}
                            mt={2}
                            p={2}
                            borderWidth="1px"
                            borderRadius="md"
                          >
                            <Text fontWeight="semibold" mb={1}>
                              שולחן {col}
                            </Text>
                            <SimpleGrid columns={{ base: 4, sm: 6, md: 8 }} gap={1}>
                              {seats
                                .filter((s) => s.area === area && s.col === col)
                                .sort((a, b) => a.row - b.row)
                                .map((seat) => {
                                  const owned = (
                                      seat.owner_id && seat.owner_id !== selected.id
                                  );
                                  const picked = pickedSeats.has(seat.id);
                                  const color = owned
                                    ? "red.400"
                                    : picked
                                    ? "brand.500"
                                    : "bg.muted";

                                  const owner = users.find(
                                    (u) => u.id === seat.owner_id
                                  );
                                  return (
                                    <Button
                                      key={seat.id}
                                      size="xs"
                                      bg={color}
                                      color={
                                        owned || picked ? "white" : "text.primary"
                                      }
                                      _hover={
                                        owned ? undefined : { bg: seatHoverBg }
                                      }
                                      isDisabled={Boolean(owned)}
                                      onClick={() => toggleSeat(seat.id)}
                                      title={
                                        owned
                                          ? `תפוס ע"י ${owner?.name}`
                                          : `שורה ${seat.row}`
                                      }
                                    >
                                      {owned
                                        ? owner?.name.slice(0, 3) + "."
                                        : `R${seat.row}`}
                                    </Button>
                                  );
                                })}
                            </SimpleGrid>
                          </Box>
                        ))}
                    </Box>
                  ))}

                <HStack mt={4}>
                  <Button
                    colorScheme="brand"
                    onClick={confirmSeats}
                    isDisabled={
                      pickedSeats.size === 0 || pickedSeats.size > numGuests
                    }
                  >
                    אשר מושבים
                  </Button>
                  <Button variant="outline" onClick={() => setStage("details")}>
                    חזור
                  </Button>
                </HStack>
              </VStack>
            )}

            {/* seats stage but invalid */}
            {stage === "seats" && (comingIn !== "כן" || numGuests === 0) && (
              <Alert
                status="info"
                borderRadius="md"
                w="full"
                flexDir="column"
                textAlign="center"
              >
                <AlertIcon />
                עדכן סטטוס הגעה ומספר אורחים לפני בחירת מושבים.
                <Button mt={2} variant="outline" onClick={() => setStage("details")}>
                  חזור לעריכת פרטים
                </Button>
              </Alert>
            )}
          </VStack>
        )}

        {/* ---------- טבלת “משתמשים ברזרבה” עם סיכום ---------- */}
        <Box mb={12}>
          <Heading textStyle="h2" mb={4}>
            📋  לא שובצו
          </Heading>

          {(() => {
            const reserveUsers = users.filter((u) => u.reserve_count > 0);
            const totals = reserveUsers.reduce(
              (acc, u) => ({
                guests: acc.guests + u.num_guests,
                reserves: acc.reserves + u.reserve_count,
              }),
              { guests: 0, reserves: 0 }
            );

            return (
              <TableContainer>
                <Table variant="striped" size="sm">
                  <Thead>
                    <Tr>
                      <Th>שם</Th>
                      <Th>טלפון</Th>
                      <Th>אורחים</Th>
                      <Th>רזרבות</Th>
                      <Th>אזור</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {reserveUsers.map((u) => (
                      <Tr
                        key={u.id}
                        onClick={() => pickUser(u)}
                        cursor="pointer"
                        _hover={{ bg: listHoverBg }}
                        transition="background 0.2s"
                      >
                        <Td>{u.name}</Td>
                        <Td>{u.phone}</Td>
                        <Td>{u.num_guests}</Td>
                        <Td>{u.reserve_count}</Td>
                        <Td>{u.area || "-"}</Td>
                      </Tr>
                    ))}

                    {/* --- שורת סכום --- */}
                    <Tr fontWeight="bold" bg="bg.muted">
                      <Td colSpan={2}>סה״כ</Td>
                      <Td>{totals.guests}</Td>
                      <Td>{totals.reserves}</Td>
                      <Td />
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            );
          })()}
        </Box>

        {/* ---------- טבלת “כל המשתמשים” עם סיכום ---------- */}
        <Box>
          <Heading textStyle="h2" mb={4}>
            📋 כל המשתמשים
          </Heading>

          {(() => {
            const totals = users.reduce(
              (acc, u) => ({
                guests: acc.guests + u.num_guests,
                reserves: acc.reserves + u.reserve_count,
              }),
              { guests: 0, reserves: 0 }
            );

            return (
              <TableContainer>
                <Table variant="striped" size="sm">
                  <Thead>
                    <Tr>
                      <Th>שם</Th>
                      <Th>טלפון</Th>
                      <Th>מגיע?</Th>
                      <Th>אורחים</Th>
                      <Th>רזרבות</Th>
                      <Th>אזור</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {users.map((u) => (
                      <Tr
                        key={u.id}
                        onClick={() => pickUser(u)}
                        cursor="pointer"
                        _hover={{ bg: listHoverBg }}
                        transition="background 0.2s"
                      >
                        <Td>{u.name}</Td>
                        <Td>{u.phone}</Td>
                        <Td>{u.is_coming ?? "-"}</Td>
                        <Td>{u.num_guests}</Td>
                        <Td>{u.reserve_count}</Td>
                        <Td>{u.area || "-"}</Td>
                      </Tr>
                    ))}

                    {/* --- שורת סכום --- */}
                    <Tr fontWeight="bold" bg="bg.muted">
                      <Td colSpan={3}>סה״כ</Td>
                      <Td>{totals.guests}</Td>
                      <Td>{totals.reserves}</Td>
                      <Td />
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            );
          })()}
        </Box>

        {/* שילוב הקומפוננטה החדשה --> */}
        <Box mt={12} borderTopWidth="2px" borderColor="border.subtle" pt={8}>
            <Heading textStyle="h2" mb={8}>
              רישום / חיפוש
            </Heading>
            <RSVPScreen />
        </Box>
      </Box>
    );
};

export default AdminScreen;