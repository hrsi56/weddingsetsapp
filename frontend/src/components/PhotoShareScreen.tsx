import React from "react";
import {
  Box,
  Heading,
  Text,
  Link as ChakraLink,
  Image,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import googleLogo from "../assets/go.png";   // ← ייבוא התמונה (חשוב!)


const PhotoShareScreen: React.FC = () => {
  const cardBg = useColorModeValue("bg.canvas", "gray.800");

  return (
    <Box maxW="lg" mx="auto" p={3} dir="rtl"  mb={4}>
      <Box id="photos" mx="auto" maxW="lg" layerStyle="card" bg={cardBg} textAlign="center">
        <VStack gap={6}>
          {/* כותרת */}
          <Heading size="xl" color="primary">
            📸 שיתוף תמונות 📸
          </Heading>
          <Text fontSize="lg">
            לחצו על הלוגו בכדי לשתף את רגעי השמחה שלנו ולצפות בתמונות שאחרים העלו.
          </Text>
          {/* קישור ל-Google Photos */}
          <ChakraLink
            href="https://photos.app.goo.gl/CXuHxit6c9J6rypy8"
            isExternal
            _hover={{ textDecoration: "none", transform: "scale(1.03)" }}
            transition="transform 0.2s"
          >
            <Image
              src={googleLogo}
              alt="Google Photos"
              borderRadius="xl"
              boxShadow="soft-lg"
              border="1px solid"
              borderColor="border.subtle"
              w={{ base: "220px", sm: "300px", md: "380px" }}
              mx="auto"
            />
          </ChakraLink>


        </VStack>
      </Box>
    </Box>
  );
};

export default PhotoShareScreen;