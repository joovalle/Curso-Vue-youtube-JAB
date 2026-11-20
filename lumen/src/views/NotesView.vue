<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Bookmark, Download, Highlighter, StickyNote, Upload } from 'lucide-vue-next'
import { bookByNumber } from '@/core/canon'
import { engine } from '@/core/engine/client'
import { fromVerseKey } from '@/core/reference'
import { HIGHLIGHT_COLORS, type HighlightColor } from '@/core/storage/db'
import { useBackup } from '@/composables/backup'
import { useLocale } from '@/composables/locale'
import { useAnnotations } from '@/stores/annotations'
import { useLibrary } from '@/stores/library'
import { useSettings } from '@/stores/settings'

type Tab = 'notes' | 'highlights' | 'bookmarks'
const router = useRouter()
const notes = useAnnotations()
const library = useLibrary()
const settings = useSettings()
const { passage } = useLocale()
const { exportFile, importFile } = useBackup()

const tab = ref<Tab>('notes')
const color = ref<HighlightColor | null>(null)
const texts = ref(new Map<number, string>())

const items = computed(() => {
  if (tab.value === 'notes') return [...notes.notes.values()].map((n) => ({ key: n.key, body: n.text, color: null as HighlightColor | null }))
  if (tab.value === 'highlights') {
    return [...notes.highlights.entries()]
      .filter(([, c]) => !color.value || c === color.value)
      .map(([key, c]) => ({ key, body: '', color: c }))
  }
  return [...notes.bookmarks].map((key) => ({ key, body: '', color: null }))
})
const sorted = computed(() => [...items.value].sort((a, b) => a.key - b.key))

/** Carga el texto bíblico de los versículos visibles. */
watch(sorted, async (list) => {
  const id = settings.prefs.bibles[0]
  const missing = list.filter((i) => !texts.value.has(i.key)).slice(0, 300)
  if (!id || !missing.length) return
  await library.ensureOpen(id)
  const out = await engine().plain(id, missing.map((i) => ({ start: i.key })))
  const next = new Map(texts.value)
  missing.forEach((i, idx) => next.set(i.key, out[idx]))
  texts.value = next
}, { immediate: true })

function open(key: number) {
  const p = fromVerseKey(key)
  void router.push({ name: 'read', params: { book: bookByNumber(p.book)!.osis, chapter: p.chapter }, query: { v: p.verse } })
}
const counts = computed(() => ({ notes: notes.notes.size, highlights: notes.highlights.size, bookmarks: notes.bookmarks.size }))
const icons = { notes: StickyNote, highlights: Highlighter, bookmarks: Bookmark }
</script>

<template>
  <div class="page">
    <header class="top">
      <div>
        <h1 class="page-title">{{ $t('notes.title') }}</h1>
        <p class="page-sub">{{ $t('notes.subtitle') }}</p>
      </div>
      <div class="io">
        <button class="btn btn-sm" @click="exportFile"><Download /> {{ $t('settings.export') }}</button>
        <button class="btn btn-sm" @click="importFile"><Upload /> {{ $t('settings.import') }}</button>
      </div>
    </header>

    <div class="tabs">
      <div class="segmented">
        <button v-for="x in (['notes', 'highlights', 'bookmarks'] as const)" :key="x" :class="{ active: tab === x }" @click="tab = x">
          {{ $t(`notes.tabs.${x}`) }} <span class="count">{{ counts[x] }}</span>
        </button>
      </div>
      <div v-if="tab === 'highlights'" class="colors">
        <button class="chip" :class="{ active: !color }" @click="color = null">{{ $t('notes.all') }}</button>
        <button v-for="c in HIGHLIGHT_COLORS" :key="c" class="swatch" :class="[`c-${c}`, { on: color === c }]" :title="$t(`colors.${c}`)" @click="color = c" />
      </div>
    </div>

    <div v-if="!sorted.length" class="empty">
      <component :is="icons[tab]" />
      <p>{{ $t(tab === 'notes' ? 'notes.emptyNotes' : tab === 'highlights' ? 'notes.emptyHighlights' : 'notes.emptyBookmarks') }}</p>
    </div>

    <ol v-else class="list">
      <li v-for="it in sorted" :key="it.key">
        <button class="item" @click="open(it.key)">
          <span class="ref"><i v-if="it.color" class="dot" :class="`c-${it.color}`" />{{ passage(fromVerseKey(it.key)) }}</span>
          <span v-if="it.body" class="body">{{ it.body }}</span>
          <span class="verse" :class="{ hl: it.color }" :style="it.color ? { background: `var(--hl-${it.color})` } : {}">{{ texts.get(it.key) ?? '…' }}</span>
        </button>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.top { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.io { display: flex; gap: 8px; }
.tabs { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 28px 0 18px; }
.count { margin-left: 4px; font-size: 11.5px; color: var(--text-3); font-variant-numeric: tabular-nums; }
.colors { display: flex; align-items: center; gap: 8px; }
.chip { cursor: pointer; }
.swatch { width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--bg); box-shadow: 0 0 0 1px var(--border-strong); padding: 0; }
.swatch.on { box-shadow: 0 0 0 2px var(--accent); }
.c-gold { background: #f2c94c; } .c-mint { background: #6fcf97; } .c-sky { background: #67a9f0; } .c-lilac { background: #b28ee8; } .c-rose { background: #f0889a; }
.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.item {
  display: grid; gap: 8px; width: 100%; text-align: left; padding: 18px 20px;
  border-radius: var(--radius-l); border: 1px solid var(--border); background: var(--bg-elevated);
  transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
}
.item:hover { border-color: var(--border-strong); box-shadow: var(--shadow-m); }
.ref { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--accent); }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.body { font-size: 15.5px; white-space: pre-line; color: var(--text); }
.verse { font-family: var(--font-serif); font-size: 15px; line-height: 1.6; color: var(--text-2); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.verse.hl { color: var(--text); padding: 2px 4px; border-radius: 4px; -webkit-box-decoration-break: clone; box-decoration-break: clone; display: inline; }
</style>
