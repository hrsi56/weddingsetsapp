// src/components/AdminScreen.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { CloseIcon, SearchIcon } from "@chakra-ui/icons";
import RSVPScreen from "./RSVPScreen";

/* ─────────────────────────────────────────────────────────────
 *  TYPES
 * ───────────────────────────────────────────────────────────── */
interface User {
  id: number;
  name: string;
  phone: string;
  Phone2?: string | null;
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

type Stage = "details" | "seats" | "confirmed" | null;

/* ─────────────────────────────────────────────────────────────
 *  API HELPERS
 * ───────────────────────────────────────────────────────────── */
const BASE = "/api";
const JSON_HEADERS = { "Content-Type": "application/json" } as const;

async function safeFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? `HTTP ${res.status} – ${url}`);
  }
  return res.json() as Promise<T>;
}

// שליפת כל המשתמשים (מסוכך בשרת)
const fetchAllUsers = (signal?: AbortSignal): Promise<User[]> =>
  safeFetch(`${BASE}/users`, { signal });

// שליפת משתמשים עם חיפוש – הסינון נעשה בשרת
const searchUsers = (q: string, signal?: AbortSignal): Promise<User[]> =>
  safeFetch(`${BASE}/users?q=${encodeURIComponent(q)}`, { signal });

const fetchSeats = (): Promise<Seat[]> =>
  safeFetch(`${BASE}/seats`);

const fetchAreas = (): Promise<string[]> =>
  safeFetch(`${BASE}/users/areas`);

const apiCreateUser = (data: Partial<User>): Promise<User> =>
  safeFetch(`${BASE}/users`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });

const apiUpdateUser = (
  id: number,
  data: Partial<User> & { seat_ids?: number[] }
): Promise<User> =>
  safeFetch(`${BASE}/users/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });

const apiCreateTable = (
  area: string,
  capacity = 12
): Promise<{ ok: boolean; new_col: number }> =>
  safeFetch(`${BASE}/seats/table`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ area, capacity }),
  });

const apiDeleteTable = (
  area: string,
  col: number
): Promise<{ ok: boolean }> =>
  safeFetch(
    `${BASE}/seats/table?area=${encodeURIComponent(area)}&col=${col}`,
    { method: "DELETE" }
  );

/* ─────────────────────────────────────────────────────────────
 *  UTILITIES
 * ───────────────────────────────────────────────────────────── */
const HEBREW_NAME_RE = /^[א-ת]{2,}(?: [א-ת]{2,})+$/;
const PHONE_RE = /^\d{10}$/;

const maskPhone = (phone?: string | null): string => {
  if (!phone) return "";
  if (phone.length <= 3) return phone;
  return "*".repeat(phone.length - 3) + phone.slice(-3);
};

const seatSummary = (
  user: User,
  seats: Seat[],
  prefixMap: Record<string, number>
): string => {
  const owned = seats.filter((s) => s.owner_id === user.id);
  if (!owned.length) return "לא שובצו מקומות";

  const tableCount: Record<string, number> = {};
  owned.forEach((s) => {
    const prefix = prefixMap[s.area];
    const displayCol = prefix != null ? `${prefix}${s.col}` : s.col;
    const key = `אזור ${s.area}, שולחן ${displayCol}`;
    tableCount[key] = (tableCount[key] ?? 0) + 1;
  });

  return Object.entries(tableCount)
    .map(([k, c]) => `${c} מקומות ב${k}`)
    .join(" | ");
};

/* ─────────────────────────────────────────────────────────────
 *  COMPONENT
 * ───────────────────────────────────────────────────────────── */
const AdminScreen: React.FC = () => {
  const toast = useToast();
  const cardBg      = useColorModeValue("white", "gray.800");
  const rowHoverBg  = useColorModeValue("gray.50", "gray.700");

  /* ── Loading / Error ─────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  /* ── Data: TWO SEPARATE CONCERNS ─────────────────────────────
   *
   *  allUsers     – רשימה מלאה מסוכך, נטענת ברקע כל 30s.
   *                 משמשת את תצוגת השולחנות (section 2) כדי
   *                 שתמיד נדע מי יושב איפה.
   *
   *  displayUsers – תוצאות שמוצגות ברשימות (רזרבה / כל משתמשים).
   *                 כשאין חיפוש = allUsers.
   *                 כשיש חיפוש  = מה שחזר מהשרת עבור ה-query.
   *
   *  ─── מדוע זה פותר את ה-Race Condition? ───────────────────
   *  הרענון ברקע כותב רק ל-allUsers (ול-displayUsers אם אין חיפוש).
   *  החיפוש ה-debounced כותב רק ל-displayUsers.
   *  הם לעולם לא כותבים לאותו state בו-זמנית.
   * ──────────────────────────────────────────────────────────── */
  const [allUsers,     setAllUsers]     = useState<User[]>([]);
  const [displayUsers, setDisplayUsers] = useState<User[]>([]);
  const [seats,        setSeats]        = useState<Seat[]>([]);
  const [serverAreas,  setServerAreas]  = useState<string[]>([]);

  /* ── Search ──────────────────────────────────────────────── */
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  /* ── Selection / Edit Flow ───────────────────────────────── */
  const [selected,  setSelected]  = useState<User | null>(null);
  const [stage,     setStage]     = useState<Stage>(null);
  const [numGuests, setNumGuests] = useState(1);
  const [areaIn,    setAreaIn]    = useState("");
  const [comingIn,  setComingIn]  = useState<"כן" | "לא" | null>(null);

  /* ── Create Form ─────────────────────────────────────────── */
  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState("");
  const [newPhone,   setNewPhone]   = useState("");
  const [createErr,  setCreateErr]  = useState<string | null>(null);

  /* ── Derived ─────────────────────────────────────────────── */
  const areas = useMemo(() => {
    const combined = new Set([...serverAreas, ...seats.map((s) => s.area)]);
    return Array.from(combined).filter(Boolean).sort();
  }, [serverAreas, seats]);

  const areaPrefixMap = useMemo(() => {
    const map: Record<string, number> = {};
    areas.forEach((a, i) => { map[a] = i + 10; });
    return map;
  }, [areas]);

  // Map מהיר id→user מתוך allUsers (לתצוגת השולחנות)
  const userById = useMemo(
    () => new Map(allUsers.map((u) => [u.id, u])),
    [allUsers]
  );

  // Set של ה-IDs שיושבים בכיסאות
  const seatedUserIds = useMemo(
    () => new Set(seats.filter((s) => s.owner_id !== null).map((s) => s.owner_id as number)),
    [seats]
  );

  // Set של ה-IDs שתואמים לחיפוש הנוכחי (לצורך הדגשה בשולחנות)
  const matchedUserIds = useMemo(
    () => new Set(displayUsers.map((u) => u.id)),
    [displayUsers]
  );

  /* ── Background Refresh ──────────────────────────────────── */
  // ref כדי לבדוק מצב חיפוש בתוך callback ה-setInterval
  // ללא צורך להוסיף אותו ל-dependencies של useCallback
  const searchQueryRef = useRef(searchQuery);
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  const refreshData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [u, s, a] = await Promise.all([
        fetchAllUsers(),
        fetchSeats(),
        fetchAreas(),
      ]);
      setAllUsers(u);
      setSeats(s);
      setServerAreas(a);
      // אם אין חיפוש פעיל – עדכן גם את displayUsers
      if (!searchQueryRef.current.trim()) {
        setDisplayUsers(u);
      }
      if (!isBackground) setError(null);
    } catch (e) {
      if (!isBackground) setError((e as Error).message);
      else console.error("Background refresh failed:", e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData(false);
    const id = setInterval(() => refreshData(true), 30_000);
    return () => clearInterval(id);
  }, [refreshData]);

  /* ── Search: Debounce + AbortController ──────────────────── */

  // כשאין חיפוש, displayUsers מסונכרן עם allUsers
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDisplayUsers(allUsers);
    }
  }, [allUsers, searchQuery]);

  // כשיש חיפוש, שולחים בקשה לשרת (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const controller = new AbortController();
    setSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery.trim(), controller.signal);
        if (!controller.signal.aborted) {
          setDisplayUsers(results);
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== "AbortError") {
          console.error("Search failed:", e);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  /* ── Helpers ─────────────────────────────────────────────── */
  const getTableDisplay = useCallback(
    (area: string, col: number) => {
      const prefix = areaPrefixMap[area];
      return prefix != null ? `${prefix}${col}` : `${col}`;
    },
    [areaPrefixMap]
  );

  const resetSelection = useCallback(() => {
    setSelected(null);
    setStage(null);
    setShowCreate(false);
  }, []);

  const pickUser = useCallback((u: User) => {
    setSelected(u);
    setStage("details");
    setNumGuests(u.num_guests);
    setAreaIn(u.area ?? "");
    setComingIn(u.is_coming);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // עדכון allUsers ו-displayUsers לאחר שינוי משתמש (PUT/POST)
  const syncUpdatedUser = useCallback((updated: User) => {
    setAllUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    setDisplayUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  }, []);

  /* ── Create User ─────────────────────────────────────────── */
  const handleCreate = async () => {
    setCreateErr(null);

    if (!newName.trim() || !newPhone.trim())
      return setCreateErr("שם וטלפון חובה.");
    if (!HEBREW_NAME_RE.test(newName.trim()))
      return setCreateErr("השם חייב להיות בעברית (שם + משפחה).");
    if (!PHONE_RE.test(newPhone.trim()))
      return setCreateErr("טלפון – 10 ספרות בלבד.");

    try {
      const created = await apiCreateUser({
        name: newName.trim(),
        phone: newPhone.trim(),
        user_type: "אורח",
        is_coming: null,
        num_guests: 1,
        reserve_count: 0,
        area: "",
      });
      setAllUsers((p) => [...p, created]);
      setDisplayUsers((p) => [...p, created]);
      toast({ title: "נוצר בהצלחה", status: "success", duration: 2500 });
      setShowCreate(false);
      setNewName("");
      setNewPhone("");
      pickUser(created);
    } catch (e) {
      setCreateErr((e as Error).message);
    }
  };

  /* ── Save Details (stage → seats) ───────────────────────── */
  const saveDetails = async () => {
    if (!selected) return;

    const diff: Partial<User> & { seat_ids?: number[] } = {};
    if (numGuests !== selected.num_guests)   diff.num_guests = numGuests;
    if (comingIn  !== selected.is_coming)    diff.is_coming  = comingIn;

    const currentArea = selected.area ?? "";
    if (areaIn !== currentArea) {
      diff.area = areaIn;
      // שינוי אזור → שחרור כיסאות ישנים
      if (seatedUserIds.has(selected.id)) diff.seat_ids = [];
    }

    if (Object.keys(diff).length) {
      try {
        const updated = await apiUpdateUser(selected.id, diff);
        syncUpdatedUser(updated);
        setSelected(updated);
        if (diff.seat_ids !== undefined) setSeats(await fetchSeats());
      } catch (e) {
        toast({ title: "שגיאה בשמירת פרטים", description: (e as Error).message, status: "error", duration: 4000 });
        return;
      }
    }
    setStage("seats");
  };

  /* ── Create Table ────────────────────────────────────────── */
  const handleCreateTable = async () => {
    if (!areaIn) {
      toast({ title: "אנא בחר אזור קודם", status: "warning", duration: 3000 });
      return;
    }
    try {
      await apiCreateTable(areaIn, 12);
      setSeats(await fetchSeats());
      toast({ title: "שולחן חדש נפתח!", status: "success", duration: 2500 });
    } catch (e) {
      toast({ title: "שגיאה בפתיחת שולחן", status: "error", duration: 3000 });
    }
  };

  /* ── Assign to Table ─────────────────────────────────────── */
  const assignToTable = async (col: number) => {
    if (!selected) return;

    const tableSeats = seats.filter((s) => s.area === areaIn && s.col === col);
    const available  = tableSeats.filter((s) => !s.owner_id || s.owner_id === selected.id);

    if (available.length < numGuests) {
      toast({ title: "אין מספיק מקומות פנויים בשולחן זה", status: "error", duration: 3000 });
      setSeats(await fetchSeats().catch(() => seats));
      return;
    }

    const payload = {
      seat_ids:    available.slice(0, numGuests).map((s) => s.id),
      num_guests:  numGuests,
      reserve_count: 0,
      area:        areaIn,
      is_coming:   comingIn,
    };

    try {
      const updated = await apiUpdateUser(selected.id, payload);
      syncUpdatedUser(updated);
      setSelected(updated);
      setSeats(await fetchSeats());
      setStage("confirmed");
      toast({ title: `שובץ לשולחן ${getTableDisplay(areaIn, col)}`, status: "success", duration: 2500 });
    } catch (e) {
      toast({
        title: "שיבוץ נכשל",
        description: (e as Error).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setSeats(await fetchSeats().catch(() => seats));
    }
  };

  /* ── Remove From Table ───────────────────────────────────── */
  const handleRemoveFromTable = async (userToRemove: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`האם להסיר את ${userToRemove.name} מהשולחן?`)) return;

    try {
      const updated = await apiUpdateUser(userToRemove.id, { seat_ids: [] });
      syncUpdatedUser(updated);
      setSeats(await fetchSeats());
      toast({ title: "הוסר בהצלחה", status: "success", duration: 2500 });
      if (selected?.id === userToRemove.id) setStage("details");
    } catch (e) {
      toast({ title: "שגיאה בהסרה", status: "error", duration: 3000 });
    }
  };

  /* ── Delete Table ────────────────────────────────────────── */
  const handleDeleteTable = async (area: string, col: number) => {
    const displayName = getTableDisplay(area, col);
    if (!window.confirm(`למחוק את שולחן ${displayName} באזור ${area}? כל האורחים יחזרו לרזרבה.`)) return;

    try {
      await apiDeleteTable(area, col);
      const freshSeats = await fetchSeats();
      setSeats(freshSeats);
      toast({ title: "השולחן נמחק", status: "success", duration: 2500 });
      // אם המשתמש הנבחר ישב בשולחן שנמחק
      if (selected && seats.some((s) => s.owner_id === selected.id && s.area === area && s.col === col)) {
        setStage("details");
      }
    } catch (e) {
      toast({ title: "שגיאה במחיקת השולחן", status: "error", duration: 3000 });
    }
  };

  /* ── Tables Summary (for seats stage) ───────────────────── */
  const getTablesSummary = useCallback(() => {
    if (!areaIn) return [];

    const areaSeats = seats.filter((s) => s.area === areaIn);
    const map = new Map<number, Seat[]>();
    areaSeats.forEach((s) => {
      if (!map.has(s.col)) map.set(s.col, []);
      map.get(s.col)!.push(s);
    });

    return Array.from(map.entries())
      .map(([col, colSeats]) => {
        const freeCount     = colSeats.filter((s) => !s.owner_id || s.owner_id === selected?.id).length;
        const occupantIds   = Array.from(
          new Set(colSeats.filter((s) => s.owner_id && s.owner_id !== selected?.id).map((s) => s.owner_id!))
        );
        // שימוש ב-allUsers (userById) לקבלת שם אמיתי, ללא תלות בחיפוש
        const occupants     = occupantIds.map((id) => userById.get(id)).filter(Boolean) as User[];
        const isCurrentUser = colSeats.some((s) => s.owner_id === selected?.id);

        return { col, freeCount, occupants, totalCapacity: colSeats.length, isCurrentUser };
      })
      .sort((a, b) => a.col - b.col);
  }, [areaIn, seats, selected, userById]);

  /* ─────────────────────────────────────────────────────────────
   *  STATISTICS  (תמיד מבוססות על allUsers + seats המלאים)
   * ───────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const totalSeated     = seats.filter((s) => s.owner_id !== null).length;
    const totalUnseated   = allUsers
      .filter((u) => u.is_coming === "כן" && u.num_guests > 0 && !seatedUserIds.has(u.id))
      .reduce((acc, u) => acc + u.num_guests, 0);
    return { totalSeated, totalUnseated, grand: totalSeated + totalUnseated };
  }, [seats, allUsers, seatedUserIds]);

  /* ─────────────────────────────────────────────────────────────
   *  EARLY RETURNS
   * ───────────────────────────────────────────────────────────── */
  if (loading)
    return (
      <Box p={8} textAlign="center" dir="rtl">
        <Spinner size="xl" />
        <Text mt={2}>טוען...</Text>
      </Box>
    );

  if (error)
    return (
      <Alert status="error" flexDir="column" alignItems="center" textAlign="center" dir="rtl" m={8}>
        <AlertIcon boxSize={10} mr={0} />
        <Heading size="md" mt={2}>{error}</Heading>
        <Button mt={4} onClick={() => refreshData(false)}>נסה שוב</Button>
      </Alert>
    );

  /* ─────────────────────────────────────────────────────────────
   *  JSX
   * ───────────────────────────────────────────────────────────── */
  return (
    <Box p={{ base: 3, md: 8 }} dir="rtl" textAlign="right">

      {/* ══ CREATE FORM ══════════════════════════════════════════ */}
      {showCreate && !selected && (
        <VStack
          bg={cardBg} gap={4} mb={8} p={6}
          borderRadius="md" shadow="md" borderWidth="1px"
        >
          <Heading size="lg">יצירת אורח חדש</Heading>

          <FormControl>
            <FormLabel>שם מלא (עברית)</FormLabel>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ישראל ישראלי"
              textAlign="center"
            />
          </FormControl>

          <FormControl>
            <FormLabel>טלפון (10 ספרות)</FormLabel>
            <Input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="05XXXXXXXX"
              textAlign="center"
              type="tel"
            />
          </FormControl>

          {createErr && <Text color="red.500" fontSize="sm">{createErr}</Text>}

          <HStack>
            <Button colorScheme="brand" onClick={handleCreate}>צור אורח</Button>
            <Button variant="outline" onClick={() => { setShowCreate(false); setCreateErr(null); }}>ביטול</Button>
          </HStack>
        </VStack>
      )}

      {/* ══ SELECTED USER CARD ══════════════════════════════════ */}
      {selected && (
        <VStack
          bg={cardBg} gap={6} mb={8} p={6}
          borderRadius="md" shadow="md" borderWidth="1px"
          align="stretch"
        >
          <HStack justify="space-between" wrap="wrap" gap={2}>
            <Heading size="md">
              {selected.name}
              <Text as="span" fontWeight="normal" fontSize="sm" color="gray.500" mr={2}>
                ({maskPhone(selected.phone)}
                {selected.Phone2 ? ` / ${maskPhone(selected.Phone2)}` : ""})
              </Text>
            </Heading>
            <Button size="sm" variant="ghost" onClick={resetSelection}>
              ✕ סגור
            </Button>
          </HStack>

          <Divider />

          {/* ── CONFIRMED ─────────────────────────────────────── */}
          {stage === "confirmed" && (
            <VStack bg="green.50" p={4} borderRadius="md" gap={2}>
              <Heading size="md" color="green.700">✔ נשמר בהצלחה</Heading>
              <Text>{seatSummary(selected, seats, areaPrefixMap)}</Text>
              <Button size="sm" variant="outline" onClick={() => setStage("details")}>ערוך שוב</Button>
            </VStack>
          )}

          {/* ── DETAILS STAGE ─────────────────────────────────── */}
          {stage === "details" && (
            <VStack align="stretch" gap={4}>
              <Heading size="sm" color="gray.600">עדכון פרטים</Heading>

              {/* סטטוס הגעה */}
              <FormControl>
                <FormLabel>סטטוס הגעה</FormLabel>
                <Menu matchWidth>
                  <MenuButton
                    as={Button} w="full" variant="outline"
                    fontWeight="normal"
                    rightIcon={<span style={{ fontSize: "0.7em" }}>▼</span>}
                  >
                    {comingIn ?? "בחר..."}
                  </MenuButton>
                  <MenuList zIndex={20}>
                    <MenuItem onClick={() => setComingIn("כן")}>כן</MenuItem>
                    <MenuItem onClick={() => setComingIn("לא")}>לא</MenuItem>
                  </MenuList>
                </Menu>
              </FormControl>

              {/* מספר אורחים */}
              <FormControl>
                <FormLabel>מספר אורחים (כולל המשתמש)</FormLabel>
                <Input
                  type="number" min={0} max={20}
                  value={numGuests}
                  onChange={(e) => setNumGuests(Math.max(0, parseInt(e.target.value) || 0))}
                  textAlign="center"
                />
              </FormControl>

              {/* אזור */}
              <FormControl>
                <FormLabel>אזור ישיבה מועדף</FormLabel>
                <Menu matchWidth>
                  <MenuButton
                    as={Button} w="full" variant="outline"
                    fontWeight="normal"
                    rightIcon={<span style={{ fontSize: "0.7em" }}>▼</span>}
                  >
                    {areaIn || "-- ללא אזור --"}
                  </MenuButton>
                  <MenuList zIndex={20} maxH="250px" overflowY="auto">
                    <MenuItem onClick={() => setAreaIn("")}>-- ללא אזור --</MenuItem>
                    {areas.map((a) => (
                      <MenuItem key={a} onClick={() => setAreaIn(a)}>{a}</MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </FormControl>

              <HStack justify="center" pt={2}>
                <Button colorScheme="brand" onClick={saveDetails}>
                  שמור והמשך לשיבוץ ›
                </Button>
                <Button variant="outline" onClick={resetSelection}>ביטול</Button>
              </HStack>
            </VStack>
          )}

          {/* ── SEATS STAGE (valid) ───────────────────────────── */}
          {stage === "seats" && comingIn === "כן" && numGuests > 0 && (
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between" wrap="wrap">
                <Heading size="sm">
                  שיבוץ באזור: <Text as="span" color="brand.500">{areaIn || "לא נבחר"}</Text>
                  <Text as="span" fontWeight="normal" fontSize="sm" color="gray.500" mr={2}>
                    (צריך {numGuests} מקומות)
                  </Text>
                </Heading>
                <Button colorScheme="green" size="sm" onClick={handleCreateTable}>
                  + שולחן חדש
                </Button>
              </HStack>

              <Divider />

              {(() => {
                const tables = getTablesSummary();
                if (!tables.length)
                  return <Text color="gray.500">אין שולחנות באזור זה. פתח שולחן חדש.</Text>;

                return (
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    {tables.map((t) => {
                      const hasSpace  = t.freeCount >= numGuests;
                      const isCurrent = t.isCurrentUser;

                      return (
                        <Box
                          key={t.col}
                          p={4} borderWidth="2px" borderRadius="md" shadow="sm"
                          borderColor={isCurrent ? "blue.400" : hasSpace ? "green.300" : "gray.200"}
                          bg={hasSpace ? "white" : "gray.50"}
                        >
                          <HStack justify="space-between" mb={2}>
                            <Heading size="sm">
                              שולחן {getTableDisplay(areaIn, t.col)}
                              {isCurrent && <Badge colorScheme="blue" mr={2} fontSize="xs">כאן</Badge>}
                            </Heading>
                            <Badge colorScheme={hasSpace ? "green" : "red"}>
                              {t.freeCount}/{t.totalCapacity} פנויים
                            </Badge>
                          </HStack>

                          <Text fontSize="sm" color="gray.500" minH="36px" mb={3}>
                            {t.occupants.length
                              ? `יושבים: ${t.occupants.map((o) => {
                                  const count = seats.filter(
                                    (s) => s.owner_id === o.id && s.col === t.col
                                  ).length;
                                  return `${o.name} (${count})`;
                                }).join(", ")}`
                              : "השולחן ריק"}
                          </Text>

                          <Button
                            w="full" size="sm"
                            colorScheme={isCurrent ? "blue" : "brand"}
                            isDisabled={!hasSpace}
                            onClick={() => assignToTable(t.col)}
                          >
                            {isCurrent
                              ? "עדכן שיבוץ"
                              : hasSpace
                              ? "שבץ כאן"
                              : "אין מספיק מקום"}
                          </Button>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                );
              })()}

              <Button variant="outline" size="sm" alignSelf="flex-start" onClick={() => setStage("details")}>
                ‹ חזור לפרטים
              </Button>
            </VStack>
          )}

          {/* ── SEATS STAGE (invalid – not coming / 0 guests) ─── */}
          {stage === "seats" && (comingIn !== "כן" || numGuests === 0) && (
            <Alert status="info" borderRadius="md" flexDir="column" textAlign="center">
              <AlertIcon />
              <Text mt={1}>
                {comingIn !== "כן"
                  ? "לא ניתן לשבץ – סטטוס ההגעה אינו 'כן'."
                  : "מספר האורחים הוא 0 – אין מה לשבץ."}
              </Text>
              <Button mt={3} size="sm" variant="outline" onClick={() => setStage("details")}>
                ‹ חזור לפרטים
              </Button>
            </Alert>
          )}
        </VStack>
      )}

      {/* ══ RSVP QUICK CHECK ════════════════════════════════════ */}
      <Box mb={12} pb={8} borderBottomWidth="2px" borderColor="gray.100">
        <Heading size="md" mb={4}>🚪 רישום / בדיקת אורח בכניסה</Heading>
        <Box bg={cardBg} p={6} borderRadius="md" shadow="sm">
          <RSVPScreen />
        </Box>
      </Box>

      {/* ══ ADMIN HEADER ════════════════════════════════════════ */}
      <HStack mb={6} justify="space-between" wrap="wrap" gap={3}>
        <Heading size="lg">🎩 ניהול האולם</Heading>
        <HStack gap={2} wrap="wrap">
          <Badge colorScheme="purple" fontSize="sm" px={3} py={1} borderRadius="md">
            שובצו {stats.totalSeated} | רזרבה {stats.totalUnseated} | סה״כ {stats.grand}
          </Badge>
          <Button
            colorScheme="brand" size="sm"
            onClick={() => { resetSelection(); setShowCreate(true); }}
          >
            + אורח חדש
          </Button>
        </HStack>
      </HStack>

      {/* ══ SMART SEARCH BAR ════════════════════════════════════ */}
      <Box mb={8}>
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none">
            {searchLoading ? <Spinner size="sm" /> : <SearchIcon color="gray.400" />}
          </InputLeftElement>
          <Input
            placeholder="חיפוש אורח לפי שם (חלקי) או טלפון (10 ספרות מדויקות)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg={cardBg}
            shadow="sm"
            borderRadius="md"
            paddingInlineStart={10}
          />
          {searchQuery && (
            <InputLeftElement left="auto" right={2}>
              <IconButton
                aria-label="נקה חיפוש"
                icon={<CloseIcon boxSize={3} />}
                size="sm" variant="ghost"
                onClick={() => setSearchQuery("")}
              />
            </InputLeftElement>
          )}
        </InputGroup>
        {searchQuery && (
          <Text fontSize="xs" color="gray.400" mt={1} mr={1}>
            {displayUsers.length} תוצאות
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 10 && /^\d+$/.test(searchQuery.trim())
              ? " – לחיפוש לפי טלפון הקלד 10 ספרות מדויקות"
              : ""}
          </Text>
        )}
      </Box>

      {/* ══ SECTION 1: RESERVE LIST ══════════════════════════════
       *  מבוסס על displayUsers (תוצאות החיפוש)
       * ════════════════════════════════════════════════════════ */}
      <Box mb={12}>
        <HStack mb={4} justify="space-between">
          <Heading size="md">📋 מגיעים ללא שולחן (רזרבה)</Heading>
          {searchQuery && (
            <Badge colorScheme="blue">מסונן לפי: "{searchQuery}"</Badge>
          )}
        </HStack>

        {(() => {
          const reserveList = displayUsers.filter(
            (u) => u.is_coming === "כן" && u.num_guests > 0 && !seatedUserIds.has(u.id)
          );
          const total = reserveList.reduce((acc, u) => acc + u.num_guests, 0);

          if (!reserveList.length)
            return (
              <Text color="gray.500">
                {searchQuery ? "לא נמצאו אורחים ברזרבה התואמים לחיפוש." : "רשימת הרזרבה ריקה."}
              </Text>
            );

          return (
            <TableContainer bg={cardBg} borderRadius="md" shadow="sm">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr bg="gray.50">
                    <Th>שם</Th>
                    <Th>טלפון</Th>
                    <Th isNumeric>אורחים</Th>
                    <Th>אזור מועדף</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {reserveList.map((u) => (
                    <Tr
                      key={u.id}
                      cursor="pointer"
                      onClick={() => pickUser(u)}
                      _hover={{ bg: rowHoverBg }}
                      bg={selected?.id === u.id ? "brand.50" : undefined}
                    >
                      <Td>{u.name}</Td>
                      <Td>{maskPhone(u.phone)}</Td>
                      <Td isNumeric>{u.num_guests}</Td>
                      <Td>{u.area || "–"}</Td>
                    </Tr>
                  ))}
                  <Tr bg="gray.100" fontWeight="bold">
                    <Td colSpan={2}>סה״כ מקומות לשיבוץ</Td>
                    <Td isNumeric>{total}</Td>
                    <Td />
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
          );
        })()}
      </Box>

      {/* ══ SECTION 2: TABLE GRID ════════════════════════════════
       *  מבוסס על allUsers (userById) – תמיד מלא.
       *  כשיש חיפוש פעיל: מציג רק שולחנות עם אורח תואם,
       *  אך מציג גם את שאר האורחים שיושבים באותו שולחן.
       * ════════════════════════════════════════════════════════ */}
      <Box mb={12}>
        <HStack mb={4} wrap="wrap" gap={3}>
          <Heading size="md">🗺️ סידור לפי שולחנות</Heading>
          {searchQuery && (
            <Badge colorScheme="blue">מסונן לפי: "{searchQuery}"</Badge>
          )}
        </HStack>

        {areas.length === 0 && (
          <Text color="gray.500">אין כיסאות במסד הנתונים.</Text>
        )}

        {areas.map((area) => {
          const areaSeats = seats.filter((s) => s.area === area);
          let cols = Array.from(new Set(areaSeats.map((s) => s.col))).sort((a, b) => a - b);

          // כשיש חיפוש: רק שולחנות שמכילים לפחות אורח אחד תואם
          if (searchQuery.trim()) {
            cols = cols.filter((col) =>
              areaSeats
                .filter((s) => s.col === col && s.owner_id !== null)
                .some((s) => matchedUserIds.has(s.owner_id!))
            );
          }

          if (!cols.length) return null;

          return (
            <Box
              key={area} mb={8} p={4}
              borderWidth="1px" borderRadius="md"
              bg={cardBg} shadow="sm"
            >
              <Heading size="sm" mb={4} color="gray.600">אזור: {area}</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                {cols.map((col) => {
                  const colSeats  = areaSeats.filter((s) => s.col === col);
                  const capacity  = colSeats.length;
                  const freeCount = colSeats.filter((s) => !s.owner_id).length;

                  // ספירת כיסאות לכל owner (O(1) דרך userById)
                  const ownerCount = new Map<number, number>();
                  colSeats.forEach((s) => {
                    if (s.owner_id) ownerCount.set(s.owner_id, (ownerCount.get(s.owner_id) ?? 0) + 1);
                  });

                  return (
                    <Box
                      key={col}
                      p={3} borderWidth="1px" borderRadius="md" borderColor="gray.200"
                      bg={freeCount === 0 ? "gray.50" : "white"}
                    >
                      <HStack justify="space-between" mb={2}>
                        <HStack gap={1}>
                          <Text fontWeight="bold">שולחן {getTableDisplay(area, col)}</Text>
                          <IconButton
                            aria-label="מחק שולחן"
                            icon={<CloseIcon boxSize={2.5} />}
                            size="xs" colorScheme="red" variant="ghost"
                            title="מחק שולחן לצמיתות"
                            onClick={() => handleDeleteTable(area, col)}
                          />
                        </HStack>
                        <Badge colorScheme={freeCount > 0 ? "green" : "red"} fontSize="xs">
                          {freeCount === 0 ? "מלא" : `${freeCount}/${capacity} פנויים`}
                        </Badge>
                      </HStack>

                      <Divider mb={2} />

                      {ownerCount.size === 0 ? (
                        <Text fontSize="sm" color="gray.400">ריק</Text>
                      ) : (
                        <VStack align="stretch" gap={1}>
                          {Array.from(ownerCount.entries()).map(([uid, count]) => {
                            const usr      = userById.get(uid);
                            const isMatch  = searchQuery.trim() ? matchedUserIds.has(uid) : false;

                            // אם המשתמש לא נמצא ב-allUsers (מקרה קצה)
                            if (!usr)
                              return (
                                <Text key={uid} fontSize="xs" color="gray.300">
                                  אורח #{uid} ({count})
                                </Text>
                              );

                            return (
                              <HStack key={uid} justify="space-between" borderRadius="sm" px={1}
                                _hover={{ bg: "gray.50" }}>
                                <Text
                                  fontSize="sm" cursor="pointer"
                                  fontWeight={isMatch ? "bold" : "normal"}
                                  color={isMatch ? "brand.600" : "inherit"}
                                  bg={isMatch ? "yellow.100" : "transparent"}
                                  px={isMatch ? 1 : 0} borderRadius="sm"
                                  _hover={{ textDecoration: "underline" }}
                                  onClick={() => pickUser(usr)}
                                >
                                  {usr.name} ({count})
                                </Text>
                                <IconButton
                                  aria-label="הסר"
                                  icon={<CloseIcon boxSize={2} />}
                                  size="xs" colorScheme="red" variant="ghost"
                                  onClick={(e) => handleRemoveFromTable(usr, e)}
                                />
                              </HStack>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>
          );
        })}

        {/* אין תוצאות בחיפוש */}
        {searchQuery.trim() && !areas.some((area) => {
          const areaSeats = seats.filter((s) => s.area === area);
          return Array.from(new Set(areaSeats.map((s) => s.col))).some((col) =>
            areaSeats.filter((s) => s.col === col && s.owner_id !== null)
              .some((s) => matchedUserIds.has(s.owner_id!))
          );
        }) && (
          <VStack mt={2} align="start">
            <Text color="gray.500">לא נמצאו שולחנות עם אורחים תואמים לחיפוש.</Text>
            <Button size="sm" variant="outline" onClick={() => setSearchQuery("")}>נקה חיפוש</Button>
          </VStack>
        )}
      </Box>

      {/* ══ SECTION 3: ALL USERS TABLE ══════════════════════════
       *  מבוסס על displayUsers – מסונן לפי חיפוש
       * ════════════════════════════════════════════════════════ */}
      <Box>
        <HStack mb={4} justify="space-between">
          <Heading size="md">👥 כל המשתמשים</Heading>
          {searchQuery && (
            <Badge colorScheme="blue">מסונן לפי: "{searchQuery}"</Badge>
          )}
        </HStack>

        {!displayUsers.length ? (
          <Text color="gray.500">
            {searchQuery ? "לא נמצאו משתמשים התואמים לחיפוש." : "אין משתמשים במסד הנתונים."}
          </Text>
        ) : (
          <TableContainer bg={cardBg} borderRadius="md" shadow="sm">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr bg="gray.50">
                  <Th>שם</Th>
                  <Th>טלפון</Th>
                  <Th>מגיע?</Th>
                  <Th isNumeric>אורחים</Th>
                  <Th>אזור</Th>
                </Tr>
              </Thead>
              <Tbody>
                {displayUsers.map((u) => (
                  <Tr
                    key={u.id}
                    cursor="pointer"
                    onClick={() => pickUser(u)}
                    _hover={{ bg: rowHoverBg }}
                    bg={selected?.id === u.id ? "brand.50" : undefined}
                  >
                    <Td>{u.name}</Td>
                    <Td>{maskPhone(u.phone)}</Td>
                    <Td>
                      <Badge
                        colorScheme={u.is_coming === "כן" ? "green" : u.is_coming === "לא" ? "red" : "gray"}
                      >
                        {u.is_coming ?? "לא ידוע"}
                      </Badge>
                    </Td>
                    <Td isNumeric>{u.num_guests}</Td>
                    <Td>{u.area || "–"}</Td>
                  </Tr>
                ))}
                <Tr bg="gray.100" fontWeight="bold">
                  <Td colSpan={3}>סה״כ</Td>
                  <Td isNumeric>{displayUsers.reduce((acc, u) => acc + u.num_guests, 0)}</Td>
                  <Td />
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

    </Box>
  );
};

export default AdminScreen;
