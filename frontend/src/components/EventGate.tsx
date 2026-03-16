import React from "react";
import {
  Box,
  Image,
  useColorModeValue,
  AspectRatio,
  Text,
} from "@chakra-ui/react";
// שימו לב: יש לוודא שהתקנתם את react-icons
// npm install react-icons
import invitationImage from "../assets/New_33676.jpg";

const EventGate: React.FC = () => {
  const cardBg = useColorModeValue("bg.canvas", "gray.800");

  // ה-ID של השידור החי
  const videoId = "EAWWWaI-1G8";
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`;

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
      p={4} // הגדלתי מעט את הריפוד כדי שיהיה מרווח ונעים לעין
      borderRadius="lg"
      boxShadow="md"
    >
      {/* 1. הצגת התמונה */}
      <Image
        src={invitationImage}
        alt="הזמנה לחתונה"
        w="100%"
        h="auto"
        borderRadius="md"
        mb={0} // ביטלתי את המרווח התחתון המקורי כדי להשתמש בו עבור הכותרת
      />




      {/* 4. הוספת נגן היוטיוב */}
      <Box borderRadius="md" overflow="hidden" boxShadow="sm" bg="black">
        <AspectRatio ratio={16 / 9}>
          <iframe
            src={embedUrl}
            title="YouTube live streaming"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </AspectRatio>
      </Box>
    </Box>
  );
};

export default EventGate;
