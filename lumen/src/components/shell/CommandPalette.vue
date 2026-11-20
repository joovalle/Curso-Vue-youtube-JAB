<script setup lang="ts">
import { computed, nextTick, ref, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { onKeyStroke } from '@vueuse/core'
import {
  ArrowRight, BookOpen, Columns2, CornerDownLeft, History, Library, Moon, NotebookPen, PanelRight, Search, Settings, Sun, SunMoon,
} from 'lucide-vue-next'
import ModalSheet from '@/components/common/ModalSheet.vue'
import { bookByNumber } from '@/core/canon'
import { formatPassage, normalize, parseReference, suggestBooks } from '@/core/reference'
import { useLocale } from '@/composables/locale'
import { useReader } from '@/stores/reader'
import { useSettings } from '@/stores/settings'

interface Item { id: string; icon: Component; label: string; hint?: string; group: string; run: () => void }

const router = useRouter()
const reader = useReader()
const settings = useSettings()
const { t } = useI18n()
const { lang } = useLocale()

const query = ref('')
const active = ref(0)
const input = ref<HTMLInputElement>()
const list = ref<HTMLElement>()

const goPassage = (book: number, chapter: number, verse?: number) =>
  router.push({ name: 'read', params: { book: bookByNumber(book)!.osis, chapter }, query: verse ? { v: verse } : {} })

const commands = computed<Item[]>(() => [
  { id: 'library', icon: Library, label: t('nav.library'), group: t('palette.commands'), run: () => router.push('/library') },
  { id: 'notes', icon: NotebookPen, label: t('nav.notes'), group: t('palette.commands'), run: () => router.push('/notes') },
  { id: 'settings', icon: Settings, label: t('nav.settings'), group: t('palette.commands'), run: () => router.push('/settings') },
  { id: 'parallel', icon: Columns2, label: t('palette.toggleParallel'), group: t('palette.commands'), run: () => (settings.prefs.parallel = !settings.prefs.parallel) },
  { id: 'study', icon: PanelRight, label: t('palette.toggleStudy'), group: t('palette.commands'), run: () => (settings.prefs.studyOpen = !settings.prefs.studyOpen) },
  { id: 'light', icon: Sun, label: t('palette.themeLight'), group: t('palette.commands'), run: () => (settings.prefs.theme = 'light') },
  { id: 'sepia', icon: SunMoon, label: t('palette.themeSepia'), group: t('palette.commands'), run: () => (settings.prefs.theme = 'sepia') },
  { id: 'dark', icon: Moon, label: t('palette.themeDark'), group: t('palette.commands'), run: () => (settings.prefs.theme = 'dark') },
])

const items = computed<Item[]>(() => {
  const q = query.value.trim()
  if (!q) {
    const recent = settings.prefs.history.slice(0, 6).map((p, i) => ({
      id: `h${i}`, icon: History, label: formatPassage(p, lang.value), group: t('palette.recent'), run: () => goPassage(p.book, p.chapter),
    }))
    return [...recent, ...commands.value]
  }
  const out: Item[] = []
  const ref = parseReference(q, lang.value)
  if (ref && /\d/.test(q)) {
    out.push({ id: 'ref', icon: ArrowRight, label: formatPassage(ref, lang.value), hint: t('palette.goTo'), group: t('palette.goTo'), run: () => goPassage(ref.book, ref.chapter, ref.verse) })
  }
  for (const b of suggestBooks(q, lang.value, 5)) {
    if (ref && /\d/.test(q) && ref.book === b.n) continue
    out.push({ id: `b${b.n}`, icon: BookOpen, label: b.name[lang.value], group: t('palette.books'), run: () => goPassage(b.n, 1) })
  }
  const nq = normalize(q)
  out.push(...commands.value.filter((c) => normalize(c.label).includes(nq)))
  out.push({ id: 'search', icon: Search, label: t('palette.searchText', { q }), group: t('nav.search'), run: () => router.push({ name: 'search', query: { q } }) })
  return out
})

watch(items, () => (active.value = 0))
watch(() => reader.paletteOpen, async (open) => {
  if (!open) return
  query.value = ''
  await nextTick()
  input.value?.focus()
})

function run(i: Item) {
  reader.paletteOpen = false
  i.run()
}
function move(d: number) {
  const n = items.value.length
  active.value = (active.value + d + n) % n
  void nextTick(() => list.value?.querySelector('.active')?.scrollIntoView({ block: 'nearest' }))
}

onKeyStroke((e) => (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k', (e) => {
  e.preventDefault()
  reader.paletteOpen = !reader.paletteOpen
})
onKeyStroke('/', (e) => {
  const el = document.activeElement
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || reader.paletteOpen) return
  e.preventDefault()
  reader.paletteOpen = true
})
</script>

<template>
  <ModalSheet :open="reader.paletteOpen" width="620px" top @close="reader.paletteOpen = false">
    <template #header>
      <div class="field">
        <Search class="lead" />
        <input
          ref="input" v-model="query" :placeholder="$t('palette.placeholder')" autocomplete="off" spellcheck="false"
          @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="items[active] && run(items[active])"
        >
      </div>
    </template>
    <div ref="list" class="list" role="listbox">
      <template v-for="(it, i) in items" :key="it.id">
        <p v-if="i === 0 || items[i - 1].group !== it.group" class="eyebrow group">{{ it.group }}</p>
        <button class="item" :class="{ active: i === active }" role="option" :aria-selected="i === active" @mouseenter="active = i" @click="run(it)">
          <component :is="it.icon" class="icon" />
          <span class="label">{{ it.label }}</span>
          <CornerDownLeft v-if="i === active" class="enter" />
        </button>
      </template>
    </div>
    <template #footer>
      <div class="keys">
        <span><kbd>↑</kbd><kbd>↓</kbd> {{ $t('palette.hintNav') }}</span>
        <span><kbd>↵</kbd> {{ $t('palette.hintOpen') }}</span>
        <span><kbd>esc</kbd> {{ $t('palette.hintClose') }}</span>
      </div>
    </template>
  </ModalSheet>
</template>

<style scoped>
.field { display: flex; align-items: center; gap: 12px; flex: 1; padding: 6px 0 6px 2px; }
.field .lead { width: 20px; height: 20px; color: var(--text-3); flex: none; }
.field input { flex: 1; border: 0; background: transparent; font-size: 17px; outline: none; min-width: 0; }
.field input::placeholder { color: var(--text-3); }
.list { padding: 4px 10px 12px; border-top: 1px solid var(--border); }
.group { padding: 14px 12px 6px; }
.item {
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 11px 12px; border: 0; border-radius: 12px; background: transparent; text-align: left; font-size: 15px;
}
.item.active { background: var(--accent-soft); }
.item.active .icon { color: var(--accent); }
.icon { width: 18px; height: 18px; color: var(--text-3); flex: none; }
.label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.enter { width: 16px; height: 16px; color: var(--accent); }
.keys { display: flex; gap: 18px; font-size: 12px; color: var(--text-3); }
kbd {
  display: inline-grid; place-items: center; min-width: 22px; height: 20px; padding: 0 5px; margin-right: 3px;
  border-radius: 6px; border: 1px solid var(--border); background: var(--surface); font: 600 11px var(--font-ui);
}
@media (max-width: 720px) { .keys { display: none; } }
</style>
