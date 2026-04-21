<template>
  <main class="page">
    <div class="page-header">
      <h1>History</h1>
    </div>

    <div class="search-bar">
      <span class="search-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>
      <input type="search" v-model="filter" placeholder="Filter by sermon or church..." />
    </div>

    <div v-if="store.loading" class="empty-state">Loading...</div>
    <template v-else>
      <div v-if="filtered.length === 0" class="empty-state">
        <div class="empty-icon">&#128214;</div>
        <p>{{ filter ? 'No matching entries.' : 'No sermons logged yet.' }}</p>
      </div>

      <EventCard
        v-for="event in filtered"
        :key="event.id"
        :event="event"
        :show-actions="true"
        @edit="startEdit"
        @delete="confirmDelete"
      />
    </template>

    <!-- Edit modal overlay -->
    <div v-if="editing" class="modal-overlay" @click.self="editing = null">
      <div class="modal-card">
        <h2 style="margin-bottom:1rem">Edit Entry</h2>
        <div class="form-group">
          <label>Date</label>
          <input type="date" v-model="editForm.date" />
        </div>
        <div class="form-group">
          <label>Sermon</label>
          <select v-model="editForm.sermonId">
            <option v-for="s in store.sermons" :key="s.id" :value="s.id">{{ s.title }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Church</label>
          <select v-model="editForm.churchId">
            <option v-for="c in store.churches" :key="c.id" :value="c.id">{{ churchLabel(c) }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Scripture Reading</label>
          <input type="text" v-model="editForm.scriptureReading" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          <div class="form-group">
            <label>Opening Hymn #</label>
            <input type="text" v-model="editForm.openingHymn" />
          </div>
          <div class="form-group">
            <label>Closing Hymn #</label>
            <input type="text" v-model="editForm.closingHymn" />
          </div>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea v-model="editForm.notes"></textarea>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-primary" @click="saveEdit" :disabled="saving">
            <span v-if="saving" class="spinner"></span>Save
          </button>
          <button class="btn btn-secondary" @click="editing = null">Cancel</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useStore, type SermonEvent, type Church } from '../stores/index';
import EventCard from '../components/EventCard.vue';

const store = useStore();
const filter = ref('');
const editing = ref<SermonEvent | null>(null);
const saving = ref(false);

const editForm = reactive({
  date: '',
  sermonId: 0,
  churchId: 0,
  scriptureReading: '',
  openingHymn: '',
  closingHymn: '',
  notes: '',
});

const filtered = computed(() => {
  const q = filter.value.toLowerCase().trim();
  if (!q) return store.events;
  return store.events.filter(
    (e) =>
      e.sermon.title.toLowerCase().includes(q) ||
      e.church.name.toLowerCase().includes(q) ||
      (e.church.city ?? '').toLowerCase().includes(q) ||
      (e.scriptureReading ?? '').toLowerCase().includes(q),
  );
});

function churchLabel(c: Church) {
  const parts = [c.name];
  if (c.city) parts.push(c.city);
  if (c.state) parts.push(c.state);
  return parts.join(', ');
}

function startEdit(event: SermonEvent) {
  editing.value = event;
  Object.assign(editForm, {
    date: event.date,
    sermonId: event.sermon.id,
    churchId: event.church.id,
    scriptureReading: event.scriptureReading ?? '',
    openingHymn: event.openingHymn ?? '',
    closingHymn: event.closingHymn ?? '',
    notes: event.notes ?? '',
  });
}

async function saveEdit() {
  if (!editing.value) return;
  saving.value = true;
  try {
    await store.updateEvent(editing.value.id, {
      date: editForm.date,
      sermonId: editForm.sermonId,
      churchId: editForm.churchId,
      scriptureReading: editForm.scriptureReading || undefined,
      openingHymn: editForm.openingHymn || undefined,
      closingHymn: editForm.closingHymn || undefined,
      notes: editForm.notes || undefined,
    });
    editing.value = null;
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(id: number) {
  if (!confirm('Delete this sermon entry?')) return;
  await store.deleteEvent(id);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  padding: 1rem;
}

.modal-card {
  background: var(--surface);
  border-radius: 16px 16px 0 0;
  padding: 1.5rem 1rem 2rem;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  max-height: 90vh;
  overflow-y: auto;
}
</style>
