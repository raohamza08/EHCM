"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import styles from "./Auth.module.css";

function AuthForm() {
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get("token");

    // If token exists, default to register mode
    const [isLogin, setIsLogin] = useState(!inviteToken);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { setAuth } = useAuthStore();

    useEffect(() => {
        if (inviteToken) {
            setIsLogin(false);
            // Optionally fetch invite details to prefill email if needed
            api.get<any>(`/workspaces/invitations/${inviteToken}`)
                .then(data => setEmail(data.email))
                .catch(console.error);
        }
    }, [inviteToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const endpoint = isLogin ? "/auth/login" : "/auth/register";
            const body = {
                email,
                password,
                ...(isLogin ? {} : { name, jobTitle }),
                ...(inviteToken ? { inviteToken } : {})
            };

            const data = await api.post<{ token: string; user: any; workspaceId?: string }>(endpoint, body);

            if (data.workspaceId) {
                // Ensure specific workspace is active immediately
                const { setActiveWorkspace } = (await import("@/store/useChatStore")).useChatStore.getState();
                setActiveWorkspace(data.workspaceId);
            }

            setAuth(data.user, data.token);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>EuroCom</h1>
                    <p className={styles.subtitle}>
                        {isLogin ? "Welcome back" : "Create your account"}
                        {inviteToken && !isLogin && " to join workspace"}
                    </p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <div className={styles.field}>
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Job Title</label>
                                <input
                                    type="text"
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    placeholder="Software Engineer"
                                />
                            </div>
                        </>
                    )}
                    <div className={styles.field}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@work.com"
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button type="submit" className={styles.submitButton} disabled={isLoading}>
                        {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Get Started")}
                    </button>
                </form>

                <div className={styles.footer}>
                    {isLogin ? (
                        <>
                            Don't have an account?{" "}
                            <button onClick={() => setIsLogin(false)}>Sign Up</button>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <button onClick={() => setIsLogin(true)}>Sign In</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthForm />
        </Suspense>
    );
}
