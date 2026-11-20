<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Check } from 'lucide-vue-next'
import { fromVerseKey } from '@/core/reference'
import { useAnnotations } from '@/stores/annotations'
import { useReader } from '@/stores/reader'

const emit = defineEmits<{ go: [book: number, chapter: number, verse?: number] }>()
const reader = useReader()
const notes = useAnnotations()
const text = ref('')
const saved = ref(false)
let currentKey: number | null = null

watch(
  () => reader.focusKey,
  (key) => {
    currentKey = key
    text.value = key ? notes.notes.get(key)?.text ?? '' : ''
    saved.value = false
  },
  { immediate: true },
)

const persist = useDebounceFn(async (key: number, value: string) => {
  await notes.saveNote(key, value)
  saved.value = true
}, 500)

function onInput() {
  saved.value = false
  if (currentKey) void persist(currentKey, text.value)
}

function jump(key: number) {
  const p = fromVerseKey(key)
  reader.focus = p.verse
  reader.selection = [p.verse]
  emit('go', p.book, p.chapter, p.verse)
}

const chapterNotes = computed(() => {
  const { book, chapter } = reader.passage
  return [...notes.notes.values()]
    .filter((n) => { const p = fromVerseKey(n.key); return p.book === book && p.chapter === chapter && n.key !== reader.focusKey })
    .sort((a, b) => a.key - b.key)
})
</script>

<template>
  <div class="note">
    <textarea
      v-model="text" class="editor" :placeholder="$t('study.notePlaceholder')" rows="8"
      @input="onInput" @blur="currentKey && notes.saveNote(currentKey, text)"
    />
    <p class="status" :class="{ on: saved }"><Check /> {{ $t('study.noteSaved') }}</p>

    <section v-if="chapterNotes.length" class="others">
      <h3 class="eyebrow">{{ $t('study.chapterNotes') }}</h3>
      <button v-for="n in chapterNotes" :key="n.id" class="other" @click="jump(n.key)">
        <span class="v">{{ fromVerseKey(n.key).verse }}</span>
        <span class="t">{{ n.text }}</span>
      </button>
    </section>
  </div>
</template>

<style scoped>
.note { padding: 16px 16px 40px; }
.editor {
  width: 100%; min-height: 200px; resize: vertical;
  padding: 14px 16px; border-radius: 14px; border: 1px solid var(--border);
  background: var(--bg); color: var(--text);
  font-family: var(--font-serif); font-size: 16px; line-height: 1.65;
  transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
}
.editor:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
.status { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 12.5px; color: var(--text-3); opacity: 0; transition: opacity var(--dur) var(--ease); }
.status.on { opacity: 1; }
.status svg { width: 14px; height: 14px; color: var(--accent); }
.others { margin-top: 26px; }
.others .eyebrow { margin-bottom: 8px; }
.other { display: grid; grid-template-columns: 28px 1fr; gap: 8px; width: 100%; text-align: left; padding: 10px 8px; border: 0; border-radius: 10px; background: transparent; }
.other:hover { background: var(--surface); }
.v { font-weight: 700; font-size: 13px; color: var(--accent); }
.t { font-size: 14px; color: var(--text-2); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; white-space: pre-line; }
</style>
