<template>
  <main class="page">
    <div class="page-header">
      <h1>Search & Query</h1>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'where' }" @click="tab = 'where'; reset()">Where preached?</button>
      <button class="tab" :class="{ active: tab === 'what' }" @click="tab = 'what'; reset()">Sermons at church</button>
      <button class="tab" :class="{ active: tab === 'new' }" @click="tab = 'new'; reset()">Never preached here</button>
    </div>

    <!-- WHERE DID I PREACH SERMON X -->
    <template v-if="tab === 'where'">
      <div class="form-group">
        <label>Select a Sermon</label>
        <select v-model="selectedSermonId" @change="runQuery">
          <option value="">— choose —</option>
          <option v-for="s in store.sermons" :key="s.id" :value="s.id">{{ s.title }}</option>
        </select>
      </div>
      <template v-if="selectedSermonId">
        <div class="query-label" v-if="results.length">
          "{{ sermonName(selectedSermonId) }}" has been preached at {{ results.length }} location{{ results.length !== 1 ? 's' : '' }}:
        </div>
        <div class="query-label" v-else>This sermon has not been preached anywhere yet.</div>
        <EventCard v-for="e in results" :key="e.id" :event="e" />
      </template>
    </template>

    <!-- WHAT SERMONS AT CHURCH Y -->
    <template v-if="tab === 'what'">
      <div class="form-group">
        <label>Select a Church</label>
        <select v-model="selectedChurchId" @change="runQuery">
          <option value="">— choose —</option>
          <option v-for="c in store.churches" :key="c.id" :value="c.id">{{ churchLabel(c) }}</option>
        </select>
      </div>
      <template v-if="selectedChurchId">
        <div class="query-label" v-if="results.length">
          {{ results.length }} sermon{{ results.length !== 1 ? 's' : '' }} preached at {{ churchName(selectedChurchId) }}:
        </div>
        <div class="query-label" v-else>No sermons have been logged at this church yet.</div>
        <EventCard v-for="e in results" :key="e.id" :event="e" />
      </template>
    </template>

    <!-- SERMONS NEVER PREACHED HERE -->
    <template v-if="tab === 'new'">
      <div class="form-group">
        <label>Select a Church</label>
        <select v-model="selectedChurchId" @change="runQuery">
          <option value="">— choose —</option>
          <option v-for="c in store.churches" :key="c.id" :value="c.id">{{ churchLabel(c) }}</option>
        </select>
      </div>
      <template v-if="selectedChurchId">
        <div class="query-label" v-if="freshSermons.length">
          {{ freshSermons.length }} sermon{{ freshSermons.length !== 1 ? 's' : '' }} never preached at {{ churchName(selectedChurchId) }}:
        </div>
        <div class="query-label" v-else>You've preached all your sermons at this church already!</div>
        <div v-for="s in freshSermons" :key="s.id" class="card">
          <div class="event-title">{{ s.title }}</div>
          <div v-if="s.description" style="font-size:0.82rem;color:var(--text-muted);margin-top:0.25rem">{{ s.description }}</div>
        </div>
      </template>
    </template>

    <div v-if="loading" class="empty-state">Loading...</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useStore, type SermonEvent, type Sermon, type Church } from '../stores/index';
import EventCard from '../components/EventCard.vue';

const store = useStore();

const tab = ref<'where' | 'what' | 'new'>('where');
const selectedSermonId = ref<number | ''>('');
const selectedChurchId = ref<number | ''>('');
const results = ref<SermonEvent[]>([]);
const freshSermons = ref<Sermon[]>([]);
const loading = ref(false);
const error = ref('');

function reset() {
  selectedSermonId.value = '';
  selectedChurchId.value = '';
  results.value = [];
  freshSermons.value = [];
  error.value = '';
}

function sermonName(id: number | '') {
  if (!id) return '';
  return store.sermons.find((s) => s.id === id)?.title ?? '';
}

function churchName(id: number | '') {
  if (!id) return '';
  const c = store.churches.find((c) => c.id === id);
  return c ? churchLabel(c) : '';
}

function churchLabel(c: Church) {
  const parts = [c.name];
  if (c.city) parts.push(c.city);
  if (c.state) parts.push(c.state);
  return parts.join(', ');
}

async function runQuery() {
  results.value = [];
  freshSermons.value = [];
  error.value = '';

  if (tab.value === 'where' && selectedSermonId.value) {
    loading.value = true;
    try {
      await store.fetchEvents({ sermon_id: selectedSermonId.value as number });
      results.value = store.events.filter((e) => e.sermon.id === selectedSermonId.value);
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  if (tab.value === 'what' && selectedChurchId.value) {
    loading.value = true;
    try {
      await store.fetchEvents({ church_id: selectedChurchId.value as number });
      results.value = store.events.filter((e) => e.church.id === selectedChurchId.value);
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  if (tab.value === 'new' && selectedChurchId.value) {
    loading.value = true;
    try {
      freshSermons.value = await store.fetchSermonsNotAtChurch(selectedChurchId.value as number);
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }
}
</script>
