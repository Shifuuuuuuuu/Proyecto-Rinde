<template>
  <AppNavbar />
  <main class="container py-4">
    <router-view />
  </main>

  <!-- Tu toast de soporte (filtra 'support') -->
  <ToastCenterSupport />

  <!-- Toasts de informes + rendiciones (derecha) -->
  <AppToastsRight />
</template>

<script setup>
import AppNavbar from '@/components/AppNavbar.vue'
import ToastCenterSupport from '@/components/ToastCenterSupport.vue'
import AppToastsRight from '@/components/AppToastsRight.vue'

import { useAdminSupportAlerts } from '@/composables/useAdminSupportAlerts'
import { useInformeAlerts } from '@/composables/useInformeAlerts'
import { useRendicionAlerts } from '@/composables/useRendicionAlerts'

// listeners globales
useAdminSupportAlerts()
useInformeAlerts()     // deja true mientras pruebas
useRendicionAlerts()   // deja true mientras pruebas
</script>
