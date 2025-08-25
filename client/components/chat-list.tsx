import { apiClient, AxiosErrorResponse, isAxiosError } from "@/lib/axios";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChatListItem } from "./chat-list-item";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Users } from "lucide-react";
import { Button } from "./ui/button";

export function ChatList() {
  const { conversations, setConversations } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const { data: res } = await apiClient.get("/conversations");
        if (typeof res === "object" && res !== null && "data" in res) {
          const { data } = res;
          if (Array.isArray(data)) {
            setConversations(data);
          }
        }
      } catch (error) {
        if (isAxiosError(error)) {
          const errorMessage =
            (error.response as AxiosErrorResponse).data.error ||
            "An error occurred during fetching conversations.";
          toast.error(errorMessage);
        } else {
          toast.error("Something went wrong. Please try again later.");
        }
        console.error("Error during fetching conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [setConversations]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="h-12 w-12 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded"></div>
              <div className="h-3 w-1/2 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-full p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6 p-4 rounded-full bg-gradient-to-br from-accent/30 to-accent/10">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>

        <h3 className="text-lg font-medium text-foreground mb-2">
          No conversations yet
        </h3>

        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Start a new conversation or join a group to begin chatting
        </p>

        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            New Chat
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            New Group
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="overflow-y-auto h-full px-3 py-2 flex flex-col gap-1 scrollbar-thin scrollbar-thumb-muted/40 hover:scrollbar-thumb-muted/60">
      <AnimatePresence mode="popLayout">
        {conversations.map((conversation, index) => (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{
              duration: 0.2,
              delay: index * 0.05,
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            <ChatListItem conversation={conversation} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}