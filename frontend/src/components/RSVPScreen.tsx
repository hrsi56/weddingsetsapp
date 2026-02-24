import React, { useEffect, useMemo, useState } from "react";
import {
  VStack,
  HStack,
  Heading,
  Text,
  Input,
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
    <VStack gap={4}>
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
    </VStack>
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
  SpecialMeal: string | null;
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
const fetchAreas = () =>
  safeFetch<string[]>(`${BASE}/users/areas`);
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
  const [meatMeals, setMeatMeals] = useState(0);           // <<< state חדש
  const [glutenFreeMeals, setGlutenFreeMeals] = useState(0); // <<< state חדש
  const [areaChoice, setAreaChoice] = useState("");
  const [specialMealText, setSpecialMealText] = useState("");


  /* ---------- set initial form state on login ---------- */
  // Updated to set new meal states
  useEffect(() => {
    if (user) {
      setGuests(user.num_guests ?? 1);
      setVeganMeals(user.vegan ?? 0);
      setKidsMeals(user.kids ?? 0);
      setMeatMeals(user.meat ?? 0);           // <<< עדכון state
      setGlutenFreeMeals(user.glutenfree ?? 0); // <<< עדכון state
      setSpecialMealText(user.SpecialMeal || "");
      if (user.area) {
        setAreaChoice(user.area);
      }
    }
  }, [user]);

  /* ---------- SEARCH ---------- */
  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    try {
      // 1. שולפים את המשתמשים ואת כל האזורים במקביל
      const [guestsData, fetchedAreas] = await Promise.all([
        searchGuests(query.trim()),
        fetchAreas()
      ]);

      // 2. שולפים את כל המקומות של האורחים שנמצאו
      const guestsWithSeats = await Promise.all(guestsData.map(async (g) => {
         const st = await seatsByUser(g.id);
         return { guest: g, seats: st };
      }));

      // 3. בונים את מפת הקידומות לאזורים (כדי שמספר השולחן יתאים בדיוק למסך האדמין)
      const localAreas = new Set(fetchedAreas);
      guestsWithSeats.forEach(({seats}) => {
         seats.forEach(s => localAreas.add(s.area));
      });

      const sortedAreas = Array.from(localAreas).filter(Boolean).sort();
      const areaPrefixMap: Record<string, number> = {};
      sortedAreas.forEach((a, idx) => {
         areaPrefixMap[a] = idx + 10;
      });

      // 4. בונים את הטבלה לתצוגה
      const table: any[] = [];
      guestsWithSeats.forEach(({guest, seats}) => {
          if (seats.length > 0) {
              // מקבצים לפי שולחן (כדי לא להציג 5 שורות זהות לאורח עם 5 מקומות באותו שולחן)
              const uniqueTables = Array.from(new Set(seats.map(s => {
                 const prefix = areaPrefixMap[s.area];
                 return prefix ? `${prefix}${s.col}` : `${s.col}`;
              })));

              uniqueTables.forEach(tNum => {
                 table.push({
                    טלפון: guest.phone,
                    שולחן: tNum,
                    אורחים: guest.num_guests,
                    שם: guest.name,
                 });
              });
          } else {
              // אם אין שיבוץ לשולחן
              table.push({
                  טלפון: guest.phone,
                  שולחן: "גשו לכניסה",
                  אורחים: guest.num_guests,
                  שם: guest.name,
              });
          }
      });
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
    const totalSpecialMeals = veganMeals + kidsMeals + meatMeals + glutenFreeMeals;
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
      meat: meatMeals,           // <<< שליחת נתונים
      glutenfree: glutenFreeMeals, // <<< שליחת נתונים
      SpecialMeal: specialMealText,
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
                בטוח ש-<b>{phone}</b> הוא מספר הטלפון הנכון?
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
              <Heading color="primary" fontWeight="bold">אישור הגעה</Heading>
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
            <VStack w="full" align="stretch">
              <VStack mb={6}>
                <Text>כמה כיסאות לשמור?</Text>
                <CustomNumberInput
                  value={guests}
                  min={1}
                  onIncrement={() => setGuests((g) => g + 1)}
                  onDecrement={() => setGuests((g) => g - 1)}
                />
              </VStack>
              <VStack mb={6} w="full">
                  <Text>אלרגנים / תזונה מיוחדת?</Text>
                  <Input
                      placeholder="למשל: רגישות לבוטנים, צליאק, טבעונות וכו'"
                      value={specialMealText}
                      onChange={(e) => setSpecialMealText(e.target.value)}
                      focusBorderColor="primary"
                      dir="rtl"
                  />
              </VStack>
              <Button w="full" onClick={saveDetails}>
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