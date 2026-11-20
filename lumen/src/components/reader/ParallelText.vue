<script setup lang="ts">
import { computed } from 'vue'
import { StickyNote } from 'lucide-vue-next'
import type { ChapterColumn } from '@/composables/chapter'
import { useLocale } from '@/composables/locale'
import { useVerseInteractions } from '@/composables/verses'
import { useReader } from '@/stores/reader'
import { useSettings } from '@/stores/settings'

const props = defineProps<{ columns: ChapterColumn[]; flash: number | null }>()
const reader = useReader()
const settings = useSettings()
const { bookName } = useLocale()
const { classes, onClick, openNote, hasNote } = useVerseInteractions()

/** Unión ordenada de los números de versículo de todas las versiones. */
const verses = computed(() => {
  const set = new Set<number>()
  for (const c of props.columns) for (const r of c.rows) set.add(r.verse)
  return [...set].sort((a, b) => a - b)
})
const lookup = computed(() => props.columns.map((c) => new Map(c.rows.map((r) => [r.verse, r.html]))))
</script>

<template>
  <article class="parallel" :class="{ 'no-strong': !settings.prefs.strongs }" :style="{ '--cols': columns.length }">
    <header class="head">
      <h1>{{ bookName(reader.passage.book) }} <span class="num">{{ reader.passage.chapter }}</span></h1>
    </header>
    <div class="grid">
      <div class="row labels">
        <span class="gutter" />
        <span v-for="c in columns" :key="c.id" class="label" :title="c.title">{{ c.abbreviation }}</span>
      </div>
      <div
        v-for="v in verses" :id="`v${v}`" :key="v"
        class="row verse" :class="[classes(v), { flash: flash === v }]" @click="onClick(v, $event)"
      >
        <span class="gutter vnum">{{ v }}<button v-if="hasNote(v)" class="mark" @click.stop="openNote(v)"><StickyNote /></button></span>
        <div v-for="(c, i) in columns" :key="c.id" class="cell" :dir="c.rtl ? 'rtl' : 'ltr'">
          <span class="cell-label">{{ c.abbreviation }}</span>
          <span v-if="lookup[i].has(v)" class="vt" v-html="lookup[i].get(v)" />
          <span v-else class="missing">—</span>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.parallel { max-width: calc(var(--read-measure) * 0.62 * var(--cols) + 3rem); margin: 0 auto; }
.head { text-align: center; margin: 8px 0 28px; }
.head h1 { font-family: var(--font-serif); font-weight: 500; font-size: clamp(28px, 4vw, 38px); letter-spacing: -0.02em; }
.num { color: var(--accent); }
.grid { font-family: var(--font-read); font-size: calc(var(--read-size) * 0.94); line-height: calc(var(--read-leading) * 0.96); }
.row {
  display: grid; grid-template-columns: 2.4rem repeat(var(--cols), minmax(0, 1fr)); gap: 0 28px;
  padding: 10px 12px; border-radius: 12px;
}
.labels {
  position: sticky; top: var(--bar-h); z-index: 2;
  padding-top: 8px; padding-bottom: 8px; background: var(--bg);
  border-bottom: 1px solid var(--border); border-radius: 0; margin-bottom: 6px;
}
.label { font-family: var(--font-ui); font-size: 12px; font-weight: 700; letter-spacing: 0.06em; color: var(--accent); }
.verse { cursor: pointer; transition: background-color 180ms var(--ease); }
.verse:hover { background: var(--surface); }
.verse.selected { box-shadow: inset 3px 0 0 var(--accent); }
.verse.selected:not(.hl) { background: var(--selection); }
.hl-gold { background: var(--hl-gold); } .hl-mint { background: var(--hl-mint); } .hl-sky { background: var(--hl-sky); }
.hl-lilac { background: var(--hl-lilac); } .hl-rose { background: var(--hl-rose); }
.verse.flash { animation: flash 1.8s var(--ease); }
@keyframes flash { 0%, 30% { box-shadow: inset 0 0 0 999px var(--accent-soft); } 100% { box-shadow: inset 0 0 0 999px transparent; } }
.vnum { font-family: var(--font-ui); font-size: 12px; font-weight: 650; color: var(--accent); padding-top: 0.35em; display: grid; justify-items: start; gap: 6px; }
.cell-label { display: none; }
.missing { color: var(--text-3); }
.mark { display: grid; place-items: center; width: 20px; height: 20px; border: 0; border-radius: 6px; background: var(--accent-soft); color: var(--accent); padding: 0; }
.mark svg { width: 12px; height: 12px; }
.vt :deep(.strong) { font-family: var(--font-ui); font-size: 0.55em; color: var(--text-3); vertical-align: 0.8em; line-height: 0; margin-left: 0.15em; }
.no-strong .vt :deep(.strong) { display: none; }
.vt :deep(.woj) { color: #a5352a; }
:root[data-theme='dark'] .vt :deep(.woj) { color: #e98a7b; }
.vt :deep(.note) { display: none; }

@media (max-width: 820px) {
  .labels { display: none; }
  .row { grid-template-columns: 1fr; gap: 6px; padding: 12px 10px; border-bottom: 1px solid var(--border); border-radius: 0; }
  .vnum { grid-auto-flow: column; justify-content: start; align-items: center; padding: 0; font-size: 13px; }
  .cell { display: grid; grid-template-columns: 4.2rem 1fr; gap: 10px; }
  .cell-label { display: block; font-family: var(--font-ui); font-size: 11px; font-weight: 700; color: var(--text-3); letter-spacing: 0.05em; padding-top: 0.45em; }
}
</style>
