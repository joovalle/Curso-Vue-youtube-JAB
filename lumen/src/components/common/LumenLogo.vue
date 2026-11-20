<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 40 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 64 64" role="img" aria-label="Lumen">
    <defs>
      <linearGradient id="lumen-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2a2218" />
        <stop offset="1" stop-color="#15110b" />
      </linearGradient>
      <linearGradient id="lumen-flame" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0" stop-color="#ffe2a0" />
        <stop offset="0.55" stop-color="#e9b45a" />
        <stop offset="1" stop-color="#c4842c" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#lumen-bg)" />
    <path
      d="M32 9.5c5.6 7.4 12 13.6 12 23.2C44 40.6 38.6 46 32 46s-12-5.4-12-13.3c0-6.1 3.4-10.4 7-14.5.4 5.4 2.4 8.4 5.6 9.6-1.4-5.4-1.6-11.4-.6-18.3Z"
      fill="url(#lumen-flame)"
    />
    <path d="M13 51.5c7.2-3.4 13.6-3 19 1.5 5.4-4.5 11.8-4.9 19-1.5" fill="none" stroke="#e9b45a" stroke-width="2.6" stroke-linecap="round" />
  </svg>
</template>
