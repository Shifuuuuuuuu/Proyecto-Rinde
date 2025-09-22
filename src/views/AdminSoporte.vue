<template>
  <div class="container py-3">
    <!-- Header -->
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div class="d-flex align-items-center gap-2">
        <h2 class="h5 mb-0">Gestión de Soporte</h2>
        <span class="badge text-bg-secondary">{{ ticketsFiltrados.length }} ticket(s)</span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <select v-model="filtro.estado" class="form-select form-select-sm" style="min-width:160px">
          <option value="">Todos los estados</option>
          <option value="abierto">Abierto</option>
          <option value="en progreso">En progreso</option>
          <option value="resuelto">Resuelto</option>
        </select>
        <select v-model="filtro.prioridad" class="form-select form-select-sm" style="min-width:140px">
          <option value="">Todas las prioridades</option>
          <option>Normal</option>
          <option>Alta</option>
        </select>
        <div class="input-group input-group-sm" style="min-width:260px">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input v-model.trim="filtro.q" class="form-control" placeholder="Buscar por asunto, correo, descripción..." />
        </div>
        <button class="btn btn-sm btn-outline-secondary" @click="recargar">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card shadow-sm">
      <div class="card-body p-0">
        <div v-if="cargando" class="text-center py-5">
          <div class="spinner-border"></div>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="text-nowrap">Fecha</th>
                <th>Asunto</th>
                <th class="d-none d-md-table-cell">Usuario</th>
                <th class="text-nowrap">Estado</th>
                <th class="text-nowrap">Prioridad</th>
                <th class="d-none d-lg-table-cell">Categoría</th>
                <th class="d-none d-xl-table-cell">Asignado</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in ticketsFiltrados" :key="t.id" @click="abrir(t)" style="cursor:pointer">
                <td class="small text-nowrap">{{ formatFechaHora(t.creadoEn) }}</td>
                <td class="text-truncate" style="max-width: 320px;" :title="t.descripcion">
                  <span class="fw-semibold">{{ t.asunto }}</span>
                  <div class="small text-muted text-truncate">{{ t.descripcion }}</div>
                </td>
                <td class="d-none d-md-table-cell">
                  <div class="small">{{ t.correo || '—' }}</div>
                  <div class="small text-muted">{{ t.empresa || '—' }}</div>
                </td>
                <td><span :class="['badge', badgeEstado(t.estado)]">{{ t.estado }}</span></td>
                <td>{{ t.prioridad }}</td>
                <td class="d-none d-lg-table-cell">{{ t.categoria }}</td>
                <td class="d-none d-xl-table-cell">
                  <span class="small">{{ t.asignadoA || '—' }}</span>
                </td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm" @click.stop>
                    <button class="btn btn-outline-primary" @click="tomar(t)" :disabled="t.estado==='resuelto'">Tomar</button>
                    <button class="btn btn-outline-success" @click="abrir(t)">Responder</button>
                    <button class="btn btn-outline-danger" @click="confirmarEliminar(t)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="!ticketsFiltrados.length">
                <td colspan="8" class="text-center text-muted py-5">Sin resultados</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Drawer / Modal detalle -->
    <div class="offcanvas offcanvas-end show" tabindex="-1"
         style="visibility: visible; width: 560px; background: #fff;"
         v-if="detalle" @click.self="cerrarDetalle">
      <div class="offcanvas-header border-bottom">
        <h5 class="offcanvas-title">
          Ticket
          <span :class="['badge ms-2', badgeEstado(detalle.estado)]">{{ detalle.estado }}</span>
        </h5>
        <button type="button" class="btn-close" @click="cerrarDetalle"></button>
      </div>
      <div class="offcanvas-body">
        <div class="mb-2">
          <div class="text-muted small">Asunto</div>
          <div class="fw-semibold">{{ detalle.asunto }}</div>
        </div>
        <div class="mb-3">
          <div class="text-muted small">Descripción</div>
          <div style="white-space: pre-wrap">{{ detalle.descripcion }}</div>
        </div>

        <div class="row g-2 mb-3">
          <div class="col-6">
            <div class="text-muted small">Prioridad</div>
            <div class="fw-semibold">{{ detalle.prioridad }}</div>
          </div>
          <div class="col-6">
            <div class="text-muted small">Categoría</div>
            <div class="fw-semibold">{{ detalle.categoria }}</div>
          </div>
          <div class="col-6">
            <div class="text-muted small">Rendición</div>
            <div class="fw-semibold">{{ detalle.rendicionId || '—' }}</div>
          </div>
          <div class="col-6">
            <div class="text-muted small">Usuario</div>
            <div class="fw-semibold">{{ detalle.correo || '—' }}</div>
          </div>
        </div>

        <div class="mb-3">
          <div class="text-muted small">Captura</div>
          <div v-if="detalle.fotoPreview" class="border rounded p-2 bg-light text-center">
            <img :src="detalle.fotoPreview" class="img-fluid rounded" />
            <a :href="detalle.fotoPreview" download="captura.jpg" class="btn btn-sm btn-outline-secondary mt-2 w-100">
              Descargar
            </a>
          </div>
          <div v-else class="small text-muted">No adjunta</div>
        </div>

        <div class="mb-3">
          <div class="text-muted small">Asignado a</div>
          <div class="d-flex gap-2">
            <input v-model.trim="asignadoA" class="form-control form-control-sm" placeholder="Tu nombre/correo" />
            <button class="btn btn-sm btn-outline-primary" @click="guardarAsignado" :disabled="guardando">
              <i class="bi bi-person-check"></i>
            </button>
          </div>
        </div>

        <!-- Respuesta -->
        <div class="mb-3">
          <label class="form-label">Respuesta al usuario</label>
          <textarea v-model.trim="respuesta" class="form-control" rows="4"
                    placeholder="Explica la causa y cómo se solucionó; pasos a seguir si vuelve a ocurrir."></textarea>
          <div class="form-text">Esta respuesta será visible para el usuario.</div>
          <div class="d-flex gap-2 mt-2">
            <button class="btn btn-success" @click="resolver" :disabled="guardando || !respuesta">
              <i class="bi bi-check2-circle me-1"></i> Marcar como resuelto
            </button>
            <button class="btn btn-outline-info" @click="marcarEnProgreso" :disabled="guardando || detalle.estado==='resuelto'">
              <i class="bi bi-hourglass-split me-1"></i> En progreso
            </button>
            <button class="btn btn-outline-warning" @click="reabrir" :disabled="guardando || detalle.estado==='abierto'">
              <i class="bi bi-arrow-counterclockwise me-1"></i> Reabrir
            </button>
          </div>
        </div>

        <!-- Notas internas -->
        <div class="mb-3">
          <label class="form-label">Nota interna (no visible al usuario)</label>
          <textarea v-model.trim="notaInterna" class="form-control" rows="2" placeholder="Apuntes internos"></textarea>
          <div class="d-flex gap-2 mt-2">
            <button class="btn btn-outline-secondary" @click="agregarNota" :disabled="guardando || !notaInterna">
              <i class="bi bi-journal-plus me-1"></i> Agregar nota
            </button>
          </div>
        </div>

        <!-- Historial -->
        <div class="mb-2">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Historial</h6>
            <span class="small text-muted">{{ historial.length }} evento(s)</span>
          </div>
          <ul class="list-group list-group-flush border rounded mt-2">
            <li v-for="h in historial" :key="h.id" class="list-group-item">
              <div class="d-flex justify-content-between">
                <div>
                  <span class="badge text-bg-light text-dark me-2">{{ h.tipo }}</span>
                  <span v-if="h.detalle">{{ h.detalle }}</span>
                </div>
                <div class="small text-muted">{{ formatFechaHora(h.creadoEn) }}</div>
              </div>
            </li>
            <li v-if="!historial.length" class="list-group-item text-muted small">Sin movimientos</li>
          </ul>
        </div>
      </div>
      <div class="offcanvas-footer border-top p-3 d-flex justify-content-between">
        <button class="btn btn-outline-danger" @click="confirmarEliminar(detalle)">
          <i class="bi bi-trash me-1"></i> Eliminar
        </button>
        <button class="btn btn-secondary" @click="cerrarDetalle">Cerrar</button>
      </div>
    </div>

    <!-- Modal de confirmación de eliminado -->
    <div class="modal fade" tabindex="-1" v-if="confirmDelete" :class="{show:true}" style="display:block" @click.self="confirmDelete=null">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Eliminar ticket</h5>
            <button type="button" class="btn-close" @click="confirmDelete=null"></button>
          </div>
          <div class="modal-body">
            <p class="mb-2">¿Estás seguro de eliminar este ticket <b>de forma permanente</b>?</p>
            <ul class="small text-muted mb-2">
              <li>Se eliminará el ticket y <b>todo</b> su historial.</li>
              <li>Esta acción no se puede deshacer.</li>
            </ul>
            <div class="border rounded p-2 bg-light">
              <div class="small text-muted">Asunto</div>
              <div class="fw-semibold">{{ confirmDelete?.asunto }}</div>
              <div class="small text-muted mt-2">Creado</div>
              <div class="fw-semibold">{{ formatFechaHora(confirmDelete?.creadoEn) }}</div>
            </div>

            <div v-if="delError" class="alert alert-danger mt-3 py-2">
              <i class="bi bi-x-octagon me-1"></i> {{ delError }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" :disabled="eliminando" @click="confirmDelete=null">Cancelar</button>
            <button class="btn btn-danger" :disabled="eliminando" @click="eliminarTicket(confirmDelete)">
              <span v-if="!eliminando"><i class="bi bi-trash me-1"></i> Eliminar definitivamente</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- /Modal -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/firebase'
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp,
  addDoc, getDocs, writeBatch
} from 'firebase/firestore'

const auth = useAuthStore()

// Estado de UI
const cargando = ref(true)
const tickets = ref([])
const detalle = ref(null)
const historial = ref([])

const filtro = ref({ estado: '', prioridad: '', q: '' })
const asignadoA = ref('')
const respuesta = ref('')
const notaInterna = ref('')
const guardando = ref(false)

// Eliminación
const confirmDelete = ref(null)
const eliminando = ref(false)
const delError = ref('')

// Carga inicial
let unsub = null
onMounted(() => {
  recargar()
})

function recargar () {
  if (unsub) unsub()
  cargando.value = true
  const qRef = query(
    collection(db, 'soporte'),
    orderBy('creadoEn', 'desc')
  )
  unsub = onSnapshot(qRef, (snap) => {
    tickets.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    cargando.value = false
  }, () => (cargando.value = false))
}

// Filtros
const ticketsFiltrados = computed(() => {
  const q = filtro.value.q.toLowerCase().trim()
  return tickets.value.filter(t => {
    if (filtro.value.estado && t.estado !== filtro.value.estado) return false
    if (filtro.value.prioridad && t.prioridad !== filtro.value.prioridad) return false
    if (!q) return true
    const blob = `${t.asunto || ''} ${t.descripcion || ''} ${t.correo || ''} ${t.rendicionId || ''}`.toLowerCase()
    return blob.includes(q)
  })
})

// Abrir detalle
async function abrir (t) {
  detalle.value = t
  asignadoA.value = t.asignadoA || (auth.perfil?.nombre || auth.user?.email || '')
  respuesta.value = ''
  notaInterna.value = ''
  // Cargar historial
  const qRef = query(
    collection(db, 'soporte', t.id, 'historial'),
    orderBy('creadoEn', 'desc')
  )
  const snap = await getDocs(qRef)
  historial.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

function cerrarDetalle () {
  detalle.value = null
  historial.value = []
  respuesta.value = ''
  notaInterna.value = ''
}

// Acciones
async function logHistorial (ticketId, tipo, detalleTxt = '') {
  await addDoc(collection(db, 'soporte', ticketId, 'historial'), {
    tipo, detalle: detalleTxt || null,
    userId: auth.uid || null,
    usuario: auth.perfil?.nombre || auth.user?.email || null,
    creadoEn: serverTimestamp()
  })
}

async function tomar (t) {
  try {
    guardando.value = true
    const asignado = auth.perfil?.nombre || auth.user?.email || 'admin'
    await updateDoc(doc(db, 'soporte', t.id), {
      estado: 'en progreso',
      asignadoA: asignado,
      actualizadoEn: serverTimestamp()
    })
    await logHistorial(t.id, 'asignación', `Asignado a ${asignado}`)
  } finally {
    guardando.value = false
  }
}

async function guardarAsignado () {
  if (!detalle.value) return
  try {
    guardando.value = true
    await updateDoc(doc(db, 'soporte', detalle.value.id), {
      asignadoA: asignadoA.value || null,
      actualizadoEn: serverTimestamp()
    })
    await logHistorial(detalle.value.id, 'actualización', `Asignado a ${asignadoA.value || '—'}`)
    detalle.value.asignadoA = asignadoA.value
  } finally {
    guardando.value = false
  }
}

async function marcarEnProgreso () {
  if (!detalle.value) return
  try {
    guardando.value = true
    await updateDoc(doc(db, 'soporte', detalle.value.id), {
      estado: 'en progreso',
      actualizadoEn: serverTimestamp()
    })
    await logHistorial(detalle.value.id, 'estado', 'En progreso')
    detalle.value.estado = 'en progreso'
  } finally {
    guardando.value = false
  }
}

async function resolver () {
  if (!detalle.value) return
  try {
    guardando.value = true
    await updateDoc(doc(db, 'soporte', detalle.value.id), {
      estado: 'resuelto',
      respuesta: respuesta.value.trim(),
      resueltoPor: auth.perfil?.nombre || auth.user?.email || 'admin',
      resueltoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    })
    await logHistorial(detalle.value.id, 'resolución', respuesta.value.trim())
    detalle.value.estado = 'resuelto'
    detalle.value.respuesta = respuesta.value.trim()
    respuesta.value = ''
  } finally {
    guardando.value = false
  }
}

async function reabrir () {
  if (!detalle.value) return
  try {
    guardando.value = true
    await updateDoc(doc(db, 'soporte', detalle.value.id), {
      estado: 'abierto',
      actualizadoEn: serverTimestamp()
    })
    await logHistorial(detalle.value.id, 'estado', 'Reabierto')
    detalle.value.estado = 'abierto'
  } finally {
    guardando.value = false
  }
}

async function agregarNota () {
  if (!detalle.value || !notaInterna.value) return
  try {
    guardando.value = true
    await logHistorial(detalle.value.id, 'nota interna', notaInterna.value.trim())
    notaInterna.value = ''
  } finally {
    guardando.value = false
  }
}

/** ---------- ELIMINAR TICKET + HISTORIAL ---------- */
function confirmarEliminar (t) {
  delError.value = ''
  confirmDelete.value = t
}

async function eliminarTicket (t) {
  if (!t?.id) return
  eliminando.value = true
  delError.value = ''
  try {
    // 1) Cargar historial del ticket
    const hSnap = await getDocs(collection(db, 'soporte', t.id, 'historial'))

    // 2) Preparar batch para borrar historial + ticket
    const batch = writeBatch(db)
    hSnap.forEach(h => batch.delete(h.ref))
    batch.delete(doc(db, 'soporte', t.id))

    // 3) Ejecutar
    await batch.commit()

    // 4) Cerrar detalle si era el abierto
    if (detalle.value?.id === t.id) cerrarDetalle()

    // 5) Cerrar modal
    confirmDelete.value = null

    // (Opcional) Optimista: quitarlo de la tabla ya mismo
    tickets.value = tickets.value.filter(x => x.id !== t.id)
  } catch (err) {
    console.error(err)
    delError.value = err?.message || 'No se pudo eliminar el ticket.'
  } finally {
    eliminando.value = false
  }
}

// Helpers
const formatFechaHora = (ts) => {
  try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return new Intl.DateTimeFormat('es-CL', { dateStyle:'medium', timeStyle:'short'}).format(d) }
  catch { return '-' }
}
const badgeEstado = (estado) =>
  ({ 'abierto':'text-bg-warning', 'en progreso':'text-bg-info', 'resuelto':'text-bg-success' }[estado] || 'text-bg-secondary')
</script>

<style scoped>
.offcanvas { box-shadow: -12px 0 24px rgba(0,0,0,.08); }
</style>
