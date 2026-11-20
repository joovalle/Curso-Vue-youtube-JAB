<script setup lang="ts">
import { CircleCheck, Info, TriangleAlert } from 'lucide-vue-next'
import { toasts } from '@/composables/toast'
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <TransitionGroup name="rise">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.tone">
        <CircleCheck v-if="t.tone === 'success'" />
        <TriangleAlert v-else-if="t.tone === 'error'" />
        <Info v-else />
        <span>{{ t.text }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed; z-index: 100; left: 50%; transform: translateX(-50%);
  top: 18px; display: grid; gap: 8px; justify-items: center; pointer-events: none;
  width: min(92vw, 460px);
}
.toast {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 16px; border-radius: 14px;
  background: var(--text); color: var(--bg);
  font-size: 14px; font-weight: 550; box-shadow: var(--shadow-l);
}
.toast svg { width: 18px; height: 18px; flex: none; }
.toast.success svg { color: #6fd39a; }
.toast.error svg { color: #ff8a80; }
:root[data-theme='dark'] .toast.success svg { color: #1f8a4c; }
:root[data-theme='dark'] .toast.error svg { color: #c0392b; }
</style>
