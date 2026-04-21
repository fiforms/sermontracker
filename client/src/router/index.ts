import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/log', name: 'log', component: () => import('../views/LogView.vue') },
    { path: '/history', name: 'history', component: () => import('../views/HistoryView.vue') },
    { path: '/search', name: 'search', component: () => import('../views/SearchView.vue') },
    { path: '/manage', name: 'manage', component: () => import('../views/ManageView.vue') },
  ],
});

export default router;
