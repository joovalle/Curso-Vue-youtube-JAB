<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { LoaderCircle, ScrollText } from 'lucide-vue-next'
import { engine } from '@/core/engine/client'
import type { CommentaryEntry } from '@/core/engine/modules'
import { useLibrary } from '@/stores/library'
import { useReader } from '@/stores/reader'
import { useSettings } from '@/stores/settings'

const reader = useReader()
const library = useLibrary()
const settings = useSettings()
const entries = ref<CommentaryEntry[]>([])
const loading = ref(false)

const selected = computed({
  get: () => (library.commentaries.some((c) => c.id === settings.prefs.commentaryId) ? settings.prefs.commentaryId : library.commentaries[0]?.id) ?? null,
  set: (id) => (settings.prefs.commentaryId = id),
})

watch(
  () => [selected.value, reader.focusKey] as const,
  async ([id]) => {
    entries.value = []
    if (!id || !reader.focus) return
    loading.value = true
    try {
      await library.ensureOpen(id)
      entries.value = await engine().commentary(id, reader.passage.book, reader.passage.chapter, reader.focus)
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="commentary">
    <div v-if="!library.commentaries.length" class="empty">
      <ScrollText /><p>{{ $t('study.noCommentaryInstalled') }}</p>
      <RouterLink to="/library" class="btn btn-sm">{{ $t('nav.library') }}</RouterLink>
    </div>
    <template v-else>
      <select v-if="library.commentaries.length > 1" v-model="selected" class="input select">
        <option v-for="c in library.commentaries" :key="c.id" :value="c.id">{{ c.info.title }}</option>
      </select>
      <div v-if="loading" class="empty"><LoaderCircle class="spin" /></div>
      <div v-else-if="!entries.length" class="empty"><ScrollText /><p>{{ $t('study.noCommentary') }}</p></div>
      <article v-for="(e, i) in entries" :key="i" class="entry">
        <p class="eyebrow">
          {{ e.scope === 'book' ? $t('study.bookScope') : e.scope === 'chapter' ? $t('study.chapterScope', { r: e.range }) : $t('study.verseScope', { r: e.range }) }}
        </p>
        <div class="html" v-html="e.html" />
      </article>
    </template>
  </div>
</template>

<style scoped>
.commentary { padding: 14px 18px 40px; }
.select { margin-bottom: 12px; }
.entry + .entry { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border); }
.entry .eyebrow { margin-bottom: 8px; }
.html { font-family: var(--font-serif); font-size: 15.5px; line-height: 1.7; color: var(--text); overflow-wrap: anywhere; }
.html :deep(p) { margin: 0 0 0.8em; }
.html :deep(b) { font-weight: 650; }
</style>
