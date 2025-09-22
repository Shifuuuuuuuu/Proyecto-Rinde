<template>
  <AppNavbar />
  <main class="container py-4">
    <router-view />
  </main>
  <ToastCenterSupport />
  <ToastCenterRendiciones />
</template>

<script setup>
import AppNavbar from '@/components/AppNavbar.vue'

import ToastCenterSupport from '@/components/ToastCenterSupport.vue'
import ToastCenterRendiciones from '@/components/ToastCenterRendiciones.vue'
import { useSupportNotifications } from '@/composables/useSupportNotifications'
import { useAdminSupportAlerts } from '@/composables/useAdminSupportAlerts'
import { useRendicionesNotificationsForUser, useRendicionesNotificationsForAprobador } from '@/composables/useRendicionesNotifications'

useRendicionesNotificationsForUser()
useRendicionesNotificationsForAprobador()
useSupportNotifications()
useAdminSupportAlerts()
</script>
