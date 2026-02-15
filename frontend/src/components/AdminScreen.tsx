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
  Badge,
  Divider,
  SimpleGrid,
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
const createTableAPI = (area: string, capacity: number = 12): Promise<{ok: boolean, new_col: number}> =>
  safeFetch(`${BASE}/seats/table`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ area, capacity }),
  });

/* ------------------------------------------------------------
 * UTILITIES
 * ---------------------------------------------------------- */
const hebrewNameRegex = /^[א-ת]{2,}(?: [א-ת]{2,})+$/;
const phoneRegex = /^\d{10}$/;

const seatSummary = (user: User | null, seats: Seat[]): string => {
  if (!user) return "לא נבחר משתמש";
  const owned = seats.filter((s) => s.owner_id === user.id);
  if (!owned.length) return "לא שובצו מקומות";

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

  /* ---------------- theme colours ---------------- */
  const cardBg       = useColorModeValue("bg.canvas", "gray.800");
  const listHoverBg  = useColorModeValue("gray.50",   "gray.700");

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

  /* ---------------- derived ---------------- */
  const areas = useMemo(
    () => Array.from(new Set(seats.map((s) => s.area))).sort(),
    [seats]
  );

  // זיהוי משתמשים שכבר יש להם לפחות כיסא אחד
  const seatedUserIds = useMemo(
    () => new Set(seats.filter((s) => s.owner_id).map((s) => s.owner_id)),
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
  };

  const pickUser = useCallback(
    (u: User) => {
      setSelected(u);
      setStage("details");
      setNumGuests(u.num_guests);
      setAreaIn(u.area || "");
      setComingIn(u.is_coming);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
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
    }
    setStage("seats");
  };

  /* ---------------- create a new table ---------------- */
  const handleCreateTable = async () => {
    if (!areaIn) {
      toast({ title: "אנא בחר אזור קודם", status: "warning", duration: 3000 });
      return;
    }
    try {
      await createTableAPI(areaIn, 12);
      const updatedSeats = await fetchSeats();
      setSeats(updatedSeats);
      toast({ title: "שולחן חדש נפתח בהצלחה!", status: "success", duration: 2500 });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({ title: "שגיאה בפתיחת שולחן", status: "error", duration: 3000 });
    }
  };

  /* ---------------- assign to specific table ---------------- */
  const assignAndConfirmTable = async (col: number) => {
    if (!selected) return;

    const tableSeats = seats.filter(s => s.area === areaIn && s.col === col);
    const availableSeats = tableSeats.filter(s => !s.owner_id || s.owner_id === selected.id);

    if (availableSeats.length < numGuests) {
      toast({ title: "אין מספיק מקומות פנויים בשולחן זה", status: "error", duration: 3000 });
      return;
    }

    const toAssignIds = availableSeats.slice(0, numGuests).map(s => s.id);

    // * כאן מתבצע איפוס כמות הרזרבה ל-0 בעת השיבוץ לשולחן *
    const payload = {
      seat_ids: toAssignIds,
      num_guests: numGuests,
      reserve_count: 0,
      area: areaIn,
      is_coming: comingIn,
    };

    try {
      const updated = await updateUser(selected.id, payload);
      setUsers((u) => u.map((x) => (x.id === updated.id ? updated : x)));
      setSelected(updated);
      setSeats(await fetchSeats());
      setStage("confirmed");
      toast({ title: `שובץ בהצלחה לשולחן ${col}`, status: "success", duration: 2500 });
    } catch (error) {
      console.error("Failed to assign to table:", error);
      toast({ title: "שגיאה בשמירה", status: "error", duration: 4000 });
    }
  };


  /* ---------------- TABLE DATA PROCESSING ---------------- */
  const getTablesSummary = () => {
    if (!areaIn) return [];

    const areaSeats = seats.filter(s => s.area === areaIn);
    const tablesMap = new Map<number, Seat[]>();

    areaSeats.forEach(s => {
       if (!tablesMap.has(s.col)) tablesMap.set(s.col, []);
       tablesMap.get(s.col)!.push(s);
    });

    return Array.from(tablesMap.entries()).map(([col, tSeats]) => {
       const freeCountForUser = tSeats.filter(s => !s.owner_id || s.owner_id === selected?.id).length;
       const occupantsIds = Array.from(new Set(tSeats.filter(s => s.owner_id && s.owner_id !== selected?.id).map(s => s.owner_id)));
       const occupants = occupantsIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
       const isUserCurrentlyHere = tSeats.some(s => s.owner_id === selected?.id);

       return { col, tSeats, freeCountForUser, occupants, totalCapacity: tSeats.length, isUserCurrentlyHere };
    }).sort((a, b) => a.col - b.col);
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
      <Alert status="error" variant="subtle" flexDir="column" alignItems="center" textAlign="center" dir="rtl" m={8}>
        <AlertIcon boxSize={10} mr={0} />
        <Heading size="md" mb={2}>{error}</Heading>
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
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </Select>
                </FormControl>

                <HStack>
                  <Button colorScheme="brand" onClick={saveDetails}>
                    שמור והמשך לשיבוץ
                  </Button>
                  <Button variant="outline" onClick={resetSelection}>
                    ביטול
                  </Button>
                </HStack>
              </VStack>
            )}

            {/* ---------- tables stage ---------- */}
            {stage === "seats" && comingIn === "כן" && numGuests > 0 && (
              <VStack w="full" align="flex-start" gap={4}>
                <HStack w="full" justify="space-between" wrap="wrap">
                    <Heading size="md">
                      שיבוץ לאזור: {areaIn} (צריך {numGuests} מקומות)
                    </Heading>
                    <Button colorScheme="green" size="sm" onClick={handleCreateTable}>
                        + פתח שולחן חדש
                    </Button>
                </HStack>
                <Divider />

                {(() => {
                    const tables = getTablesSummary();
                    if (tables.length === 0) return <Text>אין שולחנות באזור זה.</Text>;

                    return (
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} w="full">
                            {tables.map(table => {
                                const hasSpace = table.freeCountForUser >= numGuests;
                                const isCurrentTable = table.isUserCurrentlyHere;

                                return (
                                    <Box
                                        key={table.col}
                                        p={4}
                                        borderWidth="2px"
                                        borderRadius="md"
                                        borderColor={isCurrentTable ? "blue.400" : hasSpace ? "green.400" : "gray.200"}
                                        bg={hasSpace ? "white" : "gray.50"}
                                        shadow="sm"
                                    >
                                        <HStack justify="space-between" mb={2}>
                                            <Heading size="sm">שולחן {table.col}</Heading>
                                            <Badge colorScheme={hasSpace ? "green" : "red"}>
                                                פנוי: {table.freeCountForUser} / {table.totalCapacity}
                                            </Badge>
                                        </HStack>

                                        <Text fontSize="sm" color="gray.600" mb={4} minH="40px">
                                            {table.occupants.length > 0
                                                ? `יושבים: ${table.occupants.map(o => `${o.name} (${seats.filter(s => s.owner_id === o.id && s.col === table.col).length})`).join(", ")}`
                                                : "השולחן ריק."}
                                        </Text>

                                        <Button
                                            w="full"
                                            colorScheme={isCurrentTable ? "blue" : "brand"}
                                            isDisabled={!hasSpace}
                                            onClick={() => assignAndConfirmTable(table.col)}
                                        >
                                            {isCurrentTable ? "עדכן שולחן זה (המשתמש כבר כאן)" : hasSpace ? "שבץ לשולחן זה" : "אין מספיק מקום"}
                                        </Button>
                                    </Box>
                                );
                            })}
                        </SimpleGrid>
                    );
                })()}

                <HStack mt={4}>
                  <Button variant="outline" onClick={() => setStage("details")}>
                    חזור לעריכת פרטים
                  </Button>
                </HStack>
              </VStack>
            )}

            {/* seats stage but invalid */}
            {stage === "seats" && (comingIn !== "כן" || numGuests === 0) && (
              <Alert status="info" borderRadius="md" w="full" flexDir="column" textAlign="center">
                <AlertIcon />
                עדכן סטטוס הגעה ומספר אורחים לפני בחירת מושבים.
                <Button mt={2} variant="outline" onClick={() => setStage("details")}>
                  חזור לעריכת פרטים
                </Button>
              </Alert>
            )}
          </VStack>
        )}

        {/* 1. טבלת “רזרבה” (משתמשים שאישרו הגעה אבל ללא שולחן) */}
        <Box mb={12}>
          <Heading textStyle="h2" mb={4}>
            📋 רזרבה (מגיעים ללא שולחן)
          </Heading>

          {(() => {
            // הסינון המעודכן: אישרו הגעה, יש אורחים, ואין להם כיסאות
            const reserveUsers = users.filter(
              (u) => u.is_coming === "כן" && u.num_guests > 0 && !seatedUserIds.has(u.id)
            );

            const totals = reserveUsers.reduce(
              (acc, u) => acc + u.num_guests, 0
            );

            if (reserveUsers.length === 0) return <Text>אין כרגע אורחים ברזרבה.</Text>;

            return (
              <TableContainer>
                <Table variant="striped" size="sm">
                  <Thead>
                    <Tr>
                      <Th>שם</Th>
                      <Th>טלפון</Th>
                      <Th>אורחים (לשיבוץ)</Th>
                      <Th>אזור מועדף</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {reserveUsers.map((u) => (
                      <Tr
                        key={u.id}
                        onClick={() => pickUser(u)}
                        cursor="pointer"
                        _hover={{ bg: listHoverBg }}
                        bg={selected?.id === u.id ? "brand.50" : undefined}
                        transition="background 0.2s"
                      >
                        <Td>{u.name}</Td>
                        <Td>{u.phone}</Td>
                        <Td>{u.num_guests}</Td>
                        <Td>{u.area || "-"}</Td>
                      </Tr>
                    ))}
                    <Tr fontWeight="bold" bg="bg.muted">
                      <Td colSpan={2}>סה״כ מקומות להשלמה</Td>
                      <Td>{totals}</Td>
                      <Td />
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            );
          })()}
        </Box>

        {/* 2. סידור לפי שולחנות */}
        <Box mb={12}>
          <Heading textStyle="h2" mb={4}>
            🗺️ סידור לפי שולחנות
          </Heading>
          {areas.length === 0 && <Text>לא קיימים כיסאות או אזורים מוגדרים במסד הנתונים.</Text>}

          {areas.map(area => {
            const areaSeats = seats.filter(s => s.area === area);
            const cols = Array.from(new Set(areaSeats.map(s => s.col))).sort((a,b) => a - b);

            if (cols.length === 0) return null;

            return (
              <Box key={area} mb={8} p={4} borderWidth="1px" borderRadius="md" bg={cardBg}>
                 <Heading size="md" mb={4}>אזור: {area}</Heading>
                 <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                    {cols.map(col => {
                        const tSeats = areaSeats.filter(s => s.col === col);
                        const capacity = tSeats.length;
                        const occupied = tSeats.filter(s => s.owner_id);
                        const freeCount = capacity - occupied.length;

                        // קיבוץ לפי משתמש
                        const occupantCounts = new Map<number, number>();
                        occupied.forEach(s => {
                            if (s.owner_id) {
                                occupantCounts.set(s.owner_id, (occupantCounts.get(s.owner_id) || 0) + 1);
                            }
                        });

                        return (
                           <Box key={col} p={4} borderWidth="1px" borderRadius="md" borderColor="gray.200" bg={freeCount === 0 ? "gray.50" : "white"}>
                              <HStack justify="space-between" mb={3}>
                                  <Text fontWeight="bold" fontSize="lg">שולחן {col}</Text>
                                  <Badge colorScheme={freeCount > 0 ? "green" : "red"}>
                                    {freeCount === 0 ? "מלא" : `${freeCount} פנויים מתוך ${capacity}`}
                                  </Badge>
                              </HStack>
                              <Divider mb={3} />

                              {occupantCounts.size === 0 ? (
                                  <Text fontSize="sm" color="gray.500">השולחן ריק</Text>
                              ) : (
                                  <VStack align="start" gap={1}>
                                      {Array.from(occupantCounts.entries()).map(([uid, count]) => {
                                          const usr = users.find(u => u.id === uid);
                                          return (
                                              <Text
                                                key={uid}
                                                fontSize="sm"
                                                cursor="pointer"
                                                _hover={{ color: "brand.500", textDecoration: "underline" }}
                                                onClick={() => { if(usr) pickUser(usr); }}
                                                title="לחץ לעריכת המשתמש"
                                              >
                                                  • {usr?.name} ({count})
                                              </Text>
                                          );
                                      })}
                                  </VStack>
                              )}
                           </Box>
                        )
                    })}
                 </SimpleGrid>
              </Box>
            )
          })}
        </Box>

        {/* 3. טבלת “כל המשתמשים” */}
        <Box>
          <Heading textStyle="h2" mb={4}>
            👥 כל המשתמשים
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
                        bg={selected?.id === u.id ? "brand.50" : undefined}
                        transition="background 0.2s"
                      >
                        <Td>{u.name}</Td>
                        <Td>{u.phone}</Td>
                        <Td>{u.is_coming ?? "-"}</Td>
                        <Td>{u.num_guests}</Td>
                        <Td>{u.area || "-"}</Td>
                      </Tr>
                    ))}
                    <Tr fontWeight="bold" bg="bg.muted">
                      <Td colSpan={3}>סה״כ</Td>
                      <Td>{totals.guests}</Td>
                      <Td />
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            );
          })()}
        </Box>

        {/* שילוב הקומפוננטה RSVP --> */}
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