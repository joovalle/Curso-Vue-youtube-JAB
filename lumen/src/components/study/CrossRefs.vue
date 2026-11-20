<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { Link2, LoaderCircle } from 'lucide-vue-next'
import { engine } from '@/core/engine/client'
import type { CrossRef } from '@/core/engine/modules'
import { formatPassage, fromVerseKey } from '@/core/reference'
import { useLocale } from '@/composables/locale'
import { useLibrary } from '@/stores/library'
import { useReader } from '@/stores/reader'
import { useSettings } from '@/stores/settings'

const emit = defineEmits<{ go: [book: number, chapter: number, verse?: number] }>()
const reader = useReader()
const library = useLibrary()
const settings = useSettings()
const { lang } = useLocale()

const PAGE = 25
const refs = shallowRef<(CrossRef & { text: string })[]>([])
const all = shallowRef<CrossRef[]>([])
const loading = ref(false)
const xrefId = computed(() => library.crossrefs[0]?.id)
const catalogEntry = computed(() => library.catalog?.find((m) => m.kind === 'crossrefs'))

async function withText(list: CrossRef[]) {
  const bible = settings.prefs.bibles[0]
  if (!bible) return list.map((r) => ({ ...r, text: '' }))
  await library.ensureOpen(bible)
  const texts = await engine().plain(bible, list.map((r) => ({ start: r.start, end: r.end })))
  return list.map((r, i) => ({ ...r, text: texts[i] }))
}

watch(
  () => [reader.focusKey, xrefId.value, settings.prefs.bibles[0]] as const,
  async ([key, id]) => {
    refs.value = []
    all.value = []
    if (!key || !id) return
    loading.value = true
    try {
      await library.ensureOpen(id)
      all.value = await engine().crossRefs(id, key)
      refs.value = await withText(all.value.slice(0, PAGE))
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

async function more() {
  refs.value = [...refs.value, ...(await withText(all.value.slice(refs.value.length, refs.value.length + PAGE)))]
}

function label(r: CrossRef) {
  const s = fromVerseKey(r.start)
  const e = r.end ? fromVerseKey(r.end) : null
  const sameChapter = e && e.book === s.book && e.chapter === s.chapter
  return formatPassage({ ...s, verseEnd: sameChapter ? e.verse : undefined }, lang.value) + (e && !sameChapter ? '…' : '')
}

function open(r: CrossRef) {
  const s = fromVerseKey(r.start)
  emit('go', s.book, s.chapter, s.verse)
}
const maxVotes = computed(() => Math.max(1, ...all.value.map((r) => r.votes)))

if (!xrefId.value) void library.fetchCatalog()
</script>

<template>
  <div class="refs">
    <div v-if="!xrefId" class="empty">
      <Link2 />
      <p>{{ $t('study.needXrefs') }}</p>
      <button v-if="catalogEntry" class="btn btn-primary btn-sm" :disabled="catalogEntry.id in library.progress" @click="library.install(catalogEntry)">
        <LoaderCircle v-if="catalogEntry.id in library.progress" class="spin" />
        {{ $t('study.install') }} · {{ (catalogEntry.size / 1e6).toFixed(1) }} MB
      </button>
    </div>
    <div v-else-if="loading" class="empty"><LoaderCircle class="spin" /></div>
    <div v-else-if="!all.length" class="empty"><Link2 /><p>{{ $t('study.noRefs') }}</p></div>
    <template v-else>
      <button v-for="r in refs" :key="`${r.start}-${r.end}`" class="ref" @click="open(r)">
        <span class="top">
          <span class="label">{{ label(r) }}</span>
          <span class="votes" :title="$t('study.votes', { n: r.votes })"><i :style="{ width: `${(r.votes / maxVotes) * 100}%` }" /></span>
        </span>
        <span class="text">{{ r.text }}</span>
      </button>
      <button v-if="refs.length < all.length" class="btn btn-ghost more" @click="more">{{ $t('common.more') }} ({{ all.length - refs.length }})</button>
    </template>
  </div>
</template>

<style scoped>
.refs { padding: 8px 10px 40px; }
.ref {
  display: grid; gap: 4px; width: 100%; text-align: left;
  padding: 12px 12px; border: 0; border-radius: 12px; background: transparent;
  transition: background var(--dur) var(--ease);
}
.ref:hover { background: var(--surface); }
.top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.label { font-weight: 650; font-size: 13.5px; color: var(--accent); }
.votes { width: 38px; height: 4px; border-radius: 4px; background: var(--surface-2); overflow: hidden; flex: none; }
.votes i { display: block; height: 100%; background: var(--accent); opacity: 0.55; border-radius: 4px; }
.text { font-family: var(--font-serif); font-size: 14.5px; line-height: 1.55; color: var(--text-2); display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.more { width: 100%; margin-top: 6px; }
</style>
