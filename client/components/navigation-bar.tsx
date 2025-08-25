import { ChatList } from "./chat-list";
import { SearchSection } from "./search-section";
import { UserAccountMenu } from "./user-account-menu"; 
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageSquarePlus, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { ConnectionIndicator } from "./connection-status";

export function NavigationBar() {
  const {connectionStatus} = useStore()
  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header Section */}
      <div className="p-3 border-b border-border/40 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Connexa
          </h1>
          <ConnectionIndicator connectionStatus={connectionStatus} />
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted transition-transform hover:scale-105"
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">New Chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted transition-transform hover:scale-105"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">New Group</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <SearchSection />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted/40">
        <ChatList />
      </div>

      {/* User Account Menu at Bottom */}
      <motion.div 
        className="border-t border-border/40 bg-card/90 backdrop-blur-sm shadow-inner"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <UserAccountMenu />
      </motion.div>
    </div>
  );
}