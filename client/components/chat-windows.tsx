import { useStore } from "@/lib/store";
import { InfoBar } from "./info-bar";
import { MessagesWindow } from "./messages-window";
import { Typography } from "./ui/typography";
import { MessageInput } from "./message-input";

export function ChatWindow() {
  const { activeConversation } = useStore();
  return (
    < >
      {activeConversation ? (
        <div className="relative min-h-screen max-h-screen w-full flex flex-col">
          <InfoBar />
          <MessagesWindow />
          <MessageInput />
        </div>
      ) : (
        <div className="h-screen w-full flex flex-col justify-center items-center">
          <Typography variant="h3" className="text-muted-foreground">
            Select a conversation to start chatting
          </Typography>
        </div>
      )}
    </>
  );
}
