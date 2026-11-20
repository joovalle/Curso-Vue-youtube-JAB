<script setup lang="ts">
import { watch } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ open: boolean; title?: string; width?: string; top?: boolean }>(), { width: '720px' })
const emit = defineEmits<{ close: [] }>()
onKeyStroke('Escape', () => props.open && emit('close'))
watch(() => props.open, (o) => document.documentElement.classList.toggle('modal-open', o))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="backdrop" :class="{ top }" @mousedown.self="emit('close')">
        <section class="sheet" :style="{ '--w': width }" role="dialog" aria-modal="true" :aria-label="title">
          <header v-if="title || $slots.header" class="head">
            <slot name="header"><h2>{{ title }}</h2></slot>
            <button class="icon-btn" :aria-label="$t('common.close')" @click="emit('close')"><X /></button>
          </header>
          <div class="body"><slot /></div>
          <footer v-if="$slots.footer" class="foot"><slot name="footer" /></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed; inset: 0; z-index: 80;
  display: grid; place-items: center; padding: 24px;
  background: var(--backdrop);
  backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
}
.backdrop.top { place-items: start center; padding-top: 12vh; }
.sheet {
  width: min(var(--w), 100%); max-height: min(84vh, 860px);
  display: flex; flex-direction: column;
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: var(--radius-xl); box-shadow: var(--shadow-l); overflow: hidden;
}
.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 16px 8px 22px; }
.head h2 { font-size: 17px; }
.body { overflow: auto; overscroll-behavior: contain; flex: 1; }
.foot { padding: 12px 18px; border-top: 1px solid var(--border); }

.modal-enter-active, .modal-leave-active { transition: opacity var(--dur) var(--ease); }
.modal-enter-active .sheet, .modal-leave-active .sheet { transition: transform var(--dur) var(--ease); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .sheet, .modal-leave-to .sheet { transform: translateY(14px) scale(0.985); }

@media (max-width: 720px) {
  .backdrop, .backdrop.top { place-items: end stretch; padding: 0; padding-top: 6vh; }
  .sheet { width: 100%; max-height: 94vh; border-radius: var(--radius-xl) var(--radius-xl) 0 0; padding-bottom: env(safe-area-inset-bottom); }
  .modal-enter-from .sheet, .modal-leave-to .sheet { transform: translateY(40%); }
}
</style>
