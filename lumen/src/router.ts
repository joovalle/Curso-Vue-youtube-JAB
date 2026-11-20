import { createRouter, createWebHashHistory } from 'vue-router'
import { useLibrary } from '@/stores/library'
import ReadView from '@/views/ReadView.vue'

export const router = createRouter({
  // Hash: funciona igual en cualquier hosting estático, en Capacitor y en Tauri.
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/read' },
    { path: '/read/:book?/:chapter?', name: 'read', component: ReadView },
    { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue') },
    { path: '/library', name: 'library', component: () => import('@/views/LibraryView.vue') },
    { path: '/notes', name: 'notes', component: () => import('@/views/NotesView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
    { path: '/welcome', name: 'welcome', component: () => import('@/views/WelcomeView.vue'), meta: { bare: true } },
    { path: '/:pathMatch(.*)*', redirect: '/read' },
  ],
  scrollBehavior: (_to, _from, saved) => saved ?? undefined,
})

// Primera vez sin Biblias instaladas → pantalla de bienvenida.
router.beforeEach((to) => {
  const library = useLibrary()
  if (!library.bibles.length && (to.name === 'read' || to.name === 'search' || to.name === 'notes')) {
    return { name: 'welcome' }
  }
})
