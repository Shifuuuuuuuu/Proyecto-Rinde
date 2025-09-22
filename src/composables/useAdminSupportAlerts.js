// src/composables/useAdminSupportAlerts.js
import { ref, watch } from 'vue'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toastStore'

export function useAdminSupportAlerts() {
  const auth = useAuthStore()
  const toasts = useToastStore()
  const loaded = ref(false)
  let unsub = null

  function start() {
    const rol = auth.perfil?.rol
    if (!auth.uid || rol !== 'admin') return
    if (unsub) return

    const qRef = query(collection(db, 'soporte'), orderBy('creadoEn', 'desc'))

    unsub = onSnapshot(qRef, (snap) => {
      if (loaded.value) {
        snap.docChanges().forEach((ch) => {
          if (ch.type !== 'added') return
          const data = ch.doc.data()
          if (data.userId && data.userId === auth.uid) return

          toasts.pushSupport({
            title: 'Nuevo ticket de soporte',
            subtitle: data.asunto || '(Sin asunto)',
            body: `${data.correo || 'Usuario'} · Prioridad: ${data.prioridad || 'Normal'} · ${data.categoria || '—'}`,
            variant: 'warning',
            timeout: 7000,
            to: { name: 'admin.soporte' },
          })
        })
      }
      loaded.value = true
    }, console.error)
  }

  function stop() {
    if (unsub) unsub()
    unsub = null
    loaded.value = false
  }

  watch(() => [auth.uid, auth.perfil?.rol], () => { stop(); start() }, { immediate: true })
  return { start, stop }
}
