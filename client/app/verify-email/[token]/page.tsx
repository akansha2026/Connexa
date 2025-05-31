import { use } from "react";

export default function VerifyEmail({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = use(params)
    return <div className="">
        Verify email: {token}
    </div>
}