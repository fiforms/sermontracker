<template>
  <div class="card">
    <div class="card-row">
      <div>
        <div class="event-date">{{ formatDate(event.date) }}</div>
        <div class="event-title">{{ event.sermon.title }}</div>
        <div class="event-church">&#127930; {{ churchLabel(event.church) }}</div>
        <div class="event-meta" v-if="event.scriptureReading || event.openingHymn || event.closingHymn">
          <span v-if="event.scriptureReading" class="meta-chip">&#128214; {{ event.scriptureReading }}</span>
          <span v-if="event.openingHymn" class="meta-chip">Opening #{{ event.openingHymn }}</span>
          <span v-if="event.closingHymn" class="meta-chip">Closing #{{ event.closingHymn }}</span>
        </div>
        <div v-if="event.notes" style="margin-top:0.4rem; font-size:0.82rem; color:var(--text-muted)">{{ event.notes }}</div>
      </div>
      <div v-if="showActions" class="manage-actions" style="flex-shrink:0">
        <button class="btn btn-ghost" @click="$emit('edit', event)" title="Edit">&#9998;</button>
        <button class="btn btn-danger" @click="$emit('delete', event.id)" title="Delete">&#128465;</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SermonEvent, Church } from '../stores/index';

defineProps<{
  event: SermonEvent;
  showActions?: boolean;
}>();

defineEmits<{
  edit: [event: SermonEvent];
  delete: [id: number];
}>();

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function churchLabel(c: Church) {
  const parts = [c.name];
  if (c.city) parts.push(c.city);
  if (c.state) parts.push(c.state);
  return parts.join(', ');
}
</script>
