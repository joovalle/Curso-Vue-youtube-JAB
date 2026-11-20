<script setup lang="ts">
import { ref, watch } from 'vue'
import { GitCompare } from 'lucide-vue-next'
import { engine } from '@/core/engine/client'
import { useLibrary } from '@/stores/library'
import { useReader } from '@/stores/reader'

const reader = useReader()
const library = useLibrary()
const items = ref<{ id: string; abbr: string; title: string; text: string; rtl: boolean }[]>([])

watch(
  () => [reader.focusKey, library.bibles.length] as const,
  async ([key]) => {
    if (!key) return
    items.value = await Promise.all(
      library.bibles.map(async (b) => {
        try {
          await library.ensureOpen(b.id)
          const [text] = await engine().plain(b.id, [{ start: key }])
          return { id: b.id, abbr: b.info.abbreviation, title: b.info.title, text, rtl: b.info.rtl }
        } catch {
          return { id: b.id, abbr: b.info.abbreviation, title: b.info.title, text: '', rtl: false }
        }
      }),
    )
  },
  { immediate: true },
)
</script>

<template>
  <div class="compare">
    <div v-if="library.bibles.length < 2" class="empty">
      <GitCompare /><p>{{ $t('study.onlyOne') }}</p>
      <RouterLink to="/library" class="btn btn-sm">{{ $t('nav.library') }}</RouterLink>
    </div>
    <article v-for="it in items" :key="it.id" class="item">
      <header><span class="abbr">{{ it.abbr }}</span><span class="title">{{ it.title }}</span></header>
      <p :dir="it.rtl ? 'rtl' : 'ltr'">{{ it.text || '—' }}</p>
    </article>
  </div>
</template>

<style scoped>
.compare { padding: 10px 16px 40px; display: grid; gap: 4px; }
.item { padding: 12px 4px 14px; border-bottom: 1px solid var(--border); }
.item:last-child { border-bottom: 0; }
header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.abbr { font-size: 12px; font-weight: 750; letter-spacing: 0.05em; color: var(--accent); }
.title { font-size: 12px; color: var(--text-3); }
p { font-family: var(--font-serif); font-size: 16px; line-height: 1.65; }
</style>
