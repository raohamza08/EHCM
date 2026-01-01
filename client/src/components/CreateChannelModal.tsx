"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useChatStore } from "@/store/useChatStore";
import styles from "./WorkspaceModal.module.css";

export default function CreateChannelModal({
    workspaceId,
    onClose,
    onSuccess
}: {
    workspaceId: string;
    onClose: () => void;
    onSuccess: (channel: any) => void;
}) {
    const [name, setName] = useState("");
    const [type, setType] = useState("PUBLIC");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const channel = await api.post<any>("/channels", {
                name: name.toLowerCase().replace(/\s+/g, "-"),
                type,
                workspaceId
            });
            onSuccess(channel);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>Create a channel</h2>
                <p>Channels are where your team communicates by topic.</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. marketing"
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Visibility</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className={styles.select}>
                            <option value="PUBLIC">Public</option>
                            <option value="PRIVATE">Private</option>
                        </select>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancel}>Cancel</button>
                        <button type="submit" className={styles.submit} disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Channel"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
