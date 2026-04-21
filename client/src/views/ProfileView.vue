<template>
  <main class="page">
    <div class="page-header">
      <h1>Profile</h1>
    </div>

    <div v-if="store.profile" class="card profile-card">
      <form @submit.prevent="save">
        <div class="form-group">
          <label>Name</label>
          <input type="text" v-model="form.name" placeholder="Your name" required />
        </div>

        <div class="form-group">
          <label>Title</label>
          <input type="text" v-model="form.title" placeholder="e.g. Pastor, Elder, Evangelist" />
        </div>

        <div class="form-group">
          <label>Home Church</label>
          <input type="text" v-model="form.homeChurch" placeholder="Your home congregation" />
        </div>

        <div class="form-group">
          <label>Notes</label>
          <textarea v-model="form.notes" rows="3" placeholder="Anything else you'd like to note"></textarea>
        </div>

        <div class="form-group">
          <label>Email</label>
          <input
            type="email"
            v-model="form.email"
            :disabled="!store.profile.emailEditable"
            :class="{ 'input-disabled': !store.profile.emailEditable }"
          />
          <p v-if="!store.profile.emailEditable" class="field-hint">
            Email is managed by your authentication provider and cannot be changed here.
          </p>
        </div>

        <div v-if="saved" class="alert alert-success" style="margin-bottom:0.75rem">
          Profile saved.
        </div>
        <div v-if="saveError" class="alert alert-error" style="margin-bottom:0.75rem">
          {{ saveError }}
        </div>

        <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <a
            v-if="store.profile.appPortalUrl"
            :href="store.profile.appPortalUrl"
            class="btn btn-secondary"
          >App List / Logout</a>
        </div>
      </form>
    </div>

    <div v-else class="card" style="padding:2rem;text-align:center;color:var(--text-muted)">
      Loading…
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useStore } from '../stores/index.js';

const store = useStore();

const form = ref({
  name: '',
  title: '',
  homeChurch: '',
  notes: '',
  email: '',
});

const saving = ref(false);
const saved = ref(false);
const saveError = ref<string | null>(null);

function syncForm() {
  if (!store.profile) return;
  form.value = {
    name: store.profile.name,
    title: store.profile.title ?? '',
    homeChurch: store.profile.homeChurch ?? '',
    notes: store.profile.notes ?? '',
    email: store.profile.email,
  };
}

watch(() => store.profile, syncForm, { immediate: true });

async function save() {
  saving.value = true;
  saved.value = false;
  saveError.value = null;
  try {
    await store.updateProfile({
      name: form.value.name,
      title: form.value.title || null,
      homeChurch: form.value.homeChurch || null,
      notes: form.value.notes || null,
      email: form.value.email,
    });
    saved.value = true;
    setTimeout(() => (saved.value = false), 3000);
  } catch (e) {
    saveError.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}
</script>
