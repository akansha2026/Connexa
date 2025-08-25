import { Conversation, User } from "@/lib/index.types";
import { useStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { MoreVertical, Search, UserRound, UsersRound } from "lucide-react";
import { DateTime } from "luxon";
import { Button } from "./ui/button";

function alphabeticalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function InfoBar() {
  const { activeConversation: conversation, user } = useStore();

  function displayName(conversation: Conversation | null): string {
    if (!conversation) return "No Conversation Selected";
    if (conversation.isGroup) return conversation.name || "Group Chat";
    const participant = conversation.participants.find(p => p.id !== user?.id);
    return participant ? participant.name : "Unknown User";
  }

  function avatarUrl(conversation: Conversation | null): string | undefined {
    if (!conversation) return undefined;
    if (conversation.isGroup) return conversation.avatarUrl;
    const participant = conversation.participants.find(p => p.id !== user?.id);
    return participant?.avatarUrl;
  }

  function lastSeenTime(user: User): string {
    if (!user?.lastSeen) return "";
    const dt = DateTime.fromJSDate(new Date(user.lastSeen));
    const now = DateTime.now();

    if (user.online) return "Online";
    if (dt.hasSame(now, "day")) return dt.toFormat("t");
    if (dt.plus({ days: 1 }).hasSame(now, "day")) return "Yesterday";
    if (now.diff(dt, "days").days <= 7) return dt.toFormat("ccc");
    return dt.toFormat("dd LLL yyyy");
  }

  function participantsInfo(conversation: Conversation | null): string {
    if (!conversation?.participants) return "No participants";

    if (!conversation.isGroup) {
      const participant = conversation.participants.find(p => p.id !== user?.id);
      if (!participant) return "Unknown participant";
      return participant.online
        ? "Online"
        : `Last seen ${lastSeenTime(participant)}`;
    }

    const names = conversation.participants
      .map(p => (p.id === user?.id ? "You" : p.name))
      .sort(alphabeticalCompare);

    return names.length > 3
      ? `${names.slice(0, 3).join(", ")} +${names.length - 3} more`
      : names.join(", ");
  }

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b shadow-sm backdrop-blur-sm bg-background/70">
      {/* Left: Avatar + Name + Status */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-11 w-11">
            <AvatarImage
              src={avatarUrl(conversation)}
              alt={user?.name ?? "Avatar"}
            />
            <AvatarFallback className="bg-muted">
              {conversation?.isGroup ? (
                <UsersRound className="h-5 w-5 text-muted-foreground" />
              ) : (
                <UserRound className="h-5 w-5 text-muted-foreground" />
              )}
            </AvatarFallback>
          </Avatar>

          {/* Online indicator */}
          {!conversation?.isGroup && conversation?.participants.some(p => p.id !== user?.id && p.online) && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-base md:text-lg font-semibold leading-tight truncate max-w-[200px]">
            {displayName(conversation)}
          </span>
          <span
            className={`text-xs md:text-sm leading-tight truncate max-w-[200px] ${
              participantsInfo(conversation).startsWith("Online")
                ? "text-green-500 font-medium"
                : "text-muted-foreground"
            }`}
          >
            {participantsInfo(conversation)}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Search">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="More options">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}