"use client";

import React from "react";
import { Phone, PhoneOff, Video, X } from "lucide-react";
import styles from "./IncomingCallModal.module.css";
import { useChatStore } from "@/store/useChatStore";

export default function IncomingCallModal({
    fromName,
    type,
    onAccept,
    onReject
}: {
    fromName: string;
    type: "video" | "audio";
    onAccept: () => void;
    onReject: () => void;
}) {
    return (
        <div className={styles.container}>
            <div className={styles.avatar}>
                {type === "video" ? <Video size={24} /> : <Phone size={24} />}
            </div>
            <div className={styles.info}>
                <h4>{fromName}</h4>
                <p>Incoming {type} call...</p>
            </div>
            <div className={styles.actions}>
                <button onClick={onReject} className={`${styles.btn} ${styles.reject}`}>
                    <PhoneOff size={20} />
                </button>
                <button onClick={onAccept} className={`${styles.btn} ${styles.accept}`}>
                    <Phone size={20} />
                </button>
            </div>
        </div>
    );
}
