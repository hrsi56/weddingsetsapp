// src/components/PhotoShareScreen.tsx
import React from "react";
import { Box, Heading, Text, Link, Image } from "@chakra-ui/react";

const PhotoShareScreen: React.FC = () => {
    return (
        <Box
            id="photos"
            maxW="lg"
            mx="auto"
            p={6}
            bg="brand.pureWhite"
            boxShadow="soft-lg"
            borderRadius="xlRounded"
            textAlign="center"
        >
            {/* כותרת מסך */}
            <Heading
                as="h2"
                size="xl"
                fontFamily="heading"
                color="brand.sunriseGold"
                mb={4}
            >
                📸 שתפו אותנו בתמונות מהאירוע 📸
            </Heading>

            {/* אייקון / קישור לתמונות */}
            <Link
                href="https://photos.app.goo.gl/CXuHxit6c9J6rypy8"
                isExternal
                display="inline-block"
            >
                <Image
                    src="https://www.gstatic.com/images/branding/product/1x/photos_48dp.png"
                    alt="Google Photos"
                    borderRadius="xlRounded"
                    boxShadow="soft-lg"
                    border="1px"
                    borderColor="brand.lightGray"
                    // רוחב שונה בגלישות (רספונסיביות)
                    w={{ base: "260px", sm: "360px", md: "480px" }}
                    mx="auto"
                    mb={3}
                />
            </Link>

            <Text fontFamily="body" color="gray.700">
                לחצו על הלוגו כדי לראות ולשתף תמונות מהחתונה.
            </Text>
        </Box>
    );
};

export default PhotoShareScreen;