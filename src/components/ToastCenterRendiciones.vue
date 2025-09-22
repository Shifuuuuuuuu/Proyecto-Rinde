<template>
  <!-- derecha, levantado 96px para no tapar al de soporte -->
  <div class="toast-container position-fixed end-0 p-3" style="z-index:1080;">
    <div
      v-for="t in safeToasts"
      :key="t.id"
      class="toast show align-items-center"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="toast-header">
        <i class="bi bi-clipboard-check me-2"></i>
        <strong class="me-auto">Rendiciones</strong>
        <small class="text-muted">{{ t.time }}</small>
        <button type="button" class="btn-close ms-2 mb-1" @click="toasts.remove(t.id)" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        <div class="fw-semibold">{{ t.title }}</div>
        <div class="small text-muted" v-if="t.subtitle">{{ t.subtitle }}</div>
        <div class="mt-1" v-if="t.body" style="white-space: pre-wrap;">{{ t.body }}</div>
        <RouterLink v-if="t._to" class="btn btn-sm btn-outline-primary mt-2" :to="t._to">
          Ver
        </RouterLink>
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
    .filter(t => t.channel === 'rendicion')
    .map(t => {
      let _to = null
      if (t.to) {
        try {
          const r = router.resolve(t.to)
          if (r?.href) _to = t.to
        } catch { /* oculta botón si no resuelve */ }
      }
      return { ...t, _to }
    })
)
</script>
