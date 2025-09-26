<!-- src/views/AprobadorInformeDetalle.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="container py-3">
    <!-- Header -->
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="router.back()">
          <i class="bi bi-arrow-left"></i> Volver
        </button>
        <div>
          <h2 class="h5 mb-0">Aprobador · Detalle de informe</h2>
          <div class="text-muted small">
            Creado: {{ formatFecha(informe?.creadoEn) }} ·
            Estado:
            <span :class="['badge', badgeInforme(informe?.estado)]">
              {{ informe?.estado || '—' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Acciones de cabecera -->
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="volverAListado">
          <i class="bi bi-list-ul"></i> Ver informes
        </button>
        <!-- Devolver SIEMPRE habilitado -->
        <button class="btn btn-outline-warning btn-sm"
                :disabled="guardando"
                @click="openModalDevolver">
          <i class="bi bi-arrow-counterclockwise"></i> Devolver informe
        </button>
        <!-- Finalizar según puedeCerrar -->
        <button class="btn btn-outline-success btn-sm"
                :disabled="guardando || !puedeCerrar"
                @click="openModalFinalizar">
          <i class="bi bi-flag"></i> Finalizar informe
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger mb-3">{{ error }}</div>

    <!-- Cabecera de informe -->
    <div class="card shadow-sm mb-3" v-if="informe">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-8">
            <label class="text-muted small">Título</label>
            <div class="fs-5 fw-semibold">{{ informe.titulo || '(Sin título)' }}</div>
          </div>
          <div class="col-md-4">
            <label class="text-muted small">Rendiciones</label>
            <div class="fs-5 fw-semibold">{{ informe.rendicionIds?.length || 0 }}</div>
          </div>
          <div class="col-12">
            <label class="text-muted small">Nota</label>
            <div class="text-body">{{ informe.nota || '—' }}</div>
          </div>
        </div>
      </div>
      <div class="card-footer bg-light">
        <div class="d-flex align-items-center flex-wrap gap-3">
          <div v-for="(monto, code) in informe.totalesPorMoneda" :key="code" class="small">
            <span class="text-muted">{{ code }} total:</span>
            <strong>{{ formatMoney(monto, code) }}</strong>
          </div>
        </div>
      </div>
    </div>
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <h6 class="mb-0">Rendiciones del informe</h6>
          <div class="d-flex align-items-center gap-2">
            <select v-model="filtroEstado" class="form-select form-select-sm">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
              <option value="borrador">Borrador</option>
            </select>
            <button class="btn btn-outline-secondary btn-sm" @click="limpiarSeleccion" :disabled="!selectedIds.length">
              Limpiar selección
            </button>
          </div>
        </div>

        <div v-if="cargando" class="text-center py-4">
          <div class="spinner-border"></div>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th style="width:36px" class="text-center">
                  <input class="form-check-input" type="checkbox"
                         :checked="allVisibleSelected"
                         @change="toggleSelectAllVisible" />
                </th>
                <th>Fecha</th>
                <th style="width:64px;"></th>
                <th>Categoría</th>
                <th>Motivo</th>
                <th class="text-end">Monto</th>
                <th>Moneda</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="x in rendicionesFiltradas" :key="x.id">
                <td class="text-center">
                  <input class="form-check-input" type="checkbox"
                         :value="x.id" v-model="selectedIds" />
                </td>
                <td class="small text-nowrap">{{ formatFecha(x.fecha || x.creadoEn) }}</td>
                <td>
                  <div class="thumb-sm border rounded bg-light d-flex align-items-center justify-content-center">
                    <img v-if="x.fotoPreview" :src="x.fotoPreview" alt="thumb" />
                    <i v-else class="bi bi-receipt text-muted"></i>
                  </div>
                </td>
                <td>{{ x.categoria || '—' }}</td>
                <td class="text-truncate" style="max-width: 360px;">
                  <span class="text-muted small me-1" v-if="x.notas" title="Notas"><i class="bi bi-sticky"></i></span>
                  {{ x.motivo || '—' }}
                </td>
                <td class="text-end">{{ formatMoney(x.monto, x.moneda || 'CLP') }}</td>
                <td>{{ x.moneda || 'CLP' }}</td>
                <td>
                  <span :class="['badge', badgeRend(x.estado)]">{{ x.estado }}</span>
                  <span v-if="x.informeId" class="badge text-bg-info ms-1">en informe</span>
                </td>
              </tr>
              <tr v-if="!rendicionesFiltradas.length">
                <td colspan="9" class="text-center text-muted py-4">No hay rendiciones para mostrar.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ===== Barra flotante estilo MisRendiciones (solo selección) ===== -->
    <Transition name="slide-up-blur">
      <div v-if="selectedIds.length" class="fab-bar glass shadow-xl border-top">
        <div class="container d-flex flex-wrap align-items-center justify-content-between gap-2 py-2">
          <div class="small">
            <strong>{{ selectedIds.length }}</strong> seleccionada(s)
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-outline-secondary" type="button" @click="limpiarSeleccion">
              <i class="bi bi-x-circle"></i> Quitar selección
            </button>

            <button class="btn btn-outline-success" type="button" @click="openApprove(selectedIds)">
              <i class="bi bi-check2-circle"></i> Aprobar
            </button>

            <button class="btn btn-outline-danger" type="button" @click="openReject(selectedIds)">
              <i class="bi bi-x-circle"></i> Rechazar
            </button>

            <button class="btn btn-outline-primary" type="button" :disabled="selectedIds.length !== 1" @click="openEditBySelection">
              <i class="bi bi-pencil-square"></i> Editar
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ===== Modales ===== -->
    <ModalPro
      v-if="modals.aprobar.show"
      title="Aprobar rendiciones"
      icon="bi-check2-circle"
      :loading="guardando"
      @close="modals.aprobar.show=false"
      @ok="confirmApprove"
    >
      <template #body>
        <p class="mb-2">Vas a aprobar <strong>{{ modals.aprobar.ids.length }}</strong> rendición(es).</p>
        <div class="mb-2">
          <label class="form-label">Comentario (obligatorio)</label>
          <textarea v-model.trim="modals.aprobar.comentario" class="form-control" rows="3"
                    placeholder="Motivo de aprobación..."></textarea>
          <div class="text-danger small mt-1" v-if="modals.aprobar.error">{{ modals.aprobar.error }}</div>
        </div>
      </template>
    </ModalPro>

    <ModalPro
      v-if="modals.rechazar.show"
      title="Rechazar rendiciones"
      icon="bi-x-circle"
      :danger="true"
      :loading="guardando"
      @close="modals.rechazar.show=false"
      @ok="confirmReject"
    >
      <template #body>
        <p class="mb-2">Vas a rechazar <strong>{{ modals.rechazar.ids.length }}</strong> rendición(es).</p>
        <div class="mb-2">
          <label class="form-label">Comentario (obligatorio)</label>
          <textarea v-model.trim="modals.rechazar.comentario" class="form-control" rows="3"
                    placeholder="Motivo del rechazo..."></textarea>
          <div class="text-danger small mt-1" v-if="modals.rechazar.error">{{ modals.rechazar.error }}</div>
        </div>
      </template>
    </ModalPro>

    <ModalPro
      v-if="modals.editar.show"
      title="Editar rendición"
      icon="bi-pencil-square"
      :loading="guardando"
      okText="Guardar cambios"
      @close="modals.editar.show=false"
      @ok="confirmEdit"
    >
      <template #body>
        <div v-if="modals.editar.data" class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label">Monto</label>
            <input type="number" class="form-control" v-model.number="modals.editar.data.monto" min="0" />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Moneda</label>
            <select class="form-select" v-model="modals.editar.data.moneda">
              <option value="CLP">CLP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="UF">UF</option>
            </select>
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Categoría</label>
            <input type="text" class="form-control" v-model.trim="modals.editar.data.categoria" />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Tipo de documento</label>
            <select class="form-select" v-model="modals.editar.data.tipoDocumento">
              <option value="">—</option>
              <option value="boleta">Boleta</option>
              <option value="factura">Factura</option>
              <option value="ticket">Ticket</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Folio / N° documento</label>
            <input type="text" class="form-control" v-model.trim="modals.editar.data.folio" />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">N° boleta</label>
            <input type="text" class="form-control" v-model.trim="modals.editar.data.numeroBoleta" />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-control" v-model="modals.editar.data._fechaStr" />
          </div>
          <div class="col-12">
            <label class="form-label">Motivo</label>
            <input type="text" class="form-control" v-model.trim="modals.editar.data.motivo" />
          </div>
          <div class="col-12">
            <label class="form-label">Notas</label>
            <textarea class="form-control" rows="3" v-model.trim="modals.editar.data.notas"></textarea>
          </div>
        </div>
      </template>
    </ModalPro>

    <ModalPro
      v-if="modals.finalizar.show"
      title="Finalizar informe"
      icon="bi-flag"
      :loading="guardando"
      okText="Finalizar"
      @close="modals.finalizar.show=false"
      @ok="confirmFinalizar"
    >
      <template #body>
        <p class="mb-2">Confirma que el informe queda finalizado. No podrás seguir editando rendiciones de este informe.</p>
        <label class="form-label">Comentario (obligatorio)</label>
        <textarea v-model.trim="modals.finalizar.comentario" class="form-control" rows="3"
                  placeholder="Comentario de cierre..."></textarea>
        <div class="text-danger small mt-1" v-if="modals.finalizar.error">{{ modals.finalizar.error }}</div>
      </template>
    </ModalPro>

    <ModalPro
      v-if="modals.devolver.show"
      title="Devolver informe"
      icon="bi-arrow-counterclockwise"
      :danger="true"
      :loading="guardando"
      okText="Devolver"
      @close="modals.devolver.show=false"
      @ok="confirmDevolver"
    >
      <template #body>
        <p class="mb-2">El informe se devolverá al rendidor para correcciones.</p>
        <label class="form-label">Observación (obligatoria)</label>
        <textarea v-model.trim="modals.devolver.comentario" class="form-control" rows="3"
                  placeholder="Indica el motivo de devolución..."></textarea>
        <div class="text-danger small mt-1" v-if="modals.devolver.error">{{ modals.devolver.error }}</div>
      </template>
    </ModalPro>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ModalPro from '@/components/ModalPro.vue'
import { db } from '@/firebase'
import {
  doc, getDoc, collection, query, where, getDocs, documentId,
  writeBatch, serverTimestamp, updateDoc
} from 'firebase/firestore'

/* Recibe :informeId como prop desde el router */
const props = defineProps({ informeId: { type: String, required: true } })

const router = useRouter()

const error = ref('')
const cargando = ref(true)
const guardando = ref(false)

const informe = ref(null)
const rendiciones = ref([])
const selectedIds = ref([])
const filtroEstado = ref('')

const modals = ref({
  aprobar: { show: false, ids: [], comentario: '', error: '' },
  rechazar: { show: false, ids: [], comentario: '', error: '' },
  editar: { show: false, data: null },
  finalizar: { show: false, comentario: '', error: '' },
  devolver: { show: false, comentario: '', error: '' }
})

onMounted(loadAll)

async function loadAll () {
  cargando.value = true
  try {
    const refInf = doc(db, 'informes', props.informeId)
    const snap = await getDoc(refInf)
    if (!snap.exists()) { error.value = 'El informe no existe.'; return }
    informe.value = { id: snap.id, ...snap.data() }

    const ids = Array.isArray(informe.value.rendicionIds) ? informe.value.rendicionIds : []
    rendiciones.value = await fetchRendicionesByIds(ids)
  } catch (e) {
    console.error(e); error.value = 'No fue posible cargar el informe.'
  } finally { cargando.value = false }
}

async function fetchRendicionesByIds (ids) {
  if (!ids.length) return []
  const chunks = []
  for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10))
  const results = []
  for (const ch of chunks) {
    const qRef = query(collection(db, 'rendiciones'), where(documentId(), 'in', ch))
    const snap = await getDocs(qRef)
    snap.forEach(d => results.push({ id: d.id, ...d.data() }))
  }
  results.sort((a,b) => {
    const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha || a.creadoEn)
    const dbb = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha || b.creadoEn)
    return dbb - da
  })
  return results
}

const rendicionesFiltradas = computed(() => !filtroEstado.value ? rendiciones.value : rendiciones.value.filter(r => r.estado === filtroEstado.value))
const allVisibleSelected = computed(() =>
  rendicionesFiltradas.value.length > 0 &&
  rendicionesFiltradas.value.every(r => selectedIds.value.includes(r.id))
)
const puedeCerrar = computed(() => rendiciones.value.some(r => r.estado === 'aprobada' || r.estado === 'rechazada'))

function limpiarSeleccion () { selectedIds.value = [] }
function toggleSelectAllVisible (e) {
  if (e.target.checked) {
    const set = new Set([...selectedIds.value, ...rendicionesFiltradas.value.map(r => r.id)])
    selectedIds.value = [...set]
  } else {
    const visibles = new Set(rendicionesFiltradas.value.map(r => r.id))
    selectedIds.value = selectedIds.value.filter(id => !visibles.has(id))
  }
}
function volverAListado () { router.push({ name: 'aprobadorInformes' }) }

const formatFecha = (ts) => {
  try { const d = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts)); return new Intl.DateTimeFormat('es-CL').format(d) } catch { return '-' }
}
const formatMoney = (value, code) => {
  const n = Number(value || 0)
  if (code === 'CLP') return new Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 }).format(n)
  if (code === 'USD') return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n)
  if (code === 'EUR') return new Intl.NumberFormat('es-ES', { style:'currency', currency:'EUR' }).format(n)
  if (code === 'UF')  return `UF ${new Intl.NumberFormat('es-CL', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(n)}`
  return n
}
const badgeRend = (estado) => ({ pendiente:'text-bg-warning', aprobada:'text-bg-success', rechazada:'text-bg-danger', borrador:'text-bg-secondary' }[estado] || 'text-bg-secondary')
const badgeInforme = (estado) => ({ pendiente:'text-bg-warning', aprobado:'text-bg-success', parcial:'text-bg-info', rechazado:'text-bg-danger', devuelto:'text-bg-secondary', finalizado:'text-bg-success' }[estado] || 'text-bg-secondary')

function openApprove (ids) { modals.value.aprobar = { show: true, ids: [...ids], comentario: '', error: '' } }
function openReject (ids)  { modals.value.rechazar = { show: true, ids: [...ids], comentario: '', error: '' } }
function openEdit (rend) {
  const d = { ...rend }
  const date = d.fecha?.toDate ? d.fecha.toDate() : (d.fecha ? new Date(d.fecha) : new Date())
  d._fechaStr = date.toISOString().slice(0,10)
  modals.value.editar = { show: true, data: d }
}
function openEditBySelection () {
  const id = selectedIds.value[0]
  const r = rendiciones.value.find(x => x.id === id)
  if (r) openEdit(r)
}
function openModalFinalizar () { modals.value.finalizar = { show: true, comentario: '', error: '' } }
function openModalDevolver ()  { modals.value.devolver  = { show: true, comentario: '', error: '' } }

async function batchUpdateEstado (ids, estado, comentario) {
  guardando.value = true
  try {
    for (let i = 0; i < ids.length; i += 400) {
      const slice = ids.slice(i, i + 400)
      const batch = writeBatch(db)
      for (const id of slice) {
        const ref = doc(db, 'rendiciones', id)
        if (estado === 'aprobada') {
          batch.update(ref, {
            estado: 'aprobada',
            comentarioAprob: comentario,
            aprobadoPor: 'aprobador',
            aprobadoEn: serverTimestamp(),
            actualizadoEn: serverTimestamp()
          })
        } else {
          batch.update(ref, {
            estado: 'rechazada',
            comentarioRechazo: comentario,
            rechazadoPor: 'aprobador',
            rechazadoEn: serverTimestamp(),
            actualizadoEn: serverTimestamp()
          })
        }
      }
      await batch.commit()
    }
    rendiciones.value = rendiciones.value.map(r => ids.includes(r.id) ? { ...r, estado } : r)
    selectedIds.value = []
  } finally { guardando.value = false }
}

async function confirmApprove () {
  const m = modals.value.aprobar
  if (!m.comentario.trim()) { m.error = 'Debes ingresar un comentario.'; return }
  m.error = ''
  await batchUpdateEstado(m.ids, 'aprobada', m.comentario.trim())
  m.show = false
}
async function confirmReject () {
  const m = modals.value.rechazar
  if (!m.comentario.trim()) { m.error = 'Debes ingresar un comentario.'; return }
  m.error = ''
  await batchUpdateEstado(m.ids, 'rechazada', m.comentario.trim())
  m.show = false
}
async function confirmEdit () {
  const m = modals.value.editar
  if (!m.data) return
  guardando.value = true
  try {
    const ref = doc(db, 'rendiciones', m.data.id)
    const payload = {
      monto: Number(m.data.monto) || 0,
      moneda: m.data.moneda || 'CLP',
      categoria: m.data.categoria || '',
      tipoDocumento: m.data.tipoDocumento || '',
      folio: m.data.folio || '',
      numeroBoleta: m.data.numeroBoleta || '',
      motivo: m.data.motivo || '',
      notas: m.data.notas || '',
      fecha: new Date(m.data._fechaStr + 'T12:00:00'),
      actualizadoEn: serverTimestamp()
    }
    await updateDoc(ref, payload)
    const idx = rendiciones.value.findIndex(r => r.id === m.data.id)
    if (idx >= 0) rendiciones.value[idx] = { ...rendiciones.value[idx], ...payload }
    m.show = false
  } catch (e) { console.error(e) } finally { guardando.value = false }
}

async function confirmFinalizar () {
  const m = modals.value.finalizar
  if (!m.comentario.trim()) { m.error = 'Debes ingresar un comentario.'; return }
  m.error = ''
  guardando.value = true
  try {
    const ref = doc(db, 'informes', props.informeId)
    await updateDoc(ref, {
      estado: 'finalizado',
      observacionFinal: m.comentario.trim(),
      finalizadoPor: 'aprobador',
      finalizadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    })
    informe.value.estado = 'finalizado'
    m.show = false
  } catch (e) { console.error(e) } finally { guardando.value = false }
}
async function confirmDevolver () {
  const m = modals.value.devolver
  if (!m.comentario.trim()) { m.error = 'Debes ingresar una observación.'; return }
  m.error = ''
  guardando.value = true
  try {
    const ref = doc(db, 'informes', props.informeId)
    await updateDoc(ref, {
      estado: 'devuelto',
      observacionDevolucion: m.comentario.trim(),
      devueltoPor: 'aprobador',
      devueltoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    })
    informe.value.estado = 'devuelto'
    m.show = false
  } catch (e) { console.error(e) } finally { guardando.value = false }
}
</script>

<style scoped>
.thumb-sm { width: 56px; height: 40px; overflow: hidden; display:flex; align-items:center; justify-content:center; }
.thumb-sm img { width: 100%; height: 100%; object-fit: cover; }

/* ===== Barra flotante estilo MisRendiciones ===== */
.fab-bar{
  position: sticky;
  bottom: 0;
  left: 0; right: 0;
  background: #fff;
  z-index: 1040;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
.glass{ backdrop-filter: blur(8px); background: rgba(255,255,255,.9); }
.shadow-xl{ box-shadow: 0 -12px 30px rgba(0,0,0,.12); }

/* Animación tipo MisRendiciones */
.slide-up-blur-enter-from { opacity: 0; transform: translateY(20px); filter: blur(2px); }
.slide-up-blur-enter-active { transition: all .28s ease; }
.slide-up-blur-leave-to { opacity: 0; transform: translateY(12px); filter: blur(2px); }
.slide-up-blur-leave-active { transition: all .2s ease; }

.badge { text-transform: capitalize; }
</style>
