import { useStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Typography } from "./ui/typography";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function ProfileSection() {
  const { user } = useStore();

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-secondary border rounded-lg shadow-sm">
      <Link href="/settings">
        <Avatar className="h-12 w-12 border">
          <AvatarImage  src={user?.avatarUrl} alt={user?.name ?? "Avatar"} />
          <AvatarFallback className="bg-primary">
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

      <ThemeToggle className="ml-auto top-5 right-12" />
    </div>
  );
}
