<script setup>
import { RouterView } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import FooterSection from '@/components/layout/FooterSection.vue'
import WhatsAppButton from '@/components/layout/WhatsAppButton.vue'
import DemoBanner from '@/components/layout/DemoBanner.vue'
</script>

<template>
  <DemoBanner />
  <NavBar />
  <main style="flex: 1">
    <RouterView />
  </main>
  <FooterSection />
  <WhatsAppButton />
</template>
