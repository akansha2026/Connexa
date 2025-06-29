import { Conversation } from "@/lib/index.types";
import { useStore } from "@/lib/store";
import { DateTime } from 'luxon'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { UserRound, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatListItemProps = {
    conversation: Conversation;
};

export function ChatListItem({ conversation }: ChatListItemProps) {
    const { user } = useStore();

    function displayName(conversation: Conversation): string {
        if (conversation.isGroup) {
            return conversation.name || "Group Chat";
        } else {
            const participant = conversation.participants.find(p => p.id !== user?.id);
            return participant ? participant.name : "Unknown User";
        }
    }


    function lastMessageTime(conversation: Conversation): string {
        if (conversation.lastMessage) {
            const dt = DateTime.fromJSDate(new Date(conversation.lastMessage.createdAt));

            const now = DateTime.now();

            if (dt.hasSame(now, 'day')) {
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

    function avatarUrl(conversation: Conversation): string | undefined {
        if (conversation.isGroup) {
            return conversation.avatarUrl
        } else {
            const participant = conversation.participants.find(p => p.id !== user?.id);
            if (participant && participant.avatarUrl) {
                return participant.avatarUrl;
            }
        }
    }

    function trimmedLastMessage(conversation: Conversation): string {
        if (conversation.lastMessage) {
            const content = conversation.lastMessage.content || "";
            return content.length > 25 ? content.substring(0, 25) + "..." : content;
        }
        return "No messages yet";
    }

    const { setActiveConversation, activeConversation } = useStore();

    return (
        <div className={
            cn(
                "relative flex items-center p-4 hover:bg-secondary cursor-pointer transition-colors rounded-sm border border-secondary mb-1",
                activeConversation?.id === conversation.id ? "bg-secondary" : "bg-transparent"
            )
        } onClick={() => {
            setActiveConversation(conversation);
        }}>
            <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl(conversation)} alt={user?.name ?? "Avatar"} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                    {conversation.isGroup ? (
                        <UsersRound className="h-6 w-6" />
                    ) : (
                        <UserRound className="h-6 w-6" />
                    )}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col ml-4">
                <span className="text-md font-semibold">{displayName(conversation)}</span>
                <span className="text-xs text-muted-foreground">{trimmedLastMessage(conversation)}</span>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
                {lastMessageTime(conversation)}
            </div>

            {/* If active add right side green border */}
            {activeConversation?.id === conversation.id && (
                <div className="absolute right-0 top-0 h-full w-1 bg-green-500 rounded-tr-sm rounded-br-sm" />
            )}
        </div>
    );
}