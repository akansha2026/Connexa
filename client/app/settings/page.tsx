'use client'

import { useStore } from "@/lib/store";
import { Logout } from "@/components/logout";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/axios";
import { User } from "@/lib/index.types";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Mail, User as UserIcon } from "lucide-react";
import EditImageDialog from "@/components/edit-Avatar";
export default function Settings() {
    const { user, setUser } = useStore();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            async function getUserFromToken() {
                try {
                    const { data } = await apiClient.get("/auth/profile");
                    if (typeof data === "object" && data !== null && "data" in data) {
                        // You can further type-assert here if needed
                        const userProfile = (data as { data: unknown }).data;

                        // Save it as a global state for whole application
                        setUser(userProfile as User);
                    } else {
                        throw new Error("User not found");
                    }
                } catch (error) {
                    console.log(error);
                    router.push("/landing");
                }
            }
            getUserFromToken();
        }
    }, [router, setUser, user]);

    // I want to show a page on click of edit button without navigation
    // const handleEditClick = () => {
    //     console.log("Edit button clicked");

    // };

    console.log("User in settings:", user);

    return (
        <div className="flex flex-col w-full h-screen items-center justify-center gap-4 p-4">
            <div className="flex flex-col gap-2 justify-center items-center">
                <Avatar className="h-32 w-32 relative flex justify-center items-center text-center rounded-full bg-primary">
                    <AvatarImage src={user?.avatarUrl} alt={user?.name ?? "Avatar"} />
                    <AvatarFallback className="flex items-center justify-center text-primary-foreground">
                        <Typography variant="h1">{user?.name?.[0] ?? "U"}</Typography>
                    </AvatarFallback>
                </Avatar>
                <EditImageDialog />
            </div>
            <div className="flex flex-col gap-2">
                <Typography variant="h3" className="flex justify-center items-center ">Settings</Typography>
                <Typography variant="muted">Manage your account settings</Typography>
                <div className="bg-secondary p-2 flex rounded-sm border items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary" />
                        <Typography variant="muted">{user?.name}</Typography>
                    </div>
                    <Button variant="secondary" className="bg-primary" size="lg">Edit</Button>
                </div>
                <div className="bg-secondary p-2 flex rounded-sm border items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <Typography variant="muted">{user?.email}</Typography>
                </div>
                <Separator />
                <div className="flex gap-2 justify-center items-center">
                    <span>Logout</span>
                    <Logout />
                </div>
            </div>
        </div>
    )
}