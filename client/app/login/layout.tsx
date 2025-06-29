import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login | Connexa",
    description: "Login page for Connexa",
};

export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}
