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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------- */
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
type Coming = "כן" | "לא" | null;

/* ------------------------------------------------------------
 * API HELPERS (with error handling)
 * ---------------------------------------------------------- */
const BASE = "/api";
const json = { "Content-Type": "application/json" } as const;

async function safeFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error((await r.json().catch(() => null))?.detail ?? r.statusText);
  return r.json();
}

const searchGuests = (q: string) => safeFetch<User[]>(`${BASE}/users?q=${encodeURIComponent(q)}`);
const seatsByUser = (id: number) => safeFetch<Seat[]>(`${BASE}/seats/user/${id}`);
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
  safeFetch(`${BASE}/users/${id}`, { method: "PUT", headers: json, body: JSON.stringify(data) });
const getAllSeats = () => safeFetch<Seat[]>(`${BASE}/seats`);

/* ------------------------------------------------------------
 * VALIDATORS
 * ---------------------------------------------------------- */
const isHebrewName = (v: string) => /^[\u0590-\u05FF]{2,}( [\u0590-\u05FF]{2,})+$/.test(v);
const isPhone = (v: string) => /^\d{10}$/.test(v);

/* ------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------- */
const RSVPScreen: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  /* ---------- state ---------- */
  const [finished, setFinished] = useState<"תודה" | "מצטערים" | null>(null);

  const [showLogin, setShowLogin] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [coming, setComing] = useState<Coming>(null);
  const [guests, setGuests] = useState(1);
  const [areas, setAreas] = useState<string[]>([]);
  const [areaChoice, setAreaChoice] = useState("");

  /* ---------- initial areas ---------- */
  useEffect(() => {
    getAllSeats().then((s) =>
      setAreas(Array.from(new Set(s.map((x) => x.area))).sort())
    );
  }, []);

  /* ---------- smooth scroll on finish ---------- */
  useEffect(() => window.scrollTo({ top: 0, behavior: "smooth" }), [finished]);

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
            שולחן: "—",
            איזור: g.area ?? "-",
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
    if (!isHebrewName(name.trim())) {
      toast({ title: "שם מלא בעברית בלבד", status: "warning" });
      return;
    }
    if (!isPhone(phone.trim())) {
      toast({ title: "טלפון – 10 ספרות", status: "warning" });
      return;
    }
    // admin shortcut
    if (name.trim() === "ירדן" && phone.trim() === "0547957141") {
      navigate("/admin");
      return;
    }
    try {
      const u = await loginOrCreate(name.trim(), phone.trim());
      setUser(u);
      setShowLogin(false);
    } catch {
      toast({ title: "שגיאת התחברות", status: "error" });
    }
  };

  /* ---------- COMING choice ---------- */
  useEffect(() => {
    if (!user || !coming) return;
    updateComing(user.id, coming === "כן");
    if (coming === "לא") setFinished("מצטערים");
  }, [coming, user]);

  /* ---------- SAVE DETAILS ---------- */
  const saveDetails = async () => {
    if (!user) return;
    await updateUser(user.id, {
      num_guests: guests,
      reserve_count: guests,
      area: areaChoice,
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
      <Center mt={40}>
        <Text fontSize="2xl" fontWeight="bold" color={finished === "תודה" ? "primary" : "red.500" }  textAlign="center">
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
          <Heading color="primary">אישור הגעה</Heading>
          <Input
            placeholder="שם מלא"
            value={name}
            onChange={(e) => setName(e.target.value)}
            focusBorderColor="primary"
            dir="rtl"
          />
          <Input
            placeholder="טלפון"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            focusBorderColor="primary"
            dir="rtl"
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
            <VStack w="full" gap={4}>
              <Text>כמה אורחים מגיעים?</Text>
              <Input
                type="number"
                min={1}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                focusBorderColor="primary"
              />

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

              <Button w="full" onClick={saveDetails} isDisabled={!areaChoice}>
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