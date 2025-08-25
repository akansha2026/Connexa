import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings | Connexa",
    description: "Setting page for Connexa",
};

export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}
