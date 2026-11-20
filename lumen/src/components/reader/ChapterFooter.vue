<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { nextChapter, prevChapter } from '@/core/reference'
import { useLocale } from '@/composables/locale'
import { useReader } from '@/stores/reader'

const emit = defineEmits<{ go: [book: number, chapter: number] }>()
const reader = useReader()
const { passage } = useLocale()
const prev = computed(() => prevChapter(reader.passage))
const next = computed(() => nextChapter(reader.passage))
</script>

<template>
  <nav class="footer">
    <button v-if="prev" class="card-link prev" @click="emit('go', prev.book, prev.chapter)">
      <ArrowLeft />
      <span><small>{{ $t('reader.prevChapter') }}</small>{{ passage(prev) }}</span>
    </button>
    <span v-else />
    <button v-if="next" class="card-link next" @click="emit('go', next.book, next.chapter)">
      <span><small>{{ $t('reader.continueTo') }}</small>{{ passage(next) }}</span>
      <ArrowRight />
    </button>
  </nav>
</template>

<style scoped>
.footer {
  max-width: var(--read-measure); margin: 56px auto 0;
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.card-link {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; border-radius: var(--radius-l);
  border: 1px solid var(--border); background: var(--bg-elevated);
  font-family: var(--font-serif); font-size: 17px; font-weight: 600; text-align: left;
  transition: border-color var(--dur) var(--ease), transform 160ms var(--ease), box-shadow var(--dur) var(--ease);
}
.card-link:hover { border-color: var(--accent); box-shadow: var(--shadow-m); transform: translateY(-1px); }
.card-link small { display: block; font-family: var(--font-ui); font-size: 11.5px; font-weight: 600; color: var(--text-3); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 2px; }
.card-link svg { width: 20px; height: 20px; color: var(--accent); flex: none; }
.next { justify-content: flex-end; text-align: right; }
@media (max-width: 520px) {
  .footer { grid-template-columns: 1fr; }
  .prev { order: 2; }
}
</style>
