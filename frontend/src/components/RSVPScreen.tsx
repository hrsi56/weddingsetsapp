import React, { useEffect, useMemo, useState } from "react";
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
  useToast,
  useColorModeValue,
  IconButton,
} from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";

/* ------------------------------------------------------------
 * רכיב מעוצב אישית לשדה מספר
 * ---------------------------------------------------------- */
interface CustomNumberInputProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
}

const CustomNumberInput: React.FC<CustomNumberInputProps> = ({
  value,
  onIncrement,
  onDecrement,
  min,
  max,
}) => {
  return (
    <HStack maxW="180px" w="full" justifyContent="center" gap={4}>
      <IconButton
        aria-label="הוספה"
        icon={<AddIcon />}
        onClick={onIncrement}
        isDisabled={max !== undefined && value >= max}
        colorScheme="green"
        isRound
      />
      <Input
        value={value}
        readOnly
        textAlign="center"
        w="60px"
        focusBorderColor="primary"
        fontWeight="bold"
        fontSize="lg"
        p={0}
      />
      <IconButton
        aria-label="הפחתה"
        icon={<MinusIcon />}
        onClick={onDecrement}
        isDisabled={min !== undefined && value <= min}
        colorScheme="red"
        isRound
      />
    </HStack>
  );
};


/* ------------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------- */
// Updated User interface to include new fields
interface User {
  id: number;
  name: string;
  phone: string;
  user_type: string | null;
  is_coming: "כן" | "לא" | null;
  num_guests: number | null;
  reserve_count: number | null;
  area: string | null;
  vegan: number | null;
  kids: number | null;
  vegankids: number | null; // <<< שדה חדש
  meat: number | null;       // <<< שדה חדש
  glutenfree: number | null; // <<< שדה חדש
}

interface Seat {
  id: number;
  row: string;
  col: number;
  area: string;
  status: "free" | "taken";
  owner_id: number | null;
}
type Coming = "כן" | "לא" | null;

/* ------------------------------------------------------------
 * API HELPERS (with error handling)
 * ---------------------------------------------------------- */
const BASE = "/api";
const json = { "Content-Type": "application/json" } as const;

async function safeFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok)
    throw new Error(
      (await r.json().catch(() => null))?.detail ?? r.statusText
    );
  return r.json();
}

const searchGuests = (q: string) =>
  safeFetch<User[]>(`${BASE}/users?q=${encodeURIComponent(q)}`);
const seatsByUser = (id: number) =>
  safeFetch<Seat[]>(`${BASE}/seats/user/${id}`);
const loginOrCreate = (name: string, phone: string) =>
  safeFetch<User>(`${BASE}/users/login`, {
    method: "POST",
    headers: json,
    body: JSON.stringify({ name, phone }),
  });
const updateComing = (id: number, coming: boolean) =>
  safeFetch(`${BASE}/users/${id}/coming`, {
    method: "PUT",
    headers: json,
    body: JSON.stringify({ coming }),
  });
const updateUser = (id: number, data: Partial<User>) =>
  safeFetch(`${BASE}/users/${id}`, {
    method: "PUT",
    headers: json,
    body: JSON.stringify(data),
  });
const getAllSeats = () => safeFetch<Seat[]>(`${BASE}/seats`);

/* ------------------------------------------------------------
 * VALIDATORS
 * ---------------------------------------------------------- */
const isPhone = (v: string) => /^\d{10}$/.test(v);

/* ------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------- */
const RSVPScreen: React.FC = () => {
  const toast = useToast();

  /* ---------- state ---------- */
  const [finished, setFinished] = useState<"תודה" | "מצטערים" | null>(null);

  const [showLogin, setShowLogin] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);

  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [coming, setComing] = useState<Coming>(null);
  const [guests, setGuests] = useState(1);
  const [veganMeals, setVeganMeals] = useState(0);
  const [kidsMeals, setKidsMeals] = useState(0);
  const [veganKidsMeals, setVeganKidsMeals] = useState(0); // <<< state חדש
  const [meatMeals, setMeatMeals] = useState(0);           // <<< state חדש
  const [glutenFreeMeals, setGlutenFreeMeals] = useState(0); // <<< state חדש
  const [areas, setAreas] = useState<string[]>([]);
  const [areaChoice, setAreaChoice] = useState("");

  /* ---------- initial areas ---------- */
  useEffect(() => {
    getAllSeats().then((s) =>
      setAreas(Array.from(new Set(s.map((x) => x.area))).sort())
    );
  }, []);

  /* ---------- set initial form state on login ---------- */
  // Updated to set new meal states
  useEffect(() => {
    if (user) {
      setGuests(user.num_guests ?? 1);
      setVeganMeals(user.vegan ?? 0);
      setKidsMeals(user.kids ?? 0);
      setVeganKidsMeals(user.vegankids ?? 0); // <<< עדכון state
      setMeatMeals(user.meat ?? 0);           // <<< עדכון state
      setGlutenFreeMeals(user.glutenfree ?? 0); // <<< עדכון state
      if (user.area) {
        setAreaChoice(user.area);
      }
    }
  }, [user]);

  /* ---------- SEARCH ---------- */
  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    try {
      const guests = await searchGuests(query.trim());
      const table: any[] = [];
      for (const g of guests) {
        const st = await seatsByUser(g.id);
        if (st.length)
          st.forEach((s) =>
            table.push({
              טלפון: g.phone,
              כיסא: s.row,
              שולחן: s.col,
              איזור: g.area ?? "-",
              אורחים: g.num_guests,
              שם: g.name,
            })
          );
        else
          table.push({
            טלפון: g.phone,
            כיסא: "נא לגשת לכניסה לקבלת מקומות",
            אורחים: g.num_guests,
            שם: g.name,
          });
      }
      setRows(table);
    } catch {
      toast({ title: "שגיאת חיפוש", status: "error" });
    }
  };

  /* ---------- LOGIN ---------- */
  const handleLogin = async () => {
    const trimmedPhone = phone.trim();
    const trimmedName = name.trim();

    if (!isPhone(trimmedPhone)) {
      toast({ title: "טלפון – 10 ספרות", status: "warning" });
      return;
    }

    try {
      const existingUsers = await searchGuests(trimmedPhone);
      const userExists = existingUsers.length > 0;

      if (userExists) {
        const u = await loginOrCreate(trimmedName, trimmedPhone);
        setUser(u);
        setShowLogin(false);
      } else {
        setShowCreateConfirm(true);
      }
    } catch (e) {
      toast({
        title: "שגיאת התחברות",
        description: (e as Error).message,
        status: "error",
      });
    }
  };

  const handleCreateConfirmed = async () => {
    try {
      const u = await loginOrCreate(name.trim(), phone.trim());
      setUser(u);
      setShowLogin(false);
      setShowCreateConfirm(false);
    } catch (e) {
      toast({
        title: "שגיאה ביצירת המשתמש",
        description: (e as Error).message,
        status: "error",
      });
    }
  };

  const handleCreateCancelled = () => {
    setShowCreateConfirm(false);
  };

  /* ---------- COMING choice ---------- */
  useEffect(() => {
    if (!user || !coming) return;
    updateComing(user.id, coming === "כן");
    if (coming === "לא") setFinished("מצטערים");
  }, [coming, user]);

  /* ---------- SAVE DETAILS ---------- */
  // Updated to send new meal data
  const saveDetails = async () => {
    if (!user) return;
    // הגבלה משופרת לפני השליחה לשרת
    const totalSpecialMeals = veganMeals + kidsMeals + veganKidsMeals + meatMeals + glutenFreeMeals;
    if (totalSpecialMeals > guests) {
        toast({ title: "מספר המנות המיוחדות גדול ממספר האורחים", status: "warning" });
        return;
    }
    await updateUser(user.id, {
      num_guests: guests,
      reserve_count: guests,
      area: areaChoice,
      vegan: veganMeals,
      kids: kidsMeals,
      vegankids: veganKidsMeals, // <<< שליחת נתונים
      meat: meatMeals,           // <<< שליחת נתונים
      glutenfree: glutenFreeMeals, // <<< שליחת נתונים
    });
    setFinished("תודה");
  };

  /* ---------- table ---------- */
  const table = useMemo(() => {
    if (!rows.length)
      return (
        <Center>
          <Text color="gray.500">לא נמצאו תוצאות.</Text>
        </Center>
      );

    return (
      <TableContainer overflowX="auto">
        <Table variant="striped" size="sm">
          <Thead>
            <Tr bg="bg.muted">
              {Object.keys(rows[0])
                .reverse()
                .map((h) => (
                  <Th key={h} textAlign="center">
                    {h}
                  </Th>
                ))}
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((r, i) => (
              <Tr key={i}>
                {Object.values(r)
                  .reverse()
                  .map((v, j) => (
                    <Td key={j} textAlign="center">
                      {v as string | number}
                    </Td>
                  ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    );
  }, [rows]);

  /* ---------- theme bg ---------- */
  const cardBg = useColorModeValue("bg.canvas", "gray.800");

  /* ---------- FINISH ---------- */
  if (finished)
      return (
        <Center minH="50vh">
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color={finished === "תודה" ? "primary" : "red.500"}
            textAlign="center"
          >
            {finished === "תודה"
              ? "תודה רבה! המקומות נשמרו בהצלחה 💖"
              : "מצטערים שלא תוכלו להגיע. תודה על העדכון 💔"}
          </Text>
        </Center>
      );

  /* ---------- RENDER ---------- */
  return (
    <VStack maxW="2xl" mx="auto" p={4} gap={10} dir="rtl">
      {/* -------- LOGIN -------- */}
      {showLogin && !user && (
        <VStack layerStyle="card" bg={cardBg} gap={4} maxW="md" mx="auto">
          {showCreateConfirm ? (
            <VStack w="full" gap={4} textAlign="center">
              <Text>
                לא נמצא משתמש רשום.
                <br />
                האם אתה בטוח ש-<b>{phone}</b> הוא מספר הטלפון הנכון?
              </Text>
              <HStack w="full" gap={4}>
                <Button w="full" onClick={handleCreateConfirmed}>
                  כן, המשך
                </Button>
                <Button
                  w="full"
                  variant="outline"
                  onClick={handleCreateCancelled}
                >
                  לא, חזור
                </Button>
              </HStack>
            </VStack>
          ) : (
            <>
              <Heading color="primary">אישור הגעה</Heading>
              <Input
                placeholder="שם מלא"
                value={name}
                onChange={(e) => setName(e.target.value)}
                focusBorderColor="primary"
                dir="rtl"
                isDisabled={showCreateConfirm}
              />
              <Input
                placeholder="טלפון"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                focusBorderColor="primary"
                dir="rtl"
                isDisabled={showCreateConfirm}
              />
              <Button w="full" onClick={handleLogin}>
                המשך
              </Button>
              <Button
                variant="outline"
                w="full"
                onClick={() => {
                  setShowLogin(false);
                  setShowSearch(true);
                  setRows([]);
                  setQuery("");
                }}
              >
                חיפוש ברשומות
              </Button>
            </>
          )}
        </VStack>
      )}

      {/* -------- SEARCH -------- */}
      {showSearch && !user && (
        <VStack layerStyle="card" bg={cardBg} gap={4} maxW="md" mx="auto">
          <Input
            placeholder="🔍 חפש לפי שם או טלפון"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            focusBorderColor="primary"
            dir="rtl"
          />
          <Button w="full" onClick={handleSearch}>
            חפש/י
          </Button>
          {table}
          <Button
            variant="outline"
            w="full"
            onClick={() => {
              setShowSearch(false);
              setShowLogin(true);
              setRows([]);
              setQuery("");
            }}
          >
            אישור הגעה
          </Button>
        </VStack>
      )}

      {/* -------- AFTER LOGIN -------- */}
      {user && (
        <VStack layerStyle="card" bg={cardBg} gap={6} maxW="md" mx="auto">
          <Heading size="lg" color="primary">
            היי {user.name}!
          </Heading>

          {/* choice */}
          {!coming && (
            <HStack gap={6}>
              <Button onClick={() => setComing("כן")}>נגיע</Button>
              <Button colorScheme="red" onClick={() => setComing("לא")}>
                לא נגיע
              </Button>
            </HStack>
          )}

          {/* details */}
          {coming === "כן" && (
            <VStack w="full" gap={6} align="stretch">
              <VStack>
                <Text>כמה אורחים מגיעים?</Text>
                <CustomNumberInput
                  value={guests}
                  min={1}
                  onIncrement={() => setGuests((g) => g + 1)}
                  onDecrement={() => setGuests((g) => g - 1)}
                />
              </VStack>

              <VStack>
                <Text>מספר מנות טבעוניות:</Text>
                <CustomNumberInput
                  value={veganMeals}
                  min={0}
                  max={guests - (kidsMeals + veganKidsMeals + meatMeals + glutenFreeMeals)}
                  onIncrement={() => setVeganMeals((v) => v + 1)}
                  onDecrement={() => setVeganMeals((v) => v - 1)}
                />
              </VStack>

              <VStack>
                <Text>מספר מנות בשר:</Text>
                <CustomNumberInput
                  value={meatMeals}
                  min={0}
                  max={guests - (veganMeals + kidsMeals + veganKidsMeals + glutenFreeMeals)}
                  onIncrement={() => setMeatMeals((m) => m + 1)}
                  onDecrement={() => setMeatMeals((m) => m - 1)}
                />
              </VStack>


              <VStack>
                <Text>מספר מנות ילדים:</Text>
                <CustomNumberInput
                  value={kidsMeals}
                  min={0}
                  max={guests - (veganMeals + veganKidsMeals + meatMeals + glutenFreeMeals)}
                  onIncrement={() => setKidsMeals((k) => k + 1)}
                  onDecrement={() => setKidsMeals((k) => k - 1)}
                />
              </VStack>

              {/* <<< ----------- התוספות החדשות ----------- >>> */}
              <VStack>
                <Text>מספר מנות ילדים טבעוניות:</Text>
                <CustomNumberInput
                  value={veganKidsMeals}
                  min={0}
                  max={guests - (veganMeals + kidsMeals + meatMeals + glutenFreeMeals)}
                  onIncrement={() => setVeganKidsMeals((k) => k + 1)}
                  onDecrement={() => setVeganKidsMeals((k) => k - 1)}
                />
              </VStack>

              <VStack>
                <Text>מספר מנות ללא גלוטן:</Text>
                <CustomNumberInput
                  value={glutenFreeMeals}
                  min={0}
                  max={guests - (veganMeals + kidsMeals + veganKidsMeals + meatMeals)}
                  onIncrement={() => setGlutenFreeMeals((g) => g + 1)}
                  onDecrement={() => setGlutenFreeMeals((g) => g - 1)}
                />
              </VStack>
              {/* <<< ----------- סוף התוספות ----------- >>> */}


              {/* Show area selection only if user has no area assigned */}
              {user && !user.area && (
                <>
                  <Text>בחר/י איזור ישיבה:</Text>
                  <Select
                    placeholder="בחר/י..."
                    value={areaChoice}
                    onChange={(e) => setAreaChoice(e.target.value)}
                    focusBorderColor="primary"
                  >
                    {areas.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </Select>
                </>
              )}

              <Button w="full" onClick={saveDetails} isDisabled={!areaChoice && !user.area}>
                שמור/י
              </Button>
            </VStack>
          )}
        </VStack>
      )}
    </VStack>
  );
};

export default RSVPScreen;