<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LoaderCircle, Search } from 'lucide-vue-next'
import { bookByNumber } from '@/core/canon'
import { engine } from '@/core/engine/client'
import type { SearchHit } from '@/core/engine/modules'
import { fromVerseKey, verseKey } from '@/core/reference'
import { useLocale } from '@/composables/locale'
import { useLibrary } from '@/stores/library'
import { useReader } from '@/stores/reader'
import { useSettings } from '@/stores/settings'

type Scope = 'all' | 'ot' | 'nt' | 'book'
const route = useRoute()
const router = useRouter()
const library = useLibrary()
const settings = useSettings()
const reader = useReader()
const { bookName, passage } = useLocale()

const query = ref(String(route.query.q ?? ''))
const scope = ref<Scope>((route.query.scope as Scope) ?? 'all')
const bibleId = ref(settings.prefs.bibles[0] ?? '')
const hits = shallowRef<SearchHit[]>([])
const perBook = ref<Record<number, number>>({})
const total = ref(0)
const loading = ref(false)
const searched = ref(false)
const bookFilter = ref<number | null>(null)
const PAGE = 100

const range = computed(() => {
  if (bookFilter.value) return { from: verseKey(bookFilter.value, 0, 0), to: verseKey(bookFilter.value, 999, 999) }
  switch (scope.value) {
    case 'ot': return { from: verseKey(1, 0, 0), to: verseKey(39, 999, 999) }
    case 'nt': return { from: verseKey(40, 0, 0), to: verseKey(66, 999, 999) }
    case 'book': return { from: verseKey(reader.passage.book, 0, 0), to: verseKey(reader.passage.book, 999, 999) }
    default: return {}
  }
})

async function run(append = false) {
  const q = query.value.trim()
  if (!q || !bibleId.value) return
  loading.value = true
  try {
    await library.ensureOpen(bibleId.value)
    const r = await engine().search(bibleId.value, q, { ...range.value, limit: PAGE, offset: append ? hits.value.length : 0 })
    hits.value = append ? [...hits.value, ...r.hits] : r.hits
    total.value = r.total
    if (!bookFilter.value) perBook.value = r.perBook
    searched.value = true
  } finally {
    loading.value = false
  }
}

function submit() {
  bookFilter.value = null
  void router.replace({ query: { q: query.value.trim() || undefined, scope: scope.value === 'all' ? undefined : scope.value } })
}

watch(() => [route.query.q, route.query.scope], () => {
  query.value = String(route.query.q ?? '')
  scope.value = (route.query.scope as Scope) ?? 'all'
  bookFilter.value = null
  void run()
}, { immediate: true })
watch([bibleId, bookFilter], () => run())

function open(h: SearchHit) {
  const p = fromVerseKey(h.key)
  void router.push({ name: 'read', params: { book: bookByNumber(p.book)!.osis, chapter: p.chapter }, query: { v: p.verse } })
}
const books = computed(() => Object.entries(perBook.value).map(([b, n]) => ({ b: Number(b), n })).sort((a, b) => a.b - b.b))
</script>

<template>
  <div class="page">
    <h1 class="page-title">{{ $t('search.title') }}</h1>
    <form class="bar" @submit.prevent="submit">
      <div class="field">
        <Search />
        <input v-model="query" class="input" :placeholder="$t('search.placeholder')" autofocus enterkeyhint="search" type="search">
      </div>
      <select v-if="library.bibles.length > 1" v-model="bibleId" class="input version">
        <option v-for="b in library.bibles" :key="b.id" :value="b.id">{{ b.info.abbreviation }}</option>
      </select>
    </form>
    <div class="scopes">
      <div class="segmented">
        <button v-for="s in (['all', 'ot', 'nt'] as const)" :key="s" :class="{ active: scope === s }" type="button" @click="scope = s; submit()">
          {{ $t(`search.${s}`) }}
        </button>
        <button type="button" :class="{ active: scope === 'book' }" @click="scope = 'book'; submit()">{{ bookName(reader.passage.book) }}</button>
      </div>
    </div>
    <p class="hint">{{ $t('search.hint') }}</p>

    <div v-if="loading && !hits.length" class="empty"><LoaderCircle class="spin" /><p>{{ $t('search.indexing') }}</p></div>
    <template v-else-if="searched">
      <div class="summary">
        <strong>{{ $t('search.results', total) }}</strong>
        <div v-if="books.length > 1" class="books">
          <button class="chip" :class="{ active: !bookFilter }" @click="bookFilter = null">{{ $t('notes.all') }}</button>
          <button v-for="x in books" :key="x.b" class="chip" :class="{ active: bookFilter === x.b }" @click="bookFilter = x.b">
            {{ bookName(x.b) }} <small>{{ x.n }}</small>
          </button>
        </div>
      </div>
      <p v-if="!hits.length" class="empty">{{ $t('search.noResults') }}</p>
      <ol class="results">
        <li v-for="h in hits" :key="h.key">
          <button class="hit" @click="open(h)">
            <span class="ref">{{ passage(fromVerseKey(h.key)) }}</span>
            <span class="snippet" v-html="h.html" />
          </button>
        </li>
      </ol>
      <button v-if="hits.length < total" class="btn more" :disabled="loading" @click="run(true)">
        <LoaderCircle v-if="loading" class="spin" />{{ $t('search.loadMore') }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.bar { display: flex; gap: 10px; margin-top: 22px; }
.field { position: relative; flex: 1; }
.field svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; color: var(--text-3); }
.field .input { height: 54px; padding-left: 48px; font-size: 17px; border-radius: 16px; }
.version { width: auto; height: 54px; border-radius: 16px; font-weight: 600; }
.scopes { margin-top: 14px; overflow-x: auto; }
.hint { margin-top: 12px; font-size: 13px; color: var(--text-3); max-width: 70ch; }
.summary { margin: 32px 0 12px; display: grid; gap: 12px; }
.summary strong { font-size: 15px; }
.books { display: flex; flex-wrap: wrap; gap: 6px; }
.chip small { color: var(--text-3); font-weight: 600; }
.chip { cursor: pointer; }
.results { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.hit {
  display: grid; gap: 4px; width: 100%; text-align: left; padding: 14px 16px; border: 0; border-radius: 14px; background: transparent;
  transition: background var(--dur) var(--ease);
}
.hit:hover { background: var(--surface); }
.ref { font-size: 13px; font-weight: 700; color: var(--accent); }
.snippet { font-family: var(--font-serif); font-size: 16.5px; line-height: 1.6; }
.snippet :deep(mark) { background: var(--hl-gold); color: inherit; border-radius: 3px; padding: 0 2px; }
.more { margin: 18px auto 0; display: flex; }
@media (max-width: 720px) {
  .bar { flex-direction: column; }
  .version { width: 100%; }
}
</style>
