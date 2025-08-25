import { useStore } from "@/lib/store";
import { InfoBar } from "./info-bar";
import { Typography } from "./ui/typography";
import { MessageInput } from "./message-input";
import {
  MessageSquare,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Users,
  MessageCircle,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { ConnectionStatus } from "@/lib/index.types";
import { MessagesWindow } from "./messages-window";


// Empty state component
const EmptyState = ({ connectionStatus }: { connectionStatus: ConnectionStatus }) => {
  const { user } = useStore();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleQuickAction = (action: string) => {
    toast.info(`${action} - Feature coming soon!`);
  };

  return (
    <div className="h-full w-full flex flex-col justify-center items-center text-center p-6 bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-lg space-y-8">
        {/* Welcome Section */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
            <div className="relative p-6 bg-accent/20 rounded-full border border-border/50">
              <MessageSquare className="h-12 w-12 text-primary mx-auto" />
            </div>
          </div>

          <div className="space-y-2">
            <Typography variant="h2" className="text-foreground font-semibold">
              {getWelcomeMessage()}, {user?.name || "there"}!
            </Typography>
            <Typography variant="large" className="text-muted-foreground">
              Ready to start chatting? Select a conversation or create a new one.
            </Typography>
          </div>
        </div>

        {/* Connection Status */}
        {!connectionStatus.isConnected && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <WifiOff className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Connection Issue
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {connectionStatus.error || "Disconnected from chat server"}
            </p>
          </div>
        )}


        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleQuickAction("Starting new chat")}
            className="flex items-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/20 transition-all duration-200 hover:scale-[1.02] group"
          >
            <MessageCircle className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-primary">New Chat</span>
          </button>

          <button
            onClick={() => handleQuickAction("Creating group")}
            className="flex items-center gap-2 p-4 bg-accent/50 hover:bg-accent/70 rounded-xl border border-border/50 transition-all duration-200 hover:scale-[1.02] group"
          >
            <Users className="h-5 w-5 text-foreground group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-foreground">New Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Connection warning banner
const ConnectionWarning = ({ connectionStatus }: { connectionStatus: ConnectionStatus }) => {
  if (connectionStatus.isConnected) return null;

  const getWarningContent = () => {
    if (connectionStatus.isReconnecting) {
      return {
        icon: RefreshCw,
        message: "Reconnecting to chat server...",
        submessage: "Your messages will be sent once connected.",
        className: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
        iconClassName: "text-blue-600 dark:text-blue-400 animate-spin",
        textClassName: "text-blue-800 dark:text-blue-200"
      };
    }

    return {
      icon: AlertTriangle,
      message: "You're currently offline",
      submessage: connectionStatus.error || "Messages cannot be sent or received.",
      className: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
      iconClassName: "text-amber-600 dark:text-amber-400",
      textClassName: "text-amber-800 dark:text-amber-200"
    };
  };

  const warning = getWarningContent();
  const IconComponent = warning.icon;

  return (
    <div className={`${warning.className} border-b px-4 py-2`}>
      <div className="flex items-center gap-3">
        <IconComponent className={`h-4 w-4 ${warning.iconClassName}`} />
        <div>
          <p className={`text-sm font-medium ${warning.textClassName}`}>
            {warning.message}
          </p>
          <p className={`text-xs ${warning.textClassName} opacity-80`}>
            {warning.submessage}
          </p>
        </div>
      </div>
    </div>
  );
};

// Main ChatWindow component
export function ChatWindow() {
  const { activeConversation, connectionStatus } = useStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N for new chat (placeholder)
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        toast.info("New chat - Feature coming soon!");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!activeConversation) {
    return <EmptyState connectionStatus={connectionStatus} />;
  }

  return (
    <div className="relative h-full w-full flex flex-col bg-background">
      {/* Connection warning banner */}
      <ConnectionWarning connectionStatus={connectionStatus} />

      <InfoBar />
      <div className="flex-1 min-h-0">
        <MessagesWindow />
      </div>
      <MessageInput
        disabled={!connectionStatus.isConnected}
        isReconnecting={connectionStatus.isReconnecting}
      />
    </div>
  );
}