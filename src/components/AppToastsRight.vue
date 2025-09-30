<template>
  <div class="toast-container position-fixed end-0 p-3" style="z-index:1080; top: 11%;">
    <div
      v-for="t in safeToasts"
      :key="t.id"
      class="toast show align-items-center shadow"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      :class="variantClass(t.variant)"
    >
      <div class="toast-header">
        <i v-if="t.icon" :class="['me-2','bi', t.icon]"></i>
        <strong class="me-auto">
          {{ t.channel === 'rendicion' ? 'Rendiciones' : t.channel === 'informe' ? 'Informes' : 'Notificación' }}
        </strong>
        <small class="text-muted">{{ t.time }}</small>
        <button type="button" class="btn-close ms-2 mb-1" @click="toasts.remove(t.id)" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        <div class="fw-semibold">{{ t.title }}</div>
        <div class="small text-muted" v-if="t.subtitle">{{ t.subtitle }}</div>
        <div class="mt-1" v-if="t.body" style="white-space: pre-wrap;">{{ t.body }}</div>
        <RouterLink v-if="t._to" class="btn btn-sm btn-outline-primary mt-2" :to="t._to">Ver</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useToastStore } from '@/stores/toastStore'

const toasts = useToastStore()
const router = useRouter()

const safeToasts = computed(() =>
  toasts.items
    .filter(t => t.channel === 'rendicion' || t.channel === 'informe')
    .map(t => {
      let _to = null
      if (t.to) {
        try {
          const r = router.resolve(t.to) // t.to puede ser string (path) o Location
          if (r && r.href) _to = t.to
        } catch { /* ocultar botón si no resuelve */ }
      }
      return { ...t, _to }
    })
)

const variantClass = (v) => {
  switch (v) {
    case 'success': return 'border-start border-4 border-success'
    case 'danger':  return 'border-start border-4 border-danger'
    case 'warning': return 'border-start border-4 border-warning'
    default:        return 'border-start border-4 border-info'
  }
}
</script>

<style scoped>
.toast {
  min-width: 320px;
  max-width: 420px;
}
</style>
