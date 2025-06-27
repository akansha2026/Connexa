import { useStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Typography } from "./ui/typography";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { apiClient } from "@/lib/axios";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { ws } from "@/lib/ws";

export function ProfileSection() {
  const { user } = useStore();

  const router = useRouter()

  async function handleLogout(){
    try {
      console.log("Logging out")
      await apiClient.post("/auth/logout")

      // disconnect the socket
      ws.disconnect()

      router.push("/login")
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-secondary border rounded-lg shadow-sm">
      <Link href="/settings">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user?.avatarUrl} alt={user?.name ?? "Avatar"} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Typography variant="h4">{user?.name?.[0] ?? "U"}</Typography>
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex flex-col gap-0.5">
        <Typography variant="h4" className="font-normal">{user?.name ?? "User Name"}</Typography>
        <Typography variant="muted">
          {user?.email ?? "user@example.com"}
        </Typography>
      </div>

      <Button onClick={handleLogout} size="icon" className="ml-auto rounded-full">
        <LogOut />
      </Button>
    </div>
  );
}
