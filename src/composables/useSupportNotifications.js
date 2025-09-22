// src/composables/useSupportNotifications.js
import { ref, watch } from 'vue'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toastStore'

export function useSupportNotifications() {
  const auth = useAuthStore()
  const toasts = useToastStore()
  const loaded = ref(false)
  let unsub = null
  const lastStates = new Map()

  function start() {
    if (!auth.uid || unsub) return
    const qRef = query(collection(db, 'soporte'), where('userId', '==', auth.uid), orderBy('creadoEn', 'desc'))
    unsub = onSnapshot(qRef, (snap) => {
      if (loaded.value) {
        snap.docChanges().forEach((ch) => {
          if (ch.type !== 'modified') return
          const id = ch.doc.id
          const data = ch.doc.data()
          const prev = lastStates.get(id)?.estado
          const now = data.estado
          if (prev !== 'resuelto' && now === 'resuelto') {
            toasts.pushSupport({
              title: 'Ticket resuelto',
              subtitle: data.asunto || 'Soporte',
              body: data.respuesta || 'Se marcó como resuelto.',
              variant: 'success',
              timeout: 6000,
              to: { name: 'soporte' },
            })
          }
        })
      }
      snap.docs.forEach(d => lastStates.set(d.id, { estado: d.data().estado }))
      loaded.value = true
    }, () => {})
  }

  function stop() {
    if (unsub) unsub()
    unsub = null
    loaded.value = false
    lastStates.clear()
  }

  watch(() => auth.uid, (uid) => { stop(); if (uid) start() }, { immediate: true })
  return { start, stop }
}
