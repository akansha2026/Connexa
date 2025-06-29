import { Conversation, User } from "@/lib/index.types";
import { useStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { UserRound, UsersRound } from "lucide-react";
import { DateTime } from "luxon";

export function InfoBar() {
    const { activeConversation: conversation, user } = useStore();

    function displayName(conversation: Conversation | null): string {
        if (!conversation) {
            return "No Conversation Selected";
        }
        if (conversation.isGroup) {
            return conversation.name || "Group Chat";
        } else {
            const participant = conversation.participants.find(p => p.id !== user?.id);
            return participant ? participant.name : "Unknown User";
        }
    }

    function avatarUrl(conversation: Conversation | null): string | undefined {
        if (!conversation) {
            return undefined;
        }

        if (conversation.isGroup) {
            return conversation.avatarUrl
        } else {
            const participant = conversation.participants.find(p => p.id !== user?.id);
            if (participant && participant.avatarUrl) {
                return participant.avatarUrl;
            }
        }
    }

    function lastSeenTime(user: User): string {
        // I need to check for the inline of a user not for last message
        if (user?.lastSeen) {
            const dt = DateTime.fromJSDate(new Date(user?.lastSeen));

            const now = DateTime.now();
            if(dt == now) return "online";
            else if (dt.hasSame(now, 'day')) {
                return dt.toFormat("t");
            } else if (dt.plus({ days: 1 }).hasSame(now, 'day')) {
                return "Yesterday";
            } else if (now.diff(dt, 'days').days <= 7) {
                return dt.toFormat("ccc"); // e.g. Mon, Tue
            } else {
                return dt.toFormat("dd LLL yyyy"); // e.g. 22 Jun 2025
            }
        }
        return "";
    }

    function participantsInfo(conversation: Conversation | null): string {
        if (!conversation || !conversation.participants) {
            return "No participants";
        }

        if (!conversation.isGroup) {
            // Show status of the other participant in a 1:1 conversation
            const participant = conversation.participants.find(p => p.id !== user?.id);
            if (participant) {
                return participant.online ? "Online" : `Last seen ${lastSeenTime(participant)}`;
            }
            return "Unknown participant";
        }

        // For group conversations, show the participants separated by commas
        return conversation.participants.map(p => p.id === user?.id ? "You" : p.name).sort().join(", ")
    }

    return (
        <div className="py-3 px-4 shadow-sm border-b flex items-center gap-3">
            <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl(conversation)} alt={user?.name ?? "Avatar"} />
                <AvatarFallback className="bg-primary">
                    {conversation?.isGroup ? (
                        <UsersRound className="h-6 w-6" />
                    ) : (
                        <UserRound className="h-6 w-6" />
                    )}
                </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex flex-col">
                <h2 className="text-lg font-semibold">{displayName(conversation)}</h2>
                <p className="text-sm text-muted-foreground">
                    {participantsInfo(conversation)}
                </p>
            </div>
        </div>
    );
}