<script setup lang="ts">
import { onMounted } from 'vue'
import { Code, Gift, HandHeart, Lock, WifiOff, Layers } from 'lucide-vue-next'
import LumenLogo from '@/components/common/LumenLogo.vue'
import { APP } from '@/config'
import { useLibrary } from '@/stores/library'

const library = useLibrary()
onMounted(() => void library.fetchCatalog())
const values = [
  { icon: Gift, title: 'about.values.free', text: 'about.values.freeText' },
  { icon: Lock, title: 'about.values.private', text: 'about.values.privateText' },
  { icon: WifiOff, title: 'about.values.offline', text: 'about.values.offlineText' },
  { icon: Layers, title: 'about.values.open', text: 'about.values.openText' },
]
</script>

<template>
  <div class="page narrow">
    <header class="hero">
      <LumenLogo :size="76" />
      <h1 class="page-title">Lumen</h1>
      <p class="page-sub">{{ $t('about.tagline') }}</p>
    </header>

    <blockquote class="verse">
      <p>{{ $t('about.verse') }}</p>
      <cite>{{ $t('about.verseRef') }}</cite>
    </blockquote>

    <p class="mission">{{ $t('about.mission') }}</p>

    <div class="values">
      <article v-for="v in values" :key="v.title" class="value card">
        <component :is="v.icon" />
        <h3>{{ $t(v.title) }}</h3>
        <p>{{ $t(v.text) }}</p>
      </article>
    </div>

    <section class="section support card">
      <HandHeart class="heart" />
      <h2>{{ $t('about.support') }}</h2>
      <p>{{ $t('about.supportText') }}</p>
      <div v-if="APP.donations.length" class="links">
        <a v-for="d in APP.donations" :key="d.url" :href="d.url" target="_blank" rel="noopener" class="btn btn-primary">{{ d.label }}</a>
      </div>
      <p v-else class="soon">{{ $t('about.donationsSoon') }}</p>
      <p class="contribute">{{ $t('about.contribute') }}</p>
      <a v-if="APP.repoUrl" :href="APP.repoUrl" target="_blank" rel="noopener" class="btn btn-sm"><Code /> {{ $t('about.code') }}</a>
    </section>

    <section class="section">
      <h2 class="section-title">{{ $t('about.credits') }}</h2>
      <ul class="credits">
        <li v-for="m in library.catalog ?? []" :key="m.id"><strong>{{ m.title }}</strong> — {{ m.license }}</li>
        <li><strong>OpenBible.info</strong> — Cross references (CC BY)</li>
        <li><strong>scrollmapper/bible_databases</strong> — fuentes de texto</li>
        <li><strong>SQLite · sql.js · Vue</strong> — tecnología</li>
      </ul>
      <p class="version">{{ $t('about.version', { v: APP.version }) }}</p>
    </section>
  </div>
</template>

<style scoped>
.narrow { max-width: 780px; }
.hero { display: grid; justify-items: center; text-align: center; gap: 10px; padding-top: 12px; }
.hero .page-title { margin-top: 8px; }
.verse { margin: 40px auto 0; max-width: 40ch; text-align: center; text-wrap: balance; }
.verse p { font-family: var(--font-serif); font-size: clamp(21px, 3vw, 26px); line-height: 1.45; font-style: italic; }
.verse cite { display: block; margin-top: 10px; font-style: normal; font-size: 13px; font-weight: 650; letter-spacing: 0.06em; color: var(--accent); text-transform: uppercase; }
.mission { margin: 36px auto 0; max-width: 62ch; text-align: center; font-size: 16.5px; line-height: 1.7; color: var(--text-2); }
.values { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 40px; }
.value { padding: 22px; }
.value svg { width: 22px; height: 22px; color: var(--accent); }
.value h3 { margin-top: 12px; font-size: 16px; }
.value p { margin-top: 6px; color: var(--text-2); font-size: 14px; }
.support { display: grid; justify-items: center; text-align: center; gap: 10px; padding: 36px 28px; background: linear-gradient(180deg, var(--accent-soft), transparent 70%), var(--bg-elevated); }
.heart { width: 30px; height: 30px; color: var(--accent); }
.support h2 { font-family: var(--font-serif); font-size: 26px; }
.support p { max-width: 54ch; color: var(--text-2); }
.links { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 6px; }
.soon { font-weight: 600; color: var(--accent) !important; }
.contribute { font-size: 14px; }
.credits { margin: 0; padding-left: 18px; display: grid; gap: 8px; color: var(--text-2); font-size: 14.5px; }
.version { margin-top: 24px; font-size: 12.5px; color: var(--text-3); }
@media (max-width: 600px) { .values { grid-template-columns: 1fr; } }
</style>
