<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Check, Download, FileUp, HardDrive, LoaderCircle, ShieldCheck, Trash2 } from 'lucide-vue-next'
import ModuleCard from '@/components/common/ModuleCard.vue'
import { toast } from '@/composables/toast'
import { useLibrary, IMPORT_EXTENSIONS, type CatalogEntry } from '@/stores/library'
import { useSettings } from '@/stores/settings'
import type { InstalledModule } from '@/core/storage/db'

const library = useLibrary()
const settings = useSettings()
const router = useRouter()
const { t } = useI18n()
const dragging = ref(false)
const importing = ref(0)
const usage = ref<string | null>(null)
const fileInput = ref<HTMLInputElement>()

const mb = (bytes: number) => (bytes < 1e5 ? `${Math.max(1, Math.round(bytes / 1e3))} KB` : `${(bytes / 1e6).toFixed(bytes < 1e7 ? 1 : 0)} MB`)
const available = computed(() => (library.catalog ?? []).filter((c) => !library.get(c.id)))

async function refreshUsage() {
  try {
    const est = await navigator.storage?.estimate?.()
    if (est?.usage) usage.value = mb(est.usage)
  } catch { /* no disponible */ }
}
onMounted(() => { void library.fetchCatalog(); void refreshUsage() })

async function install(entry: CatalogEntry) {
  try {
    await library.install(entry)
    toast(t('library.importOk', { name: entry.title }), 'success')
    void refreshUsage()
  } catch (e) {
    toast(t('library.importFail', { name: entry.title, error: (e as Error).message }), 'error', 6000)
  }
}

async function importFiles(files: FileList | File[] | null | undefined) {
  for (const file of Array.from(files ?? [])) {
    importing.value++
    try {
      const rec = await library.importFile(file)
      toast(t('library.importOk', { name: rec.info.title }), 'success')
    } catch (e) {
      toast(t('library.importFail', { name: file.name, error: (e as Error).message }), 'error', 7000)
    } finally {
      importing.value--
    }
  }
  void refreshUsage()
  if (fileInput.value) fileInput.value.value = ''
}

function onDrop(e: DragEvent) {
  dragging.value = false
  void importFiles(e.dataTransfer?.files)
}

async function remove(m: InstalledModule) {
  if (!confirm(t('library.removeConfirm', { name: m.info.title }))) return
  await library.remove(m.id)
  toast(t('library.removed'))
  void refreshUsage()
}

function read(m: InstalledModule) {
  settings.prefs.bibles = [m.id, ...settings.prefs.bibles.filter((b) => b !== m.id)]
  void router.push('/read')
}

const meta = (m: InstalledModule) => [
  m.language ? t(`lang.${m.language}`) : t('library.imported'),
  mb(m.size),
  ...(m.license ? [m.license] : []),
]
</script>

<template>
  <div class="page">
    <header>
      <h1 class="page-title">{{ $t('library.title') }}</h1>
      <p class="page-sub">{{ $t('library.subtitle') }}</p>
      <p v-if="usage" class="usage"><HardDrive /> {{ $t('library.storage', { used: usage }) }}</p>
    </header>

    <section class="section">
      <div class="section-head"><h2 class="section-title">{{ $t('library.installed') }}</h2></div>
      <p v-if="!library.installed.length" class="empty">{{ $t('library.empty') }}</p>
      <div class="list">
        <ModuleCard
          v-for="m in library.installed" :key="m.id" :kind="m.info.kind" :title="m.info.title"
          :abbreviation="m.info.abbreviation" :meta="meta(m)"
        >
          <span v-if="m.info.kind === 'bible' && settings.prefs.bibles[0] === m.id" class="chip active"><Check :size="14" /> {{ $t('library.active') }}</span>
          <button v-else-if="m.info.kind === 'bible'" class="btn btn-sm" @click="read(m)">{{ $t('library.use') }}</button>
          <button class="icon-btn" :title="$t('library.remove')" :aria-label="$t('library.remove')" @click="remove(m)"><Trash2 /></button>
        </ModuleCard>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="section-title">{{ $t('library.catalog') }}</h2></div>
      <p v-if="library.catalogError" class="empty">{{ $t('library.catalogError') }}</p>
      <div v-else-if="!library.catalog" class="empty"><LoaderCircle class="spin" /></div>
      <div class="list">
        <ModuleCard
          v-for="c in available" :key="c.id" :kind="c.kind" :title="c.title" :abbreviation="c.abbreviation"
          :description="c.description" :meta="[$t(`lang.${c.language}`), mb(c.size), c.license]"
        >
          <div v-if="c.id in library.progress" class="progress" :aria-label="$t('common.loading')">
            <i :style="{ width: `${Math.round(library.progress[c.id] * 100)}%` }" />
          </div>
          <button v-else class="btn btn-primary btn-sm" @click="install(c)"><Download /> {{ $t('common.download') }}</button>
        </ModuleCard>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="section-title">{{ $t('library.importTitle') }}</h2></div>
      <label
        class="drop" :class="{ dragging }"
        @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="onDrop"
      >
        <input ref="fileInput" type="file" multiple :accept="IMPORT_EXTENSIONS.join(',')" class="sr-only" @change="importFiles(($event.target as HTMLInputElement).files)">
        <LoaderCircle v-if="importing" class="spin big" />
        <FileUp v-else class="big" />
        <strong>{{ $t('library.importText') }}</strong>
        <span class="btn btn-sm">{{ $t('library.importButton') }}</span>
        <small>{{ $t('library.importFormats') }}</small>
      </label>
      <p class="legal"><ShieldCheck /> {{ $t('library.importLegal') }}</p>
    </section>
  </div>
</template>

<style scoped>
.usage { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; font-size: 13px; color: var(--text-3); }
.usage svg { width: 15px; height: 15px; }
.list { display: grid; gap: 10px; }
.progress { width: 120px; height: 6px; border-radius: 6px; background: var(--surface-2); overflow: hidden; }
.progress i { display: block; height: 100%; background: var(--accent); border-radius: 6px; transition: width 200ms linear; }
.drop {
  display: grid; justify-items: center; gap: 12px; text-align: center;
  padding: 40px 24px; border-radius: var(--radius-xl);
  border: 1.5px dashed var(--border-strong); background: var(--surface);
  cursor: pointer; transition: border-color var(--dur) var(--ease), background var(--dur) var(--ease);
}
.drop:hover, .drop.dragging { border-color: var(--accent); background: var(--accent-soft); }
.drop strong { font-weight: 550; max-width: 52ch; color: var(--text-2); }
.drop small { color: var(--text-3); font-size: 12.5px; }
.big { width: 34px; height: 34px; color: var(--accent); }
.legal { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 13px; color: var(--text-3); }
.legal svg { width: 16px; height: 16px; flex: none; }
</style>
