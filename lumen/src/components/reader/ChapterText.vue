<script setup lang="ts">
import { computed } from 'vue'
import { Bookmark, StickyNote } from 'lucide-vue-next'
import type { ChapterColumn } from '@/composables/chapter'
import { useLocale } from '@/composables/locale'
import { useVerseInteractions } from '@/composables/verses'
import { useReader } from '@/stores/reader'
import { useSettings } from '@/stores/settings'

const props = defineProps<{ column: ChapterColumn; flash: number | null }>()
const reader = useReader()
const settings = useSettings()
const { bookName } = useLocale()
const { classes, onClick, openNote, hasNote, hasBookmark } = useVerseInteractions()
const paragraph = computed(() => settings.prefs.layout === 'paragraph')
</script>

<template>
  <article
    class="chapter"
    :class="[settings.prefs.layout, { 'no-num': !settings.prefs.verseNumbers, 'no-strong': !settings.prefs.strongs }]"
    :dir="column.rtl ? 'rtl' : 'ltr'"
  >
    <header class="head">
      <p class="eyebrow">{{ column.title }}</p>
      <h1>{{ bookName(reader.passage.book) }}<span v-if="!paragraph" class="num"> {{ reader.passage.chapter }}</span></h1>
    </header>

    <p v-if="column.error" class="notice">{{ $t('reader.loadError') }} <small>{{ column.error }}</small></p>
    <p v-else-if="!column.rows.length" class="notice">{{ $t('reader.missingChapter') }}</p>

    <div v-else class="text">
      <span v-if="paragraph" class="dropcap" aria-hidden="true">{{ reader.passage.chapter }}</span>
      <span
        v-for="(r, i) in column.rows" :id="`v${r.verse}`" :key="r.verse"
        class="verse" :class="[classes(r.verse), { flash: flash === r.verse }]"
        :data-v="r.verse" @click="onClick(r.verse, $event)"
      ><sup v-if="!(paragraph && i === 0)" class="vnum">{{ r.verse }}</sup><span class="vt" v-html="r.html" /><button
          v-if="hasNote(r.verse)" class="mark note" :aria-label="$t('selection.note')" @click.stop="openNote(r.verse)"
        ><StickyNote /></button><span v-if="hasBookmark(r.verse)" class="mark"><Bookmark /></span>{{ ' ' }}</span>
    </div>
  </article>
</template>

<style scoped>
.chapter { max-width: var(--read-measure); margin: 0 auto; }
.head { text-align: center; margin: 8px 0 36px; }
.head .eyebrow { margin-bottom: 10px; }
.head h1 {
  font-family: var(--font-serif); font-weight: 500;
  font-size: clamp(30px, 5vw, 42px); letter-spacing: -0.02em; line-height: 1.15;
}
.head .num { color: var(--accent); }

.text {
  font-family: var(--font-read);
  font-size: var(--read-size);
  line-height: var(--read-leading);
  color: var(--text);
  text-wrap: pretty;
  hanging-punctuation: first;
  font-variant-ligatures: common-ligatures;
}
.paragraph .text { text-align: justify; hyphens: auto; -webkit-hyphens: auto; }
/* En pantallas estrechas la justificación abre huecos: se alinea a la izquierda */
@media (max-width: 560px) { .paragraph .text { text-align: start; } }

.dropcap {
  float: left;
  font-family: var(--font-serif);
  font-size: calc(var(--read-size) * var(--read-leading) * 2.05);
  line-height: 0.82;
  font-weight: 500;
  color: var(--accent);
  margin: 0.1em 0.14em 0 -0.04em;
  padding-top: 0.04em;
  font-variant-numeric: lining-nums;
  pointer-events: none;
  user-select: none;
}
[dir='rtl'] .dropcap { float: right; margin: 0.1em -0.04em 0 0.14em; }

.verse {
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 180ms var(--ease), box-shadow 180ms var(--ease);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  padding: 0.06em 0;
}
.verses .verse { display: block; position: relative; padding: 0.15em 0 0.15em 2.1em; margin: 0 0 0.35em; }
.verses .vnum { position: absolute; left: 0; top: 0.72em; width: 1.7em; text-align: right; }
.no-num .vnum { display: none; }

.vnum {
  font-family: var(--font-ui);
  font-size: 0.56em; font-weight: 650;
  color: var(--accent);
  vertical-align: 0.62em; line-height: 0;
  margin: 0 0.28em 0 0.1em;
  font-variant-numeric: lining-nums;
  user-select: none;
}

.hl-gold { background: var(--hl-gold); }
.hl-mint { background: var(--hl-mint); }
.hl-sky { background: var(--hl-sky); }
.hl-lilac { background: var(--hl-lilac); }
.hl-rose { background: var(--hl-rose); }

.verse.selected {
  text-decoration: underline dotted var(--accent);
  text-decoration-thickness: 2px;
  text-underline-offset: 0.28em;
}
.verse.selected:not(.hl) { background-color: var(--selection); }
.verse.flash { animation: flash 1.8s var(--ease); }
/* Sombra interior: resalta sin tapar el color de subrayado */
@keyframes flash { 0%, 30% { box-shadow: inset 0 0 0 999px var(--accent-soft), 0 0 0 4px var(--accent-soft); } 100% { box-shadow: inset 0 0 0 999px transparent, 0 0 0 4px transparent; } }

.mark {
  display: inline-grid; place-items: center; vertical-align: 0.1em;
  width: 1.15em; height: 1.15em; margin: 0 0.1em; padding: 0;
  border: 0; border-radius: 6px; background: var(--accent-soft); color: var(--accent);
}
.mark svg { width: 0.7em; height: 0.7em; }

.vt :deep(.strong) {
  font-family: var(--font-ui); font-size: 0.5em; font-weight: 600; color: var(--text-3);
  margin-left: 0.15em; cursor: help; vertical-align: 0.8em; line-height: 0;
}
.vt :deep(.strong:hover) { color: var(--accent); }
.no-strong .vt :deep(.strong) { display: none; }
.vt :deep(.woj) { color: #a5352a; }
:root[data-theme='dark'] .vt :deep(.woj) { color: #e98a7b; }
.vt :deep(.note) { display: none; }
.vt :deep(.title) { display: block; font-weight: 600; font-size: 0.85em; color: var(--text-2); margin: 0.6em 0 0.2em; }

.notice { text-align: center; color: var(--text-3); padding: 40px 0; font-size: 15px; }
.notice small { display: block; margin-top: 8px; font-size: 12px; opacity: 0.8; }
</style>
