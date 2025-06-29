import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Password Reset | Connexa",
    description: "Reset your password",
};

export default function PasswordResetLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}
