<template>
  <main class="page">
    <div class="page-header">
      <h1>{{ editId ? 'Edit Entry' : 'Log a Sermon' }}</h1>
    </div>

    <transition name="fade">
      <div v-if="success" class="alert alert-success">Sermon logged successfully!</div>
    </transition>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div class="card">
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Date (Sabbath)</label>
          <input type="date" v-model="form.date" required />
        </div>

        <div class="form-group">
          <label>Sermon</label>
          <div style="display:flex;gap:0.5rem">
            <select v-model="form.sermonId" required style="flex:1">
              <option value="" disabled>Select sermon...</option>
              <option v-for="s in store.sermons" :key="s.id" :value="s.id">{{ s.title }}</option>
            </select>
            <button type="button" class="btn btn-secondary" @click="showNewSermon = !showNewSermon" style="white-space:nowrap;padding:0.65rem 0.85rem">
              + New
            </button>
          </div>
          <div v-if="showNewSermon" class="inline-form" style="margin-top:0.5rem">
            <div class="form-group" style="margin-bottom:0.5rem">
              <input type="text" v-model="newSermonTitle" placeholder="Sermon title" />
            </div>
            <button type="button" class="btn btn-primary" @click="addSermon" :disabled="!newSermonTitle.trim()">Add Sermon</button>
          </div>
        </div>

        <div class="form-group">
          <label>Church</label>
          <div style="display:flex;gap:0.5rem">
            <select v-model="form.churchId" required style="flex:1">
              <option value="" disabled>Select church...</option>
              <option v-for="c in store.churches" :key="c.id" :value="c.id">{{ churchLabel(c) }}</option>
            </select>
            <button type="button" class="btn btn-secondary" @click="showNewChurch = !showNewChurch" style="white-space:nowrap;padding:0.65rem 0.85rem">
              + New
            </button>
          </div>
          <div v-if="showNewChurch" class="inline-form" style="margin-top:0.5rem">
            <div class="form-group" style="margin-bottom:0.5rem">
              <input type="text" v-model="newChurchName" placeholder="Church name" />
            </div>
            <div class="form-row" style="margin-bottom:0.5rem">
              <input type="text" v-model="newChurchCity" placeholder="City" />
              <input type="text" v-model="newChurchState" placeholder="State/Province" />
            </div>
            <button type="button" class="btn btn-primary" @click="addChurch" :disabled="!newChurchName.trim()">Add Church</button>
          </div>
        </div>

        <div class="form-group">
          <label>Scripture Reading</label>
          <input type="text" v-model="form.scriptureReading" placeholder="e.g. Isaiah 40:28-31" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          <div class="form-group">
            <label>Opening Hymn #</label>
            <input type="text" v-model="form.openingHymn" placeholder="e.g. 100" />
          </div>
          <div class="form-group">
            <label>Closing Hymn #</label>
            <input type="text" v-model="form.closingHymn" placeholder="e.g. 462" />
          </div>
        </div>

        <div class="form-group">
          <label>Notes (optional)</label>
          <textarea v-model="form.notes" placeholder="Any notes about this service..."></textarea>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="saving">
          <span v-if="saving" class="spinner"></span>
          {{ editId ? 'Update Entry' : 'Log Sermon' }}
        </button>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useStore, type Church } from '../stores/index';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();

const editId = ref<number | null>(null);
const saving = ref(false);
const success = ref(false);
const error = ref('');

const showNewSermon = ref(false);
const newSermonTitle = ref('');
const showNewChurch = ref(false);
const newChurchName = ref('');
const newChurchCity = ref('');
const newChurchState = ref('');

function todaySabbath() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 6 ? 0 : day === 0 ? -1 : 6 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

const form = reactive({
  date: todaySabbath(),
  sermonId: '' as number | '',
  churchId: '' as number | '',
  scriptureReading: '',
  openingHymn: '',
  closingHymn: '',
  notes: '',
});

function churchLabel(c: Church) {
  const parts = [c.name];
  if (c.city) parts.push(c.city);
  if (c.state) parts.push(c.state);
  return parts.join(', ');
}

async function addSermon() {
  if (!newSermonTitle.value.trim()) return;
  const s = await store.addSermon({ title: newSermonTitle.value.trim(), description: null });
  form.sermonId = s.id;
  newSermonTitle.value = '';
  showNewSermon.value = false;
}

async function addChurch() {
  if (!newChurchName.value.trim()) return;
  const c = await store.addChurch({
    name: newChurchName.value.trim(),
    city: newChurchCity.value.trim() || null,
    state: newChurchState.value.trim() || null,
    country: null,
  });
  form.churchId = c.id;
  newChurchName.value = '';
  newChurchCity.value = '';
  newChurchState.value = '';
  showNewChurch.value = false;
}

async function submit() {
  if (!form.sermonId || !form.churchId) return;
  saving.value = true;
  error.value = '';
  try {
    await store.logEvent({
      sermonId: form.sermonId as number,
      churchId: form.churchId as number,
      date: form.date,
      scriptureReading: form.scriptureReading || undefined,
      openingHymn: form.openingHymn || undefined,
      closingHymn: form.closingHymn || undefined,
      notes: form.notes || undefined,
    });
    success.value = true;
    // Reset form
    form.sermonId = '';
    form.churchId = '';
    form.scriptureReading = '';
    form.openingHymn = '';
    form.closingHymn = '';
    form.notes = '';
    form.date = todaySabbath();
    setTimeout(() => {
      success.value = false;
      router.push('/history');
    }, 1200);
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>
