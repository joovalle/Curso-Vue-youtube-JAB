<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bookmark, BookmarkCheck, Copy, Eraser, GitCompare, Link2, Share2, StickyNote, X } from 'lucide-vue-next'
import { engine } from '@/core/engine/client'
import { formatVerseList, verseKey } from '@/core/reference'
import { HIGHLIGHT_COLORS, type HighlightColor } from '@/core/storage/db'
import { useLocale } from '@/composables/locale'
import { toast } from '@/composables/toast'
import { useAnnotations } from '@/stores/annotations'
import { useLibrary } from '@/stores/library'
import { useReader } from '@/stores/reader'
import { useSettings } from '@/stores/settings'

const reader = useReader()
const notes = useAnnotations()
const library = useLibrary()
const settings = useSettings()
const { t } = useI18n()
const { bookName } = useLocale()

const label = computed(() => `${bookName(reader.passage.book)} ${reader.passage.chapter}:${formatVerseList(reader.selection)}`)
const allBookmarked = computed(() => reader.selectedKeys.every((k) => notes.bookmarks.has(k)))
const canShare = typeof navigator !== 'undefined' && 'share' in navigator

async function highlight(color: HighlightColor | null) {
  await notes.setHighlight(reader.selectedKeys, color)
  reader.clear()
}

/** Texto de los versículos seleccionados, con su referencia. */
async function selectedText(): Promise<string> {
  const id = settings.prefs.bibles[0]
  const { book, chapter } = reader.passage
  const single = reader.selection.length === 1
  const parts = await Promise.all(
    reader.selection.map((v) => engine().plain(id, [{ start: verseKey(book, chapter, v) }]).then(([s]) => (single ? s : `${v} ${s}`))),
  )
  const abbr = library.get(id)?.info.abbreviation ?? ''
  return `«${parts.join(' ')}»\n— ${label.value} ${abbr ? `(${abbr})` : ''}`.trim()
}

async function copy() {
  await navigator.clipboard.writeText(await selectedText())
  toast(t('selection.copied'), 'success')
  reader.clear()
}

async function share() {
  try {
    await navigator.share({ text: await selectedText() })
  } catch {
    /* cancelado */
  }
}

async function bookmark() {
  const target = allBookmarked.value
  for (const k of reader.selectedKeys) if (notes.bookmarks.has(k) === target) await notes.toggleBookmark(k)
  toast(t(target ? 'selection.unbookmarked' : 'selection.bookmarked'), 'success')
}
</script>

<template>
  <Transition name="rise">
    <div v-if="reader.selection.length" class="actions" :class="{ panel: settings.prefs.studyOpen }" role="toolbar" :aria-label="label">
      <div class="top">
        <span class="ref">{{ label }}</span>
        <button class="close" :aria-label="$t('selection.clear')" @click="reader.clear()"><X /></button>
      </div>
      <div class="row">
        <div class="colors">
          <button
            v-for="c in HIGHLIGHT_COLORS" :key="c" class="dot" :class="`c-${c}`"
            :title="$t(`colors.${c}`)" :aria-label="`${$t('selection.highlight')}: ${$t(`colors.${c}`)}`" @click="highlight(c)"
          />
          <button class="dot erase" :title="$t('selection.clearHighlight')" :aria-label="$t('selection.clearHighlight')" @click="highlight(null)"><Eraser /></button>
        </div>
        <span class="sep" />
        <button class="act" @click="reader.openStudy('notes')"><StickyNote /><span>{{ $t('selection.note') }}</span></button>
        <button class="act" @click="reader.openStudy('refs')"><Link2 /><span>{{ $t('selection.refs') }}</span></button>
        <button class="act" @click="reader.openStudy('compare')"><GitCompare /><span>{{ $t('selection.compare') }}</span></button>
        <button class="act" @click="bookmark"><BookmarkCheck v-if="allBookmarked" /><Bookmark v-else /><span>{{ $t('selection.bookmark') }}</span></button>
        <button class="act" @click="copy"><Copy /><span>{{ $t('common.copy') }}</span></button>
        <button v-if="canShare" class="act" @click="share"><Share2 /><span>{{ $t('common.share') }}</span></button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.actions {
  position: fixed; z-index: 40;
  left: 50%; bottom: 22px; transform: translateX(-50%);
  width: max-content; max-width: calc(100vw - 24px);
  padding: 8px 10px 10px; border-radius: 20px;
  background: var(--bg-elevated); border: 1px solid var(--border); box-shadow: var(--shadow-l);
}
.rise-enter-from, .rise-leave-to { transform: translate(-50%, 12px); }
/* Centrada sobre el área de lectura, no sobre toda la ventana */
@media (min-width: 721px) {
  .actions { left: calc((100vw + var(--rail-w)) / 2); max-width: calc(100vw - var(--rail-w) - 24px); }
}
@media (min-width: 1025px) {
  .actions.panel { left: calc((100vw + var(--rail-w) - var(--panel-w)) / 2); max-width: calc(100vw - var(--rail-w) - var(--panel-w) - 24px); }
}
.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 2px 4px 6px 8px; }
.ref { font-family: var(--font-serif); font-weight: 600; font-size: 15px; }
.close { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: 8px; background: transparent; color: var(--text-3); }
.close:hover { background: var(--surface); color: var(--text); }
.close svg { width: 16px; height: 16px; }
.row { display: flex; align-items: center; gap: 2px; overflow-x: auto; scrollbar-width: none; }
.colors { display: flex; align-items: center; gap: 6px; padding: 0 6px; }
.dot {
  width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--bg-elevated);
  box-shadow: 0 0 0 1px var(--border-strong); flex: none; padding: 0;
  transition: transform 140ms var(--ease);
}
.dot:hover { transform: scale(1.14); }
.c-gold { background: #f2c94c; } .c-mint { background: #6fcf97; } .c-sky { background: #67a9f0; }
.c-lilac { background: #b28ee8; } .c-rose { background: #f0889a; }
.erase { display: grid; place-items: center; background: var(--surface); color: var(--text-2); }
.erase svg { width: 14px; height: 14px; }
.sep { width: 1px; height: 30px; background: var(--border); margin: 0 6px; flex: none; }
.act {
  display: grid; justify-items: center; gap: 2px; min-width: 62px; padding: 6px 6px 4px;
  border: 0; border-radius: 12px; background: transparent; color: var(--text-2);
  font-size: 11px; font-weight: 600; flex: none;
}
.act:hover { background: var(--surface); color: var(--text); }
.act svg { width: 19px; height: 19px; }

@media (max-width: 720px) {
  .actions { bottom: calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 10px); width: calc(100vw - 16px); }
  .row { flex-wrap: wrap; overflow: visible; }
  .colors { width: 100%; justify-content: space-between; padding: 2px 6px 10px; }
  .dot { width: 34px; height: 34px; }
  .sep { display: none; }
  .act { flex: 1; min-width: 0; padding: 8px 2px 6px; }
  .act span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
}
</style>
