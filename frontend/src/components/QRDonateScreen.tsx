import React, { useEffect, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Link as ChakraLink,
  Center,
  useColorModeValue,
} from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { useInView } from "react-intersection-observer";

/* ------------------------------------------------------------
 * links: שני סטים (even/odd) למניעת חסימות שירות
 * ---------------------------------------------------------- */
const LINKS_EVEN = {
  bit: "https://www.bitpay.co.il/app/me/E9049ECA-8141-BA0B-2447-B065756C7CE27979",
  paybox: "https://link.payboxapp.com/MezqeVWwZKLExEqe9",
};
const LINKS_ODD = {
  bit: "https://www.bitpay.co.il/app/me/CCB63470-71B9-3957-154F-F3E20BEBF8F452AD",
  paybox: "https://link.payboxapp.com/4bxjYRXxUs5ZNbGT8",
};

/* ------------------------------------------------------------
 * API – שליחת ברכה ל-Google Sheets
 * ---------------------------------------------------------- */
const addBlessing = async (name: string, blessing: string) => {
  const r = await fetch("/api/blessing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, blessing }),
  });
  if (!r.ok) throw new Error("בעיה בשליחה");
};

/* ------------------------------------------------------------
 * QRItem: קומפוננטת קישור + QR + טקסט גרדיאנט
 * ---------------------------------------------------------- */
const QRItem: React.FC<{ label: string; url: string }> = ({ label, url }) => {
  const { ref, inView } = useInView({ threshold: 0.2 });

  const gradientIn = useColorModeValue(
    "linear(to-t, #E8A041, #FDB98F, #1AAFB7)",
    "linear(to-t, brand.50, accent.50)"
  );

  const gradientOut = useColorModeValue(
    "linear(to-b, brand.50, accent.50)",
    "linear(to-b, #1AAFB7, #FDB98F, #E8A041)"
  );

  return (
    <ChakraLink
      href={url}
      isExternal
      _hover={{ textDecoration: "none", transform: "scale(1.05)" }}
      transition="transform 0.2s"
    >
      <VStack>
        <Text
          ref={ref}
          fontSize="lg"
          fontWeight="semibold"
          bgGradient={inView ? gradientIn : gradientOut}
          bgClip="text"
          color="transparent"
          transition="all 0.4s ease"
        >
          {label}
        </Text>
        <Center>
          <QRCodeSVG value={url} size={180} level="H" />
        </Center>
      </VStack>
    </ChakraLink>
  );
};

/* ------------------------------------------------------------
 * MAIN COMPONENT
 * ---------------------------------------------------------- */
const QRDonateScreen: React.FC = () => {
  const [links, setLinks] = useState(LINKS_EVEN);
  useEffect(() => {
    setLinks(Math.random() * 1000 % 2 < 1 ? LINKS_EVEN : LINKS_ODD);
  }, []);

  const [name, setName] = useState("");
  const [blessing, setBlessing] = useState("");
  const [status, setStatus] = useState<null | "ok" | "err">(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !blessing.trim()) return setStatus("err");
    try {
      await addBlessing(name.trim(), blessing.trim());
      setStatus("ok");
      setName("");
      setBlessing("");
    } catch {
      setStatus("err");
    }
  };

  const cardBg = useColorModeValue("bg.canvas", "gray.800");
  const bgco = "rgba(230, 255, 251, 0.2)";

  return (
    <Box maxW="lg" mx="auto" p={6} dir="rtl" layerStyle="card" bg={bgco} mb={12}>
      {/* --------- טופס ברכה --------- */}
      <Box
        as="form"
        onSubmit={handleSubmit}
        layerStyle="card"
        bg={cardBg}
        textAlign="right"
      >
        <Heading textAlign="center" color="primary" mb={6}>
          📝 כתיבת ברכה לזוג המאושר
        </Heading>

        <VStack gap={4}>
          <FormControl>
            <FormLabel>שם</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              focusBorderColor="primary"
            />
          </FormControl>

          <FormControl>
            <FormLabel>ברכה</FormLabel>
            <Textarea
              rows={5}
              resize="none"
              value={blessing}
              onChange={(e) => setBlessing(e.target.value)}
              focusBorderColor="primary"
            />
          </FormControl>

          <Button type="submit" w="full">
            שליחה
          </Button>

          {status === "ok" && (
            <Text color="green.500">✅ הברכה נשלחה! תודה ❤️</Text>
          )}
          {status === "err" && (
            <Text color="red.500">🛑 יש למלא שם וברכה (או שגיאת שרת)</Text>
          )}
        </VStack>
      </Box>

      {/* --------- QR codes --------- */}
      <HStack
        mt={10}
        gap={{ base: 6, md: 10 }}
        justify="center"
        flexWrap="wrap"
      >
        <QRItem label="Bit" url={links.bit} />
        <QRItem label="PayBox" url={links.paybox} />
      </HStack>
    </Box>
  );
};

export default QRDonateScreen;