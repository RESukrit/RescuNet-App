// Cloudflare Pages Function for /api/sos
// Runs on Cloudflare's global edge network (v8 workers runtime)

interface SosRecord {
  id: number;
  name: string;
  condition: string;
  battery: number;
  lat: number;
  lng: number;
  priority: number;
  time: string;
  status: string;
  notes?: string;
  meshHops?: number;
}

const DEFAULT_SIGNALS: SosRecord[] = [
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

// In-memory array per edge isolate
let edgeSignals: SosRecord[] = [...DEFAULT_SIGNALS];

export async function onRequestGet() {
  return new Response(JSON.stringify(edgeSignals), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPost(context: any) {
  try {
    const data: any = await context.request.json();
    const newBeacon: SosRecord = {
      id: data.id || Date.now(),
      name: data.name ? String(data.name).trim() : 'Survivor in Distress',
      condition: data.condition || 'Medical Emergency',
      battery: typeof data.battery === 'number' ? data.battery : 85,
      lat: typeof data.lat === 'number' ? data.lat : 10.0534,
      lng: typeof data.lng === 'number' ? data.lng : 76.6272,
      priority: typeof data.priority === 'number' ? data.priority : 75,
      time: data.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: data.status || 'active',
      notes: data.notes || '',
      meshHops: data.meshHops || 1,
    };

    edgeSignals = [newBeacon, ...edgeSignals.filter((s) => s.id !== newBeacon.id)];

    return new Response(JSON.stringify({ status: 'success', data: newBeacon }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Invalid JSON' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
