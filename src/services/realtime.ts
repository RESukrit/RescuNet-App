import { SosSignal } from '../types';

export interface EmergencyAdvisory {
  id: string;
  title: string;
  message: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  issuedAt: string;
  issuedBy: string;
}

export type RealtimeEventType = 
  | 'new-sos'
  | 'status-change'
  | 'delete-sos'
  | 'reset-signals'
  | 'new-advisory'
  | 'connected';

export interface RealtimeMessage {
  event: RealtimeEventType;
  payload: any;
  timestamp?: string;
}

type RealtimeCallback = (msg: RealtimeMessage) => void;

class RealtimeService {
  private listeners: Set<RealtimeCallback> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private pollInterval: any = null;
  private isConnected: boolean = false;

  constructor() {
    this.initBroadcastChannel();
    this.initSSE();
    this.initFallbackPolling();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('rescunet_live_mesh');
        this.broadcastChannel.onmessage = (ev) => {
          if (ev && ev.data) {
            this.notifyListeners(ev.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported in this frame:', err);
      }
    }
  }

  private initSSE() {
    if (typeof window === 'undefined' || !('EventSource' in window)) return;

    try {
      this.eventSource = new EventSource('/api/events');

      this.eventSource.onopen = () => {
        this.isConnected = true;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.event) {
            this.notifyListeners(data);
          }
        } catch {
          // Heartbeat or malformed frame
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        // EventSource will automatically retry connecting
      };
    } catch (err) {
      console.warn('SSE connection failed, relying on cross-tab & polling:', err);
    }
  }

  private initFallbackPolling() {
    // Light background poll every 4 seconds as redundant backup
    if (typeof window === 'undefined') return;
    this.pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/sos');
        if (res.ok) {
          const signals = await res.json();
          this.notifyListeners({
            event: 'reset-signals',
            payload: signals,
            timestamp: new Date().toISOString(),
          });
        }
      } catch {
        // Offline mode, continue silently
      }
    }, 4000);
  }

  public subscribe(callback: RealtimeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public broadcast(msg: RealtimeMessage) {
    // Notify local listeners
    this.notifyListeners(msg);

    // Notify other open tabs/windows (User Portal vs Admin Portal)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch {
        // channel error
      }
    }
  }

  private notifyListeners(msg: RealtimeMessage) {
    this.listeners.forEach((cb) => {
      try {
        cb(msg);
      } catch (e) {
        console.warn('Error in realtime listener:', e);
      }
    });
  }

  public destroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.eventSource) this.eventSource.close();
    if (this.broadcastChannel) this.broadcastChannel.close();
    this.listeners.clear();
  }
}

export const realtime = new RealtimeService();

// REST Helpers
export async function getSosSignals(): Promise<SosSignal[]> {
  try {
    const res = await fetch('/api/sos');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Return cached from localStorage or default
    return [];
  }
}

export async function submitSosSignal(payload: Partial<SosSignal>): Promise<SosSignal> {
  const res = await fetch('/api/sos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const result = await res.json();
  
  // Instant cross-tab broadcast
  realtime.broadcast({
    event: 'new-sos',
    payload: result.data,
  });

  return result.data;
}

export async function patchSosStatus(
  id: number,
  status: 'active' | 'assigned' | 'rescued',
  notes?: string
): Promise<SosSignal> {
  const res = await fetch(`/api/sos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const result = await res.json();

  realtime.broadcast({
    event: 'status-change',
    payload: result.data,
  });

  return result.data;
}

export async function deleteSosSignal(id: number): Promise<void> {
  const res = await fetch(`/api/sos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  realtime.broadcast({
    event: 'delete-sos',
    payload: { id },
  });
}

export async function getEmergencyAdvisories(): Promise<EmergencyAdvisory[]> {
  try {
    const res = await fetch('/api/advisories');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return [
      {
        id: 'adv-fallback',
        title: 'Disaster Area Active Advisory',
        message: 'Cell towers offline. Maintain battery conservation mode and transmit location pings every 30 minutes.',
        level: 'WARNING',
        issuedAt: 'Ongoing',
        issuedBy: 'EOC Command Post',
      },
    ];
  }
}

export async function publishEmergencyAdvisory(advisory: {
  title: string;
  message: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
}): Promise<EmergencyAdvisory> {
  const res = await fetch('/api/advisories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(advisory),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const result = await res.json();

  realtime.broadcast({
    event: 'new-advisory',
    payload: result.data,
  });

  return result.data;
}
