<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { ArrowLeft, BookA } from 'lucide-vue-next'
import { engine } from '@/core/engine/client'
import { useLibrary } from '@/stores/library'
import { useReader } from '@/stores/reader'
import { useSettings } from '@/stores/settings'

const reader = useReader()
const library = useLibrary()
const settings = useSettings()

const query = ref('')
const topics = ref<string[]>([])
const topic = ref<string | null>(null)
const definition = ref<string | null>(null)

const selected = computed({
  get: () => (library.dictionaries.some((d) => d.id === settings.prefs.dictionaryId) ? settings.prefs.dictionaryId : library.dictionaries[0]?.id) ?? null,
  set: (id) => (settings.prefs.dictionaryId = id),
})

async function list() {
  const id = selected.value
  if (!id) return
  await library.ensureOpen(id)
  topics.value = await engine().topics(id, query.value.trim(), 80)
}

async function open(t: string) {
  const id = selected.value
  if (!id) return
  await library.ensureOpen(id)
  // Busca primero en el diccionario elegido y luego en los demás (útil para números Strong)
  for (const d of [id, ...library.dictionaries.map((x) => x.id).filter((x) => x !== id)]) {
    await library.ensureOpen(d)
    const html = await engine().definition(d, t)
    if (html) { topic.value = t; definition.value = html; return }
  }
  topic.value = t
  definition.value = null
}

watchDebounced(query, list, { debounce: 180 })
watch(selected, () => { topic.value = null; void list() }, { immediate: true })
watch(
  () => reader.dictionaryTopic,
  (t) => {
    if (!t) return
    query.value = t
    void open(t)
    reader.dictionaryTopic = null
  },
  { immediate: true },
)
</script>

<template>
  <div class="dict">
    <div v-if="!library.dictionaries.length" class="empty">
      <BookA /><p>{{ $t('study.noDictionaryInstalled') }}</p>
      <RouterLink to="/library" class="btn btn-sm">{{ $t('nav.library') }}</RouterLink>
    </div>
    <template v-else>
      <div class="controls">
        <select v-if="library.dictionaries.length > 1" v-model="selected" class="input">
          <option v-for="d in library.dictionaries" :key="d.id" :value="d.id">{{ d.info.title }}</option>
        </select>
        <input v-model="query" class="input" :placeholder="$t('study.dictSearch')" @focus="topic = null">
      </div>
      <article v-if="topic" class="entry">
        <button class="btn btn-ghost btn-sm" @click="topic = null"><ArrowLeft /> {{ $t('common.back') }}</button>
        <h3>{{ topic }}</h3>
        <div v-if="definition" class="html" v-html="definition" />
        <p v-else class="muted">{{ $t('study.dictEmpty') }}</p>
      </article>
      <ul v-else class="topics">
        <li v-for="t in topics" :key="t"><button @click="open(t)">{{ t }}</button></li>
        <li v-if="!topics.length" class="muted">{{ $t('study.dictEmpty') }}</li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.dict { padding: 14px 16px 40px; }
.controls { display: grid; gap: 8px; margin-bottom: 10px; }
.topics { list-style: none; margin: 0; padding: 0; }
.topics button { width: 100%; text-align: left; padding: 9px 10px; border: 0; border-radius: 10px; background: transparent; font-size: 14.5px; }
.topics button:hover { background: var(--surface); }
.entry h3 { font-family: var(--font-serif); font-size: 22px; margin: 12px 4px 10px; }
.html { font-family: var(--font-serif); font-size: 15.5px; line-height: 1.7; padding: 0 4px; overflow-wrap: anywhere; }
.html :deep(p) { margin: 0 0 0.8em; }
.muted { color: var(--text-3); padding: 10px; font-size: 14px; }
</style>
