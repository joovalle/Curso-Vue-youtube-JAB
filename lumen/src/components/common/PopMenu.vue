<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'

const props = withDefaults(defineProps<{ align?: 'start' | 'end'; width?: string }>(), { align: 'end', width: '280px' })
const open = ref(false)
const root = ref<HTMLElement>()
onClickOutside(root, () => (open.value = false))
onKeyStroke('Escape', () => (open.value = false))
const close = () => (open.value = false)
defineExpose({ close })
</script>

<template>
  <div ref="root" class="pop">
    <slot name="trigger" :open="open" :toggle="() => (open = !open)" />
    <Transition name="pop">
      <div v-if="open" class="panel" :class="props.align" :style="{ width: props.width }" role="dialog">
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pop { position: relative; }
.panel {
  position: absolute; top: calc(100% + 8px); z-index: 50;
  max-width: calc(100vw - 24px);
  padding: 8px; border-radius: var(--radius-l);
  background: var(--bg-elevated); border: 1px solid var(--border); box-shadow: var(--shadow-l);
  transform-origin: top right;
}
.panel.end { right: 0; }
.panel.start { left: 0; transform-origin: top left; }
.pop-enter-active, .pop-leave-active { transition: opacity 160ms var(--ease), transform 160ms var(--ease); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }
</style>
