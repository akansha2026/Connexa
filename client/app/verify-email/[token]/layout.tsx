import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Verify Email | Connexa",
    description: "Verify your email address",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}
