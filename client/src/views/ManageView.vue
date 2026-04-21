<template>
  <main class="page">
    <div class="page-header">
      <h1>Manage</h1>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'churches' }" @click="tab = 'churches'">Churches</button>
      <button class="tab" :class="{ active: tab === 'sermons' }" @click="tab = 'sermons'">Sermons</button>
    </div>

    <!-- CHURCHES TAB -->
    <template v-if="tab === 'churches'">
      <div class="inline-form">
        <h3 style="margin-bottom:0.75rem">{{ editingChurch ? 'Edit Church' : 'Add Church' }}</h3>
        <div class="form-group">
          <label>Name</label>
          <input type="text" v-model="churchForm.name" placeholder="Church name" />
        </div>
        <div class="form-row">
          <div>
            <label>City</label>
            <input type="text" v-model="churchForm.city" placeholder="City" />
          </div>
          <div>
            <label>State</label>
            <input type="text" v-model="churchForm.state" placeholder="State" />
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
          <button class="btn btn-primary" @click="saveChurch" :disabled="!churchForm.name.trim() || saving">
            {{ editingChurch ? 'Update' : 'Add' }}
          </button>
          <button v-if="editingChurch" class="btn btn-secondary" @click="cancelChurch">Cancel</button>
        </div>
      </div>

      <div class="card">
        <div v-if="store.churches.length === 0" class="empty-state" style="padding:1rem 0">
          No churches added yet.
        </div>
        <div v-for="c in store.churches" :key="c.id" class="manage-item">
          <div>
            <div class="manage-item-name">{{ c.name }}</div>
            <div class="manage-item-sub">{{ [c.city, c.state].filter(Boolean).join(', ') || 'No location' }}</div>
          </div>
          <div class="manage-actions">
            <button class="btn btn-ghost" @click="startEditChurch(c)">&#9998;</button>
            <button class="btn btn-danger" @click="removeChurch(c.id)">&#128465;</button>
          </div>
        </div>
      </div>
    </template>

    <!-- SERMONS TAB -->
    <template v-if="tab === 'sermons'">
      <div class="inline-form">
        <h3 style="margin-bottom:0.75rem">{{ editingSermon ? 'Edit Sermon' : 'Add Sermon' }}</h3>
        <div class="form-group">
          <label>Title</label>
          <input type="text" v-model="sermonForm.title" placeholder="Sermon title" />
        </div>
        <div class="form-group">
          <label>Description (optional)</label>
          <textarea v-model="sermonForm.description" placeholder="Brief description..." style="min-height:60px"></textarea>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-primary" @click="saveSermon" :disabled="!sermonForm.title.trim() || saving">
            {{ editingSermon ? 'Update' : 'Add' }}
          </button>
          <button v-if="editingSermon" class="btn btn-secondary" @click="cancelSermon">Cancel</button>
        </div>
      </div>

      <div class="card">
        <div v-if="store.sermons.length === 0" class="empty-state" style="padding:1rem 0">
          No sermons added yet.
        </div>
        <div v-for="s in store.sermons" :key="s.id" class="manage-item">
          <div>
            <div class="manage-item-name">{{ s.title }}</div>
            <div v-if="s.description" class="manage-item-sub">{{ s.description }}</div>
            <div class="manage-item-sub">
              Preached {{ timesPreached(s.id) }}x
            </div>
          </div>
          <div class="manage-actions">
            <button class="btn btn-ghost" @click="startEditSermon(s)">&#9998;</button>
            <button class="btn btn-danger" @click="removeSermon(s.id)">&#128465;</button>
          </div>
        </div>
      </div>
    </template>

    <div v-if="error" class="alert alert-error" style="margin-top:1rem">{{ error }}</div>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useStore, type Church, type Sermon } from '../stores/index';

const store = useStore();
const tab = ref<'churches' | 'sermons'>('churches');
const saving = ref(false);
const error = ref('');

// -- Churches --
const editingChurch = ref<Church | null>(null);
const churchForm = reactive({ name: '', city: '', state: '' });

function startEditChurch(c: Church) {
  editingChurch.value = c;
  Object.assign(churchForm, { name: c.name, city: c.city ?? '', state: c.state ?? '' });
}

function cancelChurch() {
  editingChurch.value = null;
  Object.assign(churchForm, { name: '', city: '', state: '' });
}

async function saveChurch() {
  if (!churchForm.name.trim()) return;
  saving.value = true;
  error.value = '';
  try {
    if (editingChurch.value) {
      await store.updateChurch(editingChurch.value.id, {
        name: churchForm.name,
        city: churchForm.city || null,
        state: churchForm.state || null,
      });
    } else {
      await store.addChurch({
        name: churchForm.name,
        city: churchForm.city || null,
        state: churchForm.state || null,
        country: null,
      });
    }
    cancelChurch();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}

async function removeChurch(id: number) {
  if (!confirm('Delete this church? Sermon events will also be affected.')) return;
  await store.deleteChurch(id);
}

// -- Sermons --
const editingSermon = ref<Sermon | null>(null);
const sermonForm = reactive({ title: '', description: '' });

function startEditSermon(s: Sermon) {
  editingSermon.value = s;
  Object.assign(sermonForm, { title: s.title, description: s.description ?? '' });
}

function cancelSermon() {
  editingSermon.value = null;
  Object.assign(sermonForm, { title: '', description: '' });
}

async function saveSermon() {
  if (!sermonForm.title.trim()) return;
  saving.value = true;
  error.value = '';
  try {
    if (editingSermon.value) {
      await store.updateSermon(editingSermon.value.id, {
        title: sermonForm.title,
        description: sermonForm.description || null,
      });
    } else {
      await store.addSermon({ title: sermonForm.title, description: sermonForm.description || null });
    }
    cancelSermon();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}

async function removeSermon(id: number) {
  if (!confirm('Delete this sermon? Logged events will also be affected.')) return;
  await store.deleteSermon(id);
}

function timesPreached(sermonId: number) {
  return store.events.filter((e) => e.sermon.id === sermonId).length;
}
</script>
