<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, RotateCcw, Trash2, Upload } from 'lucide-vue-next'
import { LOCALES, type Locale } from '@/core/canon'
import { engine } from '@/core/engine/client'
import { verseKey } from '@/core/reference'
import { detectLocale, setLocale } from '@/i18n'
import { useBackup } from '@/composables/backup'
import { toast } from '@/composables/toast'
import { useAnnotations } from '@/stores/annotations'
import { useLibrary } from '@/stores/library'
import { useSettings, type ThemeChoice } from '@/stores/settings'

const settings = useSettings()
const library = useLibrary()
const notes = useAnnotations()
const { t } = useI18n()
const { exportFile, importFile } = useBackup()
const prefs = computed(() => settings.prefs)

const themes: { id: ThemeChoice; bg: string; fg: string; accent: string }[] = [
  { id: 'auto', bg: 'linear-gradient(135deg,#fbfaf7 50%,#131417 50%)', fg: '#1e1b16', accent: '#96661c' },
  { id: 'light', bg: '#fbfaf7', fg: '#1e1b16', accent: '#96661c' },
  { id: 'sepia', bg: '#f4ecdc', fg: '#392c1c', accent: '#8c5718' },
  { id: 'dark', bg: '#131417', fg: '#ebe6dc', accent: '#dcae62' },
]

const locale = computed({
  get: () => prefs.value.locale ?? 'auto',
  set: (v: Locale | 'auto') => {
    prefs.value.locale = v === 'auto' ? null : v
    setLocale(prefs.value.locale ?? detectLocale())
  },
})

const preview = ref('En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios. Este era en el principio con Dios.')
watch(() => prefs.value.bibles[0], async (id) => {
  if (!id) return
  try {
    await library.ensureOpen(id)
    preview.value = (await engine().plain(id, [{ start: verseKey(43, 1, 1), end: verseKey(43, 1, 3) }]))[0]
  } catch { /* se mantiene el texto de ejemplo */ }
}, { immediate: true })

async function clearAll() {
  if (!confirm(t('settings.clearConfirm'))) return
  await notes.clearAll()
  toast(t('settings.cleared'))
}
</script>

<template>
  <div class="page narrow">
    <h1 class="page-title">{{ $t('settings.title') }}</h1>

    <section class="section">
      <h2 class="section-title">{{ $t('settings.appearance') }}</h2>
      <div class="themes">
        <button v-for="th in themes" :key="th.id" class="theme" :class="{ on: prefs.theme === th.id }" @click="prefs.theme = th.id">
          <span class="sample" :style="{ background: th.bg, color: th.fg }">
            <span class="aa">Aa</span><span class="line" :style="{ background: th.accent }" />
          </span>
          <span class="name">{{ $t(`settings.themes.${th.id}`) }}</span>
        </button>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">{{ $t('settings.reading') }}</h2>
      <div class="card group">
        <div class="row">
          <span>{{ $t('settings.font') }}</span>
          <div class="segmented">
            <button class="serif" :class="{ active: prefs.font === 'serif' }" @click="prefs.font = 'serif'">{{ $t('settings.serif') }}</button>
            <button :class="{ active: prefs.font === 'sans' }" @click="prefs.font = 'sans'">{{ $t('settings.sans') }}</button>
          </div>
        </div>
        <div class="row">
          <span>{{ $t('settings.size') }} <small>{{ prefs.fontSize }}px</small></span>
          <input v-model.number="prefs.fontSize" type="range" min="14" max="30" step="1">
        </div>
        <div class="row">
          <span>{{ $t('settings.leading') }} <small>{{ prefs.leading.toFixed(2) }}</small></span>
          <input v-model.number="prefs.leading" type="range" min="1.4" max="2.2" step="0.05">
        </div>
        <div class="row">
          <span>{{ $t('settings.layout') }}</span>
          <div class="segmented">
            <button :class="{ active: prefs.layout === 'paragraph' }" @click="prefs.layout = 'paragraph'">{{ $t('settings.paragraph') }}</button>
            <button :class="{ active: prefs.layout === 'verses' }" @click="prefs.layout = 'verses'">{{ $t('settings.verses') }}</button>
          </div>
        </div>
        <label class="row"><span>{{ $t('settings.verseNumbers') }}</span><input v-model="prefs.verseNumbers" type="checkbox" class="switch"></label>
        <label class="row"><span>{{ $t('settings.strongs') }}</span><input v-model="prefs.strongs" type="checkbox" class="switch"></label>
        <div class="preview">
          <p class="eyebrow">{{ $t('settings.preview') }}</p>
          <p class="sample-text">{{ preview }}</p>
        </div>
      </div>
      <button class="btn btn-ghost btn-sm reset" @click="settings.reset()"><RotateCcw /> {{ $t('settings.reset') }}</button>
    </section>

    <section class="section">
      <h2 class="section-title">{{ $t('settings.language') }}</h2>
      <div class="segmented langs">
        <button :class="{ active: locale === 'auto' }" @click="locale = 'auto'">{{ $t('settings.auto') }}</button>
        <button v-for="l in LOCALES" :key="l" :class="{ active: locale === l }" @click="locale = l">{{ $t(`lang.${l}`) }}</button>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">{{ $t('settings.data') }}</h2>
      <p class="page-sub small">{{ $t('settings.dataText') }}</p>
      <div class="data">
        <button class="btn" @click="exportFile"><Download /> {{ $t('settings.export') }}</button>
        <button class="btn" @click="importFile"><Upload /> {{ $t('settings.import') }}</button>
        <button class="btn btn-danger" @click="clearAll"><Trash2 /> {{ $t('settings.clear') }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.narrow { max-width: 760px; }
.section-title { margin-bottom: 14px; }
.themes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.theme { display: grid; gap: 8px; padding: 0; border: 0; background: transparent; text-align: center; }
.sample {
  display: grid; align-content: center; justify-items: start; gap: 8px; height: 92px; padding: 0 16px;
  border-radius: var(--radius-l); border: 1px solid var(--border); box-shadow: var(--shadow-s);
  transition: box-shadow var(--dur) var(--ease), transform 160ms var(--ease);
}
.theme:hover .sample { transform: translateY(-2px); }
.theme.on .sample { box-shadow: 0 0 0 2px var(--accent), var(--shadow-m); }
.aa { font-family: var(--font-serif); font-size: 26px; font-weight: 600; }
.line { width: 40%; height: 4px; border-radius: 4px; }
.name { font-size: 13px; font-weight: 600; color: var(--text-2); }
.theme.on .name { color: var(--accent); }
.group { display: grid; padding: 6px 20px; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 58px; border-bottom: 1px solid var(--border); }
.row small { color: var(--text-3); margin-left: 6px; font-variant-numeric: tabular-nums; }
.row input[type='range'] { width: min(260px, 50%); accent-color: var(--accent); }
.serif { font-family: var(--font-serif); }
.switch { appearance: none; width: 44px; height: 26px; border-radius: 26px; background: var(--surface-2); position: relative; cursor: pointer; transition: background var(--dur) var(--ease); flex: none; }
.switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: var(--shadow-s); transition: transform var(--dur) var(--ease); }
.switch:checked { background: var(--accent); }
.switch:checked::after { transform: translateX(18px); }
.preview { padding: 18px 0 16px; }
.sample-text { margin-top: 10px; font-family: var(--font-read); font-size: var(--read-size); line-height: var(--read-leading); }
.reset { margin-top: 10px; }
.langs { flex-wrap: wrap; }
.small { font-size: 14px; margin: -6px 0 14px; max-width: 60ch; }
.data { display: flex; flex-wrap: wrap; gap: 10px; }
@media (max-width: 600px) { .themes { grid-template-columns: repeat(2, 1fr); } }
</style>
