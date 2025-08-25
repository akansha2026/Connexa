import { ConnectionStatus } from "@/lib/index.types";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

// Connection indicator component
export function ConnectionIndicator({ connectionStatus }: Readonly<{ connectionStatus: ConnectionStatus }>) {
  if (connectionStatus.isConnected) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
        <Wifi className="h-3 w-3 text-green-600 dark:text-green-400" />
        <span className="text-xs text-green-700 dark:text-green-300">Connected</span>
      </div>
    );
  }

  if (connectionStatus.isReconnecting) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
        <RefreshCw className="h-3 w-3 text-blue-600 dark:text-blue-400 animate-spin" />
        <span className="text-xs text-blue-700 dark:text-blue-300">Reconnecting</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 rounded-full">
      <WifiOff className="h-3 w-3 text-red-600 dark:text-red-400" />
      <span className="text-xs text-red-700 dark:text-red-300">Offline</span>
    </div>
  );
};