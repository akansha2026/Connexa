"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import LoginSVG from "@/public/login.svg";
import ConnexaLogo from "@/public/logo.png";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { apiClient, AxiosErrorResponse, isAxiosError } from "@/lib/axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z
    .string()
    .min(8, {
      message: "Password must be atleast 8 characters long.",
    })
    .max(20, {
      message: "Password should not be more than 20 characters.",
    }),
});

export default function Login() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const router = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await apiClient.post("/auth/login", values);
      toast.success("Login successful.");

      router.push("/");
    } catch (error) {
      if (isAxiosError(error)) {
        // You can handle error.response here if needed
        const errorMessage =
          (error.response as AxiosErrorResponse).data.error ||
          "An error occurred during signup.";
        toast.error(errorMessage);
      } else {
        toast.error("Something went wrong. Please try again later.");
      }
      console.error("Error during signup:", error);
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center gap-8">
      <div className="w-0 md:flex-[0.5] flex justify-center items-center md:w-full h-screen bg-zinc-800 dark:bg-zinc-300">
        <Image src={LoginSVG} alt="Login Screen SVG" className="p-6" />
      </div>
      <div className="flex-[0.5] flex flex-col justify-center items-center gap-8">
        <Form {...form}>
          <Image
            src={ConnexaLogo}
            width={100}
            height={100}
            alt="Login Screen SVG"
            className="rounded-full border-2"
          />
          <Typography variant="h1">Sign in to Connexa</Typography>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 w-72 max-w-full "
          >
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
                  <FormLabel className="flex justify-end w-full hover:underline text-blue-500">
                    <Link href="/password-reset">Forgot password ?</Link>
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit">
              Submit
            </Button>

            <Separator orientation="horizontal" />

            <div className="flex justify-center gap-2 items-center">
              <Typography variant="small">
                Don&apos;t have an account ?{" "}
              </Typography>{" "}
              <Link href="/signup" className="text-blue-500 hover:underline">
                {" "}
                Signup
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

