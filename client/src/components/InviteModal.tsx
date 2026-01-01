"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { Copy, Check } from "lucide-react";
import styles from "./WorkspaceModal.module.css";

export default function InviteModal({
    workspaceId,
    onClose
}: {
    workspaceId: string;
    onClose: () => void;
}) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("MEMBER");
    const [inviteLink, setInviteLink] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const data = await api.post<any>(`/workspaces/${workspaceId}/invite`, { email, role });
            setInviteLink(data.inviteLink);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>Invite team members</h2>

                {!inviteLink ? (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.field}>
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className={styles.select}>
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Member</option>
                                <option value="GUEST">Guest</option>
                            </select>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <div className={styles.actions}>
                            <button type="button" onClick={onClose} className={styles.cancel}>Cancel</button>
                            <button type="submit" className={styles.submit} disabled={isLoading}>
                                {isLoading ? "Sending..." : "Send Invite"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className={styles.success}>
                        <p>Invitation link created! Share this with them:</p>
                        <div className={styles.linkGroup}>
                            <input readOnly value={inviteLink} className={styles.linkInput} />
                            <button onClick={copyToClipboard} className={styles.copyButton}>
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                        <button onClick={onClose} className={styles.submit} style={{ marginTop: "20px" }}>Done</button>
                    </div>
                )}
            </div>
        </div>
    );
}
