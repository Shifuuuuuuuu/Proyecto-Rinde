<template>
  <AppNavbar />
  <main class="container py-4">
    <router-view />
  </main>
</template>

<script setup>
import AppNavbar from '@/components/AppNavbar.vue'
</script>
