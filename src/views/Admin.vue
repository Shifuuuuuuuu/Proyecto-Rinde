<!-- eslint-disable vue/multi-word-component-names -->
<!-- eslint-disable vue/no-deprecated-filter -->
<template>
  <div class="container-fluid py-4">
    <!-- HEADER -->
    <div class="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="router.back()">
          <i class="bi bi-arrow-left"></i> Volver
        </button>
        <h2 class="h5 mb-0">Panel de rendiciones (Admin)</h2>
        <span v-if="onlyCurrentMonth" class="badge text-bg-primary ms-2">Mes actual</span>
        <span v-else class="badge text-bg-secondary ms-2">Todas</span>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="toggleMonth()">
          <i class="bi bi-calendar3"></i>
          <span class="ms-1">{{ onlyCurrentMonth ? 'Ver todas' : 'Solo mes actual' }}</span>
        </button>
        <button class="btn btn-outline-dark btn-sm" @click="goUsuarios">
          <i class="bi bi-people"></i>
          <span class="ms-1">Usuarios</span>
        </button>
      </div>
    </div>

    <!-- CONTROLES -->
    <div class="card mb-3 shadow-sm">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-12 col-md-4">
            <label class="form-label small">Buscar</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input v-model="search" class="form-control" placeholder="Motivo, empresa, comentario, número..." @input="onSearchChange" />
            </div>
          </div>

          <div class="col-6 col-md-2">
            <label class="form-label small">Estado</label>
            <select v-model="estado" class="form-select" @change="reload(true)">
              <option value="todas">Todas</option>
              <option value="borrador">Borrador</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>

          <div class="col-6 col-md-3">
            <label class="form-label small">Categoría</label>
            <select v-model="categoria" class="form-select" @change="reload(true)">
              <option value="todas">Todas</option>
              <option v-for="c in categoriaOpts" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="col-12 col-md-3">
            <label class="form-label small">Solicitante (email)</label>
            <select v-model="solicitante" class="form-select" @change="reload(true)">
              <option value="todos">Todos</option>
              <option v-for="email in solicitantesOpts" :key="email" :value="email">{{ email }}</option>
            </select>
          </div>
        </div>

        <div class="d-flex align-items-center justify-content-between mt-3">
          <div class="d-flex align-items-center gap-2">
            <label class="form-label small mb-0">Por página</label>
            <select v-model.number="pageSize" class="form-select form-select-sm w-auto" @change="reload(true)">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- ALERTA -->
    <div v-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      <div>{{ error }}</div>
    </div>

    <!-- LISTA -->
    <div class="card shadow-sm">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="min-width: 120px;">Fecha gasto</th>
              <th>Solicitante</th>
              <th>Empresa</th>
              <th>Categoría</th>
              <th class="text-end" style="min-width: 120px;">Monto</th>
              <th class="text-end" style="min-width: 260px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-4">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Cargando rendiciones...
              </td>
            </tr>

            <tr
              v-for="r in renderRows"
              :key="r.id"
              :class="['row-hover', selected?.id === r.id ? 'table-active' : '']"
              @click="openDetail(r)"
            >
              <td>
                <div class="fw-semibold">{{ formatFecha(r.fecha) }}</div>
                <small class="text-muted">{{ r.numeroDocumento || r.folio ? ('N° ' + (r.numeroDocumento || r.folio)) : '' }}</small>
              </td>
              <td>
                <div class="fw-semibold">{{ r.nombre || r.solicitanteNombre || '—' }}</div>
                <small class="text-muted">{{ r.email || r.userEmail || '-' }}</small>
              </td>
              <td>{{ r.empresa || '-' }}</td>
              <td>{{ r.categoria || '-' }}</td>
              <td class="text-end">{{ formatMonto(r.monto) }}</td>
              <td class="text-end">
                <div class="btn-group">
                  <button class="btn btn-outline-secondary btn-sm" @click.stop="openDetail(r)" title="Ver detalle">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-outline-primary btn-sm" @click.stop="openEdit(r)" title="Editar">
                    <i class="bi bi-pencil-square"></i>
                  </button>

                  <!-- Sacar de informe -->
                  <button
                    class="btn btn-outline-warning btn-sm"
                    v-if="r.informeId"
                    @click.stop="sacarDeInforme(r)"
                    title="Sacar de informe"
                  >
                    <i class="bi bi-box-arrow-left"></i>
                  </button>

                  <!-- Agregar a informe (si NO tiene informe) -->
                  <div class="btn-group" v-else>
                    <button
                      class="btn btn-outline-success btn-sm dropdown-toggle"
                      data-bs-toggle="dropdown"
                      @click.stop="ensureInformes()"
                      title="Agregar a informe"
                    >
                      <i class="bi bi-journal-plus"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" style="max-height:280px; overflow:auto;">
                      <li v-if="informesLoading" class="px-3 py-2 small text-muted">Cargando informes…</li>
                      <li v-else-if="informesOpts.length === 0" class="px-3 py-2 small text-muted">Sin informes pendientes</li>
                      <li v-for="inf in informesOpts" :key="inf.id">
                        <button class="dropdown-item" @click.stop="agregarAInforme(r, inf.id)">
                          {{ inf.titulo }}
                        </button>
                      </li>
                    </ul>
                  </div>

                  <button class="btn btn-outline-danger btn-sm" @click.stop="eliminar(r)" title="Eliminar">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!loading && renderRows.length === 0">
              <td colspan="7" class="text-center text-muted py-4">Sin rendiciones para mostrar</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINACIÓN -->
      <div class="card-footer d-flex justify-content-between align-items-center">
        <div class="small text-muted">
          Página {{ page + 1 }} • Mostrando {{ renderRows.length }} de {{ pageSize }}
        </div>
        <div class="btn-group">
          <button class="btn btn-outline-secondary btn-sm" :disabled="page === 0 || loading" @click="prevPage">
            <i class="bi bi-chevron-left"></i> Anterior
          </button>
          <button class="btn btn-outline-secondary btn-sm" :disabled="!hasNextPage || loading" @click="nextPage">
            Siguiente <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- OFFCANVAS DETALLE (con zoom/rotación) -->
    <div class="offcanvas offcanvas-end show" tabindex="-1" style="visibility: visible;" v-if="detailOpen && selected" @click.self="closeDetail">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title">
          Detalle rendición
        </h5>
        <button type="button" class="btn-close text-reset" @click="closeDetail"></button>
      </div>
      <div class="offcanvas-body">
        <div class="d-flex justify-content-between align-items-start">
          <span :class="['badge', badgeClass(selected.estado)]">{{ selected.estado || '—' }}</span>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" @click="openEdit(selected)"><i class="bi bi-pencil-square"></i> Editar</button>
            <button class="btn btn-sm btn-outline-secondary" @click="closeDetail">Cerrar</button>
          </div>
        </div>
        <hr />
        <dl class="row small">
          <dt class="col-4">Fecha</dt><dd class="col-8">{{ formatFecha(selected.fecha) }}</dd>
          <dt class="col-4">Solicitante</dt><dd class="col-8">{{ selected.nombre || selected.solicitanteNombre || '—' }}</dd>
          <dt class="col-4">Email</dt><dd class="col-8">{{ selected.email || selected.userEmail || '—' }}</dd>
          <dt class="col-4">Empresa</dt><dd class="col-8">{{ selected.empresa || '—' }}</dd>
          <dt class="col-4">Documento</dt>
          <dd class="col-8">{{ selected.tipoDocumento || '—' }}<span v-if="selected.numeroDocumento || selected.folio"> • N° {{ selected.numeroDocumento || selected.folio }}</span></dd>
          <dt class="col-4">Categoría</dt><dd class="col-8">{{ selected.categoria || '—' }}</dd>
          <dt class="col-4">Motivo</dt><dd class="col-8">{{ selected.motivo || '—' }}</dd>
          <dt class="col-4">Monto</dt><dd class="col-8">{{ formatMonto(selected.monto) }} ({{ selected.moneda || 'CLP' }})</dd>
          <dt class="col-4">Informe</dt>
          <dd class="col-8 d-flex align-items-center flex-wrap gap-2">
            <template v-if="selected.informeId">
              <span class="badge text-bg-info">
                Informe: {{ tituloInforme(selected.informeId) }}
              </span>
              <button class="btn btn-sm btn-outline-warning" @click="sacarDeInforme(selected)">
                Sacar de informe
              </button>
            </template>
            <template v-else>
              <div class="input-group input-group-sm" style="max-width: 320px;">
                <select class="form-select" v-model="informeSeleccionado" @click="ensureInformes()">
                  <option value="" disabled>Selecciona informe pendiente</option>
                  <option v-for="inf in informesOpts" :key="inf.id" :value="inf.id">{{ inf.titulo }}</option>
                </select>
                <button class="btn btn-outline-success" :disabled="!informeSeleccionado" @click="agregarAInforme(selected, informeSeleccionado)">
                  Agregar
                </button>
              </div>
              <small class="text-muted d-block" v-if="informesLoading">Cargando informes…</small>
              <small class="text-muted d-block" v-else-if="informesOpts.length===0">No hay informes pendientes</small>
            </template>
          </dd>
          <dt class="col-4">Notas</dt><dd class="col-8"><pre class="mb-0 small" style="white-space: pre-wrap;">{{ selected.notas || '—' }}</pre></dd>
        </dl>

        <div v-if="selected.fotoPreview" class="mt-3">
          <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <div class="small text-muted">Comprobante</div>
            <div class="btn-toolbar" role="toolbar">
              <div class="btn-group btn-group-sm me-2" role="group" aria-label="Zoom">
                <button class="btn btn-outline-secondary" @click="zoomOut" title="Alejar"><i class="bi bi-zoom-out"></i></button>
                <input type="range" class="form-range mx-2" style="width:160px;" min="0.5" max="3" step="0.1" v-model.number="zoom" />
                <button class="btn btn-outline-secondary" @click="zoomIn" title="Acercar"><i class="bi bi-zoom-in"></i></button>
                <button class="btn btn-outline-secondary" @click="zoomReset" title="Reset zoom"><i class="bi bi-aspect-ratio"></i></button>
              </div>
              <div class="btn-group btn-group-sm" role="group" aria-label="Rotación">
                <button class="btn btn-outline-secondary" @click="rotateLeft" title="Rotar -90°"><i class="bi bi-arrow-counterclockwise"></i></button>
                <button class="btn btn-outline-secondary" @click="rotateRight" title="Rotar +90°"><i class="bi bi-arrow-clockwise"></i></button>
                <button class="btn btn-outline-secondary" @click="rotateReset" title="Reset rotación"><i class="bi bi-bullseye"></i></button>
              </div>
            </div>
          </div>
          <div class="img-viewport border rounded bg-light d-flex align-items-center justify-content-center">
            <img :src="selected.fotoPreview" alt="Comprobante" class="img-fluid" :style="imgTransform" />
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL EDITAR -->
    <div class="modal fade show" tabindex="-1" style="display:block;" v-if="editOpen" @click.self="closeEdit">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-pencil-square me-2"></i> Editar rendición</h5>
            <button type="button" class="btn-close" @click="closeEdit"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-4"><label class="form-label">Fecha</label><input v-model="editForm.fechaStr" type="date" class="form-control" /></div>
              <div class="col-md-4"><label class="form-label">Monto</label><input v-model.number="editForm.monto" type="number" min="0" class="form-control" /></div>
              <div class="col-md-4">
                <label class="form-label">Moneda</label>
                <select v-model="editForm.moneda" class="form-select">
                  <option value="CLP">CLP</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="UF">UF</option>
                </select>
              </div>
              <div class="col-md-6"><label class="form-label">Categoría</label><input v-model="editForm.categoria" class="form-control" /></div>
              <div class="col-md-6"><label class="form-label">Motivo</label><input v-model="editForm.motivo" class="form-control" /></div>
              <div class="col-md-6">
                <label class="form-label">Tipo documento</label>
                <select v-model="editForm.tipoDocumento" class="form-select"><option value="">—</option><option value="Boleta">Boleta</option><option value="Factura">Factura</option></select>
              </div>
              <div class="col-md-6"><label class="form-label">N° documento/folio</label><input v-model="editForm.numeroDocumento" class="form-control" /></div>
              <div class="col-md-6">
                <label class="form-label">Estado</label>
                <select v-model="editForm.estado" class="form-select"><option value="borrador">Borrador</option><option value="pendiente">Pendiente</option><option value="aprobada">Aprobada</option><option value="rechazada">Rechazada</option></select>
              </div>
              <div class="col-12"><label class="form-label">Notas</label><textarea v-model="editForm.notas" rows="3" class="form-control"></textarea></div>

              <!-- Reemplazar imagen -->
              <div class="col-12">
                <label class="form-label">Reemplazar comprobante (opcional)</label>
                <input type="file" class="form-control" accept="image/*" @change="onReplaceImage" />
                <div v-if="replacePreview" class="mt-2">
                  <div class="small text-muted mb-1">Vista previa nueva</div>
                  <img :src="replacePreview" class="img-fluid rounded border" alt="Nueva imagen" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="closeEdit">Cancelar</button>
            <button class="btn btn-primary" :disabled="saving" @click="saveEdit">
              <span v-if="!saving"><i class="bi bi-save me-1"></i> Guardar cambios</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="editOpen" class="modal-backdrop fade show" @click="closeEdit"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase'
import {
  collection, query, where, orderBy, limit, startAfter, getDocs, getDoc,
  doc, updateDoc, deleteDoc, serverTimestamp, Timestamp,
  writeBatch, arrayUnion, arrayRemove
} from 'firebase/firestore'

/* -------------------- STATE -------------------- */
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const onlyCurrentMonth = ref(true)
const estado = ref('todas')
const categoria = ref('todas')
const solicitante = ref('todos')  // email o 'todos'
const search = ref('')

const categoriaOpts = ref([])
const solicitantesOpts = ref([])  // lista de emails únicos

const pageSize = ref(10)
const page = ref(0)
const cursors = ref([])
const hasNextPage = ref(false)

const rows = ref([])
const selected = ref(null)

/* Offcanvas detalle e imagen */
const detailOpen = ref(false)
const zoom = ref(1)
const rotation = ref(0)
function openDetail(r){ selected.value = r; detailOpen.value = true; zoom.value = 1; rotation.value = 0 }
function closeDetail(){ detailOpen.value = false }
function onSearchChange(){}
function zoomIn(){ zoom.value = Math.min(3, +(zoom.value + 0.2).toFixed(1)) }
function zoomOut(){ zoom.value = Math.max(0.5, +(zoom.value - 0.2).toFixed(1)) }
function zoomReset(){ zoom.value = 1 }
function rotateLeft(){ rotation.value = (rotation.value - 90 + 360) % 360 }
function rotateRight(){ rotation.value = (rotation.value + 90) % 360 }
function rotateReset(){ rotation.value = 0 }
const imgTransform = computed(() => ({
  transform: `rotate(${rotation.value}deg) scale(${zoom.value})`,
  transformOrigin: 'center center',
  transition: 'transform .12s ease',
  maxWidth: '100%',
  maxHeight: '100%'
}))
// --- Cache de títulos de informes (id -> titulo) ---
const informeTituloCache = ref(new Map())

async function fetchInformeTitulo(id){
  if (!id) return null
  if (informeTituloCache.value.has(id)) return informeTituloCache.value.get(id)
  try{
    const s = await getDoc(doc(db, 'informes', id))
    const titulo = s.exists() ? (s.data()?.titulo || id) : id
    informeTituloCache.value.set(id, titulo)
    return titulo
  }catch{
    informeTituloCache.value.set(id, id)
    return id
  }
}

// helper reactivo para template: devuelve el título si lo hay, y dispara la carga si falta
function tituloInforme(id){
  const t = informeTituloCache.value.get(id)
  if (!t && id) fetchInformeTitulo(id)
  return t || id || '—'
}

// cuando abres el detalle, precarga el título si hay informe
watch(selected, (val)=>{
  if (val?.informeId) fetchInformeTitulo(val.informeId)
})

/* Informes: SOLO pendientes */
const informesOpts = ref([])             // [{id, titulo}]
const informesLoading = ref(false)
const informeSeleccionado = ref('')
async function ensureInformes(){
  if (informesLoading.value || informesOpts.value.length) return
  try{
    informesLoading.value = true
    const qInf = query(
      collection(db, 'informes'),
      where('estado','==','pendiente'),
      orderBy('creadoEn','desc'),
      limit(100)
    )
    const snap = await getDocs(qInf)
    informesOpts.value = snap.docs.map(d => ({ id: d.id, titulo: d.data().titulo || d.id }))
  } finally{
    informesLoading.value = false
  }
}

/* -------------------- RANGO MES -------------------- */
function getRangoMesActual() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return { inicioMes: first, finMes: last }
}
const { inicioMes, finMes } = getRangoMesActual()
const rangoMesInicio = ref(inicioMes)
const rangoMesFin = ref(finMes)

/* -------------------- FORMATTERS -------------------- */
const formatMonto = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n || 0)
const formatFecha = (ts) => {
  try {
    const d = ts?.toDate ? ts.toDate() : (typeof ts === 'number' ? new Date(ts) : (ts || new Date()))
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  } catch { return '-' }
}
const badgeClass = (e) => ({
  borrador: 'badge rounded-pill text-bg-secondary',
  pendiente: 'badge rounded-pill text-bg-warning',
  aprobada: 'badge rounded-pill text-bg-success',
  rechazada: 'badge rounded-pill text-bg-danger'
}[e] || 'badge rounded-pill text-bg-secondary')

/* -------------------- CARGA / FILTRO -------------------- */
async function fetchPage(opts = { reset: false }) {
  loading.value = true
  error.value = ''
  try {
    if (opts.reset) {
      page.value = 0
      cursors.value = []
    }

    const baseCol = collection(db, 'rendiciones')
    const clauses = []
    if (onlyCurrentMonth.value) {
      clauses.push(where('creadoEn', '>=', rangoMesInicio.value))
      clauses.push(where('creadoEn', '<=', rangoMesFin.value))
    }
    if (estado.value !== 'todas') clauses.push(where('estado', '==', estado.value))
    if (categoria.value !== 'todas') clauses.push(where('categoria', '==', categoria.value))

    let docs = []

    if (solicitante.value !== 'todos') {
      // DUAL QUERY (userEmail || email)
      let q1 = query(baseCol, ...clauses, where('userEmail','==', solicitante.value), orderBy('creadoEn','desc'), limit(pageSize.value))
      let q2 = query(baseCol, ...clauses, where('email','==', solicitante.value), orderBy('creadoEn','desc'), limit(pageSize.value))
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)])
      const tmp = [...s1.docs, ...s2.docs]
      const map = new Map()
      tmp.forEach(d => map.set(d.id, d))
      docs = Array.from(map.values())
        .sort((a,b) => (b.data().creadoEn?.toMillis?.() ?? 0) - (a.data().creadoEn?.toMillis?.() ?? 0))
        .slice(0, pageSize.value)
      hasNextPage.value = (s1.docs.length === pageSize.value) || (s2.docs.length === pageSize.value)
      if (docs.length > 0) cursors.value[page.value] = docs[docs.length - 1]
    } else {
      let q = query(baseCol, ...clauses, orderBy('creadoEn','desc'), limit(pageSize.value))
      if (page.value > 0 && cursors.value[page.value - 1]) {
        q = query(baseCol, ...clauses, orderBy('creadoEn','desc'), startAfter(cursors.value[page.value - 1]), limit(pageSize.value))
      }
      const snap = await getDocs(q)
      docs = snap.docs
      hasNextPage.value = snap.docs.length === pageSize.value
      if (snap.docs.length > 0) cursors.value[page.value] = snap.docs[snap.docs.length - 1]
    }

    rows.value = docs.map(d => {
      const data = d.data()
      return { id: d.id, ...data, userEmail: data.userEmail || data.email || null }
    })

    buildOptionsFrom(rows.value)

    if (selected.value) {
      const again = rows.value.find(r => r.id === selected.value.id)
      if (again) selected.value = again
      else { selected.value = null; detailOpen.value = false }
    }
  } catch (e) {
    console.error(e)
    error.value = 'No fue posible cargar las rendiciones (verifica índices compuestos en Firestore).'
  } finally {
    loading.value = false
  }
}

function buildOptionsFrom(list) {
  const cats = new Set(categoriaOpts.value)
  list.forEach(x => x?.categoria && cats.add(x.categoria))
  categoriaOpts.value = Array.from(cats).sort()

  const emails = new Set(solicitantesOpts.value)
  list.forEach(x => {
    const email = x?.userEmail || x?.email
    if (email && typeof email === 'string' && email.includes('@')) emails.add(email)
  })
  solicitantesOpts.value = Array.from(emails).sort((a,b)=>a.localeCompare(b))
}

/* -------------------- BUSQUEDA CLIENTE -------------------- */
const renderRows = computed(() => {
  const term = (search.value || '').toLowerCase().trim()
  if (!term) return rows.value
  return rows.value.filter(r => {
    const texto = [
      r.motivo, r.empresa, r.comentario, r.numeroDocumento, r.folio, r.solicitanteNombre, r.userEmail, r.email
    ].filter(Boolean).join(' ').toLowerCase()
    return texto.includes(term)
  })
})

/* -------------------- ACCIONES -------------------- */

async function eliminar(r) {
  const ok = confirm(`¿Eliminar la rendición N° ${r.numeroDocumento || r.folio || r.id}? Esta acción no se puede deshacer.`)
  if (!ok) return
  try {
    await deleteDoc(doc(db, 'rendiciones', r.id))
    rows.value = rows.value.filter(x => x.id !== r.id)
    if (selected.value?.id === r.id) { selected.value = null; detailOpen.value = false }
  } catch (e) {
    console.error(e)
    error.value = 'No fue posible eliminar la rendición.'
  }
}

/* -------------------- INFORMES: agregar / sacar (batch con campo correcto) -------------------- */
async function agregarAInforme(r, informeId){
  if (!informeId || !r?.id) return
  try{
    const infRef = doc(db, 'informes', informeId)
    const infSnap = await getDoc(infRef)
    if (!infSnap.exists()) throw new Error('Informe no existe')
    const inf = infSnap.data()
    if (inf.estado !== 'pendiente') throw new Error('El informe no está pendiente')

    const batch = writeBatch(db)
    batch.update(infRef, { rendicionIds: arrayUnion(r.id), _lastUpdate: serverTimestamp() })
    const renRef = doc(db, 'rendiciones', r.id)
    // 🔽 además de informeId, marcamos estado pendiente
    batch.update(renRef, { informeId, estado: 'pendiente', _lastUpdate: serverTimestamp() })
    await batch.commit()

    // cache título y refresco UI
    informeTituloCache.value.set(informeId, inf.titulo || informeId)
    r.informeId = informeId
    r.estado = 'pendiente'
    if (selected.value?.id === r.id){
      selected.value.informeId = informeId
      selected.value.estado = 'pendiente'
    }
    informeSeleccionado.value = ''
  } catch(e){
    console.error(e)
    error.value = e?.message || 'No se pudo agregar al informe.'
  }
}


async function sacarDeInforme(r){
  if (!r?.id) return
  const nombre = tituloInforme(r.informeId)
  const ok = confirm(`¿Seguro deseas sacar esta rendición del informe "${nombre}"?`)
  if (!ok) return
  try{
    const informeId = r.informeId
    const batch = writeBatch(db)
    if (informeId){
      const infRef = doc(db, 'informes', informeId)
      batch.update(infRef, { rendicionIds: arrayRemove(r.id), _lastUpdate: serverTimestamp() })
    }
    const renRef = doc(db, 'rendiciones', r.id)
    // 🔽 quitamos informe y volvemos a borrador
    batch.update(renRef, { informeId: null, estado: 'borrador', _lastUpdate: serverTimestamp() })
    await batch.commit()

    r.informeId = null
    r.estado = 'borrador'
    if (selected.value?.id === r.id){
      selected.value.informeId = null
      selected.value.estado = 'borrador'
    }
  } catch(e){
    console.error(e)
    error.value = 'No se pudo sacar del informe.'
  }
}



/* -------------------- MODAL EDITAR -------------------- */
const editOpen = ref(false)
const editForm = ref({})
const replacePreview = ref(null)
function dateToInput(d) {
  try {
    const x = d?.toDate ? d.toDate() : (d instanceof Date ? d : new Date(d))
    const y = x.getFullYear(), m = String(x.getMonth() + 1).padStart(2,'0'), da = String(x.getDate()).padStart(2,'0')
    return `${y}-${m}-${da}`
  } catch { return '' }
}
function buildEditForm(r) {
  editForm.value = {
    id: r.id,
    fechaStr: dateToInput(r.fecha),
    monto: r.monto ?? 0,
    moneda: r.moneda || 'CLP',
    categoria: r.categoria || '',
    motivo: r.motivo || '',
    notas: r.notas || '',
    tipoDocumento: r.tipoDocumento || '',
    numeroDocumento: r.numeroDocumento || r.folio || '',
    estado: r.estado || 'borrador',
  }
  replacePreview.value = null
}
function openEdit(r) { buildEditForm(r); editOpen.value = true }
function closeEdit() { if (!saving.value) editOpen.value = false }
async function onReplaceImage(e){
  const file = e.target.files?.[0]
  if (!file) return
  try{
    replacePreview.value = await compressImageToDataURL(file, { maxW: 1280, maxH: 1280, quality: 0.8 })
  }catch(err){
    console.error(err)
    error.value = 'No se pudo procesar la imagen nueva.'
    replacePreview.value = null
  }
}
async function saveEdit() {
  if (!editForm.value.id) return
  saving.value = true
  error.value = ''
  try {
    const payload = {
      monto: Number(editForm.value.monto || 0),
      moneda: editForm.value.moneda || 'CLP',
      categoria: (editForm.value.categoria || '').trim(),
      motivo: (editForm.value.motivo || '').trim(),
      notas: (editForm.value.notas || '').trim() || null,
      tipoDocumento: editForm.value.tipoDocumento || '',
      numeroDocumento: (editForm.value.numeroDocumento || '').trim(),
      folio: (editForm.value.numeroDocumento || '').trim(),
      estado: editForm.value.estado || 'borrador',
      _lastUpdate: serverTimestamp(),
    }
    if (editForm.value.fechaStr) payload.fecha = Timestamp.fromDate(new Date(editForm.value.fechaStr))
    if (replacePreview.value) payload.fotoPreview = replacePreview.value

    const refDoc = doc(db, 'rendiciones', editForm.value.id)
    await updateDoc(refDoc, payload)

    const idx = rows.value.findIndex(r => r.id === editForm.value.id)
    if (idx >= 0) rows.value[idx] = { ...rows.value[idx], ...payload }
    if (selected.value?.id === editForm.value.id) selected.value = { ...selected.value, ...payload }

    editOpen.value = false
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo guardar los cambios.'
  } finally {
    saving.value = false
  }
}

/* Imagen helper (compresión a dataURL) */
function compressImageToDataURL(file, { maxW = 1280, maxH = 1280, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = () => {
      img.onload = () => {
        const { width, height } = img
        const ratio = Math.min(maxW / width, maxH / height, 1)
        const w = Math.round(width * ratio)
        const h = Math.round(height * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const isPng = file.type.includes('png')
        const mime = isPng ? 'image/png' : 'image/jpeg'
        const dataURL = canvas.toDataURL(mime, isPng ? undefined : quality)
        resolve(dataURL)
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/* -------------------- PAGINACIÓN -------------------- */
async function nextPage() { if (!hasNextPage.value || loading.value) return; page.value += 1; await fetchPage() }
async function prevPage() { if (page.value === 0 || loading.value) return; page.value -= 1; await fetchPage() }

/* -------------------- RELOAD / WATCHERS -------------------- */
async function reload(resetCursors = true) { await fetchPage({ reset: resetCursors }) }
function toggleMonth() {
  onlyCurrentMonth.value = !onlyCurrentMonth.value
  if (onlyCurrentMonth.value) {
    const { inicioMes, finMes } = getRangoMesActual()
    rangoMesInicio.value = inicioMes
    rangoMesFin.value = finMes
  }
  reload(true)
}
watch(pageSize, () => reload(true))
watch([estado, categoria, solicitante], () => reload(true))

/* -------------------- NAV -------------------- */
function goUsuarios(){ router.push({ name: 'AdminUsuarios' }) }

/* -------------------- INIT -------------------- */
onMounted(() => { reload(true) })

/* --- Notas de índices: mismos que te dejé antes --- */
</script>

<style scoped>
.table td, .table th { vertical-align: middle; }
.card { border-radius: 0.5rem; }
.badge { font-weight: 600; letter-spacing: .2px; }
.btn-group .btn { white-space: nowrap; }
.row-hover { cursor: pointer; }
.row-hover:hover { background: rgba(0,0,0,.02); }

.offcanvas { width: min(520px, 96vw); z-index: 1075; border-left: 1px solid rgba(0,0,0,.08); }
.offcanvas-header { border-bottom: 1px solid rgba(0,0,0,.06); }
.img-viewport { height: 340px; overflow: hidden; }

.modal-backdrop { z-index: 1060; }
.modal { z-index: 1070; }
</style>
