"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import styles from "@/components/Auth.module.css";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

function JoinContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { token: authToken } = useAuthStore();
    const [invitation, setInvitation] = useState<any>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setError("Invitation token is missing. Please check your link.");
            setIsLoading(false);
            return;
        }

        api.get<any>(`/workspaces/invitations/${token}`)
            .then(data => {
                setInvitation(data);
                setIsLoading(false);
            })
            .catch(err => {
                setError(err.message || "This invitation is invalid or has expired.");
                setIsLoading(false);
            });
    }, [token]);

    const handleJoin = async () => {
        if (authToken) {
            // User is logged in, accept directly
            try {
                const res = await api.post<{ workspaceId: string }>(`/workspaces/invitations/${token}/accept`, {});
                const { setActiveWorkspace } = (await import("@/store/useChatStore")).useChatStore.getState();
                setActiveWorkspace(res.workspaceId);
                router.push("/");
            } catch (err: any) {
                setError(err.message || "Failed to join workspace");
            }
        } else {
            // Not logged in, go to register/login with token
            router.push(`/?token=${token}`);
        }
    };

    if (isLoading) return (
        <div className={styles.container}>
            <div className={styles.card}>
                <Loader2 className="animate-spin" size={48} style={{ color: "var(--primary)", margin: "0 auto 24px" }} />
                <p>Verifying your invitation...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
                <h2 className={styles.title}>Something went wrong</h2>
                <p className={styles.subtitle} style={{ marginBottom: "24px" }}>{error}</p>
                <button onClick={() => router.push("/")} className={styles.submitButton}>
                    Back to Home
                </button>
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div style={{
                    width: "80px", height: "80px", borderRadius: "20px", background: "rgba(99, 102, 241, 0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "var(--primary)"
                }}>
                    <Mail size={40} />
                </div>

                <h1 className={styles.title}>You're invited!</h1>
                <p className={styles.subtitle} style={{ marginBottom: "32px", fontSize: "16px" }}>
                    You've been invited to join <strong style={{ color: "var(--foreground)" }}>{invitation.workspace.name}</strong> as a <span style={{ color: "var(--primary)", fontWeight: "600" }}>{invitation.role.toLowerCase()}</span>.
                </p>

                <div style={{ background: "var(--background-secondary)", padding: "20px", borderRadius: "16px", marginBottom: "32px", textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "start", gap: "12px", marginBottom: "12px" }}>
                        <CheckCircle2 size={18} style={{ color: "var(--success)", marginTop: "2px" }} />
                        <div>
                            <span style={{ fontWeight: "600" }}>Collaborate with your team</span>
                            <p style={{ fontSize: "13px", color: "var(--foreground-tertiary)" }}>Access all channels and shared documents.</p>
                        </div>
                    </div>
                </div>

                <button onClick={handleJoin} className={styles.submitButton}>
                    Accept & Continue
                </button>
            </div>
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={<div className={styles.container}>Loading...</div>}>
            <JoinContent />
        </Suspense>
    );
}
