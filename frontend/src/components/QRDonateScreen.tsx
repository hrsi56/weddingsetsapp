import React, { useEffect, useState } from "react";
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
} from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";

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
 * COMPONENT
 * ---------------------------------------------------------- */
const QRDonateScreen: React.FC = () => {
  /* --------- לינקים אקראיים --------- */
  const [links, setLinks] = useState(LINKS_EVEN);
  useEffect(() => {
    setLinks(Math.random() * 1000 % 2 < 1 ? LINKS_EVEN : LINKS_ODD);
  }, []);

  /* --------- form state --------- */
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

  /* --------- theme colours --------- */
  const cardBg = useColorModeValue("bg.canvas", "gray.800");
  const bgco = "rgba(230, 255, 251, 0.2)";
  const teco = useColorModeValue("primary", "gray.800");


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
            <Input
              placeholder= "שם"
              value={name}
              onChange={(e) => setName(e.target.value)}
              focusBorderColor="primary"
            />
          </FormControl>

          <FormControl>
            <Textarea
              placeholder="ברכה"
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
          >
            <VStack>
              <Text fontSize="lg" color="primary" fontWeight="semibold" textColor={teco}>
                {label}
              </Text>
              <Center>
                <QRCodeSVG value={url} size={180} level="H" />
              </Center>
            </VStack>
          </ChakraLink>
        ))}
      </HStack>
    </Box>
  );
};

export default QRDonateScreen;
