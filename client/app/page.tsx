import { getUserFromToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getUserFromToken();

  if (!user) {
    redirect("/landing");
  }

  return (
    <main className="flex items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">Welcome back!</h1>
    </main>
  );
}