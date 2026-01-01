import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    status?: string | null;
    jobTitle?: string | null;
    bio?: string | null;
}

interface AuthState {
    user: User | null;
    token: string | null;
    _hasHydrated: boolean;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            _hasHydrated: false,
            setAuth: (user, token) => set({ user, token }),
            logout: () => set({ user: null, token: null }),
            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: "eurocom-auth",
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
