// src/composables/useInformeAlerts.js
import { ref, watch } from 'vue'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toastStore'

/**
 * Rendidor:
 *  - NO toast al crear 'pendiente'
 *  - SÍ toast cuando cambia a 'aprobado' | 'rechazado' | 'devuelto' | 'finalizado'
 *  - Ver -> { name: 'informeDetalle', params:{id} }
 *
 * Aprobador/Admin:
 *  - Toast cuando entra/vuelve a 'pendiente'/'devuelto'
 *  - Si hay aprobadorId -> solo para el asignado
 *  - Si NO hay aprobadorId -> broadcast a todos los aprobadores/admin
 *  - Ver -> { name: 'aprobadorInforme', params:{id} }
 */

export function useInformeAlerts({ debug = true } = {}) {
  const auth = useAuthStore()
  const toasts = useToastStore()
  const loaded = ref(false)
  let unsub = null

  const subtitleOf = (d) => d?.titulo?.trim() || '(Sin título)'
  const bodyOf = (d) => {
    const folio = d?.folio ? `Folio: ${d.folio}` : ''
    const nota  = (d?.observacionFinal || d?.nota || '').toString().trim()
    return [folio, nota].filter(Boolean).join(' · ')
  }

  const approverTo = (id) => ({ name: 'aprobadorInforme', params: { id } })
  const rendidorTo = (id) => ({ name: 'informeDetalle',   params: { id } })

  function buildQuery(uid, rol) {
    const base = collection(db, 'informes')
    if (rol === 'aprobador' || rol === 'admin') {
      // lee todo y filtra en cliente para asegurar snapshot>0
      return query(base, orderBy('creadoEn', 'desc'))
    }
    // rendidor: solo los suyos
    return query(base, where('userId', '==', uid), orderBy('creadoEn', 'desc'))
  }

  function start() {
    const uid = auth.uid
    const rol = auth?.perfil?.rol
    if (!uid || unsub) return

    const qRef = buildQuery(uid, rol)
    const estados = new Map()

    const isApproverRole = (rol === 'aprobador' || rol === 'admin')
    const isMineForRendidor = (d) => !!d && d.userId === uid
    const isMineForApprover = (d) => {
      if (!d) return false
      if (d.aprobadorId) return d.aprobadorId === uid      // asignado: solo ese aprobador
      return isApproverRole                                // sin asignación: broadcast a todos los aprobadores/admin
    }

    unsub = onSnapshot(qRef, (snap) => {

      // Precarga sin toasts
      if (!loaded.value) {
        snap.forEach(doc => {
          const d = doc.data() || {}
          estados.set(doc.id, String(d.estado || '').toLowerCase())
        })
        loaded.value = true
        return
      }

      // Cambios tras precarga
      snap.docChanges().forEach((ch) => {
        const id = ch.doc.id
        const d = ch.doc.data() || {}
        const nuevo = String(d.estado || '').toLowerCase()
        const anterior = estados.get(id)

        // ===== Aprobador/Admin =====
        if (isApproverRole) {
          const belongs = isMineForApprover(d)
          if (belongs) {
            const basePayload = {
              subtitle: subtitleOf(d),
              body: bodyOf(d),
              to: approverTo(id),
            }
            if (ch.type === 'added') {
              if (nuevo === 'pendiente' || nuevo === 'devuelto') {
                debug && console.log('[useInformeAlerts] push APPROVER toast to ->', basePayload.to)
                toasts.pushInformePendiente({
                  title: nuevo === 'pendiente' ? 'Nuevo informe pendiente' : 'Informe devuelto para revisión',
                  timeout: 7000,
                  ...basePayload,
                })
              }
            } else if (ch.type === 'modified' && nuevo !== anterior) {
              if (nuevo === 'pendiente' || nuevo === 'devuelto') {
                debug && console.log('[useInformeAlerts] push APPROVER toast to ->', basePayload.to)
                toasts.pushInformePendiente({
                  title: nuevo === 'pendiente' ? 'Informe en revisión' : 'Informe devuelto',
                  ...basePayload,
                })
              }
            }
          }
          estados.set(id, nuevo)
          return
        }

        // ===== Rendidor =====
        if (isMineForRendidor(d)) {
          if (ch.type === 'added') {
            // no notificar al crear en 'pendiente'
            estados.set(id, nuevo)
            return
          }
          if (ch.type === 'modified' && nuevo !== anterior) {
            const basePayload = {
              subtitle: subtitleOf(d),
              body: bodyOf(d),
              to: rendidorTo(id),
            }
            debug && console.log('[useInformeAlerts] push RENDIDOR toast to ->', basePayload.to)
            switch (nuevo) {
              case 'aprobado':
                toasts.pushInformeAprobado({ title: 'Informe Aprobado', ...basePayload })
                break
              case 'rechazado':
                toasts.pushInformeRechazado({ title: 'Informe Rechazado', timeout: 9000, ...basePayload })
                break
              case 'devuelto':
                toasts.pushInformeDevuelto({ title: 'Informe Devuelto', ...basePayload })
                break
              case 'finalizado':
                toasts.pushInformeFinalizado({ title: 'Informe Finalizado', ...basePayload })
                break
            }
          }
          estados.set(id, nuevo)
          return
        }

        // Otros roles → ignorar
        estados.set(id, nuevo)
      })
    }, (e) => console.error('[useInformeAlerts] onSnapshot error', e))
  }

  function stop() {
    if (unsub) unsub()
    unsub = null
    loaded.value = false
  }

  // Limpia toasts viejos al cambiar usuario/rol para evitar destinos obsoletos
  watch(() => [auth.uid, auth?.perfil?.rol], () => {
    toasts.clear('informe')
    stop(); start()
  }, { immediate: true })

  return { start, stop }
}
