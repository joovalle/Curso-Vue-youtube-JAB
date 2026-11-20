<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ArrowLeft, CornerDownLeft } from 'lucide-vue-next'
import ModalSheet from '@/components/common/ModalSheet.vue'
import { BOOKS, type Book } from '@/core/canon'
import { formatPassage, normalize, parseReference, type Passage } from '@/core/reference'
import { useLocale } from '@/composables/locale'
import { useLibrary } from '@/stores/library'
import { useReader } from '@/stores/reader'
import { useSettings } from '@/stores/settings'

const emit = defineEmits<{ go: [p: Passage] }>()
const reader = useReader()
const library = useLibrary()
const settings = useSettings()
const { lang } = useLocale()

const query = ref('')
const book = ref<Book | null>(null)
const input = ref<HTMLInputElement>()

watch(() => reader.pickerOpen, async (open) => {
  if (!open) return
  query.value = ''
  book.value = null
  await nextTick()
  input.value?.focus()
})

/** Libros presentes en la Biblia principal (algunas solo tienen el NT). */
const available = computed(() => library.get(settings.prefs.bibles[0])?.info.books ?? null)

const filtered = computed(() => {
  const q = normalize(query.value).replace(/\s/g, '')
  if (!q || /\d/.test(q.slice(1))) return BOOKS
  return BOOKS.filter((b) =>
    [b.name[lang.value], b.abbr[lang.value]].some((s) => normalize(s).replace(/\s/g, '').startsWith(q)),
  )
})
const ot = computed(() => filtered.value.filter((b) => b.testament === 'OT'))
const nt = computed(() => filtered.value.filter((b) => b.testament === 'NT'))
const parsed = computed(() => (query.value.trim() ? parseReference(query.value, lang.value) : undefined))

function choose(b: Book) {
  if (b.chapters === 1) return go({ book: b.n, chapter: 1 })
  book.value = b
}
function go(p: Passage) {
  reader.pickerOpen = false
  emit('go', p)
}
function submit() {
  if (parsed.value && /\d/.test(query.value)) return go(parsed.value)
  if (filtered.value.length === 1) return choose(filtered.value[0])
  if (parsed.value) return choose(BOOKS[parsed.value.book - 1])
}
</script>

<template>
  <ModalSheet :open="reader.pickerOpen" width="760px" top @close="reader.pickerOpen = false">
    <template #header>
      <div class="search">
        <button v-if="book" class="icon-btn" :aria-label="$t('common.back')" @click="book = null"><ArrowLeft /></button>
        <input
          v-if="!book" ref="input" v-model="query" class="input" :placeholder="$t('picker.filter')"
          autocomplete="off" spellcheck="false" @keydown.enter.prevent="submit"
        >
        <h2 v-else class="book-title">{{ book.name[lang] }}</h2>
      </div>
    </template>

    <div class="content">
      <button v-if="!book && parsed && /\d/.test(query)" class="go" @click="go(parsed)">
        <span>{{ $t('picker.go', { ref: formatPassage(parsed, lang) }) }}</span><CornerDownLeft />
      </button>

      <template v-if="!book">
        <section v-for="[label, list] in ([['picker.ot', ot], ['picker.nt', nt]] as const)" :key="label">
          <template v-if="list.length">
            <h3 class="eyebrow">{{ $t(label) }}</h3>
            <div class="books">
              <button
                v-for="b in list" :key="b.n" class="book" :class="{ off: available && !available[b.n] }"
                :style="{ '--cat': `var(--cat-${b.category})` }" :title="$t(`categories.${b.category}`)" @click="choose(b)"
              >
                <span class="name">{{ b.name[lang] }}</span>
                <span class="meta">{{ b.chapters }}</span>
              </button>
            </div>
          </template>
        </section>
      </template>

      <template v-else>
        <h3 class="eyebrow">{{ $t('picker.chapters') }}</h3>
        <div class="chapters">
          <button
            v-for="c in book.chapters" :key="c" class="chapter"
            :class="{ current: reader.passage.book === book.n && reader.passage.chapter === c }"
            @click="go({ book: book.n, chapter: c })"
          >{{ c }}</button>
        </div>
      </template>
    </div>
  </ModalSheet>
</template>

<style scoped>
.search { display: flex; align-items: center; gap: 8px; flex: 1; }
.search .input { height: 48px; font-size: 16px; border-radius: 14px; }
.book-title { font-family: var(--font-serif); font-size: 22px; font-weight: 600; }
.content { padding: 8px 22px 26px; }
.go {
  display: flex; align-items: center; justify-content: space-between; width: 100%;
  margin: 4px 0 14px; padding: 14px 16px; border-radius: 14px; border: 0;
  background: var(--accent); color: var(--accent-contrast); font-weight: 650; font-size: 15px;
}
.go svg { width: 18px; height: 18px; }
section + section { margin-top: 22px; }
.eyebrow { margin: 10px 2px 10px; }
.books { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; }
.book {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 12px 10px 14px; border-radius: 12px;
  border: 1px solid transparent; background: var(--surface);
  text-align: left; position: relative; overflow: hidden;
  transition: background var(--dur) var(--ease), border-color var(--dur) var(--ease), transform 120ms var(--ease);
}
.book::before { content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px; border-radius: 0 3px 3px 0; background: var(--cat); opacity: 0.85; }
.book:hover { background: var(--bg-elevated); border-color: var(--border-strong); }
.book:active { transform: scale(0.98); }
.book.off { opacity: 0.4; }
.name { font-size: 14.5px; font-weight: 550; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meta { font-size: 11.5px; color: var(--text-3); font-variant-numeric: tabular-nums; }
.chapters { display: grid; grid-template-columns: repeat(auto-fill, minmax(54px, 1fr)); gap: 8px; }
.chapter {
  aspect-ratio: 1; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-elevated);
  font-family: var(--font-serif); font-size: 18px; font-weight: 550; font-variant-numeric: lining-nums;
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease), border-color var(--dur) var(--ease);
}
.chapter:hover { border-color: var(--accent); color: var(--accent); }
.chapter.current { background: var(--accent); border-color: var(--accent); color: var(--accent-contrast); }

@media (max-width: 720px) {
  .content { padding: 4px 14px 24px; }
  .books { grid-template-columns: repeat(2, 1fr); }
}
</style>
