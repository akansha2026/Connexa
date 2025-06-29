"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"


export function ThemeToggle(props: React.ComponentProps<'div'>) {
    const { theme, setTheme } = useTheme()

    return (
        <div {...props}>
            {
                theme == 'light' ? <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setTheme("dark")}
                >
                    <Sun />
                </Button> : <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setTheme("light")}
                >
                    <Moon />
                </Button>
            }
        </div>
    )
}
