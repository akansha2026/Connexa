import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Password reset",
    description: "Reset your password",
};

export default function PasswordResetLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}
