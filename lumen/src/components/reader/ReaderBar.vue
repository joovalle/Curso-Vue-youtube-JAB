<script setup lang="ts">
import { computed } from 'vue'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Columns2, Minus, PanelRight, Plus, Search, Type } from 'lucide-vue-next'
import PopMenu from '@/components/common/PopMenu.vue'
import { useLocale } from '@/composables/locale'
import { nextChapter, prevChapter } from '@/core/reference'
import { useLibrary } from '@/stores/library'
import { useReader } from '@/stores/reader'
import { useSettings, type ThemeChoice } from '@/stores/settings'

const emit = defineEmits<{ go: [book: number, chapter: number] }>()
const reader = useReader()
const settings = useSettings()
const library = useLibrary()
const { bookName } = useLocale()
const prefs = computed(() => settings.prefs)

const prev = computed(() => prevChapter(reader.passage))
const next = computed(() => nextChapter(reader.passage))
const MAX_PARALLEL = 4

const activeLabel = computed(() => {
  const ids = prefs.value.parallel ? prefs.value.bibles : prefs.value.bibles.slice(0, 1)
  return ids.map((id) => library.get(id)?.info.abbreviation ?? '—').join(' · ') || '—'
})

function pick(id: string) {
  const list = [...prefs.value.bibles]
  if (!prefs.value.parallel) {
    prefs.value.bibles = [id, ...list.filter((b) => b !== id)]
    return
  }
  if (list.includes(id)) {
    if (list.length > 1) prefs.value.bibles = list.filter((b) => b !== id)
  } else if (list.length < MAX_PARALLEL) {
    prefs.value.bibles = [...list, id]
  }
}

function toggleParallel() {
  prefs.value.parallel = !prefs.value.parallel
  if (prefs.value.parallel && prefs.value.bibles.length < 2) {
    const other = library.bibles.find((b) => !prefs.value.bibles.includes(b.id))
    if (other) prefs.value.bibles = [...prefs.value.bibles, other.id]
  }
}

const themes: { id: ThemeChoice; bg: string; fg: string }[] = [
  { id: 'light', bg: '#fbfaf7', fg: '#1e1b16' },
  { id: 'sepia', bg: '#f4ecdc', fg: '#392c1c' },
  { id: 'dark', bg: '#131417', fg: '#ebe6dc' },
  { id: 'auto', bg: 'linear-gradient(135deg,#fbfaf7 50%,#131417 50%)', fg: '#96661c' },
]
const size = (d: number) => (prefs.value.fontSize = Math.min(30, Math.max(14, prefs.value.fontSize + d)))
</script>

<template>
  <header class="bar">
    <div class="left">
      <button class="passage" :aria-label="$t('reader.choosePassage')" @click="reader.pickerOpen = true">
        <span class="book">{{ bookName(reader.passage.book) }}</span>
        <span class="ch">{{ reader.passage.chapter }}</span>
        <ChevronDown class="chev" />
      </button>
      <div class="nav-arrows">
        <button class="icon-btn" :disabled="!prev" :title="$t('reader.prevChapter')" :aria-label="$t('reader.prevChapter')" @click="prev && emit('go', prev.book, prev.chapter)"><ChevronLeft /></button>
        <button class="icon-btn" :disabled="!next" :title="$t('reader.nextChapter')" :aria-label="$t('reader.nextChapter')" @click="next && emit('go', next.book, next.chapter)"><ChevronRight /></button>
      </div>
    </div>

    <div class="right">
      <PopMenu width="300px">
        <template #trigger="{ toggle, open }">
          <button class="version" :class="{ open }" :title="$t('reader.version')" @click="toggle">
            <span>{{ activeLabel }}</span><ChevronDown />
          </button>
        </template>
        <template #default="{ close }">
          <p class="menu-label">{{ prefs.parallel ? $t('reader.addVersion') : $t('reader.version') }}</p>
          <button
            v-for="b in library.bibles" :key="b.id" class="menu-item"
            :class="{ on: prefs.parallel ? prefs.bibles.includes(b.id) : prefs.bibles[0] === b.id }"
            @click="pick(b.id); !prefs.parallel && close()"
          >
            <span class="abbr">{{ b.info.abbreviation }}</span>
            <span class="title">{{ b.info.title }}</span>
            <Check class="tick" />
          </button>
          <RouterLink to="/library" class="menu-foot" @click="close()"><Plus /> {{ $t('nav.library') }}</RouterLink>
        </template>
      </PopMenu>

      <button class="icon-btn hide-sm" :class="{ active: prefs.parallel }" :title="$t('reader.parallel')" :aria-pressed="prefs.parallel" @click="toggleParallel">
        <Columns2 />
      </button>

      <PopMenu width="300px">
        <template #trigger="{ toggle, open }">
          <button class="icon-btn" :class="{ active: open }" :title="$t('reader.textSettings')" @click="toggle"><Type /></button>
        </template>
        <div class="text-menu">
          <div class="themes">
            <button
              v-for="th in themes" :key="th.id" class="swatch" :class="{ on: prefs.theme === th.id }"
              :style="{ background: th.bg, color: th.fg }" :title="$t(`settings.themes.${th.id}`)" @click="prefs.theme = th.id"
            >Aa</button>
          </div>
          <div class="row">
            <button class="icon-btn" :aria-label="'-'" @click="size(-1)"><Minus /></button>
            <span class="size">{{ prefs.fontSize }}</span>
            <button class="icon-btn" :aria-label="'+'" @click="size(1)"><Plus /></button>
          </div>
          <div class="segmented full">
            <button :class="{ active: prefs.font === 'serif' }" class="serif" @click="prefs.font = 'serif'">{{ $t('settings.serif') }}</button>
            <button :class="{ active: prefs.font === 'sans' }" @click="prefs.font = 'sans'">{{ $t('settings.sans') }}</button>
          </div>
          <div class="segmented full">
            <button :class="{ active: prefs.layout === 'paragraph' }" @click="prefs.layout = 'paragraph'">{{ $t('settings.paragraph') }}</button>
            <button :class="{ active: prefs.layout === 'verses' }" @click="prefs.layout = 'verses'">{{ $t('settings.verses') }}</button>
          </div>
        </div>
      </PopMenu>

      <button class="icon-btn hide-sm" :title="$t('nav.search') + ' (Ctrl K)'" @click="reader.paletteOpen = true"><Search /></button>
      <button class="icon-btn" :class="{ active: prefs.studyOpen }" :title="$t('reader.study')" :aria-pressed="prefs.studyOpen" @click="prefs.studyOpen = !prefs.studyOpen">
        <PanelRight />
      </button>
    </div>
  </header>
</template>

<style scoped>
.bar {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  height: var(--bar-h); padding: 0 12px 0 16px;
  background: var(--glass);
  backdrop-filter: saturate(1.6) blur(18px); -webkit-backdrop-filter: saturate(1.6) blur(18px);
  border-bottom: 1px solid var(--border);
}
.left, .right { display: flex; align-items: center; gap: 4px; min-width: 0; }
.passage {
  display: inline-flex; align-items: baseline; gap: 8px; min-width: 0;
  height: 42px; padding: 0 12px; border: 0; border-radius: 12px; background: transparent;
  font-family: var(--font-serif); font-size: 21px; font-weight: 600; letter-spacing: -0.01em;
  transition: background var(--dur) var(--ease);
}
.passage:hover { background: var(--surface); }
.passage .book { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.passage .ch { color: var(--accent); }
.chev { width: 16px; height: 16px; color: var(--text-3); align-self: center; }
.nav-arrows { display: flex; }
.icon-btn:disabled { opacity: 0.35; cursor: default; background: transparent; }

.version {
  display: inline-flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 10px 0 14px; border-radius: 999px;
  border: 1px solid var(--border); background: var(--bg-elevated);
  font-size: 13px; font-weight: 650; letter-spacing: 0.02em; color: var(--text-2);
  max-width: 220px;
}
.version span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.version svg { width: 15px; height: 15px; flex: none; }
.version:hover, .version.open { border-color: var(--border-strong); color: var(--text); }

.menu-label { padding: 6px 10px 8px; font-size: 12px; font-weight: 600; color: var(--text-3); }
.menu-item {
  display: grid; grid-template-columns: 64px 1fr 18px; align-items: center; gap: 8px;
  width: 100%; padding: 10px; border: 0; border-radius: 10px; background: transparent; text-align: left;
}
.menu-item:hover { background: var(--surface); }
.menu-item .abbr { font-weight: 700; font-size: 13px; color: var(--accent); }
.menu-item .title { font-size: 14px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.menu-item .tick { width: 16px; height: 16px; color: var(--accent); opacity: 0; }
.menu-item.on .tick { opacity: 1; }
.menu-foot {
  display: flex; align-items: center; gap: 8px; margin-top: 6px; padding: 10px; border-top: 1px solid var(--border);
  font-size: 13.5px; font-weight: 600; color: var(--text-2);
}
.menu-foot svg { width: 16px; height: 16px; }

.text-menu { display: grid; gap: 12px; padding: 6px; }
.themes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.swatch {
  height: 52px; border-radius: 12px; border: 1px solid var(--border);
  font-family: var(--font-serif); font-size: 17px; font-weight: 600;
  box-shadow: inset 0 0 0 0 var(--accent); transition: box-shadow var(--dur) var(--ease);
}
.swatch.on { box-shadow: inset 0 0 0 2px var(--accent); border-color: var(--accent); }
.row { display: flex; align-items: center; justify-content: space-between; padding: 2px; border-radius: 12px; background: var(--surface); }
.size { font-weight: 650; font-variant-numeric: tabular-nums; }
.segmented.full { display: flex; }
.segmented.full button { flex: 1; }
.serif { font-family: var(--font-serif); }

@media (max-width: 720px) {
  .bar { padding: 0 6px 0 4px; padding-top: env(safe-area-inset-top); height: calc(var(--bar-h) + env(safe-area-inset-top)); }
  .passage { font-size: 19px; padding: 0 8px; }
  .nav-arrows, .hide-sm { display: none; }
  .version { max-width: 120px; padding: 0 8px 0 11px; }
}
</style>
