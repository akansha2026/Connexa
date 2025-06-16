import { useStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Typography } from "./ui/typography";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { apiClient } from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ProfileSection() {
  const { user, setUser } = useStore();

  const router = useRouter();
  async function handleLogout() {
    // TODO: Call logout API and redirect to login
    try {
      await apiClient.post("/auth/logout");
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.log(error);
      toast.error("Failed to logout");
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-secondary border rounded-lg shadow-sm">
      {/* Avatar + Name */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.avatarUrl} alt={user?.name ?? "Avatar"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Typography variant="large">{user?.name?.[0] ?? "U"}</Typography>
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col gap-0.5">
          <Typography variant="h4">{user?.name ?? "User Name"}</Typography>
          <Typography variant="muted">
            {user?.email ?? "user@example.com"}
          </Typography>
        </div>
      </div>

      {/* Logout Button */}

      <Tooltip>
        <TooltipTrigger asChild>
          <LogOut
            className="active:scale-95 transition-all ease-in-out cursor-pointer"
            size={40}
            onClick={handleLogout}
          />
        </TooltipTrigger>
        <TooltipContent className="shadow-md">
          <Typography variant="p">Logout</Typography>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
