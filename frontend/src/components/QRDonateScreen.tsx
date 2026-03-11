import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  FormControl,
  Input,
  Textarea,
  Button,
  Link as ChakraLink,
  Center,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";

/* ------------------------------------------------------------
 * links: שני סטים (even/odd) למניעת חסימות שירות
 * ---------------------------------------------------------- */
const LINKS_EVEN = {
  bit: "https://www.bitpay.co.il/app/me/E9049ECA-8141-BA0B-2447-B065756C7CE27979",
  paybox: "https://links.payboxapp.com/wKlmiEfEPUb",
};
const LINKS_ODD = {
  bit: "https://www.bitpay.co.il/app/me/CCB63470-71B9-3957-154F-F3E20BEBF8F452AD",
  paybox: "https://links.payboxapp.com/0lLyHR9DPUb",
};

/* ------------------------------------------------------------
 * API
 * ---------------------------------------------------------- */
const addBlessing = async (name: string, blessing: string) => {
  const r = await fetch("/api/blessing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, blessing }),
  });
  if (!r.ok) throw new Error("בעיה בשליחה");
};

const getBlessings = async () => {
  const r = await fetch("/api/blessing");
  if (!r.ok) throw new Error("בעיה במשיכת הברכות");
  return r.json();
};

/* ------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------- */
const QRDonateScreen: React.FC = () => {
  const [links, setLinks] = useState(LINKS_EVEN);
  useEffect(() => {
    setLinks((Math.random() * 1000) % 2 < 1 ? LINKS_EVEN : LINKS_ODD);
  }, []);

  const [name, setName] = useState("");
  const [blessing, setBlessing] = useState("");
  const [status, setStatus] = useState<null | "ok" | "err">(null);

  const [blessingsList, setBlessingsList] = useState<{name: string, blessing: string}[]>([]);

  // --- אלגוריתם מגנט מותאם אישית ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToCard = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container || container.children.length === 0) return;

    // 1. מוצאים איפה האמצע של המסך כרגע (במיקומים יחסיים לחלון)
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    const children = Array.from(container.children);
    let currentIndex = 0;
    let minDistance = Infinity;

    // 2. עוברים על כל הברכות ובודקים מי מהן הכי קרובה למרכז כרגע
    children.forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const childCenter = rect.left + rect.width / 2;
      const distance = Math.abs(childCenter - containerCenter);

      if (distance < minDistance) {
        minDistance = distance;
        currentIndex = index;
      }
    });

    // 3. מחשבים מי הברכה הבאה בתור לפי כיוון הלחיצה
    // (ב-RTL ימין זה אינדקס קטן יותר, שמאל זה אינדקס גדול יותר)
    let targetIndex = currentIndex;
    if (direction === "right") {
      targetIndex = Math.max(0, currentIndex - 1);
    } else if (direction === "left") {
      targetIndex = Math.min(children.length - 1, currentIndex + 1);
    }

    // 4. "ממגנטים" את הברכה המיועדת בדיוק לאמצע
    children[targetIndex].scrollIntoView({
      behavior: "smooth",
      inline: "center", // מרכז אותה אופקית
      block: "nearest", // מונע קפיצות למעלה/למטה של העמוד עצמו
    });
  };
  // --------------------------------

  const fetchBlessings = async () => {
    try {
      const data = await getBlessings();
      if (data && Array.isArray(data)) {
        setBlessingsList(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBlessings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !blessing.trim()) return setStatus("err");
    try {
      await addBlessing(name.trim(), blessing.trim());
      setStatus("ok");
      setName("");
      setBlessing("");
      await fetchBlessings();
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
      }
    } catch {
      setStatus("err");
    }
  };

  /* --------- Theme colors --------- */
  const cardBg = useColorModeValue("bg.canvas", "gray.800");
  const blessBg = useColorModeValue("white", "gray.700");
  const bgco = "rgba(230, 255, 251, 0.2)";
  const teco = useColorModeValue("primary", "gray.800");
  const btnHover = useColorModeValue("teal.50", "teal.900");

  return (
    <Box maxW="lg" mx="auto" p={6} dir="rtl" layerStyle="card" bg={bgco} mb={12}>
      {/* 1. אזור טופס כתיבת ברכה */}

      {/* 2. אזור המתנות וקודי ה-QR */}
      <Box>
        <Heading textAlign="center" color="primary" mt={2} fontSize="2xl">
          🎁 להעברת מתנה 🎁
          <br />
          <Text as="span" fontSize="lg" fontWeight="normal">
            לחצו או סרקו
          </Text>
        </Heading>

        <HStack
          mt={8}
          gap={{ base: 4, md: 8 }}
          justify="center"
          wrap="nowrap"
        >
          {[
            { label: "Bit", url: links.bit },
            { label: "PayBox", url: links.paybox },
          ].map(({ label, url }) => (
            <ChakraLink
              key={label}
              href={url}
              isExternal
              _hover={{ textDecoration: "none", transform: "scale(1.05)" }}
              transition="transform 0.2s"
              w="100%"
              maxW="140px"
            >
              <VStack gap={2}>
                <Text fontSize="lg" color="primary" fontWeight="semibold" textColor={teco}>
                  {label}
                </Text>
                <Center bg="white" p={2} borderRadius="md" shadow="sm" w="full">
                  <QRCodeSVG value={url} size={110} level="H" style={{ width: "100%", height: "auto" }} />
                </Center>
              </VStack>
            </ChakraLink>
          ))}
        </HStack>
      </Box>


      <Box as="form" onSubmit={handleSubmit} layerStyle="card" bg={cardBg} textAlign="right">
              <Heading textAlign="center" color="primary" mb={6}>
                📝 כתיבת ברכה
              </Heading>

              <VStack gap={4}>
                <FormControl>
                  <Input
                    placeholder="שם"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    focusBorderColor="primary"
                  />
                </FormControl>

                <FormControl>
                  <Textarea
                    placeholder="ברכה"
                    rows={4}
                    resize="none"
                    value={blessing}
                    onChange={(e) => setBlessing(e.target.value)}
                    focusBorderColor="primary"
                  />
                </FormControl>

                <Button type="submit" w="full" colorScheme="teal">
                  שליחה
                </Button>

                {status === "ok" && <Text color="green.500">✅ הברכה נשלחה! תודה ❤️</Text>}
                {status === "err" && <Text color="red.500">🛑 יש למלא שם וברכה (או שגיאת שרת)</Text>}
              </VStack>
            </Box>

            <Divider my={8} borderColor="gray.300" />
      {/* 3. אזור הצגת הברכות בסוף העמוד */}
      {blessingsList.length > 0 ? (
        <Box bg={cardBg} p={4} borderRadius="md" boxShadow="sm">
          <Heading textAlign="center" size="md" color="primary" mb={4}>
            💌 ברכות מהאורחים 💌
          </Heading>

          <HStack
            ref={scrollContainerRef}
            overflowX="auto"
            spacing={4}
            pb={2}
            w="full"
            sx={{
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none", // תקני לפיירפוקס
              "&::-webkit-scrollbar": { display: "none" }, // לכרום וספארי
            }}
          >
            {blessingsList.map((item, idx) => (
              <Box
                key={idx}
                flexShrink={0}
                w={{ base: "85%", md: "70%" }}
                h="110px"
                p={4}
                bg={blessBg}
                borderWidth="1px"
                borderRadius="md"
                borderColor="gray.200"
                shadow="sm"
                overflowY="auto"
                sx={{ scrollSnapAlign: "center" }}
              >
                <Text fontWeight="bold" color="primary" fontSize="sm" mb={1}>
                  {item.name}
                </Text>
                <Text fontSize="sm" whiteSpace="pre-wrap" color={teco}>
                  {item.blessing}
                </Text>
              </Box>
            ))}
          </HStack>

          <HStack justify="center" mt={3} spacing={6}>
            <Button
              onClick={() => scrollToCard("right")}
              size="sm"
              rounded="full"
              variant="outline"
              colorScheme="teal"
              _hover={{ bg: btnHover }}
            >
              →
            </Button>
             <Button
              onClick={() => scrollToCard("left")}
              size="sm"
              rounded="full"
              variant="outline"
              colorScheme="teal"
              _hover={{ bg: btnHover }}
            >
              ←
            </Button>
          </HStack>
        </Box>
      ) : null}
    </Box>
  );
};

export default QRDonateScreen;