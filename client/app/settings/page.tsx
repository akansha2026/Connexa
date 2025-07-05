'use client'

import { useStore } from "@/lib/store";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient, AxiosErrorResponse, isAxiosError } from "@/lib/axios";
import { User } from "@/lib/index.types";
import { toast } from "sonner";

import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

import { Mail, User as UserIcon, Lock } from "lucide-react";
import { Logout } from "@/components/logout";
import EditImageDialog from "@/components/edit-avatar";

export default function Settings() {
    const { user, setUser } = useStore();
    const router = useRouter();
    const [previewImage, setPreviewImage] = useState("");
    const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPasswordDialogOpen, setEditPasswordDialogOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            (async () => {
                try {
                    const { data } = await apiClient.get("/auth/profile");
                    const userProfile = (data as { data: unknown }).data;
                    setUser(userProfile as User);
                } catch (error) {
                    console.log(error);
                    router.push("/landing");
                }
            })();
        }
    }, [router, setUser, user]);

    async function handleAvatarUpdate(evt: FormEvent<HTMLButtonElement>) {
        evt.preventDefault();
        try {
            const { data: res } = await apiClient.patch<{ message: string, data: User }>("/users", { avatarUrl: previewImage });
            toast.success("Profile picture updated!");
            setUser({ ...user, avatarUrl: res.data.avatarUrl } as User);
            setPreviewImage("");
            setAvatarDialogOpen(false);
        } catch (error) {
            const errorMessage = isAxiosError(error)
                ? (error.response as AxiosErrorResponse).data.error
                : "Something went wrong.";
            toast.error(errorMessage);
            console.error(error);
        }
    }

    return (
        <div className="flex flex-col w-full h-full items-center justify-start gap-8 px-6 py-10 max-w-xl mx-auto">
            <div className="flex flex-col items-center gap-4">
                <Avatar>
                    <AvatarImage className="h-32 w-32 rounded-full border" src={user?.avatarUrl} alt={user?.name ?? "Avatar"} />
                    <AvatarFallback className="h-32 w-32 rounded-full bg-muted flex items-center justify-center text-3xl font-semibold">
                        {user?.name?.[0] ?? "U"}
                    </AvatarFallback>
                </Avatar>

                <Button onClick={() => setAvatarDialogOpen(true)} variant="outline">
                    Change Avatar
                </Button>

                <EditImageDialog
                    previewImage={previewImage}
                    setPreviewImage={setPreviewImage}
                    handleSubmit={handleAvatarUpdate}
                    isOpen={avatarDialogOpen}
                    setIsOpen={setAvatarDialogOpen}
                />
            </div>

            <div className="w-full space-y-6">
                <Typography variant="h2" className="text-center">Account Settings</Typography>
                <Typography variant="muted" className="text-center">Manage your personal information and account preferences.</Typography>

                <div className="space-y-4">
                    {/* Name section */}
                    <div className="flex justify-between items-center border rounded-lg p-3 bg-secondary">
                        <div className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-primary" />
                            <div>
                                <Label>Name</Label>
                                <p className="text-muted-foreground text-sm">{user?.name}</p>
                            </div>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline">Edit</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Update Name</DialogTitle>
                                </DialogHeader>
                                <Input placeholder="Enter new name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                <Button className="w-full">Save</Button>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Email section */}
                    <div className="flex justify-between items-center border rounded-lg p-3 bg-secondary">
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            <div>
                                <Label>Email</Label>
                                <p className="text-muted-foreground text-sm">{user?.email}</p>
                            </div>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline">Edit</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Update Email</DialogTitle>
                                </DialogHeader>
                                <Input placeholder="Enter new email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                                <Button className="w-full">Save</Button>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Password section */}
                    <div className="flex justify-between items-center border rounded-lg p-3 bg-secondary">
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-primary" />
                            <div>
                                <Label>Password</Label>
                                <p className="text-muted-foreground text-sm">••••••••</p>
                            </div>
                        </div>
                        <Dialog open={editPasswordDialogOpen} onOpenChange={setEditPasswordDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline">Change</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Change Password</DialogTitle>
                                </DialogHeader>
                                <Input type="password" placeholder="Current password" />
                                <Input type="password" placeholder="New password" />
                                <Input type="password" placeholder="Confirm new password" />
                                <Button className="w-full">Update Password</Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Separator />

                {/* Logout */}
                <div className="flex justify-between items-center border p-3 rounded-lg">
                    <span className="text-muted-foreground">Log out of your account</span>
                    <Logout />
                </div>
            </div>
        </div>
    );
}