import { useAuthStore } from "@/store/useAuthStore";

const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname !== "localhost" && hostname !== "127.0.0.1") {
            return `http://${hostname}:3005`;
        }
    }
    return "http://localhost:3005";
};

const API_URL = `${getBaseUrl()}/api`;
const DEFAULT_TIMEOUT = 10000; // 10 seconds

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = useAuthStore.getState().token;
    const headers = new Headers(options.headers);

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (options.body && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers,
            signal: controller.signal,
        });

        clearTimeout(id);

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                useAuthStore.getState().logout();
                throw new Error("Session expired. Please login again.");
            }

            let errorMessage = "Request failed";
            try {
                const error = await response.json();
                errorMessage = error.message || errorMessage;
            } catch {
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === "AbortError") {
            throw new Error("Request timed out. Please check your connection.");
        }
        throw error;
    }
}

export const api = {
    get: <T>(path: string) => request<T>(path, { method: "GET" }),
    post: <T>(path: string, body: any) => request<T>(path, {
        method: "POST",
        body: body instanceof FormData ? body : JSON.stringify(body)
    }),
    put: <T>(path: string, body: any) => request<T>(path, {
        method: "PUT",
        body: body instanceof FormData ? body : JSON.stringify(body)
    }),
    patch: <T>(path: string, body: any) => request<T>(path, {
        method: "PATCH",
        body: body instanceof FormData ? body : JSON.stringify(body)
    }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
