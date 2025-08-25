"use client";

import { ChatWindow } from "@/components/chat-windows";
import { NavigationBar } from "@/components/navigation-bar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { apiClient } from "@/lib/axios";
import { ConnectionStatus, User } from "@/lib/index.types";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { AlertCircle, Loader2, WifiOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// Custom hooks for better separation of concerns
const useAuth = () => {
  const router = useRouter();
  const { setUser, user } = useStore();
  const [authState, setAuthState] = useState({
    isLoading: true,
    error: null as string | null,
    isAuthenticated: false,
  });

  const authenticateUser = useCallback(async () => {
    if (user) {
      setAuthState(prev => ({ ...prev, isLoading: false, isAuthenticated: true }));
      return;
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data } = await apiClient.get("/auth/profile");

      if (typeof data === "object" && data !== null && "data" in data) {
        const userProfile = (data as { data: unknown }).data;

        // Basic validation
        if (typeof userProfile === 'object' &&
          userProfile !== null &&
          'id' in userProfile &&
          'name' in userProfile) {
          setUser(userProfile as User);
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: true,
            error: null
          }));

          toast.success("Welcome back!");
        } else {
          throw new Error("Invalid user data received");
        }
      } else {
        throw new Error("User profile not found");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false
      }));

      toast.error("Authentication failed. Redirecting to login...");

      // Redirect after showing error
      setTimeout(() => {
        router.push("/landing");
      }, 2000);
    }
  }, [router, setUser, user]);

  return { ...authState, authenticateUser };
};

const useWebSocket = (isAuthenticated: boolean, user: User | null) => {
  const { connectionStatus, setConnectionStatus } = useStore();

  const wsRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  const initializeWebSocket = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const { ws, WebSocketEvents } = await import("@/lib/ws");
      wsRef.current = ws;

      // Clear any existing timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      const handleConnected = () => {
        setConnectionStatus({
          isConnected: true,
          isReconnecting: false,
          error: null,
          lastConnectedAt: new Date(),
        });
        toast.success("Connected to chat server", { duration: 2000 });
      };

      const handleDisconnected = (data: any) => {
        console.warn("WebSocket disconnected:", data);
        setConnectionStatus({
          isConnected: false,
          isReconnecting: false,
        });

        // Only show toast if it was an unexpected disconnection
        if (data?.code !== 1000) { // 1000 = normal closure
          toast.warning("Disconnected from chat server");
        }
      };

      const handleReconnecting = (data: any) => {
        setConnectionStatus({
          isConnected: false,
          isReconnecting: true,
          error: null,
        });

        if (data?.attempt === 1) {
          toast.info("Connection lost. Reconnecting...", { duration: 3000 });
        }
      };

      const handleError = (error: any) => {
        console.error("WebSocket error:", error);
        const errorMessage = error?.message || "Connection error occurred";

        setConnectionStatus({
          isConnected: false,
          isReconnecting: false,
          error: error?.message || "Connection error",
        });

        toast.error(`Connection error: ${errorMessage}`);
      };

      // Remove any existing listeners
      ws.removeAllListeners(WebSocketEvents.CONNECTED);
      ws.removeAllListeners(WebSocketEvents.DISCONNECTED);
      ws.removeAllListeners(WebSocketEvents.RECONNECTING);
      ws.removeAllListeners(WebSocketEvents.ERROR);

      // Add event listeners
      ws.on(WebSocketEvents.CONNECTED, handleConnected);
      ws.on(WebSocketEvents.DISCONNECTED, handleDisconnected);
      ws.on(WebSocketEvents.RECONNECTING, handleReconnecting);
      ws.on(WebSocketEvents.ERROR, handleError);

      // Connect
      ws.connect();

      return () => {
        ws.off(WebSocketEvents.CONNECTED, handleConnected);
        ws.off(WebSocketEvents.DISCONNECTED, handleDisconnected);
        ws.off(WebSocketEvents.RECONNECTING, handleReconnecting);
        ws.off(WebSocketEvents.ERROR, handleError);
      };

    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      setConnectionStatus({
        error: "Failed to initialize connection",
        isConnected: false,
        isReconnecting: false,
      });
      toast.error("Failed to connect to chat server");
    }
  }, [isAuthenticated, user]);

  const manualReconnect = useCallback(async () => {
    if (wsRef.current) {
      toast.info("Reconnecting...");
      wsRef.current.disconnect();

      // Wait a bit before reconnecting
      reconnectTimeoutRef.current = setTimeout(() => {
        initializeWebSocket();
      }, 1000);
    }
  }, [initializeWebSocket]);

  useEffect(() => {
    const cleanup = initializeWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      cleanup?.then(cleanupFn => cleanupFn?.());
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [initializeWebSocket]);

  return { connectionStatus, manualReconnect };
};

// Connection status component
const ConnectionStatusBar = ({
  connectionStatus,
  onReconnect
}: {
  connectionStatus: ConnectionStatus;
  onReconnect: () => void;
}) => {
  if (connectionStatus.isConnected) return null;

  const getStatusConfig = () => {
    if (connectionStatus.isReconnecting) {
      return {
        icon: RefreshCw,
        color: "bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
        textColor: "text-blue-800 dark:text-blue-200",
        iconColor: "text-blue-600 dark:text-blue-400",
        message: "Reconnecting to chat server..."
      };
    }

    if (connectionStatus.error) {
      return {
        icon: WifiOff,
        color: "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800",
        textColor: "text-red-800 dark:text-red-200",
        iconColor: "text-red-600 dark:text-red-400",
        message: connectionStatus.error
      };
    }

    return {
      icon: WifiOff,
      color: "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      textColor: "text-yellow-800 dark:text-yellow-200",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      message: "Disconnected from chat server"
    };
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`${config.color} border-b px-4 py-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconComponent
            className={`h-4 w-4 ${config.iconColor} ${connectionStatus.isReconnecting ? 'animate-spin' : ''
              }`}
          />
          <span className={`text-sm ${config.textColor}`}>
            {config.message}
          </span>
        </div>

        {!connectionStatus.isReconnecting && (
          <button
            onClick={onReconnect}
            className={`text-xs px-2 py-1 rounded ${config.textColor} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

// Loading screen component
const LoadingScreen = ({ message }: { message: string }) => (
  <div className="h-screen w-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-6 max-w-md text-center">
      <div className="relative">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="absolute inset-0 rounded-full border-2 border-muted animate-pulse" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          Setting up your chat
        </h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  </div>
);

// Error screen component
const ErrorScreen = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="h-screen w-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-6 max-w-md text-center">
      <div className="relative">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="absolute inset-0 rounded-full border-2 border-destructive/20 animate-pulse" />
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="mx-auto px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Main component
export default function HomePage() {
  const { isLoading, error, isAuthenticated, authenticateUser } = useAuth();
  const { user } = useStore();
  const { connectionStatus, manualReconnect } = useWebSocket(isAuthenticated, user);

  // Retry authentication
  const handleRetryAuth = useCallback(() => {
    authenticateUser();
  }, [authenticateUser]);

  // Initialize authentication
  useEffect(() => {
    authenticateUser();
  }, [authenticateUser]);

  // Loading state
  if (isLoading) {
    return <LoadingScreen message="Authenticating your account..." />;
  }

  // Error state
  if (error) {
    return <ErrorScreen error={error} onRetry={handleRetryAuth} />;
  }

  // Main application
  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      <ConnectionStatusBar
        connectionStatus={connectionStatus}
        onReconnect={manualReconnect}
      />

      <div className="flex-1 flex min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel
            defaultSize={30}
            minSize={25}
            maxSize={40}
            className="border-r border-border/40 bg-card shadow-sm"
          >
            <NavigationBar/>
          </ResizablePanel>

          <ResizableHandle className="w-[2px] bg-border/20 hover:bg-border/50 transition-colors rounded-full" />

          <ResizablePanel
            defaultSize={70}
            maxSize={75}
            minSize={60}
            className="bg-background"
          >
            <ChatWindow/>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}