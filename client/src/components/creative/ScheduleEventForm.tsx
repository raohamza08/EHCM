"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import styles from "./CreativeHub.module.css";

interface ScheduleEventFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ScheduleEventForm({ onSuccess, onCancel }: ScheduleEventFormProps) {
    const [formData, setFormData] = useState({
        title: "",
        type: "Work",
        priority: "Medium",
        date: new Date().toISOString().split('T')[0],
        startTime: "10:00",
        duration: "1h",
        location: "",
        description: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Convert time and date to Date object
            const [hours, minutes] = formData.startTime.split(':');
            const startDateTime = new Date(formData.date);
            startDateTime.setHours(parseInt(hours), parseInt(minutes));

            await api.post("/events", {
                ...formData,
                startTime: startDateTime,
                date: new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
            });
            onSuccess();
        } catch (error) {
            console.error("Failed to schedule event", error);
            alert("Error scheduling event. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
                <label>Event Title</label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Project Sync"
                />
            </div>
            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>Type</label>
                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                        <option value="Work">Work</option>
                        <option value="Personal">Personal</option>
                        <option value="Public">Public</option>
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <label>Priority</label>
                    <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as any })}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
            </div>
            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label>Date</label>
                    <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Start Time</label>
                    <input
                        type="time"
                        required
                        value={formData.startTime}
                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    />
                </div>
            </div>
            <div className={styles.formGroup}>
                <label>Location / Link</label>
                <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Zoom, Office, etc."
                />
            </div>
            <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What's this event about?"
                />
            </div>
            <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? "Scheduling..." : "Schedule Event"}
                </button>
            </div>
        </form>
    );
}
