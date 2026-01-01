"use client";

import React, { useState } from "react";
import {
    Calendar,
    Users,
    Video,
    Share2,
    CheckCircle2
} from "lucide-react";
import { api } from "@/lib/api";
import styles from "./PublicEvents.module.css";

interface PublicEvent {
    id: string;
    title: string;
    organizer: string;
    date: string;
    attendees: number;
    category: "Webinar" | "Conference" | "Workshop";
    image: string;
}

const SAMPLE_EVENTS: PublicEvent[] = [
    {
        id: "pub_1",
        title: "Future of Game Dev 2026",
        organizer: "Unity Technologies",
        date: "Jan 15, 2026",
        attendees: 1240,
        category: "Conference",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "pub_2",
        title: "UI Design Masterclass",
        organizer: "Figma Community",
        date: "Jan 18, 2026",
        attendees: 450,
        category: "Workshop",
        image: "https://images.unsplash.com/photo-1586717791821-3f44a563cc4c?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "pub_3",
        title: "Productivity Hacks for Remote Teams",
        organizer: "EuroCom Team",
        date: "Jan 22, 2026",
        attendees: 800,
        category: "Webinar",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop"
    }
];

interface PublicEventsProps {
    events?: any[];
}

export default function PublicEvents({ events = [] }: PublicEventsProps) {
    const [rsvpStates, setRsvpStates] = useState<Record<string, boolean>>({});

    const handleRSVP = async (eventId: string) => {
        try {
            // If it's a "Public" event in our DB, we update. Otherwise just mock it for sample events.
            if (eventId.startsWith('pub_')) {
                setRsvpStates(prev => ({ ...prev, [eventId]: true }));
                alert("Successfully RSVP'd to the public event!");
            } else {
                await api.patch(`/events/${eventId}/rsvp`, { status: "ACCEPTED" });
                setRsvpStates(prev => ({ ...prev, [eventId]: true }));
            }
        } catch (error) {
            console.error("Failed to RSVP", error);
        }
    };

    const handleShare = (event: any) => {
        if (navigator.share) {
            navigator.share({
                title: event.title,
                text: `Join me at ${event.title}!`,
                url: window.location.href
            });
        } else {
            alert("Share link copied to clipboard!");
        }
    };

    // Combine sample events with real public events from backend
    const allEvents = [...SAMPLE_EVENTS, ...events];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Public Events</h1>
                <p>Browse and join industry events, workshops, and webinars.</p>
            </div>

            <div className={styles.grid}>
                {allEvents.map(event => (
                    <div key={event.id} className={styles.eventCard}>
                        <div className={styles.imageContainer}>
                            <img src={event.image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop"} alt={event.title} />
                            <div className={styles.categoryBadge}>{event.category || event.type}</div>
                        </div>
                        <div className={styles.cardContent}>
                            <h3 className={styles.eventTitle}>{event.title}</h3>
                            <p className={styles.organizer}>by {event.organizer || "Community"}</p>

                            <div className={styles.meta}>
                                <div className={styles.metaItem}>
                                    <Calendar size={14} />
                                    <span>{event.date}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <Users size={14} />
                                    <span>{event.attendees || event.participants?.length || 0} attending</span>
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <button
                                    className={`${styles.rsvpBtn} ${rsvpStates[event.id] ? styles.rsvpActive : ""}`}
                                    onClick={() => handleRSVP(event.id)}
                                    disabled={rsvpStates[event.id]}
                                >
                                    {rsvpStates[event.id] ? (
                                        <>
                                            <CheckCircle2 size={16} />
                                            Joined
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} />
                                            RSVP
                                        </>
                                    )}
                                </button>
                                <button className={styles.shareBtn} onClick={() => handleShare(event)}>
                                    <Share2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
