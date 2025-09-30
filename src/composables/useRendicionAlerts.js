import { ref, watch } from 'vue'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toastStore'

/**
 * Reglas:
 * - Solo rendidor (userId == uid) recibe toasts de rendiciones.
 * - Estados:
 *    - aprobada  -> botón "Ver" lleva a lista: { name: 'rendiciones' } (/mis-rendiciones)
 *    - rechazada/devuelta/finalizada/enviada/pendiente -> detalle: { name: 'detalle', params: { id } } (/rendicion/:id)
 */
export function useRendicionAlerts({ debug = true } = {}) {
  const auth = useAuthStore()
  const toasts = useToastStore()
  const loaded = ref(false)
  let unsub = null

  // helpers de navegación correctos según tu router
  const listTo   = () => ({ name: 'rendiciones' })               // /mis-rendiciones
  const detailTo = (id) => ({ name: 'detalle', params: { id } }) // /rendicion/:id

  // helper de textos
  const subtitleOf = (d) => (d?.numero ? `N°: ${d.numero}` : '')
  const bodyOf = (d) => (d?.motivo || d?.notas || '').toString().trim() || undefined

  function buildQuery(uid /*, rol */) {
    const base = collection(db, 'rendiciones')
    // Solo rendidor
    return query(base, where('userId', '==', uid), orderBy('fecha', 'desc'))
  }

  function start() {
    const uid = auth.uid
    const rol = auth?.perfil?.rol
    if (!uid || unsub) return

    const qRef = buildQuery(uid, rol)
    const estados = new Map()

    unsub = onSnapshot(qRef, (snap) => {

      // precarga sin toasts
      if (!loaded.value) {
        snap.forEach(doc => {
          const d = doc.data() || {}
          estados.set(doc.id, String(d.estado || '').toLowerCase())
        })
        loaded.value = true
        return
      }

      // cambios tras precarga
      snap.docChanges().forEach((ch) => {
        const id = ch.doc.id
        const d = ch.doc.data() || {}
        const nuevo = String(d.estado || '').toLowerCase()
        const anterior = estados.get(id)

        if (ch.type === 'modified' && nuevo !== anterior) {
          const subtitle = subtitleOf(d)
          const body = bodyOf(d)

          switch (nuevo) {
            case 'aprobada':
              // 👉 al aprobar, llevar a la LISTA de Mis Rendiciones
              toasts.pushRendicionAprobada({
                title: 'Rendición Aprobada',
                subtitle,
                body,
                to: listTo(),
              })
              break

            case 'rechazada':
              toasts.pushRendicionRechazada({
                title: 'Rendición Rechazada',
                subtitle,
                body,
                to: detailTo(id),
                timeout: 9000,
              })
              break

            case 'devuelta':
              toasts.pushRendicionDevuelta({
                title: 'Rendición Devuelta',
                subtitle,
                body,
                to: detailTo(id),
              })
              break

            case 'finalizada':
              toasts.pushRendicionFinalizada({
                title: 'Rendición Finalizada',
                subtitle,
                body: d?.notas || body,
                to: detailTo(id),
              })
              break

            case 'enviada':
            case 'pendiente':
              toasts.pushRendicionEnviada({
                title: 'Rendición en revisión',
                subtitle,
                body,
                to: detailTo(id),
              })
              break
          }
          estados.set(id, nuevo)
        }
      })
    }, (e) => console.error('[useRendicionAlerts] onSnapshot error', e))
  }

  function stop() { if (unsub) unsub(); unsub = null; loaded.value = false }

  // limpiar toasts de rendiciones al cambiar usuario/rol para evitar destinos viejos
  watch(() => [auth.uid, auth?.perfil?.rol], () => { toasts.clear('rendicion'); stop(); start() }, { immediate: true })

  return { start, stop }
}
