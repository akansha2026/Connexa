"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import SignupSVG from "@/public/signup.svg"
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
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { toast } from "sonner"
import { apiClient, AxiosErrorResponse, isAxiosError } from "@/lib/axios"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

const formSchema = z.object({
    name: z.string().min(1, {
        message: "Please provide your name"
    }),
    email: z.string().email("Please provide a valid email address"),
    password: z.string().min(8, {
        message: "Password must be atleast 8 characters long."
    }).max(20, {
        message: "Password should not be more than 20 characters."
    })
})

export default function Signup() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: ""
        },
    })

    const router = useRouter()

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await apiClient.post("/auth/signup", values)
            toast.success("Registration successful.")

            // Naviagte to login
            router.push("/login")
        } catch (error) {
            if (isAxiosError(error)) {
                // You can handle error.response here if needed
                const errorMessage = (error.response as AxiosErrorResponse).data.error || "An error occurred during signup.";
                toast.error(errorMessage);
            } else {
                toast.error("Something went wrong. Please try again later.")
            }
            console.error("Error during signup:", error);
        }
    }

    return (
        <div className="relative w-full min-h-screen flex items-center justify-center gap-8">
            <div className="w-0 md:flex-[0.5] flex justify-center items-center md:w-full h-screen bg-primary">
                <Image src={SignupSVG} alt="SignUp Screen SVG" className="p-6" />
            </div>
            <div className="flex-[0.5] flex flex-col justify-center items-center gap-8">
                <Form {...form}>
                    <Image src={ConnexaLogo} width={100} height={100} alt="Login Screen SVG" className="rounded-full border-2" />
                    <Typography variant="h1">Sign up to Connexa</Typography>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-72 max-w-full ">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="Password" {...field} type="password" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button className="w-full" type="submit">Submit</Button>

                        <Separator orientation="horizontal" />

                        <div className="flex justify-center gap-2 items-center">
                            <Typography variant="small">Already a member of Connexa ? </Typography>  <Link href="/login" className="text-blue-500 hover:underline"> Login</Link>
                        </div>

                    </form>
                </Form>
            </div>
            <ThemeToggle className="absolute top-4 left-4" />
        </div>
    )
}