"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useChatStore } from "@/store/useChatStore";
import styles from "./WorkspaceModal.module.css";

export default function WorkspaceModal({
    onClose,
    onSuccess
}: {
    onClose: () => void;
    onSuccess?: (workspace: any) => void;
}) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [error, setError] = useState("");
    const { setActiveWorkspace } = useChatStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const workspace = await api.post<any>("/workspaces", { name, slug });
            setActiveWorkspace(workspace.id);
            if (onSuccess) {
                onSuccess(workspace);
            }
            onClose();
        } catch (err: any) {
            setError(err.message || "An error occurred");
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>Create a new workspace</h2>
                <p>Workspaces are where your team communicates.</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>Workspace Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Acme Corp"
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Workspace URL slug</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="acme-corp"
                            required
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancel}>Cancel</button>
                        <button type="submit" className={styles.submit}>Create Workspace</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
