'use client'

import { Typography } from "@/components/ui/typography";
import { apiClient, RequestState } from "@/lib/axios";
import { LoaderCircle, MailCheckIcon, XCircleIcon } from "lucide-react";
import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyEmail({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [state, setState] = useState<RequestState>(RequestState.IN_PROGRESS);

  useEffect(() => {
    async function sendVerificationRequest() {
      try {
        await apiClient.post("/auth/verify-email", {
          token,
        });
        setState(RequestState.SUCCESS);
      } catch (error) {
        console.log(error);
        setState(RequestState.FAILURE);
      }
    }
    sendVerificationRequest();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center  px-4">
      {state === RequestState.IN_PROGRESS && (
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 1,
              ease: "linear",
            }}
          >
            <LoaderCircle size={60} />
          </motion.div>
          <Typography variant="h2" className="font-medium">
            Verifying your email...
          </Typography>
          <Typography variant="muted" className="text-center text-sm max-w-xs">
            Please wait while we confirm your email address.
          </Typography>
        </div>
      )}

      {state === RequestState.SUCCESS && (
        <div className="flex flex-col items-center gap-4 text-green-600">
          <MailCheckIcon size={60} />
          <Typography variant="h2" className="font-medium">
            Email verified successfully!
          </Typography>
          <Typography variant="muted" className="text-center text-sm text-green-700 max-w-xs">
            You can now log in to your account and start exploring Connexa.
          </Typography>
          <Button variant="default"  ><Link href="/">Go Home</Link></Button>
        </div>
      )}

      {state === RequestState.FAILURE && (
        <div className="flex flex-col items-center gap-4 text-red-600">
          <XCircleIcon size={60} />
          <Typography variant="h2" className="font-medium">
            Verification failed
          </Typography>
          <Typography variant="muted" className="text-center text-sm text-red-700 max-w-xs">
            Something went wrong during the verification process. Please try again later.
          </Typography>
        </div>
      )}
    </div>
  );
}
