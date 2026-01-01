"use client";

import React, { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize, Minimize, X } from "lucide-react";
import { socketService } from "@/lib/socket";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import styles from "./CallModal.module.css";

export default function CallModal({
    remoteUserId,
    type,
    isIncoming = false,
    onClose
}: {
    remoteUserId: string;
    type: "video" | "audio";
    isIncoming?: boolean;
    onClose: () => void;
}) {
    const { user } = useAuthStore();
    const { callState, setCallState } = useChatStore();
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(type === "audio");
    const [callStatus, setCallStatus] = useState<"calling" | "ringing" | "connected" | "ended">("calling");

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);

    const iceServers = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
        ]
    };

    useEffect(() => {
        let stream: MediaStream | null = null;

        const init = async () => {
            try {
                // Try to get media, but don't hard fail if it's just security blocking
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: type === "video",
                            audio: true
                        });
                        setLocalStream(stream);
                        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                    } catch (mediaErr) {
                        console.warn("Media access denied or unavailable, proceeding as receive-only", mediaErr);
                    }
                }

                peerConnection.current = new RTCPeerConnection(iceServers);

                if (stream) {
                    stream.getTracks().forEach(track => {
                        peerConnection.current?.addTrack(track, stream!);
                    });
                }

                peerConnection.current.ontrack = (event) => {
                    setRemoteStream(event.streams[0]);
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
                    setCallStatus("connected");
                };

                peerConnection.current.onicecandidate = (event) => {
                    if (event.candidate) {
                        socketService.socket?.emit("ice-candidate", {
                            to: remoteUserId,
                            candidate: event.candidate
                        });
                    }
                };

                if (!isIncoming) {
                    // Create offer even if no local stream (receive-only)
                    const offer = await peerConnection.current.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: type === "video"
                    });
                    await peerConnection.current.setLocalDescription(offer);
                    socketService.socket?.emit("call-user", {
                        to: remoteUserId,
                        from: user?.id,
                        type,
                        signal: offer
                    });
                } else if (callState.signalData) {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(callState.signalData));
                    const answer = await peerConnection.current.createAnswer();
                    await peerConnection.current.setLocalDescription(answer);
                    socketService.socket?.emit("answer-call", {
                        to: remoteUserId,
                        signal: answer
                    });
                    setCallStatus("connected");
                }
            } catch (err: any) {
                console.error("Critical call init error", err);
                alert(err.message || "Failed to initialize call");
                onClose();
            }
        };

        init();

        const handleAnswer = async (data: { signal: any }) => {
            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.signal));
                setCallStatus("connected");
            }
        };

        const handleCandidate = async (data: { candidate: any }) => {
            if (peerConnection.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        };

        const handleCallEnded = () => {
            setCallStatus("ended");
            setTimeout(onClose, 2000);
        };

        const handleCallRejected = () => {
            alert("Call rejected");
            onClose();
        };

        socketService.socket?.on("call-accepted", handleAnswer);
        socketService.socket?.on("ice-candidate", handleCandidate);
        socketService.socket?.on("call-ended", handleCallEnded);
        socketService.socket?.on("call-rejected", handleCallRejected);

        return () => {
            stream?.getTracks().forEach(track => track.stop());
            peerConnection.current?.close();
            socketService.socket?.off("call-accepted");
            socketService.socket?.off("ice-candidate");
            socketService.socket?.off("call-ended");
            socketService.socket?.off("call-rejected");
        };
    }, []);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks()[0].enabled = isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream && type === "video") {
            localStream.getVideoTracks()[0].enabled = isVideoOff;
            setIsVideoOff(!isVideoOff);
        }
    };

    const endCall = () => {
        socketService.socket?.emit("end-call", { to: remoteUserId });
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span>{type === "video" ? "Video Call" : "Audio Call"} - {callStatus}</span>
                    <button onClick={endCall} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.videoGrid}>
                    <div className={styles.remoteVideoContainer}>
                        {type === "video" ? (
                            <video ref={remoteVideoRef} autoPlay playsInline className={styles.remoteVideo} />
                        ) : (
                            <div className={styles.audioPlaceholder}>
                                <div className={styles.pulsingAvatar}>
                                    <Phone size={48} />
                                </div>
                                <h3>Connecting...</h3>
                            </div>
                        )}
                        {callStatus !== "connected" && (
                            <div className={styles.connectingOverlay}>
                                <div className={styles.loader} />
                                <p>{isIncoming ? "Connecting..." : "Calling..."}</p>
                            </div>
                        )}
                    </div>

                    {type === "video" && (
                        <div className={styles.localVideoContainer}>
                            {localStream ? (
                                <video ref={localVideoRef} autoPlay playsInline muted className={styles.localVideo} />
                            ) : (
                                <div className={styles.localVideoPlaceholder}>No Camera</div>
                            )}
                            {isVideoOff && <div className={styles.videoOffOverlay}><VideoOff size={24} /></div>}
                        </div>
                    )}
                </div>

                <div className={styles.controls}>
                    <button
                        onClick={toggleMute}
                        className={`${styles.controlBtn} ${isMuted ? styles.active : ""}`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    {type === "video" && (
                        <button
                            onClick={toggleVideo}
                            className={`${styles.controlBtn} ${isVideoOff ? styles.active : ""}`}
                        >
                            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>
                    )}

                    <button onClick={endCall} className={`${styles.controlBtn} ${styles.endCallBtn}`}>
                        <PhoneOff size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
