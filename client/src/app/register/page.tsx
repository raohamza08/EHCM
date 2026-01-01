"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Redirect register calls to home with same params
        const params = searchParams.toString();
        router.push(`/${params ? `?${params}` : ""}`);
    }, [router, searchParams]);

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
            Redirecting to registration...
        </div>
    );
}
