"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Image from "next/image";
import ConnexaLogo from "@/public/logo.png"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Typography } from "@/components/ui/typography"
import { useState } from "react";
import Link from "next/link";
import { apiClient, AxiosErrorResponse, isAxiosError } from "@/lib/axios";
import { toast } from "sonner";

const formSchema = z.object({
    email: z.string().email("Please provide a valid email address"),
})

export default function PasswordReset() {
    const [emailSent, setEmailSent] = useState(false)
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: ""
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setEmailSent(false)
            await apiClient.post("/auth/forgot-password", values)
            setEmailSent(true)
        } catch (error) {
            if (isAxiosError(error)) {
                // You can handle error.response here if needed
                const errorMessage = (error.response as AxiosErrorResponse).data.error || "An error occurred during signup.";
                toast.error(errorMessage);
            } else{
                toast.error("Something went wrong. Please try again later.")
            }
            console.error("Error during signup:", error);
        }
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center gap-4 flex-col">
            <Image src={ConnexaLogo} width={100} height={100} alt="Login Screen SVG" className="rounded-full border-2" />
            {!emailSent ? <Form {...form}>
                <Typography variant="h1" className="w-96 max-w-full text-center">Reset your password</Typography>
                <Typography variant="muted" className="w-96 max-w-full text-center">Enter your user account&apos;s verified email address and we will send you a password reset link.</Typography>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-72 max-w-full ">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input placeholder="Email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />


                    <Button className="w-full" type="submit">Send Email</Button>
                </form>
            </Form> :
                <>
                    <Typography variant="h1" className="w-96 max-w-full text-center">Email sent successfully</Typography>
                    <Typography variant="muted" className="w-96 max-w-full text-center">Check your email for a password reset link. If it doesn&apos;t appear within a few minutes, check your spam folder.</Typography>
                    <Button variant="link" ><Link href="/login">Return to login</Link></Button>
                </>
            }

        </div>
    )
}