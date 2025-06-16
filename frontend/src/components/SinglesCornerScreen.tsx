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
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";

/* ------------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------- */
interface Single {
  name: string;
  gender: "זכר" | "נקבה";
  about: string;
}

/* ------------------------------------------------------------
 * API HELPERS (עם טיפול־שגיאה בסיסי)
 * ---------------------------------------------------------- */
const BASE = "/api";
const json = { "Content-Type": "application/json" } as const;

const safeFetch = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error((await r.json().catch(() => null))?.detail ?? r.statusText);
  return r.json();
};

const fetchSingles = () => safeFetch<{ men: Single[]; women: Single[] }>(`${BASE}/singles`);
const addSingle = (p: Single) =>
  safeFetch(`${BASE}/singles`, { method: "POST", headers: json, body: JSON.stringify(p) });
const addFeedback = (name: string, feedback: string) =>
  safeFetch(`${BASE}/feedback`, {
    method: "POST",
    headers: json,
    body: JSON.stringify({ name, feedback }),
  });

/* ------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------- */
const SinglesCornerScreen: React.FC = () => {
  const toast = useToast();

  /* ---------- state ---------- */
  const [men, setMen] = useState<Single[]>([]);
  const [women, setWomen] = useState<Single[]>([]);

  // add-single form
  const [sName, setSName] = useState("");
  const [gender, setGender] = useState<"" | "זכר" | "נקבה">("");
  const [about, setAbout] = useState("");

  // feedback form
  const [fName, setFName] = useState("");
  const [feedback, setFeedback] = useState("");

  /* ---------- fetch on mount ---------- */
  useEffect(() => {
    fetchSingles()
      .then((d) => {
        setMen(d.men);
        setWomen(d.women);
      })
      .catch(() => toast({ title: "שגיאת טעינה", status: "error" }));
  }, [toast]);

  /* ---------- handlers ---------- */
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName.trim() || !gender || !about.trim()) {
      toast({ title: "מלא/י את כל השדות", status: "warning" });
      return;
    }
    try {
      await addSingle({ name: sName.trim(), gender, about: about.trim() });
      toast({ title: "נשלח בהצלחה", status: "success" });
      setSName("");
      setGender("");
      setAbout("");
      const d = await fetchSingles();
      setMen(d.men);
      setWomen(d.women);
    } catch {
      toast({ title: "שגיאת שליחה", status: "error" });
    }
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim() || !feedback.trim()) {
      toast({ title: "מלא/י את כל השדות", status: "warning" });
      return;
    }
    try {
      await addFeedback(fName.trim(), feedback.trim());
      toast({ title: "נשלח בהצלחה", status: "success" });
      setFName("");
      setFeedback("");
    } catch {
      toast({ title: "שגיאת שליחה", status: "error" });
    }
  };

  /* ---------- theme bg ---------- */
  const cardBg = useColorModeValue("bg.canvas", "gray.800");
  const bgco = "rgba(230, 255, 251, 0.2)";

  /* ---------- JSX ---------- */
  return (
      <Box id="singles" maxW="5xl" mx="auto" p={6} dir="rtl" layerStyle="card" bg={bgco} mb={12} >
        {/* ----- add single ----- */}
        <Box as="form" onSubmit={handleAddSingle} layerStyle="card" bg={cardBg} mb={12}>
          <VStack gap={4}>
            <Heading size="lg" color="primary">
              💞 קיר הרווקים והרווקות 💞
            </Heading>

            <FormControl>
              <Input
                placeholder="שם"
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                focusBorderColor="primary"
              />
            </FormControl>

            <FormControl>
              <Select
                placeholder=". מין?"
                value={gender}
                onChange={(e) => setGender(e.target.value as "זכר" | "נקבה")}
                focusBorderColor="primary"
              >
                <option value="זכר">רווק</option>
                <option value="נקבה">רווקה</option>
              </Select>
            </FormControl>

            <FormControl>
              <Textarea
                placeholder="קצת עליי"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                focusBorderColor="primary"
                rows={5}
                resize="none"
              />
            </FormControl>

            <Button w="full" type="submit">
              שלח/י
            </Button>
          </VStack>
        </Box>

        {/* ----- lists ----- */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} mb={12}>
          {[
            { title: "רווקים 👨", data: men },
            { title: "רווקות 👩", data: women },
          ].map(({ title, data }) => (
            <Box key={title} bg={cardBg} layerStyle="card">
              <Heading size="lg" textAlign="center" color="primary" mb={4}>
                {title}
              </Heading>
              {data.length ? (
                <VStack gap={3} align="start">
                  {data.map((s, i) => (
                    <Box key={i} layerStyle="card" bg={bgco} textAlign="right">
                      <Text fontWeight="semibold">{s.name}</Text>
                      <Text whiteSpace="pre-wrap">{s.about}</Text>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text textAlign="center" color="gray.500">
                  אין נתונים.
                </Text>
              )}
            </Box>
          ))}
        </SimpleGrid>
        {/* ----- feedback ----- */}
        <Box as="form" onSubmit={handleFeedback} layerStyle="card" bg={cardBg}>
          <VStack gap={4}>
            <Heading size="lg" color="primary" textAlign="center">
              מישהו/י מצא/ה חן? כתבו לנו ונדאג לברר אם זה הדדי
            </Heading>

            <FormControl>
              <Input
                placeholder="שם מלא ומספר טלפון"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                focusBorderColor="primary"
              />
            </FormControl>

            <FormControl>
              <Textarea
                placeholder="ההודעה שלך"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                focusBorderColor="primary"
                rows={5}
                resize="none"
              />
            </FormControl>

            <Button w="full" type="submit">
              שלח/י
            </Button>
          </VStack>
        </Box>
      </Box>
  );
};

export default SinglesCornerScreen;