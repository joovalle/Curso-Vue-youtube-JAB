<script setup lang="ts">
import { computed } from 'vue'
import { BookA, GitCompare, Link2, ScrollText, StickyNote, X } from 'lucide-vue-next'
import { useLocale } from '@/composables/locale'
import { useReader } from '@/stores/reader'
import { useSettings, type StudyTab } from '@/stores/settings'
import CrossRefs from './CrossRefs.vue'
import CompareVersions from './CompareVersions.vue'
import VerseNote from './VerseNote.vue'
import CommentaryView from './CommentaryView.vue'
import DictionaryView from './DictionaryView.vue'

const emit = defineEmits<{ go: [book: number, chapter: number, verse?: number] }>()
const reader = useReader()
const settings = useSettings()
const { passage } = useLocale()

const tabs: { id: StudyTab; icon: unknown; label: string }[] = [
  { id: 'refs', icon: Link2, label: 'study.refs' },
  { id: 'compare', icon: GitCompare, label: 'study.compare' },
  { id: 'notes', icon: StickyNote, label: 'study.notes' },
  { id: 'commentary', icon: ScrollText, label: 'study.commentary' },
  { id: 'dictionary', icon: BookA, label: 'study.dictionary' },
]
const tab = computed(() => settings.prefs.studyTab)
const focusLabel = computed(() =>
  reader.focus ? passage({ book: reader.passage.book, chapter: reader.passage.chapter, verse: reader.focus }) : '',
)
const needsVerse = computed(() => tab.value !== 'dictionary' && !reader.focus)
</script>

<template>
  <aside class="study" :aria-label="$t('reader.study')">
    <div class="handle" aria-hidden="true" />
    <header class="head">
      <div>
        <p class="eyebrow">{{ $t(`study.${tab}`) }}</p>
        <h2>{{ focusLabel || '—' }}</h2>
      </div>
      <button class="icon-btn" :aria-label="$t('common.close')" @click="settings.prefs.studyOpen = false"><X /></button>
    </header>
    <nav class="tabs" role="tablist">
      <button
        v-for="t in tabs" :key="t.id" role="tab" class="tab" :class="{ active: tab === t.id }"
        :aria-selected="tab === t.id" :title="$t(t.label)" @click="settings.prefs.studyTab = t.id"
      >
        <component :is="t.icon" /><span>{{ $t(t.label) }}</span>
      </button>
    </nav>
    <div class="body">
      <div v-if="needsVerse" class="empty"><Link2 /><p>{{ $t('study.pickVerse') }}</p></div>
      <CrossRefs v-else-if="tab === 'refs'" @go="(b, c, v) => emit('go', b, c, v)" />
      <CompareVersions v-else-if="tab === 'compare'" />
      <VerseNote v-else-if="tab === 'notes'" @go="(b, c, v) => emit('go', b, c, v)" />
      <CommentaryView v-else-if="tab === 'commentary'" />
      <DictionaryView v-else-if="tab === 'dictionary'" />
    </div>
  </aside>
</template>

<style scoped>
.study {
  position: sticky; top: var(--bar-h);
  width: var(--panel-w); height: calc(100dvh - var(--bar-h));
  display: flex; flex-direction: column;
  border-left: 1px solid var(--border); background: var(--bg-elevated);
}
.handle { display: none; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 18px 12px 10px 20px; }
.head h2 { font-family: var(--font-serif); font-size: 20px; font-weight: 600; margin-top: 2px; }
.tabs { display: grid; grid-template-columns: repeat(5, 1fr); padding: 0 8px; border-bottom: 1px solid var(--border); }
.tab {
  display: grid; justify-items: center; gap: 4px; padding: 8px 2px 9px; min-width: 0;
  border: 0; background: transparent; color: var(--text-3);
  font-size: 11px; font-weight: 600; white-space: nowrap;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color var(--dur) var(--ease), border-color var(--dur) var(--ease);
}
.tab span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.tab svg { width: 18px; height: 18px; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.body { flex: 1; overflow: auto; overscroll-behavior: contain; }

@media (max-width: 1024px) {
  .study {
    position: fixed; z-index: 45; top: auto; right: 0; bottom: 0; left: auto;
    height: 100dvh; box-shadow: var(--shadow-l);
  }
}

@media (max-width: 720px) {
  .study {
    left: 0; width: 100%; height: 72dvh;
    bottom: calc(var(--bottom-nav-h) + env(safe-area-inset-bottom));
    border-left: 0; border-top: 1px solid var(--border);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }
  .handle { display: block; width: 40px; height: 4px; border-radius: 4px; background: var(--border-strong); margin: 8px auto 0; }
  .head { padding-top: 8px; }
}
</style>
