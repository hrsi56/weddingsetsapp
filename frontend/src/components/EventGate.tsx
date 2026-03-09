import React from "react";
import {
  Box,
  Image, useColorModeValue, // 1. הוספנו את רכיב התמונה
} from "@chakra-ui/react";
import invitationImage from "../assets/New_33676.jpg"; // 2. ייבוא התמונה

/* ------------------------------------------------------------
 * HELPER — Hebrew Gematria (ללא שינוי)
 * ---------------------------------------------------------- */

/* ------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------- */
const EventGate: React.FC = () => {
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
      p={2} // הוספתי ריפוד קל כדי שהתמונה לא תידבק לקצוות אם צריך
    >
      {/* 3. הצגת התמונה מעל הקישורים */}
      <Image
        src={invitationImage}
        alt="הזמנה לחתונה"
        w="100%"
        h="auto"
        borderRadius="md"
        mb={2} // מרווח תחתון כדי להפריד מהכפתורים
      />

    </Box>
  );
};

export default EventGate;