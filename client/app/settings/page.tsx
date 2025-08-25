'use client'

import { useStore } from "@/lib/store";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient, AxiosErrorResponse, isAxiosError } from "@/lib/axios";
import { User } from "@/lib/index.types";
import { toast } from "sonner";
import { motion } from "motion/react";

import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import { 
  Mail, 
  User as UserIcon, 
  Lock, 
  Camera, 
  ArrowLeft,
  Shield,
  Bell,
  Moon,
  Globe,
  Smartphone,
  Download,
  Trash2,
  LogOut,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { useTheme } from "next-themes";

export default function Settings() {
  const { user, setUser } = useStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  // Form states
  const [previewImage, setPreviewImage] = useState("");
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPasswordDialogOpen, setEditPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Loading states
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // Settings states (placeholders for future implementation)
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeen, setLastSeen] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);

  useEffect(() => {
    if (!user) {
      (async () => {
        try {
          const { data } = await apiClient.get("/auth/profile");
          const userProfile = (data as { data: unknown }).data;
          setUser(userProfile as User);
        } catch (error) {
          console.error(error);
          router.push("/landing");
        }
      })();
    } else {
      setEditName(user.name);
      setEditEmail(user.email);
    }
  }, [router, setUser, user]);

  const handleAvatarUpdate = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (!previewImage.trim()) {
      toast.error("Please enter a valid image URL");
      return;
    }

    try {
      setIsUpdatingAvatar(true);
      const { data: res } = await apiClient.patch<{ message: string, data: User }>("/users", { 
        avatarUrl: previewImage 
      });
      toast.success("Profile picture updated!");
      setUser({ ...user, avatarUrl: res.data.avatarUrl } as User);
      setPreviewImage("");
      setAvatarDialogOpen(false);
    } catch (error) {
      const errorMessage = isAxiosError(error)
        ? (error.response as AxiosErrorResponse).data.error
        : "Failed to update profile picture";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleNameUpdate = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setIsUpdatingName(true);
      const { data: res } = await apiClient.patch<{ message: string, data: User }>("/users", { 
        name: editName 
      });
      toast.success("Name updated successfully!");
      setUser({ ...user, name: res.data.name } as User);
    } catch (error) {
      const errorMessage = isAxiosError(error)
        ? (error.response as AxiosErrorResponse).data.error
        : "Failed to update name";
      toast.error(errorMessage);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handlePasswordUpdate = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      // Note: You'll need to implement current password verification on backend
      const { data: res } = await apiClient.patch<{ message: string }>("/users", { 
        password: newPassword 
      });
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setEditPasswordDialogOpen(false);
    } catch (error) {
      const errorMessage = isAxiosError(error)
        ? (error.response as AxiosErrorResponse).data.error
        : "Failed to update password";
      toast.error(errorMessage);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      setUser(null);
      toast.success("Logged out successfully");
      router.push("/landing");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <Typography variant="muted">Loading your settings...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div 
        className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:bg-accent/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <Typography variant="h3" className="font-semibold">Settings</Typography>
            <Typography variant="muted" className="text-sm">Manage your account and preferences</Typography>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-20 w-20 border-2 border-border/30">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                      {user.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Typography variant="h4" className="font-medium">{user.name}</Typography>
                    {user.verified && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <Typography variant="muted" className="text-sm">{user.email}</Typography>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAvatarDialogOpen(true)}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Change Photo
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Personal Info */}
              <div className="grid gap-4">
                {/* Name Field */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:border-border/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Display Name</Label>
                      <p className="text-sm text-muted-foreground">{user.name}</p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Display Name</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleNameUpdate} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input 
                            id="name"
                            placeholder="Enter your name" 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isUpdatingName} className="w-full">
                            {isUpdatingName ? "Updating..." : "Save Changes"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Email Field */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:border-border/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email Address</Label>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" disabled>
                    <span className="text-muted-foreground">Coming Soon</span>
                  </Button>
                </div>

                {/* Password Field */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:border-border/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Password</Label>
                      <p className="text-sm text-muted-foreground">••••••••••••</p>
                    </div>
                  </div>
                  <Dialog open={editPasswordDialogOpen} onOpenChange={setEditPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">Change</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <Typography variant="muted" className="text-sm">
                          Choose a strong password to keep your account secure
                        </Typography>
                      </DialogHeader>
                      <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <div className="relative">
                            <Input 
                              id="current-password"
                              type={showPasswords ? "text" : "password"}
                              placeholder="Enter current password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                              onClick={() => setShowPasswords(!showPasswords)}
                            >
                              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input 
                            id="new-password"
                            type={showPasswords ? "text" : "password"}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input 
                            id="confirm-password"
                            type={showPasswords ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setEditPasswordDialogOpen(false);
                              setCurrentPassword("");
                              setNewPassword("");
                              setConfirmPassword("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isUpdatingPassword}>
                            {isUpdatingPassword ? "Updating..." : "Update Password"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy & Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>Control your privacy settings and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Last Seen</Label>
                  <p className="text-xs text-muted-foreground">Show when you were last online</p>
                </div>
                <Switch checked={lastSeen} onCheckedChange={setLastSeen} />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Read Receipts</Label>
                  <p className="text-xs text-muted-foreground">Let others know when you've read their messages</p>
                </div>
                <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <span className="text-muted-foreground">Coming Soon</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Customize how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive notifications for new messages</p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Sound Effects</Label>
                  <p className="text-xs text-muted-foreground">Play sounds for message notifications</p>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* App Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                App Preferences
              </CardTitle>
              <CardDescription>Customize your app experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Theme</Label>
                  <p className="text-xs text-muted-foreground">Choose your preferred appearance</p>
                </div>
                <select 
                  value={theme} 
                  onChange={(e) => setTheme(e.target.value)}
                  className="px-3 py-1 rounded-md border border-border bg-background text-sm"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/30 transition-colors">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Auto-download Media</Label>
                  <p className="text-xs text-muted-foreground">Automatically download images and files</p>
                </div>
                <Switch checked={autoDownload} onCheckedChange={setAutoDownload} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Language</Label>
                  <p className="text-xs text-muted-foreground">Change app language</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <Globe className="h-4 w-4 mr-2" />
                  <span className="text-muted-foreground">English</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data & Storage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data & Storage
              </CardTitle>
              <CardDescription>Manage your data and storage preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Export Chat Data</Label>
                  <p className="text-xs text-muted-foreground">Download your conversations and media</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  <span className="text-muted-foreground">Coming Soon</span>
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Clear Cache</Label>
                  <p className="text-xs text-muted-foreground">Free up storage space</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <span className="text-muted-foreground">Coming Soon</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-destructive/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-destructive">Delete Account</Label>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10" disabled>
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Coming Soon</span>
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800/30 dark:bg-orange-900/10">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-orange-700 dark:text-orange-400">Sign Out</Label>
                  <p className="text-xs text-orange-600 dark:text-orange-500">Sign out from your account on this device</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Avatar Update Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <Typography variant="muted" className="text-sm">
              Enter a URL for your new profile picture
            </Typography>
          </DialogHeader>
          <form onSubmit={handleAvatarUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avatar-url">Image URL</Label>
              <Input 
                id="avatar-url"
                placeholder="https://example.com/image.jpg" 
                value={previewImage} 
                onChange={(e) => setPreviewImage(e.target.value)}
              />
            </div>
            
            {previewImage && (
              <div className="flex justify-center">
                <Avatar className="h-20 w-20 border">
                  <AvatarImage src={previewImage} alt="Preview" />
                  <AvatarFallback>Preview</AvatarFallback>
                </Avatar>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setAvatarDialogOpen(false);
                  setPreviewImage("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingAvatar || !previewImage.trim()}>
                {isUpdatingAvatar ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}