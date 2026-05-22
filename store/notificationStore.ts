import { create } from "zustand";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/api/notifications?limit=50`, {
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-request-from": "client" },
      });
      if (res.ok) {
        const data = await res.json();
        set({
          notifications: data.data?.notifications || [],
          unreadCount: data.data?.unread || 0,
          total: data.data?.total || 0,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-request-from": "client" },
      });
      if (res.ok) {
        const data = await res.json();
        set({ unreadCount: data.data?.unread || 0 });
      }
    } catch {
      // ignore
    }
  },

  markRead: async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-request-from": "client" },
      });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // ignore
    }
  },

  markAllRead: async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-request-from": "client" },
      });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch {
      // ignore
    }
  },
}));
