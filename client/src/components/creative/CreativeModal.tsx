"use client";

import React from "react";
import { X } from "lucide-react";
import styles from "./CreativeModal.module.css";

interface CreativeModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

export default function CreativeModal({ title, onClose, children }: CreativeModalProps) {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2>{title}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>
                <div className={styles.body}>
                    {children}
                </div>
            </div>
        </div>
    );
}
