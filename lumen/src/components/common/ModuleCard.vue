<script setup lang="ts">
import { BookA, BookOpen, Link2, ScrollText } from 'lucide-vue-next'
import type { ModuleKind } from '@/core/engine/modules'

defineProps<{ kind: ModuleKind; title: string; abbreviation: string; meta: string[]; description?: string }>()
const icons = { bible: BookOpen, commentary: ScrollText, dictionary: BookA, crossrefs: Link2 }
</script>

<template>
  <article class="module card">
    <div class="icon" :class="kind"><component :is="icons[kind]" /></div>
    <div class="info">
      <p class="eyebrow">{{ $t(`library.kinds.${kind}`) }} · {{ abbreviation }}</p>
      <h3>{{ title }}</h3>
      <p v-if="description" class="desc">{{ description }}</p>
      <p class="meta"><span v-for="m in meta" :key="m">{{ m }}</span></p>
    </div>
    <div class="actions"><slot /></div>
  </article>
</template>

<style scoped>
.module { display: grid; grid-template-columns: 48px 1fr auto; gap: 16px; align-items: center; padding: 18px 18px 18px 20px; }
.icon { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 14px; background: var(--accent-soft); color: var(--accent); }
.icon.commentary { background: rgba(93, 138, 90, 0.14); color: var(--cat-poetry); }
.icon.dictionary { background: rgba(74, 122, 150, 0.14); color: var(--cat-major-prophets); }
.icon.crossrefs { background: rgba(122, 90, 160, 0.14); color: var(--cat-pauline); }
.icon svg { width: 22px; height: 22px; }
h3 { font-family: var(--font-serif); font-size: 18px; font-weight: 600; margin-top: 3px; }
.desc { font-size: 13.5px; color: var(--text-2); margin-top: 4px; max-width: 60ch; }
.meta { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 6px; font-size: 12.5px; color: var(--text-3); }
.actions { display: flex; gap: 8px; align-items: center; }
@media (max-width: 600px) {
  .module { grid-template-columns: 44px 1fr; }
  .actions { grid-column: 1 / -1; justify-content: flex-end; }
}
</style>
