<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Check, LoaderCircle, Lock } from 'lucide-vue-next'
import LumenLogo from '@/components/common/LumenLogo.vue'
import { LOCALES, type Locale } from '@/core/canon'
import { setLocale } from '@/i18n'
import { toast } from '@/composables/toast'
import { useLibrary } from '@/stores/library'
import { useSettings } from '@/stores/settings'

const router = useRouter()
const library = useLibrary()
const settings = useSettings()
const { locale } = useI18n()

const chosen = ref<string | null>(null)
const xrefs = ref(true)
const busy = ref(false)

const bibles = computed(() => (library.catalog ?? []).filter((m) => m.kind === 'bible'))
const xrefEntry = computed(() => library.catalog?.find((m) => m.kind === 'crossrefs'))
const progress = computed(() => {
  const ids = [chosen.value, xrefs.value ? xrefEntry.value?.id : null].filter(Boolean) as string[]
  const values = ids.map((id) => (library.get(id) ? 1 : library.progress[id] ?? 0))
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
})

function pickDefault() {
  const match = bibles.value.find((b) => b.language === locale.value) ?? bibles.value[0]
  chosen.value = match?.id ?? null
}
onMounted(async () => { await library.fetchCatalog(); pickDefault() })
watch(locale, pickDefault)

function setLang(l: Locale) {
  settings.prefs.locale = l
  setLocale(l)
}

async function start() {
  const bible = bibles.value.find((b) => b.id === chosen.value)
  if (!bible) return
  busy.value = true
  try {
    await Promise.all([
      library.install(bible),
      xrefs.value && xrefEntry.value ? library.install(xrefEntry.value) : Promise.resolve(),
    ])
    settings.prefs.bibles = [bible.id]
    void router.replace({ name: 'read', params: { book: 'John', chapter: 1 } })
  } catch (e) {
    toast((e as Error).message, 'error', 6000)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="welcome">
    <div class="glow" aria-hidden="true" />
    <main class="box">
      <LumenLogo :size="72" class="logo" />
      <h1>{{ $t('welcome.title') }}</h1>
      <p class="sub">{{ $t('welcome.subtitle') }}</p>

      <div class="langs" role="group" :aria-label="$t('welcome.language')">
        <button v-for="l in LOCALES" :key="l" class="chip" :class="{ active: locale === l }" @click="setLang(l)">{{ $t(`lang.${l}`) }}</button>
      </div>

      <h2 class="eyebrow">{{ $t('welcome.chooseBible') }}</h2>
      <div v-if="!library.catalog && !library.catalogError" class="loading"><LoaderCircle class="spin" /></div>
      <p v-else-if="library.catalogError" class="error">{{ $t('library.catalogError') }}</p>
      <div class="bibles">
        <button v-for="b in bibles" :key="b.id" class="bible" :class="{ on: chosen === b.id }" :disabled="busy" @click="chosen = b.id">
          <span class="check"><Check /></span>
          <span class="text">
            <strong>{{ b.title }}</strong>
            <small>{{ $t(`lang.${b.language}`) }} · {{ b.license }} · {{ (b.size / 1e6).toFixed(1) }} MB</small>
          </span>
        </button>
      </div>

      <label v-if="xrefEntry" class="xref">
        <input v-model="xrefs" type="checkbox" :disabled="busy">
        <span>{{ $t('welcome.includeXrefs') }} <small>· {{ (xrefEntry.size / 1e6).toFixed(1) }} MB</small></span>
      </label>

      <button class="btn btn-primary btn-lg start" :disabled="!chosen || busy" @click="start">
        <template v-if="busy"><LoaderCircle class="spin" /> {{ $t('welcome.starting') }}</template>
        <template v-else>{{ $t('welcome.start') }}</template>
      </button>
      <div v-if="busy" class="bar"><i :style="{ width: `${Math.round(progress * 100)}%` }" /></div>

      <p class="privacy"><Lock /> {{ $t('welcome.privacy') }}</p>
      <p class="esword">{{ $t('welcome.haveEsword') }} <RouterLink to="/library">{{ $t('welcome.importInstead') }}</RouterLink></p>
    </main>
  </div>
</template>

<style scoped>
.welcome { position: relative; min-height: 100dvh; display: grid; place-items: center; padding: 32px 18px 120px; overflow: hidden; }
.glow {
  position: absolute; inset: -30% -10% auto; height: 70vh; pointer-events: none;
  background: radial-gradient(closest-side, var(--accent-soft), transparent);
  filter: blur(20px);
}
.box { position: relative; width: min(520px, 100%); display: grid; justify-items: center; text-align: center; }
.logo { filter: drop-shadow(0 18px 30px rgba(150, 102, 28, 0.3)); }
h1 { margin-top: 22px; font-family: var(--font-serif); font-size: clamp(32px, 6vw, 44px); font-weight: 600; letter-spacing: -0.02em; }
.sub { margin-top: 10px; color: var(--text-2); font-size: 16.5px; max-width: 40ch; }
.langs { display: flex; gap: 8px; margin: 26px 0 30px; }
.chip { cursor: pointer; height: 34px; padding: 0 14px; }
.eyebrow { margin-bottom: 12px; }
.loading { padding: 20px; }
.error { color: var(--text-3); }
.bibles { display: grid; gap: 8px; width: 100%; }
.bible {
  display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 16px; text-align: left;
  border-radius: var(--radius-l); border: 1px solid var(--border); background: var(--bg-elevated);
  transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
}
.bible:hover { border-color: var(--border-strong); }
.bible.on { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.check { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid var(--border-strong); flex: none; color: transparent; }
.check svg { width: 14px; height: 14px; }
.bible.on .check { background: var(--accent); border-color: var(--accent); color: var(--accent-contrast); }
.text { display: grid; gap: 2px; }
.text strong { font-family: var(--font-serif); font-size: 17px; font-weight: 600; }
.text small { color: var(--text-3); font-size: 12.5px; }
.xref { display: flex; align-items: center; gap: 10px; margin-top: 16px; font-size: 14px; color: var(--text-2); cursor: pointer; }
.xref input { width: 18px; height: 18px; accent-color: var(--accent); }
.xref small { color: var(--text-3); }
.start { width: 100%; margin-top: 24px; }
.bar { width: 100%; height: 4px; margin-top: 12px; border-radius: 4px; background: var(--surface-2); overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--accent); transition: width 200ms linear; }
.privacy { display: flex; align-items: center; gap: 8px; margin-top: 20px; font-size: 13px; color: var(--text-3); }
.privacy svg { width: 14px; height: 14px; }
.esword { margin-top: 8px; font-size: 13px; color: var(--text-3); }
</style>
