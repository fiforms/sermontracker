<template>
  <main class="page">
    <div class="page-header">
      <h1>Dashboard</h1>
    </div>

    <div v-if="store.loading" class="empty-state">Loading...</div>
    <div v-else-if="store.error" class="alert alert-error">{{ store.error }}</div>
    <template v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ store.events.length }}</div>
          <div class="stat-label">Sermons Preached</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ store.sermons.length }}</div>
          <div class="stat-label">Sermon Titles</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ store.churches.length }}</div>
          <div class="stat-label">Churches</div>
        </div>
      </div>

      <div class="section-title">Recent Services</div>

      <div v-if="recentEvents.length === 0" class="empty-state">
        <div class="empty-icon">&#128214;</div>
        <p>No sermons logged yet.</p>
        <router-link to="/log" class="btn btn-primary" style="width:auto;margin-top:1rem">Log Your First Sermon</router-link>
      </div>

      <EventCard
        v-for="event in recentEvents"
        :key="event.id"
        :event="event"
      />

      <div v-if="store.events.length > 5" style="text-align:center;margin-top:0.5rem">
        <router-link to="/history" class="btn btn-secondary">View All History</router-link>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../stores/index';
import EventCard from '../components/EventCard.vue';

const store = useStore();
const recentEvents = computed(() => store.events.slice(0, 5));
</script>
