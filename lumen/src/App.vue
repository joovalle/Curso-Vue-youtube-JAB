<script setup lang="ts">
import AppNav from '@/components/shell/AppNav.vue'
import CommandPalette from '@/components/shell/CommandPalette.vue'
import ToastHost from '@/components/shell/ToastHost.vue'
</script>

<template>
  <div class="app" :class="{ bare: $route.meta.bare }">
    <AppNav v-if="!$route.meta.bare" />
    <div class="main">
      <RouterView />
    </div>
    <CommandPalette />
    <ToastHost />
  </div>
</template>

<style scoped>
.main { min-height: 100dvh; padding-left: var(--rail-w); }
.bare .main { padding-left: 0; }
@media (max-width: 720px) {
  .main { padding-left: 0; padding-bottom: calc(var(--bottom-nav-h) + env(safe-area-inset-bottom)); }
}
</style>
