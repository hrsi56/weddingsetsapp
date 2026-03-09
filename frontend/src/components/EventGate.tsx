import React from "react";
import {
  Box,
  Image,
  useColorModeValue,
  AspectRatio, // רכיב לשמירה על יחס גובה-רוחב
} from "@chakra-ui/react";
import invitationImage from "../assets/New_33676.jpg";

const EventGate: React.FC = () => {
  const cardBg = useColorModeValue("bg.canvas", "gray.800");

  // ה-ID של השידור החי מהקישור שסיפקת
  const videoId = "nHzOjx1K1bg";
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
      p={2}
    >
      {/* הצגת התמונה */}
      <Image
        src={invitationImage}
        alt="הזמנה לחתונה"
        w="100%"
        h="auto"
        borderRadius="md"
        mb={4}
      />

      {/* הוספת נגן היוטיוב */}
      <Box borderRadius="md" overflow="hidden" mb={2}>
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