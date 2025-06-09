import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Landing | Connexa",
    description: "Welcome to Connexa, your go-to platform for seamless connectivity and collaboration.",
};

export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}
