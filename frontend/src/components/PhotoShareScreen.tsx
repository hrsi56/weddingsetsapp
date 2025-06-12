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

const PhotoShareScreen: React.FC = () => {
  const cardBg = useColorModeValue("bg.canvas", "gray.800");

  return (
    <Box id="photos" mx="auto" maxW="lg" layerStyle="card" bg={cardBg} textAlign="center">
      <VStack gap={6}>
        {/* כותרת */}
        <Heading size="xl" color="primary">
          📸 שתפו אותנו בתמונות מהאירוע 📸
        </Heading>

        {/* קישור ל-Google Photos */}
        <ChakraLink
          href="https://photos.app.goo.gl/CXuHxit6c9J6rypy8"
          isExternal
          _hover={{ textDecoration: "none", transform: "scale(1.03)" }}
          transition="transform 0.2s"
        >
          <Image
            src="https://www.gstatic.com/images/branding/product/1x/photos_48dp.png"
            alt="Google Photos"
            borderRadius="xl"
            boxShadow="soft-lg"
            border="1px solid"
            borderColor="border.subtle"
            w={{ base: "220px", sm: "300px", md: "380px" }}
            mx="auto"
          />
        </ChakraLink>

        <Text fontSize="lg">
          לחצו על הלוגו כדי לצפות ולשתף את רגעי השמחה שלנו.
        </Text>
      </VStack>
    </Box>
  );
};

export default PhotoShareScreen;