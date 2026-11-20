<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onKeyStroke, useSwipe } from '@vueuse/core'
import { BookOpen, LoaderCircle } from 'lucide-vue-next'
import ReaderBar from '@/components/reader/ReaderBar.vue'
import ChapterText from '@/components/reader/ChapterText.vue'
import ParallelText from '@/components/reader/ParallelText.vue'
import ChapterFooter from '@/components/reader/ChapterFooter.vue'
import VerseActions from '@/components/reader/VerseActions.vue'
import PassagePicker from '@/components/reader/PassagePicker.vue'
import StudyPanel from '@/components/study/StudyPanel.vue'
import { bookByNumber, bookByOsis } from '@/core/canon'
import { nextChapter, prevChapter, type Passage } from '@/core/reference'
import { useChapters } from '@/composables/chapter'
import { useLibrary } from '@/stores/library'
import { useReader } from '@/stores/reader'
import { useSettings } from '@/stores/settings'

const route = useRoute()
const router = useRouter()
const reader = useReader()
const library = useLibrary()
const settings = useSettings()

const flash = ref<number | null>(null)
const content = ref<HTMLElement>()

/** Pasaje según la URL: /read/John/3?v=16 */
const routePassage = computed<Passage>(() => {
  const book = bookByOsis(String(route.params.book ?? ''))
  const chapter = Number(route.params.chapter)
  if (!book) return settings.prefs.last
  return { book: book.n, chapter: chapter >= 1 && chapter <= book.chapters ? chapter : 1 }
})

const activeIds = computed(() => (settings.prefs.parallel ? settings.prefs.bibles : settings.prefs.bibles.slice(0, 1)))
const passageRef = computed(() => reader.passage)
const { columns, loading } = useChapters(activeIds, passageRef)
const parallel = computed(() => settings.prefs.parallel && columns.value.length > 1)

function go(book: number, chapter: number, verse?: number) {
  const b = bookByNumber(book)
  if (!b) return
  void router.push({ name: 'read', params: { book: b.osis, chapter }, query: verse ? { v: verse } : {} })
}

watch(
  [routePassage, () => route.query.v],
  async ([p, v]) => {
    // /read sin pasaje → se completa la URL con la última posición (sin tocar el estado aquí)
    if (!route.params.book) {
      void router.replace({ name: 'read', params: { book: bookByNumber(p.book)!.osis, chapter: p.chapter } })
      return
    }
    const changed = p.book !== reader.passage.book || p.chapter !== reader.passage.chapter
    reader.setPassage(p)
    settings.remember(p)
    const verse = Number(v)
    if (verse) {
      await waitForText()
      flash.value = verse
      reader.focus = verse
      document.getElementById(`v${verse}`)?.scrollIntoView({ block: 'center', behavior: changed ? 'auto' : 'smooth' })
      setTimeout(() => (flash.value = null), 1900)
    } else if (changed) {
      window.scrollTo({ top: 0 })
      reader.focus = null
    }
  },
  { immediate: true },
)

async function waitForText() {
  for (let i = 0; i < 40 && (loading.value || !columns.value.length); i++) await new Promise((r) => setTimeout(r, 25))
  await nextTick()
}

const typing = () => {
  const el = document.activeElement
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || document.documentElement.classList.contains('modal-open')
}
onKeyStroke('ArrowLeft', (e) => {
  if (typing() || e.metaKey || e.ctrlKey || e.altKey) return
  const p = prevChapter(reader.passage)
  if (p) go(p.book, p.chapter)
})
onKeyStroke('ArrowRight', (e) => {
  if (typing() || e.metaKey || e.ctrlKey || e.altKey) return
  const p = nextChapter(reader.passage)
  if (p) go(p.book, p.chapter)
})
onKeyStroke('Escape', () => {
  if (!typing()) reader.clear()
})
onKeyStroke('g', (e) => {
  if (typing() || e.metaKey || e.ctrlKey) return
  e.preventDefault()
  reader.pickerOpen = true
})

// Deslizar para cambiar de capítulo (pantallas táctiles)
const { direction, lengthX, lengthY } = useSwipe(content, {
  threshold: 60,
  onSwipeEnd() {
    if (Math.abs(lengthX.value) < 90 || Math.abs(lengthY.value) > 50) return
    const p = direction.value === 'left' ? nextChapter(reader.passage) : direction.value === 'right' ? prevChapter(reader.passage) : undefined
    if (p) go(p.book, p.chapter)
  },
})
</script>

<template>
  <div class="read">
    <ReaderBar @go="go" />
    <div class="layout" :class="{ 'with-panel': settings.prefs.studyOpen }">
      <main ref="content" class="content" :class="{ parallel }">
        <div v-if="!library.bibles.length" class="empty no-bible">
          <BookOpen />
          <h2>{{ $t('reader.noBible') }}</h2>
          <p>{{ $t('reader.noBibleText') }}</p>
          <RouterLink to="/library" class="btn btn-primary">{{ $t('reader.goLibrary') }}</RouterLink>
        </div>
        <template v-else-if="columns.length">
          <Transition name="fade" mode="out-in">
            <ParallelText v-if="parallel" :key="`p${reader.passage.book}-${reader.passage.chapter}`" :columns="columns" :flash="flash" />
            <ChapterText v-else :key="`s${reader.passage.book}-${reader.passage.chapter}`" :column="columns[0]" :flash="flash" />
          </Transition>
          <ChapterFooter @go="go" />
        </template>
        <div v-else-if="loading" class="empty"><LoaderCircle class="spin" /></div>
      </main>
      <StudyPanel v-if="settings.prefs.studyOpen && library.bibles.length" @go="go" />
    </div>
    <VerseActions />
    <PassagePicker @go="(p) => go(p.book, p.chapter, p.verse)" />
  </div>
</template>

<style scoped>
.layout { display: flex; align-items: flex-start; }
.content {
  flex: 1; min-width: 0;
  padding: 48px 32px 200px;
}
.no-bible { min-height: 60vh; align-content: center; }
.no-bible h2 { font-family: var(--font-serif); font-size: 26px; color: var(--text); }
.no-bible p { max-width: 42ch; font-size: 15px; color: var(--text-2); }

@media (max-width: 720px) {
  .content { padding: 28px 20px 220px; }
  .content.parallel { padding: 20px 8px 220px; }
}
</style>
