import { useStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { 
  Settings, 
  LogOut, 
  User, 
  Moon, 
  Sun, 
  Monitor,
  HelpCircle,
  Bell
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/axios";
import { ws } from "@/lib/ws";
import { toast } from "sonner";
import { motion } from "motion/react";

export function UserAccountMenu() {
  const { user, setUser } = useStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      ws.disconnect();
      setUser(null);
      toast.success("Logged out successfully");
      router.push("/landing");
    } catch (error) {
      toast.error("Failed to logout");
      console.error("Logout error:", error);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  if (!user) {
    return (
      <div className="p-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted rounded mb-1"></div>
            <div className="h-3 w-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full p-3 h-auto justify-start hover:bg-accent/50 transition-all duration-200"
        >
          <motion.div 
            className="flex items-center gap-3 w-full"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-border/20">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              {user.online && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
              )}
            </div>
            
            <div className="flex-1 text-left min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </motion.div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        side="top" 
        align="start"
        className="w-64 mb-2 ml-3 shadow-lg border border-border/50"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => router.push("/settings")}
          className="cursor-pointer hover:bg-accent/50"
        >
          <Settings className="mr-3 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/settings/profile")}
          className="cursor-pointer hover:bg-accent/50"
        >
          <User className="mr-3 h-4 w-4" />
          <span>Edit Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/settings/notifications")}
          className="cursor-pointer hover:bg-accent/50"
        >
          <Bell className="mr-3 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Theme
        </DropdownMenuLabel>
        
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className="cursor-pointer hover:bg-accent/50"
        >
          <Sun className="mr-3 h-4 w-4" />
          <span>Light</span>
          {theme === "light" && (
            <div className="ml-auto h-2 w-2 bg-primary rounded-full"></div>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className="cursor-pointer hover:bg-accent/50"
        >
          <Moon className="mr-3 h-4 w-4" />
          <span>Dark</span>
          {theme === "dark" && (
            <div className="ml-auto h-2 w-2 bg-primary rounded-full"></div>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className="cursor-pointer hover:bg-accent/50"
        >
          <Monitor className="mr-3 h-4 w-4" />
          <span>System</span>
          {theme === "system" && (
            <div className="ml-auto h-2 w-2 bg-primary rounded-full"></div>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer hover:bg-accent/50">
          <HelpCircle className="mr-3 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-500 hover:bg-red-500 hover:text-white focus:bg-red-500 focus:text-white"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}