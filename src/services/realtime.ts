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

export const DEFAULT_SOS_SIGNALS: SosSignal[] = [
  {
    id: 101,
    name: 'Priya & Child (Node #4)',
    condition: 'Trapped under debris',
    battery: 18,
    lat: 10.0534,
    lng: 76.6272,
    priority: 85.0,
    time: '11:24:10 AM',
    status: 'active',
    notes: 'Collapsed masonry on ground floor. Requires heavy extraction gear.',
    meshHops: 3,
  },
  {
    id: 102,
    name: 'Elderly Resident (Node #7)',
    condition: 'Medical Emergency',
    battery: 34,
    lat: 10.0612,
    lng: 76.6198,
    priority: 78.5,
    time: '11:29:45 AM',
    status: 'active',
    notes: 'Severe asthma, inhaler lost during flood surge. Oxygen needed.',
    meshHops: 2,
  },
  {
    id: 103,
    name: 'Family of 3 (Node #2)',
    condition: 'Cut off by floodwater',
    battery: 72,
    lat: 10.0451,
    lng: 76.6385,
    priority: 62.0,
    time: '11:32:02 AM',
    status: 'assigned',
    notes: 'Rooftop refuge, water level 1.8m and rising slowly. Inflatable raft en route.',
    meshHops: 1,
  },
  {
    id: 104,
    name: 'Forestry Ranger Office',
    condition: 'Trapped in a fire',
    battery: 22,
    lat: 10.0589,
    lng: 76.6341,
    priority: 88.4,
    time: '11:35:18 AM',
    status: 'active',
    notes: 'Brushfire encroaching north boundary perimeter. Rapid evacuation required.',
    meshHops: 4,
  },
];

export const DEFAULT_ADVISORIES: EmergencyAdvisory[] = [
  {
    id: 'adv-1',
    title: 'Flash Flood Evacuation Notice',
    message: 'River Basin water levels exceeding danger threshold. All ground floor occupants move to higher designated sectors immediately.',
    level: 'CRITICAL',
    issuedAt: 'Just Now',
    issuedBy: 'EOC Command Post',
  },
  {
    id: 'adv-2',
    title: 'North Ridge Highway Impassable',
    message: 'Mudslide debris on primary corridor. Reroute through Eastern Foothills bypass (Bearing 065°).',
    level: 'WARNING',
    issuedAt: '25m ago',
    issuedBy: 'Highway Patrol Sector 4',
  }
];

const SIGNALS_STORAGE_KEY = 'rescunet_live_sos_signals_store_v2';
const ADVISORIES_STORAGE_KEY = 'rescunet_live_advisories_store_v2';

export function calculatePriorityScore(condition: string, battery: number = 85): number {
  const severityWeights: Record<string, number> = {
    'Trapped under debris': 55.0,
    'Medical Emergency': 48.0,
    'Severe Medical Danger': 48.0,
    'Trapped in a fire': 42.0,
    'Fire / Heavy Smoke': 42.0,
    'Trapped in a Fire': 42.0,
    'Cut off by floodwater': 35.0,
    'Rising Floodwater': 35.0,
    'Structural Collapse Risk': 45.0,
    'Other Life Threat': 45.0,
    'Gas Leak': 40.0,
  };
  const baseScore = severityWeights[condition] || 30.0;
  const clampedBattery = Math.max(0, Math.min(100, Number(battery) || 85));
  const batteryScore = (100 - clampedBattery) * 0.3;
  return Math.round((baseScore + batteryScore) * 100) / 100;
}

export function getLocalSignals(): SosSignal[] {
  if (typeof window === 'undefined') return DEFAULT_SOS_SIGNALS;
  try {
    const raw = localStorage.getItem(SIGNALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse local signals:', err);
  }
  // Initialize with defaults if empty
  try {
    localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(DEFAULT_SOS_SIGNALS));
  } catch {}
  return DEFAULT_SOS_SIGNALS;
}

export function saveLocalSignals(signals: SosSignal[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(signals));
  } catch (err) {
    console.warn('Failed to persist signals to localStorage:', err);
  }
}

export function resetLocalSignals(): SosSignal[] {
  if (typeof window === 'undefined') return DEFAULT_SOS_SIGNALS;
  try {
    localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(DEFAULT_SOS_SIGNALS));
    localStorage.removeItem('rescunet_active_sos_signal');
  } catch {}
  realtime.broadcast({
    event: 'reset-signals',
    payload: DEFAULT_SOS_SIGNALS,
  });
  return DEFAULT_SOS_SIGNALS;
}

export function getLocalAdvisories(): EmergencyAdvisory[] {
  if (typeof window === 'undefined') return DEFAULT_ADVISORIES;
  try {
    const raw = localStorage.getItem(ADVISORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  try {
    localStorage.setItem(ADVISORIES_STORAGE_KEY, JSON.stringify(DEFAULT_ADVISORIES));
  } catch {}
  return DEFAULT_ADVISORIES;
}

export function saveLocalAdvisories(advisories: EmergencyAdvisory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADVISORIES_STORAGE_KEY, JSON.stringify(advisories));
  } catch {}
}

class RealtimeService {
  private listeners: Set<RealtimeCallback> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private pollInterval: any = null;

  constructor() {
    this.initBroadcastChannel();
    this.initStorageEventListener();
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

  private initStorageEventListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', (event) => {
      if (event.key === SIGNALS_STORAGE_KEY && event.newValue) {
        try {
          const updated = JSON.parse(event.newValue);
          if (Array.isArray(updated)) {
            this.notifyListeners({
              event: 'reset-signals',
              payload: updated,
              timestamp: new Date().toISOString(),
            });
          }
        } catch {}
      } else if (event.key === ADVISORIES_STORAGE_KEY && event.newValue) {
        try {
          const updated = JSON.parse(event.newValue);
          if (Array.isArray(updated) && updated[0]) {
            this.notifyListeners({
              event: 'new-advisory',
              payload: updated[0],
              timestamp: new Date().toISOString(),
            });
          }
        } catch {}
      }
    });
  }

  private initSSE() {
    if (typeof window === 'undefined' || !('EventSource' in window)) return;

    try {
      this.eventSource = new EventSource('/api/events');

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.event) {
            if (data.event === 'new-sos' && data.payload) {
              const current = getLocalSignals();
              if (!current.some((s) => s.id === data.payload.id)) {
                saveLocalSignals([data.payload, ...current]);
              }
            } else if (data.event === 'status-change' && data.payload) {
              const current = getLocalSignals();
              saveLocalSignals(
                current.map((s) => (s.id === data.payload.id ? data.payload : s))
              );
            }
            this.notifyListeners(data);
          }
        } catch {
          // Heartbeat or malformed frame
        }
      };

      this.eventSource.onerror = () => {
        // Automatically retries if server goes down or static host
      };
    } catch (err) {
      console.warn('SSE connection unavailable, using local mesh & broadcast:', err);
    }
  }

  private initFallbackPolling() {
    if (typeof window === 'undefined') return;
    this.pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/sos');
        if (res.ok) {
          const signals = await res.json();
          if (Array.isArray(signals) && signals.length > 0) {
            saveLocalSignals(signals);
            this.notifyListeners({
              event: 'reset-signals',
              payload: signals,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch {
        // Offline mode or static Cloudflare Pages, continue silently
      }
    }, 5000);
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

    // Notify other open tabs/windows
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

// REST & Local Store Helpers
export async function getSosSignals(): Promise<SosSignal[]> {
  const local = getLocalSignals();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/api/sos', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const serverSignals = await res.json();
      if (Array.isArray(serverSignals) && serverSignals.length > 0) {
        const serverIds = new Set(serverSignals.map((s: SosSignal) => s.id));
        const localOnly = local.filter((s) => !serverIds.has(s.id));
        const merged = [...localOnly, ...serverSignals].sort((a, b) => b.priority - a.priority);
        saveLocalSignals(merged);
        return merged;
      }
    }
  } catch {
    // Cloudflare Pages static deploy or offline mode: return local persistent mesh store
  }

  return local;
}

export async function submitSosSignal(payload: Partial<SosSignal>): Promise<SosSignal> {
  const signalId = Date.now();
  const safeCondition = payload.condition || 'Trapped under debris';
  const safeBattery = typeof payload.battery === 'number' ? payload.battery : 85;
  const priority = payload.priority || calculatePriorityScore(safeCondition, safeBattery);

  const newSignal: SosSignal = {
    id: payload.id || signalId,
    name: payload.name && payload.name.trim() ? payload.name.trim() : 'Survivor in Distress',
    condition: safeCondition,
    battery: safeBattery,
    lat: typeof payload.lat === 'number' && !Number.isNaN(payload.lat) ? payload.lat : 10.0534,
    lng: typeof payload.lng === 'number' && !Number.isNaN(payload.lng) ? payload.lng : 76.6272,
    priority,
    time: payload.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    status: payload.status || 'active',
    notes: payload.notes || 'Immediate emergency assistance required.',
    meshHops: payload.meshHops || 1,
  };

  // 1. Immediately store in local database (guaranteed persistence)
  const current = getLocalSignals();
  const exists = current.some((s) => s.id === newSignal.id);
  const updated = exists
    ? current.map((s) => (s.id === newSignal.id ? newSignal : s))
    : [newSignal, ...current].sort((a, b) => b.priority - a.priority);

  saveLocalSignals(updated);

  // 2. Broadcast immediately to all open tabs / portals
  realtime.broadcast({
    event: 'new-sos',
    payload: newSignal,
  });

  // 3. Fire-and-forget sync to backend if server exists
  try {
    fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSignal),
    }).catch(() => {});
  } catch {}

  return newSignal;
}

export async function patchSosStatus(
  id: number,
  status: 'active' | 'assigned' | 'rescued',
  notes?: string
): Promise<SosSignal> {
  const current = getLocalSignals();
  let updatedSignal: SosSignal | null = null;

  const updatedList = current.map((sig) => {
    if (sig.id === id) {
      updatedSignal = {
        ...sig,
        status,
        notes: notes !== undefined ? notes : sig.notes,
      };
      return updatedSignal;
    }
    return sig;
  });

  if (updatedSignal) {
    saveLocalSignals(updatedList);

    // If active signal in localStorage matches this ID, update it too
    try {
      const activeRaw = localStorage.getItem('rescunet_active_sos_signal');
      if (activeRaw) {
        const active = JSON.parse(activeRaw);
        if (active && active.id === id) {
          localStorage.setItem('rescunet_active_sos_signal', JSON.stringify(updatedSignal));
        }
      }
    } catch {}

    realtime.broadcast({
      event: 'status-change',
      payload: updatedSignal,
    });
  }

  // Attempt backend patch
  try {
    fetch(`/api/sos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    }).catch(() => {});
  } catch {}

  return (
    updatedSignal || {
      id,
      name: 'Beacon',
      condition: 'Emergency',
      battery: 50,
      lat: 10.0534,
      lng: 76.6272,
      priority: 50,
      time: 'Now',
      status,
      notes,
    }
  );
}

export async function deleteSosSignal(id: number): Promise<void> {
  const current = getLocalSignals();
  const filtered = current.filter((s) => s.id !== id);
  saveLocalSignals(filtered);

  realtime.broadcast({
    event: 'delete-sos',
    payload: { id },
  });

  try {
    fetch(`/api/sos/${id}`, { method: 'DELETE' }).catch(() => {});
  } catch {}
}

export async function getEmergencyAdvisories(): Promise<EmergencyAdvisory[]> {
  const local = getLocalAdvisories();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/api/advisories', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const serverAdv = await res.json();
      if (Array.isArray(serverAdv) && serverAdv.length > 0) {
        saveLocalAdvisories(serverAdv);
        return serverAdv;
      }
    }
  } catch {}
  return local;
}

export async function publishEmergencyAdvisory(advisory: {
  title: string;
  message: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
}): Promise<EmergencyAdvisory> {
  const newAdv: EmergencyAdvisory = {
    id: `adv-${Date.now()}`,
    title: advisory.title,
    message: advisory.message,
    level: advisory.level,
    issuedAt: 'Just Now',
    issuedBy: 'EOC Command Post',
  };

  const current = getLocalAdvisories();
  const updated = [newAdv, ...current];
  saveLocalAdvisories(updated);

  realtime.broadcast({
    event: 'new-advisory',
    payload: newAdv,
  });

  try {
    fetch('/api/advisories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advisory),
    }).catch(() => {});
  } catch {}

  return newAdv;
}

