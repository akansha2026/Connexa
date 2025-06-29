import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/axios";
import { ws } from "@/lib/ws";


export function Logout(props: React.ComponentProps<'button'>) {
    const router = useRouter()

    async function handleLogout() {
        try {
            await apiClient.post("/auth/logout")

            // disconnect the socket
            ws.disconnect()

            router.push("/login")
        } catch (error) {
            console.log(error)
        }
    }
    return <Button onClick={handleLogout} size="icon" {...props}>
        <LogOut />
    </Button>
}