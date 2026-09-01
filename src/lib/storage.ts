import { scriptDataSchema } from "@/lib/schemas";
import { z } from "zod";

export interface HistoryItem {
  id: string;
  createdAt: string;
  topic: string;
  targetAudience?: string;
  platform?: string;
  tone?: string;
  script: z.infer<typeof scriptDataSchema>;
}
  
  const STORAGE_KEY = "shortscheat_history_v1";
  
  export const getHistory = (): HistoryItem[] => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
      return [];
    }
  };
  
  export const saveHistoryItem = (item: Omit<HistoryItem, "id" | "createdAt">): HistoryItem[] => {
    if (typeof window === "undefined") return [];
    const current = getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    
    const updated = [newItem, ...current].slice(0, 10);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
    return updated;
  };
  
  export const deleteHistoryItem = (id: string): HistoryItem[] => {
    if (typeof window === "undefined") return [];
    const current = getHistory();
    const updated = current.filter((item) => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to delete history item", error);
    }
    return updated;
  };