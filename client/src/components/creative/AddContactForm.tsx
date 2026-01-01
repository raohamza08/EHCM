"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import styles from "./CreativeHub.module.css";

interface AddContactFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AddContactForm({ onSuccess, onCancel }: AddContactFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        role: "",
        category: "Work"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post("/contacts", formData);
            onSuccess();
        } catch (error) {
            console.error("Failed to add contact", error);
            alert("Error adding contact. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
                <label>Full Name</label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Rivera"
                />
            </div>
            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alex@example.com"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Phone</label>
                    <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 234..."
                    />
                </div>
            </div>
            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>Company</label>
                    <input
                        type="text"
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                        placeholder="e.g. Epic Games"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Role</label>
                    <input
                        type="text"
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        placeholder="e.g. Senior Designer"
                    />
                </div>
            </div>
            <div className={styles.formGroup}>
                <label>Category</label>
                <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                    <option value="Work">Work</option>
                    <option value="Professional">Professional</option>
                    <option value="Friends">Friends</option>
                    <option value="Family">Family</option>
                </select>
            </div>
            <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Contact"}
                </button>
            </div>
        </form>
    );
}
