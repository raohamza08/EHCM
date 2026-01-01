import { create } from "zustand";

interface Message {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    channelId: string;
    isPinned?: boolean;
    reactions?: string; // JSON string
    sender: {
        id: string;
        name: string;
        avatar?: string;
    };
    files?: any[];
}

interface ChatState {
    messages: Message[];
    activeChannelId: string | null;
    activeWorkspaceId: string | null;
    currentView: "chat" | "creative";
    unreadChannels: Record<string, number>;
    showProfileModal: boolean;
    showInviteModal: boolean;
    viewProfileId: string | null;
    setShowProfileModal: (show: boolean) => void;
    setShowInviteModal: (show: boolean) => void;
    setViewProfileId: (id: string | null) => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    updateMessage: (message: Message) => void;
    deleteMessage: (id: string) => void;
    setActiveChannel: (id: string | null) => void;
    setActiveWorkspace: (id: string | null) => void;
    setUnread: (channelId: string, count: number) => void;
    updateUserProfiles: (data: { userId: string, name?: string, avatar?: string }) => void;
    callState: {
        isCalling: boolean;
        incomingCall: boolean;
        remoteUserId: string | null;
        callType: "video" | "audio" | null;
        signalData: any;
    };
    setCallState: (state: Partial<ChatState["callState"]>) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    activeChannelId: null,
    activeWorkspaceId: null,
    currentView: "chat",
    unreadChannels: {},
    showProfileModal: false,
    showInviteModal: false,
    viewProfileId: null,
    setShowProfileModal: (show) => set({ showProfileModal: show }),
    setShowInviteModal: (show) => set({ showInviteModal: show }),
    setViewProfileId: (id) => set({ viewProfileId: id }),
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => {
        const isNotActive = message.channelId !== state.activeChannelId;
        const nextUnread = { ...state.unreadChannels };
        if (isNotActive) {
            nextUnread[message.channelId] = (nextUnread[message.channelId] || 0) + 1;
        }
        return {
            messages: isNotActive ? state.messages : [...state.messages, message],
            unreadChannels: nextUnread
        };
    }),
    updateMessage: (message) => set((state) => ({
        messages: state.messages.map(m => m.id === message.id ? message : m)
    })),
    deleteMessage: (messageId) => set((state) => ({
        messages: state.messages.filter(m => m.id !== messageId)
    })),
    setActiveChannel: (channelId) => set((state) => {
        const nextUnread = { ...state.unreadChannels };
        delete nextUnread[channelId];
        return { activeChannelId: channelId, unreadChannels: nextUnread };
    }),
    setActiveWorkspace: (workspaceId) => set({ activeWorkspaceId: workspaceId }),
    setCurrentView: (view) => set({ currentView: view }),
    markAsRead: (channelId) => set((state) => {
        const nextUnread = { ...state.unreadChannels };
        delete nextUnread[channelId];
        return { unreadChannels: nextUnread };
    }),
    incrementUnread: (channelId) => set((state) => ({
        unreadChannels: {
            ...state.unreadChannels,
            [channelId]: (state.unreadChannels[channelId] || 0) + 1
        }
    })),
    updateUserProfiles: (data) => set((state) => ({
        messages: state.messages.map(m => m.senderId === data.userId ? {
            ...m,
            sender: {
                ...m.sender,
                ...(data.name ? { name: data.name } : {}),
                ...(data.avatar ? { avatar: data.avatar } : {})
            }
        } : m)
    })),
    callState: {
        isCalling: false,
        incomingCall: false,
        remoteUserId: null,
        callType: null,
        signalData: null
    },
    setCallState: (newState) => set((state) => ({
        callState: { ...state.callState, ...newState }
    }))
}));
