import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Signup | Connexa",
    description: "Signup page for Connexa",
};

export default function SignupLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}
