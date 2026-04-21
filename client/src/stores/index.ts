import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Church {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface Sermon {
  id: number;
  title: string;
  description: string | null;
}

export interface SermonEvent {
  id: number;
  date: string;
  scriptureReading: string | null;
  openingHymn: string | null;
  closingHymn: string | null;
  notes: string | null;
  sermon: Sermon;
  church: Church;
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const useStore = defineStore('main', () => {
  const churches = ref<Church[]>([]);
  const sermons = ref<Sermon[]>([]);
  const events = ref<SermonEvent[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchChurches() {
    churches.value = await api<Church[]>('/churches');
  }

  async function fetchSermons() {
    sermons.value = await api<Sermon[]>('/sermons');
  }

  async function fetchEvents(params?: { sermon_id?: number; church_id?: number }) {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    events.value = await api<SermonEvent[]>(`/events${qs}`);
  }

  async function addChurch(data: Omit<Church, 'id'>) {
    const row = await api<Church>('/churches', { method: 'POST', body: JSON.stringify(data) });
    churches.value.push(row);
    return row;
  }

  async function updateChurch(id: number, data: Partial<Omit<Church, 'id'>>) {
    const row = await api<Church>(`/churches/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    const idx = churches.value.findIndex((c) => c.id === id);
    if (idx !== -1) churches.value[idx] = row;
    return row;
  }

  async function deleteChurch(id: number) {
    await api(`/churches/${id}`, { method: 'DELETE' });
    churches.value = churches.value.filter((c) => c.id !== id);
  }

  async function addSermon(data: Omit<Sermon, 'id'>) {
    const row = await api<Sermon>('/sermons', { method: 'POST', body: JSON.stringify(data) });
    sermons.value.push(row);
    return row;
  }

  async function updateSermon(id: number, data: Partial<Omit<Sermon, 'id'>>) {
    const row = await api<Sermon>(`/sermons/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    const idx = sermons.value.findIndex((s) => s.id === id);
    if (idx !== -1) sermons.value[idx] = row;
    return row;
  }

  async function deleteSermon(id: number) {
    await api(`/sermons/${id}`, { method: 'DELETE' });
    sermons.value = sermons.value.filter((s) => s.id !== id);
  }

  async function logEvent(data: {
    sermonId: number;
    churchId: number;
    date: string;
    scriptureReading?: string;
    openingHymn?: string;
    closingHymn?: string;
    notes?: string;
  }) {
    const row = await api<SermonEvent>('/events', { method: 'POST', body: JSON.stringify(data) });
    events.value.unshift(row);
    return row;
  }

  async function updateEvent(id: number, data: Partial<Parameters<typeof logEvent>[0]>) {
    const row = await api<SermonEvent>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    const idx = events.value.findIndex((e) => e.id === id);
    if (idx !== -1) events.value[idx] = row;
    return row;
  }

  async function deleteEvent(id: number) {
    await api(`/events/${id}`, { method: 'DELETE' });
    events.value = events.value.filter((e) => e.id !== id);
  }

  async function fetchSermonsNotAtChurch(churchId: number) {
    return api<Sermon[]>(`/sermons/not-at-church/${churchId}`);
  }

  async function init() {
    loading.value = true;
    error.value = null;
    try {
      await Promise.all([fetchChurches(), fetchSermons(), fetchEvents()]);
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  return {
    churches, sermons, events, loading, error,
    fetchChurches, fetchSermons, fetchEvents,
    addChurch, updateChurch, deleteChurch,
    addSermon, updateSermon, deleteSermon,
    logEvent, updateEvent, deleteEvent,
    fetchSermonsNotAtChurch,
    init,
  };
});
