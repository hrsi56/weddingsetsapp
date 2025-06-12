// src/components/QRDonateScreen.tsx

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
    Center,
} from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";

/* ------------------------------------------------------------------- */
/*  לינקים – שתי קבוצות (even / odd), בדיוק כמו ב־Streamlit             */
/* ------------------------------------------------------------------- */
const LINKS_EVEN = {
    bit: "https://www.bitpay.co.il/app/me/E9049ECA-8141-BA0B-2447-B065756C7CE27979",
    paybox: "https://link.payboxapp.com/MezqeVWwZKLExEqe9",
};
const LINKS_ODD = {
    bit: "https://www.bitpay.co.il/app/me/CCB63470-71B9-3957-154F-F3E20BEBF8F452AD",
    paybox: "https://link.payboxapp.com/4bxjYRXxUs5ZNbGT8",
};

/* ------------------------------------------------------------------- */
/*  API – שליחת ברכה ל־Google Sheets                                   */
/* ------------------------------------------------------------------- */
const addBlessing = async (name: string, blessing: string) => {
    const res = await fetch("/api/blessing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, blessing }),
    });
    if (!res.ok) throw new Error("בעיה בשליחה");
};

/* ------------------------------------------------------------------- */
/*  COMPONENT                                                           */
/* ------------------------------------------------------------------- */
const QRDonateScreen: React.FC = () => {
    /* -------------------- לינקים (even / odd) -------------------- */
    const [links, setLinks] = useState(LINKS_EVEN);

    useEffect(() => {
        const rnd = Math.floor(Math.random() * 1000) + 1;
        setLinks(rnd % 2 === 0 ? LINKS_EVEN : LINKS_ODD);
    }, []);

    /* -------------------- Form State ----------------------------- */
    const [name, setName] = useState("");
    const [blessing, setBlessing] = useState("");
    const [status, setStatus] = useState<null | "ok" | "err">(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !blessing.trim()) {
            setStatus("err");
            return;
        }
        try {
            await addBlessing(name.trim(), blessing.trim());
            setStatus("ok");
            setName("");
            setBlessing("");
        } catch {
            setStatus("err");
        }
    };

    return (
        <Box maxW="lg" mx="auto" py={6} px={4} textAlign="right">
            {/* ----- טופס ברכה ----- */}
            <Box
                as="form"
                onSubmit={handleSubmit}
                bg="brand.pureWhite"
                boxShadow="soft-lg"
                borderRadius="xlRounded"
                p={6}
            >
                <Heading
                    as="h2"
                    size="lg"
                    textAlign="center"
                    color="brand.sunriseGold"
                    mb={4}
                    fontFamily="heading"
                >
                    📝 כתיבת ברכה לזוג המאושר
                </Heading>

                <FormControl mb={3}>
                    <FormLabel htmlFor="name" fontFamily="body" fontWeight="medium">
                        שם
                    </FormLabel>
                    <Input
                        id="name"
                        placeholder="שם"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        focusBorderColor="brand.sunriseGold"
                        dir="rtl"
                    />
                </FormControl>

                <FormControl mb={3}>
                    <FormLabel htmlFor="blessing" fontFamily="body" fontWeight="medium">
                        ברכה
                    </FormLabel>
                    <Textarea
                        id="blessing"
                        placeholder="ברכה"
                        value={blessing}
                        onChange={(e) => setBlessing(e.target.value)}
                        focusBorderColor="brand.sunriseGold"
                        resize="none"
                        rows={5}
                        dir="rtl"
                    />
                </FormControl>

                <Button
                    type="submit"
                    colorScheme="brand"
                    variant="solid"
                    w="full"
                    mt={2}
                >
                    שליחה
                </Button>

                {status === "ok" && (
                    <Text color="green.500" textAlign="center" mt={3}>
                        ✅ הברכה נשלחה!
                    </Text>
                )}
                {status === "err" && (
                    <Text color="red.500" textAlign="center" mt={3}>
                        🛑 יש למלא שם וברכה (או שגיאת שרת).
                    </Text>
                )}
            </Box>

            {/* ----- QR Codes (Side-by-Side) ----- */}
            <HStack gap={6} mt={8} justify="center">
                {/* --- Bit --- */}
                <VStack>
                    <Text
                        fontFamily="heading"
                        fontSize="lg"
                        color="brand.sunriseGold"
                        mb={2}
                    >
                        Bit
                    </Text>
                    <Center>
                        <QRCodeSVG value={links.bit} size={180} level="H" />
                    </Center>
                </VStack>

                {/* --- PayBox --- */}
                <VStack>
                    <Text
                        fontFamily="heading"
                        fontSize="lg"
                        color="brand.sunriseGold"
                        mb={2}
                    >
                        PayBox
                    </Text>
                    <Center>
                        <QRCodeSVG value={links.paybox} size={180} level="H" />
                    </Center>
                </VStack>
            </HStack>
        </Box>
    );
};

export default QRDonateScreen;