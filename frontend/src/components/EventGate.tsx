import React from "react";
import {
  Box,
  VStack,
  Link as ChakraLink,
  Button,
  HStack,
  useColorModeValue,
  Image, // 1. הוספנו את רכיב התמונה
} from "@chakra-ui/react";
import { venue } from "../eventD";
import invitationImage from "../assets/New_Full2.jpg"; // 2. ייבוא התמונה

/* ------------------------------------------------------------
 * HELPER — Hebrew Gematria (ללא שינוי)
 * ---------------------------------------------------------- */

/* ------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------- */
const EventGate: React.FC = () => {
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    venue.address
  )}`;
  const wazeLink = `https://waze.com/ul?q=${encodeURIComponent(
    venue.address
  )}&navigate=yes`;

  /* theme-aware colours */
  const cardBg = useColorModeValue("bg.canvas", "gray.800");

  return (
    <Box
      layerStyle="card"
      w="full"
      bg={cardBg}
      maxW="lg"
      mx="auto"
      textAlign="center"
      dir="rtl"
      position="relative"
      p={4} // הוספתי ריפוד קל כדי שהתמונה לא תידבק לקצוות אם צריך
    >
      {/* 3. הצגת התמונה מעל הקישורים */}
      <Image
        src={invitationImage}
        alt="הזמנה לחתונה"
        w="100%"
        h="auto"
        borderRadius="md"
        mb={6} // מרווח תחתון כדי להפריד מהכפתורים
      />

      {/* קישורי ניווט */}
      <VStack gap={2}>
        <HStack>
          <ChakraLink
            href={googleMapsLink}
            isExternal
            _hover={{ textDecoration: "none" }}
          >
            <Button variant="outline" colorScheme="brand">
              Google Maps
            </Button>
          </ChakraLink>
          <ChakraLink
            href={wazeLink}
            isExternal
            _hover={{ textDecoration: "none" }}
          >
            <Button variant="outline" colorScheme="brand">
              Waze
            </Button>
          </ChakraLink>
        </HStack>
      </VStack>

      {/* END: הודעות עם אפקט זכוכית */}
    </Box>
  );
};

export default EventGate;