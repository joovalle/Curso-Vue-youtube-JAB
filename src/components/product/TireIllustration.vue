<script setup>
defineProps({
  color: { type: String, default: '#1a1a1a' },
})
</script>

<template>
  <svg viewBox="0 0 200 200" class="tire-illustration" role="img" aria-label="Ilustración de neumático">
    <circle cx="100" cy="100" r="92" fill="#111111" />
    <circle cx="100" cy="100" r="92" fill="none" stroke="#000" stroke-width="4" opacity="0.4" />
    <circle cx="100" cy="100" r="58" :fill="color" />
    <circle cx="100" cy="100" r="58" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="3" />
    <circle cx="100" cy="100" r="14" fill="#1a1a1a" />
    <g stroke="#000" stroke-opacity="0.5" stroke-width="6" stroke-linecap="round">
      <line x1="100" y1="16" x2="100" y2="34" />
      <line x1="100" y1="166" x2="100" y2="184" />
      <line x1="16" y1="100" x2="34" y2="100" />
      <line x1="166" y1="100" x2="184" y2="100" />
      <line x1="34" y1="34" x2="46" y2="46" />
      <line x1="154" y1="154" x2="166" y2="166" />
      <line x1="34" y1="166" x2="46" y2="154" />
      <line x1="154" y1="46" x2="166" y2="34" />
    </g>
  </svg>
</template>

<style scoped>
.tire-illustration {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
