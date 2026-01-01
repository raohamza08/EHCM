"use client";
import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterContent() {
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

export default function RegisterRedirect() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterContent />
        </Suspense>
    );
}
