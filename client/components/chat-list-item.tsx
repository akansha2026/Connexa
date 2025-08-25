import { Conversation } from "@/lib/index.types";
import { useStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { UserRound, UsersRound } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

type ChatListItemProps = {
    conversation: Conversation;
};

export function ChatListItem({ conversation }: Readonly<ChatListItemProps>) {
    const { user, setActiveConversation, activeConversation } = useStore();

    function displayName(conversation: Conversation): string {
        if (conversation.isGroup) {
            return conversation.name || "Group Chat";
        } else {
            const participant = conversation.participants.find(p => p.id !== user?.id);
            return participant ? participant.name : "Unknown User";
        }
    }

    function avatarUrl(conversation: Conversation): string | undefined {
        if (conversation.isGroup) {
            return conversation.avatarUrl;
        } else {
            const participant = conversation.participants.find(p => p.id !== user?.id);
            return participant?.avatarUrl;
        }
    }

    function trimmedLastMessage(conversation: Conversation): string {
        if (conversation.lastMessage) {
            const content = conversation.lastMessage.content || "";
            return content.length > 35 ? content.substring(0, 35) + "..." : content;
        }
        return "No messages yet";
    }

    const isActive = activeConversation?.id === conversation.id;

    const handleActivate = () => setActiveConversation(conversation);
    
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleActivate();
        }
    };

    return (
        <button 
            className={cn(
                "group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ease-in-out",
                "hover:bg-accent/50 active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-primary/30",
                "w-full text-left",
                isActive 
                    ? "bg-accent shadow-sm" 
                    : "hover:shadow-sm"
            )}
            onClick={handleActivate}
            onKeyDown={handleKeyDown}
            aria-pressed={isActive}
            aria-label={`Select conversation with ${displayName(conversation)}`}
            tabIndex={0}
        >
            {/* Avatar */}
            <Avatar className="h-12 w-12 shadow-sm shrink-0">
                <AvatarImage 
                    src={avatarUrl(conversation)} 
                    alt={displayName(conversation)} 
                    className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    {conversation.isGroup ? (
                        <UsersRound className="h-5 w-5" />
                    ) : (
                        <UserRound className="h-5 w-5" />
                    )}
                </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className={cn(
                        "font-medium text-sm truncate",
                        isActive ? "text-foreground" : "text-foreground/90"
                    )}>
                        {displayName(conversation)}
                    </h3>
                    <time className="text-xs text-muted-foreground/80 ml-2 shrink-0">
                        {formatTime(conversation.lastMessage?.createdAt)}
                    </time>
                </div>
                
                <p className={cn(
                    "text-xs truncate",
                    isActive ? "text-muted-foreground" : "text-muted-foreground/70"
                )}>
                    {trimmedLastMessage(conversation)}
                </p>
            </div>

            {/* Active indicator */}
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
            )}

            {/* Hover effect */}
            <div className="absolute inset-0 rounded-xl ring-1 ring-transparent group-hover:ring-border/10 transition-all duration-200" />
        </button>
    );
}