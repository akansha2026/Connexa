"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const { setTheme } = useTheme()

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="icon"
                className="rounded-full absolute scale-0 dark:scale-100"
                onClick={() => setTheme("light")}
            >
                <Moon />
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="rounded-full absolute scale-100 dark:scale-0"
                onClick={() => setTheme("dark")}
            >
                <Sun />
            </Button>
        </div>
    )
}
