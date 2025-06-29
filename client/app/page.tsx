"use client";

import { ChatWindow } from "@/components/chat-windows";
import { NavigationBar } from "@/components/navigation-bar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { apiClient } from "@/lib/axios";
import { User } from "@/lib/index.types";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const { setUser } = useStore();

  useEffect(() => {
    async function getUserFromToken() {
      try {
        const { data } = await apiClient.get("/auth/profile");
        if (typeof data === "object" && data !== null && "data" in data) {
          // You can further type-assert here if needed
          const userProfile = (data as { data: unknown }).data;

          // Save it as a global state for whole application
          setUser(userProfile as User);
        } else {
          throw new Error("User not found");
        }
      } catch (error) {
        console.log(error);
        router.push("/login");
      }
    }
    getUserFromToken();
  }, [router, setUser]);

  return (
    <ResizablePanelGroup className="min-h-screen max-h-screen" direction="horizontal">
      <ResizablePanel defaultSize={25} minSize={25} maxSize={35}>
        <NavigationBar />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={75} maxSize={75} minSize={65}>
        <ChatWindow />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
