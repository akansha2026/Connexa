"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import ConnexaLogo from "@/public/logo.png"
import Image from "next/image";

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
import { toast } from "sonner"
import { use } from "react"

const formSchema = z.object({
    password: z.string().min(8, {
        message: "Password must be atleast 8 characters long."
    }).max(20, {
        message: "Password should not be more than 20 characters."
    }),
    confirmPassword: z.string().min(8, {
        message: "Password must be atleast 8 characters long."
    }).max(20, {
        message: "Password should not be more than 20 characters."
    })
})

export default function PasswordReset({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = use(params);
    console.log(token)
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            confirmPassword: "",
            password: ""
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (values.password != values.confirmPassword) {
            toast.error("Passwords do not match")
            return;
        }
        console.log(values)
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center gap-8 flex-col">
            <Form {...form}>
                <Image src={ConnexaLogo} width={100} height={100} alt="Connexa logo" className="rounded-full border-2" />
                <Typography variant="h1">Reset password</Typography>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-72 max-w-full ">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input placeholder="New password" {...field} type="password" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input placeholder="Confirm password" {...field} type="password" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button className="w-full" type="submit">Change Password</Button>
                </form>
            </Form>
        </div>
    )
}