"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────

interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  body: string;
  timestamp: number;
}

const QUEUE_KEY = "miamweek_offline_queue";

// ── Queue persistence ────────────────────────────────────────────────

function getQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedMutation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function addToQueue(mutation: Omit<QueuedMutation, "id" | "timestamp">) {
  const queue = getQueue();
  queue.push({
    ...mutation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  });
  saveQueue(queue);
}

function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

// ── Replay logic ─────────────────────────────────────────────────────

async function replayQueue(): Promise<{ success: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  console.log(`[OfflineSync] Replaying ${queue.length} queued mutations...`);

  let success = 0;
  let failed = 0;
  const remaining: QueuedMutation[] = [];

  for (const mutation of queue) {
    try {
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers: { "Content-Type": "application/json" },
        body: mutation.body,
      });
      if (res.ok) {
        success++;
      } else {
        // Server rejected it (e.g. item already deleted) - drop it
        console.warn(`[OfflineSync] Server rejected mutation: ${res.status}`);
        success++;
      }
    } catch {
      // Still offline or network error - keep in queue
      remaining.push(mutation);
      failed++;
    }
  }

  saveQueue(remaining);
  console.log(`[OfflineSync] Replayed: ${success} ok, ${failed} still queued`);
  return { success, failed };
}

// ── Offline-aware fetch wrapper ──────────────────────────────────────

export async function offlineFetch(
  url: string,
  options: RequestInit & { offlineOptimistic?: boolean } = {}
): Promise<Response | null> {
  const { offlineOptimistic, ...fetchOptions } = options;

  try {
    const res = await fetch(url, fetchOptions);
    return res;
  } catch {
    // Network error - we're offline
    if (
      fetchOptions.method &&
      ["POST", "PUT", "DELETE"].includes(fetchOptions.method)
    ) {
      // Queue mutation for replay
      addToQueue({
        url,
        method: fetchOptions.method,
        body: (fetchOptions.body as string) || "{}",
      });
      console.log(`[OfflineSync] Queued ${fetchOptions.method} ${url}`);
    }

    if (offlineOptimistic) {
      // Return a fake OK response so optimistic UI can proceed
      return new Response(JSON.stringify({ queued: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return null;
  }
}

// ── React hook ───────────────────────────────────────────────────────

export function useOfflineSync(onReconnect: () => void) {
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  const updateQueueSize = useCallback(() => {
    setQueueSize(getQueue().length);
  }, []);

  useEffect(() => {
    // Init
    setIsOnline(navigator.onLine);
    updateQueueSize();

    const handleOnline = async () => {
      console.log("[OfflineSync] Back online - replaying queue...");
      setIsOnline(true);

      // Replay queued mutations
      const result = await replayQueue();
      updateQueueSize();

      // Refresh data from server
      if (result.success > 0) {
        // Small delay to let server process
        setTimeout(() => {
          onReconnectRef.current();
        }, 500);
      } else {
        onReconnectRef.current();
      }
    };

    const handleOffline = () => {
      console.log("[OfflineSync] Gone offline");
      setIsOnline(false);
    };

    // Also check periodically if queue has items (in case mutations were added)
    const queueCheck = setInterval(updateQueueSize, 2000);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(queueCheck);
    };
  }, [updateQueueSize]);

  // Manual sync trigger
  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return;
    const result = await replayQueue();
    updateQueueSize();
    if (result.success > 0) {
      onReconnectRef.current();
    }
  }, [updateQueueSize]);

  return { isOnline, queueSize, syncNow, clearQueue };
}
