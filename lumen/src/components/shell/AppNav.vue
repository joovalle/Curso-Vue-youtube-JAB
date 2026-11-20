<script setup lang="ts">
import { BookOpen, HandHeart, Library, NotebookPen, Search, Settings } from 'lucide-vue-next'
import LumenLogo from '@/components/common/LumenLogo.vue'

const items = [
  { to: '/read', icon: BookOpen, label: 'nav.read', match: 'read' },
  { to: '/search', icon: Search, label: 'nav.search', match: 'search' },
  { to: '/library', icon: Library, label: 'nav.library', match: 'library' },
  { to: '/notes', icon: NotebookPen, label: 'nav.notes', match: 'notes' },
  { to: '/settings', icon: Settings, label: 'nav.settings', match: 'settings' },
]
</script>

<template>
  <nav class="rail" aria-label="Lumen">
    <RouterLink to="/read" class="brand" aria-label="Lumen"><LumenLogo :size="40" /></RouterLink>
    <div class="items">
      <RouterLink v-for="it in items" :key="it.to" :to="it.to" class="item" :class="{ active: $route.name === it.match }">
        <component :is="it.icon" :stroke-width="1.8" />
        <span>{{ $t(it.label) }}</span>
      </RouterLink>
    </div>
    <RouterLink to="/about" class="item about" :class="{ active: $route.name === 'about' }">
      <HandHeart :stroke-width="1.8" />
      <span>{{ $t('nav.about') }}</span>
    </RouterLink>
  </nav>

  <nav class="bottom" aria-label="Lumen">
    <RouterLink v-for="it in items" :key="it.to" :to="it.to" class="tab" :class="{ active: $route.name === it.match }">
      <component :is="it.icon" :stroke-width="1.8" />
      <span>{{ $t(it.label) }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.rail {
  position: fixed; inset: 0 auto 0 0; z-index: 30;
  width: var(--rail-w);
  display: flex; flex-direction: column; align-items: center; gap: 18px;
  padding: 16px 0 18px;
  background: var(--bg);
  border-right: 1px solid var(--border);
}
.brand { display: grid; place-items: center; border-radius: 14px; transition: transform var(--dur) var(--ease); }
.brand:hover { transform: rotate(-4deg) scale(1.04); text-decoration: none; }
.items { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.about { margin-top: auto; }
.item {
  display: grid; justify-items: center; gap: 3px;
  width: 64px; padding: 8px 0 7px; border-radius: 14px;
  color: var(--text-3); font-size: 10.5px; font-weight: 600; letter-spacing: 0.01em;
  transition: color var(--dur) var(--ease), background var(--dur) var(--ease);
}
.item svg { width: 22px; height: 22px; }
.item:hover { color: var(--text); background: var(--surface); text-decoration: none; }
.item.active { color: var(--accent); background: var(--accent-soft); }

.bottom { display: none; }

@media (max-width: 720px) {
  .rail { display: none; }
  .bottom {
    position: fixed; inset: auto 0 0 0; z-index: 30;
    display: grid; grid-template-columns: repeat(5, 1fr);
    height: calc(var(--bottom-nav-h) + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--bg);
    backdrop-filter: saturate(1.6) blur(18px);
    -webkit-backdrop-filter: saturate(1.6) blur(18px);
    border-top: 1px solid var(--border);
  }
  .tab {
    display: grid; justify-items: center; align-content: center; gap: 3px;
    color: var(--text-3); font-size: 10.5px; font-weight: 600;
  }
  .tab svg { width: 22px; height: 22px; }
  .tab:hover { text-decoration: none; }
  .tab.active { color: var(--accent); }
}
</style>
