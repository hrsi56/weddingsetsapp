import React from "react";
import {
  Box,
  Image,
  useColorModeValue,
  AspectRatio,
  Text,
  Button,
  VStack,
  Link,
  Alert,
  AlertDescription,
} from "@chakra-ui/react";
// שימו לב: יש לוודא שהתקנתם את react-icons
// npm install react-icons
import { FaYoutube } from "react-icons/fa";
import invitationImage from "../assets/New_33676.jpg";

const EventGate: React.FC = () => {
  const cardBg = useColorModeValue("bg.canvas", "gray.800");

  // ה-ID של השידור החי
  const videoId = "EAWWWaI-1G8";
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`;

  // קישור ההרשמה לערוץ עם אישור אוטומטי
  const channelUrl = "https://www.youtube.com/@HRSI56?sub_confirmation=1";

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

      {/* הוספת כותרת ברורה, מתחת לתמונה */}
      <Text
        fontWeight="bold"
        fontSize="3xl"
        mb={5} // יצירת מרווח לפני האלרט
      >
        יום חמישי, 19:30.
      </Text>

      {/* 2. הסבר ברור למשתמשים (במיוחד מבוגרים) */}
      <Alert
        status="info"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        borderRadius="md"
        mb={6}
        colorScheme="blue"
        p={4}
      >
        <AlertDescription>
          <VStack align="start" spacing={2} mb={4} w="full" px={2} textAlign="right">
            <Text>
                          אם הסרטון לא נטען
                        </Text>
            <Text>
              לחצו על כפתור ההרשמה לערוץ שלי, הירשמו (Subscribe) וחיזרו לכאן על מנת לנסות שוב.
            </Text>
          </VStack>

          {/* 3. כפתור ההרשמה */}
          <Button
            as={Link}
            href={channelUrl}
            isExternal // פותח בלשונית חדשה כדי שלא יאבדו את הדף
            colorScheme="red"
            size="lg"
            leftIcon={<FaYoutube />}
            w="full"
            _hover={{ textDecoration: "none", transform: "scale(1.02)" }}
            transition="all 0.2s"
          >
            לחצו כאן להרשמה לערוץ
          </Button>
        </AlertDescription>
      </Alert>

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
