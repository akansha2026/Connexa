"use client"

import { apiClient } from "@/lib/axios";
import { User } from "@/lib/index.types";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter()
  const {user, setUser} = useStore()

  useEffect(() => {
    async function getUserFromToken() {
      
      try {
        const { data } = await apiClient.get("/auth/profile");
        if (typeof data === "object" && data !== null && "data" in data) {
          // You can further type-assert here if needed
          const userProfile =  (data as { data: unknown }).data;

          // Save it as a global state for whole application
          setUser(userProfile as User)
        }
      } catch (error) {
        console.log(error)
        router.push("/login")
      }
    }
    getUserFromToken()
  }, [router, setUser])

  return (
    <main className="flex items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">Welcome back {user?.name}</h1>
    </main>
  );
}