<!-- src/views/AdminInformes.vue -->
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
        <h2 class="h5 mb-0">Administrar informes</h2>
        <span v-if="onlyCurrentMonth" class="badge text-bg-primary ms-2">Mes actual</span>
        <span v-else class="badge text-bg-secondary ms-2">Todas las fechas</span>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="toggleMonth()">
          <i class="bi bi-calendar3"></i>
          <span class="ms-1">{{ onlyCurrentMonth ? 'Ver todas' : 'Solo mes actual' }}</span>
        </button>
      </div>
    </div>

    <!-- CONTROLES -->
    <div class="card mb-3 shadow-sm">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-12 col-md-4">
            <label class="form-label small">Buscar (título, nota, usuario)</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input v-model="search" class="form-control" placeholder="Ej: viaje, septiembre, ana..." @input="onSearchChange" />
            </div>
          </div>

          <div class="col-6 col-md-3">
            <label class="form-label small">Estado</label>
            <select v-model="estado" class="form-select" @change="reload(true)">
              <option value="todas">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="parcial">Parcial</option>
              <option value="rechazado">Rechazado</option>
              <option value="devuelto">Devuelto</option>
            </select>
          </div>

          <div class="col-6 col-md-3">
            <label class="form-label small">Por página</label>
            <select v-model.number="pageSize" class="form-select" @change="reload(true)">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>

          <div class="col-12 col-md-2 d-flex align-items-end">
            <button class="btn btn-outline-primary w-100" @click="crearInforme">
              <i class="bi bi-plus-circle me-1"></i> Nuevo informe
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ALERTA -->
    <div v-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      <div>{{ error }}</div>
    </div>

    <div class="row g-3">
      <!-- LISTA DE INFORMES -->
      <div class="col-lg-8">
        <div class="card shadow-sm">
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="min-width: 160px;">Creado</th>
                  <th>Título</th>
                  <th>Estado</th>
                  <th class="text-end" style="min-width: 120px;">Rendiciones</th>
                  <th class="text-end" style="min-width: 140px;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="5" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                    Cargando informes...
                  </td>
                </tr>

                <tr
                  v-for="inf in renderInformes"
                  :key="inf.id"
                  :class="['row-hover', selected?.id === inf.id ? 'table-active' : '']"
                  @click="openDetail(inf)"
                >
                  <td>
                    <div class="fw-semibold">{{ formatFecha(inf.creadoEn) }}</div>
                  </td>
                  <td>
                    <div class="fw-semibold">{{ inf.titulo || '(Sin título)' }}</div>
                    <small class="text-muted" v-if="inf.nota">{{ inf.nota }}</small>
                  </td>
                  <td>
                    <span :class="['badge', badgeClass(inf.estado)]">{{ inf.estado || '—' }}</span>
                  </td>
                  <td class="text-end">
                    <span class="badge text-bg-light">{{ (inf.rendicionIds?.length || 0).toString() }}</span>
                  </td>
                  <td class="text-end">
                    <div class="btn-group">
                      <button class="btn btn-outline-secondary btn-sm" @click.stop="openDetail(inf)" title="Ver detalle">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-outline-primary btn-sm" @click.stop="openEditInforme(inf)" title="Editar informe">
                        <i class="bi bi-pencil-square"></i>
                      </button>
                      <button class="btn btn-outline-danger btn-sm" @click.stop="eliminarInforme(inf)" title="Eliminar">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="!loading && renderInformes.length === 0">
                  <td colspan="5" class="text-center text-muted py-4">Sin informes para mostrar</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- PAGINACIÓN -->
          <div class="card-footer d-flex justify-content-between align-items-center">
            <div class="small text-muted">
              Página {{ page + 1 }} • Mostrando {{ renderInformes.length }} de {{ pageSize }}
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
      </div>

      <!-- DETALLE -->
      <div class="col-lg-4">
        <div class="card shadow-sm sticky-top" style="top: 12px;">
          <div class="card-body" v-if="selected">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h5 class="card-title mb-0">{{ selected.titulo || '(Sin título)' }}</h5>
                <small class="text-muted">Creado: {{ formatFecha(selected.creadoEn) }}</small>
              </div>
              <div class="d-flex align-items-center gap-2">
                <span :class="['badge', badgeClass(selected.estado)]">{{ selected.estado || '—' }}</span>
                <button class="btn btn-sm btn-outline-primary" @click="openEditInforme(selected)">
                  <i class="bi bi-pencil-square"></i> Editar
                </button>
              </div>
            </div>
            <hr/>

            <dl class="row small mb-0">
              <dt class="col-4">Estado</dt>
              <dd class="col-8">
                <select class="form-select form-select-sm" :value="selected.estado || 'pendiente'"
                        @change="onChangeEstadoInforme(selected, $event.target.value)">
                  <option value="pendiente">Pendiente</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="borrador">Borrador</option>
                </select>
              </dd>

              <dt class="col-4">Nota</dt>
              <dd class="col-8">{{ selected.nota || '—' }}</dd>

              <dt class="col-4">Total items</dt>
              <dd class="col-8">{{ (selected.rendicionIds?.length || 0).toString() }}</dd>
            </dl>

            <div class="d-flex justify-content-between align-items-center mt-3">
              <h6 class="mb-0">Rendiciones</h6>
              <button class="btn btn-sm btn-outline-success" @click="openPicker">
                <i class="bi bi-journal-plus me-1"></i> Agregar
              </button>
            </div>

            <!-- RENDICIONES DEL INFORME -->
            <div class="table-responsive mt-2">
              <table class="table table-sm align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Solicitante</th>
                    <th class="text-end">Monto</th>
                    <th class="text-end" style="min-width:120px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="rendicionesLoading">
                    <td colspan="4" class="text-center py-3">
                      <div class="spinner-border spinner-border-sm me-2"></div> Cargando...
                    </td>
                  </tr>
                  <tr v-for="r in rendicionesInforme" :key="r.id" class="row-hover" @click="openRendicionDetail(r)">
                    <td>{{ formatFecha(r.fecha) }}</td>
                    <td>
                      <div class="fw-semibold">{{ r.solicitanteNombre || r.nombre || '—' }}</div>
                      <small class="text-muted">{{ r.userEmail || r.email || '-' }}</small>
                    </td>
                    <td class="text-end">{{ formatMonto(r.monto) }}</td>
                    <td class="text-end">
                      <div class="btn-group">
                        <button class="btn btn-outline-secondary btn-sm" @click.stop="openRendicionDetail(r)" title="Ver detalle">
                          <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-sm" @click.stop="sacarDeInforme(r)" title="Sacar del informe">
                          <i class="bi bi-box-arrow-left"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!rendicionesLoading && rendicionesInforme.length===0">
                    <td colspan="4" class="text-center text-muted py-3">Este informe no tiene rendiciones.</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
          <div class="card-body text-muted text-center" v-else>
            Selecciona un informe para ver su detalle.
          </div>
        </div>
      </div>
    </div>

    <!-- OFFCANVAS DETALLE RENDICIÓN -->
    <div class="offcanvas offcanvas-end show" tabindex="-1" style="visibility: visible;"
         v-if="detailOpen && selectedRendicion" @click.self="closeDetail">
      <div class="offcanvas-header">
        <h5 class="offcanvas-title">Detalle rendición</h5>
        <button type="button" class="btn-close text-reset" @click="closeDetail"></button>
      </div>
      <div class="offcanvas-body">
        <dl class="row small">
          <dt class="col-4">Fecha</dt><dd class="col-8">{{ formatFecha(selectedRendicion.fecha) }}</dd>
          <dt class="col-4">Solicitante</dt><dd class="col-8">{{ selectedRendicion.solicitanteNombre || selectedRendicion.nombre || '—' }}</dd>
          <dt class="col-4">Email</dt><dd class="col-8">{{ selectedRendicion.userEmail || selectedRendicion.email || '—' }}</dd>
          <dt class="col-4">Empresa</dt><dd class="col-8">{{ selectedRendicion.empresa || '—' }}</dd>
          <dt class="col-4">Doc</dt>
          <dd class="col-8">
            {{ selectedRendicion.tipoDocumento || '—' }}
            <span v-if="selectedRendicion.numeroDocumento || selectedRendicion.folio">• N° {{ selectedRendicion.numeroDocumento || selectedRendicion.folio }}</span>
          </dd>
          <dt class="col-4">Categoría</dt><dd class="col-8">{{ selectedRendicion.categoria || '—' }}</dd>
          <dt class="col-4">Monto</dt><dd class="col-8">{{ formatMonto(selectedRendicion.monto) }} ({{ selectedRendicion.moneda || 'CLP' }})</dd>
          <dt class="col-4">Estado</dt><dd class="col-8"><span :class="['badge', badgeClass(selectedRendicion.estado)]">{{ selectedRendicion.estado || '—' }}</span></dd>
          <dt class="col-4">Notas</dt><dd class="col-8"><pre class="mb-0 small" style="white-space: pre-wrap;">{{ selectedRendicion.notas || '—' }}</pre></dd>
        </dl>

        <div v-if="selectedRendicion.fotoPreview" class="mt-2">
          <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <div class="small text-muted">Comprobante</div>
            <div class="btn-toolbar">
              <div class="btn-group btn-group-sm me-2">
                <button class="btn btn-outline-secondary" @click="zoomOut"><i class="bi bi-zoom-out"></i></button>
                <input type="range" class="form-range mx-2" style="width:160px;" min="0.5" max="3" step="0.1" v-model.number="zoom" />
                <button class="btn btn-outline-secondary" @click="zoomIn"><i class="bi bi-zoom-in"></i></button>
                <button class="btn btn-outline-secondary" @click="zoomReset"><i class="bi bi-aspect-ratio"></i></button>
              </div>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary" @click="rotateLeft"><i class="bi bi-arrow-counterclockwise"></i></button>
                <button class="btn btn-outline-secondary" @click="rotateRight"><i class="bi bi-arrow-clockwise"></i></button>
                <button class="btn btn-outline-secondary" @click="rotateReset"><i class="bi bi-bullseye"></i></button>
              </div>
            </div>
          </div>
          <div class="img-viewport border rounded bg-light d-flex align-items-center justify-content-center">
            <img :src="selectedRendicion.fotoPreview" alt="Comprobante" class="img-fluid" :style="imgTransform"/>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL EDITAR INFORME -->
    <div class="modal fade show" tabindex="-1" style="display:block;" v-if="editInformeOpen" @click.self="closeEditInforme">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-pencil-square me-2"></i> Editar informe</h5>
            <button type="button" class="btn-close" @click="closeEditInforme"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label">Título</label>
                <input v-model="editInfForm.titulo" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Estado</label>
                <select v-model="editInfForm.estado" class="form-select">
                  <option value="pendiente">Pendiente</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="borrador">Borrador</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">Nota</label>
                <textarea v-model="editInfForm.nota" rows="3" class="form-control" placeholder="Notas u observaciones..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="closeEditInforme">Cancelar</button>
            <button class="btn btn-primary" :disabled="saving" @click="saveInforme">
              <span v-if="!saving"><i class="bi bi-save me-1"></i> Guardar</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="editInformeOpen" class="modal-backdrop fade show" @click="closeEditInforme"></div>

    <!-- MODAL PICKER DE RENDICIONES -->
    <div class="modal fade show" tabindex="-1" style="display:block;" v-if="pickerOpen" @click.self="closePicker">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-journal-plus me-2"></i> Agregar rendiciones a “{{ selected?.titulo || 'Informe' }}”</h5>
            <button type="button" class="btn-close" @click="closePicker"></button>
          </div>
          <div class="modal-body">
            <!-- FILTROS PICKER -->
            <div class="row g-2 mb-2">
              <div class="col-sm-4">
                <div class="input-group input-group-sm">
                  <span class="input-group-text"><i class="bi bi-search"></i></span>
                  <input v-model="pickerSearch" class="form-control" placeholder="Buscar motivo/empresa/n°..." />
                </div>
              </div>
              <div class="col-sm-3">
                <select v-model="pickerSolicitante" class="form-select form-select-sm">
                  <option value="">Solicitante (email)</option>
                  <option v-for="e in pickerSolicitantes" :key="e" :value="e">{{ e }}</option>
                </select>
              </div>
              <div class="col-sm-3">
                <select v-model="pickerCategoria" class="form-select form-select-sm">
                  <option value="">Categoría</option>
                  <option v-for="c in pickerCategorias" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
              <div class="col-sm-2 form-check form-switch d-flex align-items-center">
                <input class="form-check-input" type="checkbox" role="switch" id="soloPend" v-model="pickerSoloPendientes">
                <label class="form-check-label ms-2" for="soloPend">Solo pendientes</label>
              </div>
            </div>

            <div class="table-responsive border rounded">
              <table class="table table-sm align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Solicitante</th>
                    <th>Empresa</th>
                    <th>Categoria</th>
                    <th class="text-end">Monto</th>
                    <th class="text-end" style="min-width: 110px;">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="pickerLoading">
                    <td colspan="6" class="text-center py-3">
                      <div class="spinner-border spinner-border-sm me-2"></div> Cargando...
                    </td>
                  </tr>
                  <tr v-for="r in pickerRows" :key="r.id">
                    <td>{{ formatFecha(r.fecha) }}</td>
                    <td>
                      <div class="fw-semibold">{{ r.solicitanteNombre || r.nombre || '—' }}</div>
                      <small class="text-muted">{{ r.userEmail || r.email || '-' }}</small>
                    </td>
                    <td>{{ r.empresa || '—' }}</td>
                    <td>{{ r.categoria || '—' }}</td>
                    <td class="text-end">{{ formatMonto(r.monto) }}</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-success" @click="agregarAInforme(r, selected.id)">
                        <i class="bi bi-plus-circle me-1"></i> Agregar
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!pickerLoading && pickerRows.length===0">
                    <td colspan="6" class="text-center text-muted py-3">Sin resultados para agregar.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="closePicker">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="pickerOpen" class="modal-backdrop fade show" @click="closePicker"></div>
  </div>

  <!-- ===== Modal de confirmación (bonito) ===== -->
  <Teleport to="body">
    <div v-if="confirm.show" class="modal-backdrop-custom" @click.self="closeConfirm">
      <div class="modal-card">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-exclamation-triangle me-2 text-warning"></i>{{ confirm.title || 'Confirmar' }}
          </h5>
          <button type="button" class="btn-close" @click="closeConfirm"></button>
        </div>
        <div class="modal-body">
          <p class="mb-0">{{ confirm.message || '¿Confirmas la acción?' }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline-secondary" type="button" @click="closeConfirm">
            {{ confirm.cancelText || 'Cancelar' }}
          </button>
          <button class="btn btn-danger" type="button" :disabled="confirm.loading" @click="doConfirm">
            <span v-if="!confirm.loading">{{ confirm.confirmText || 'Eliminar' }}</span>
            <span v-else class="spinner-border spinner-border-sm"></span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ===== Toast / Snackbar ===== -->
  <Teleport to="body">
    <Transition name="snackbar">
      <div v-if="toast.show" class="snackbar shadow">
        <i class="bi me-2" :class="toast.icon"></i>
        <span>{{ toast.text }}</span>
        <button class="btn btn-sm btn-link text-white ms-2" @click="toast.show = false">Cerrar</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase'
import {
  collection, query, where, orderBy, limit, startAfter,
  getDocs, getDoc, addDoc, doc, updateDoc,
  serverTimestamp, writeBatch, arrayUnion, arrayRemove
} from 'firebase/firestore'

/* -------------------- STATE -------------------- */
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const error = ref('')

/* filtros lista */
const onlyCurrentMonth = ref(true)
const estado = ref('todas')
const search = ref('')
const pageSize = ref(10)
const page = ref(0)
const cursors = ref([])
const hasNextPage = ref(false)

/* datos */
const informes = ref([])
const selected = ref(null)

/* ===== Toast ===== */
const toast = ref({ show: false, text: '', icon: 'bi-check-circle' })
let toastTimer
function showToast (text, icon = 'bi-check-circle') {
  toast.value = { show: true, text, icon }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value.show = false), 2600)
}

/* ===== Confirm modal ===== */
const confirm = ref({
  show: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  loading: false,
  onConfirm: null
})
function openConfirm(opts = {}) {
  confirm.value = {
    show: true,
    title: opts.title || 'Confirmar',
    message: opts.message || '¿Confirmas la acción?',
    confirmText: opts.confirmText || 'Confirmar',
    cancelText: opts.cancelText || 'Cancelar',
    loading: false,
    onConfirm: opts.onConfirm || null
  }
}
function closeConfirm(){ if (!confirm.value.loading) confirm.value.show = false }
async function doConfirm(){
  if (typeof confirm.value.onConfirm !== 'function') return closeConfirm()
  confirm.value.loading = true
  try { await confirm.value.onConfirm(); closeConfirm() }
  finally { confirm.value.loading = false }
}

/* RANGO MES */
function getRangoMesActual(){
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0)
  const last  = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59)
  return { inicioMes: first, finMes: last }
}
const { inicioMes, finMes } = getRangoMesActual()
const rangoMesInicio = ref(inicioMes)
const rangoMesFin = ref(finMes)

/* helpers */
const formatMonto = (n)=> new Intl.NumberFormat('es-CL',{style:'currency', currency:'CLP'}).format(n||0)
const formatFecha = (ts)=>{
  try{
    const d = ts?.toDate ? ts.toDate() : (typeof ts==='number'? new Date(ts) : (ts || new Date()))
    return new Intl.DateTimeFormat('es-CL',{ day:'2-digit', month:'2-digit', year:'numeric' }).format(d)
  }catch{ return '-' }
}
const badgeClass = (e)=>({
  borrador: 'badge rounded-pill text-bg-secondary',
  pendiente: 'badge rounded-pill text-bg-warning',
  finalizado: 'badge rounded-pill text-bg-success',
}[e] || 'badge rounded-pill text-bg-secondary')

/* BUSQUEDA */
let searchDebounce
function onSearchChange(){ clearTimeout(searchDebounce); searchDebounce = setTimeout(()=>{}, 250) }
const renderInformes = computed(()=>{
  const term = (search.value || '').toLowerCase().trim()
  if (!term) return informes.value
  return informes.value.filter(i=>{
    const texto = [i.titulo, i.nota, i.userId].filter(Boolean).join(' ').toLowerCase()
    return texto.includes(term)
  })
})

/* FETCH */
async function fetchPage(opts = { reset:false }){
  loading.value = true
  error.value = ''
  try{
    if (opts.reset){ page.value=0; cursors.value=[] }

    const col = collection(db,'informes')
    const clauses = []
    if (onlyCurrentMonth.value){
      clauses.push(where('creadoEn','>=', rangoMesInicio.value))
      clauses.push(where('creadoEn','<=', rangoMesFin.value))
    }
    if (estado.value !== 'todas') clauses.push(where('estado','==', estado.value))

    let q = query(col, ...clauses, orderBy('creadoEn','desc'), limit(pageSize.value))
    if (page.value>0 && cursors.value[page.value-1]){
      q = query(col, ...clauses, orderBy('creadoEn','desc'), startAfter(cursors.value[page.value-1]), limit(pageSize.value))
    }
    const snap = await getDocs(q)
    informes.value = snap.docs.map(d=>({ id:d.id, ...d.data() }))
    hasNextPage.value = snap.docs.length === pageSize.value
    if (snap.docs.length>0) cursors.value[page.value] = snap.docs[snap.docs.length-1]

    // mantener selección si aún existe
    if (selected.value){
      const again = informes.value.find(x=>x.id===selected.value.id)
      selected.value = again || null
      if (again) await loadRendicionesDeInforme(again.id)
    }
  }catch(e){
    console.error(e)
    error.value = 'No fue posible cargar los informes (revisa índices en Firestore).'
  }finally{
    loading.value=false
  }
}
async function reload(reset=true){ await fetchPage({ reset }) }
function toggleMonth(){
  onlyCurrentMonth.value = !onlyCurrentMonth.value
  if (onlyCurrentMonth.value){
    const { inicioMes, finMes } = getRangoMesActual()
    rangoMesInicio.value = inicioMes
    rangoMesFin.value = finMes
  }
  reload(true)
}
watch([estado, pageSize], ()=> reload(true))

/* NAV/SELECCION */
function openDetail(inf){ selected.value = inf; loadRendicionesDeInforme(inf.id) }

/* RENDICIONES DEL INFORME (panel derecho) */
const rendicionesInforme = ref([])
const rendicionesLoading = ref(false)
async function loadRendicionesDeInforme(informeId){
  rendicionesLoading.value = true
  try{
    // rendimiento: mejor traer por igualdad a informeId
    const q = query(collection(db,'rendiciones'), where('informeId','==', informeId), orderBy('creadoEn','desc'), limit(100))
    const snap = await getDocs(q)
    rendicionesInforme.value = snap.docs.map(d=>({ id:d.id, ...d.data(), userEmail: d.data().userEmail || d.data().email || null }))
  }finally{
    rendicionesLoading.value = false
  }
}

/* CAMBIO DE ESTADO/EDICIÓN DE INFORME */
const editInformeOpen = ref(false)
const editInfForm = ref({})
function openEditInforme(inf){
  editInfForm.value = {
    id: inf.id,
    titulo: inf.titulo || '',
    estado: inf.estado || 'pendiente',
    nota: inf.nota || ''
  }
  editInformeOpen.value = true
}
function closeEditInforme(){ if(!saving.value) editInformeOpen.value=false }
async function saveInforme(){
  if (!editInfForm.value.id) return
  saving.value=true; error.value=''
  try{
    const refDoc = doc(db,'informes', editInfForm.value.id)
    await updateDoc(refDoc, {
      titulo: (editInfForm.value.titulo||'').trim(),
      estado: editInfForm.value.estado || 'pendiente',
      nota: (editInfForm.value.nota||'').trim() || null,
      _lastUpdate: serverTimestamp()
    })
    const idx = informes.value.findIndex(i=>i.id===editInfForm.value.id)
    if (idx>=0) informes.value[idx] = { ...informes.value[idx], ...editInfForm.value }
    if (selected.value?.id === editInfForm.value.id) selected.value = { ...selected.value, ...editInfForm.value }
    editInformeOpen.value=false
    showToast('Informe guardado', 'bi-save')
  }catch(e){
    console.error(e)
    error.value='No se pudo guardar el informe.'
  }finally{ saving.value=false }
}
async function onChangeEstadoInforme(inf, nuevo){
  try{
    await updateDoc(doc(db,'informes', inf.id), { estado:nuevo, _lastUpdate: serverTimestamp() })
    inf.estado = nuevo
    if (selected.value?.id === inf.id) selected.value.estado = nuevo
    showToast(`Informe actualizado a “${nuevo}”`, 'bi-arrow-repeat')
  }catch(e){
    console.error(e); error.value='No se pudo actualizar el estado del informe.'
  }
}

/* CREAR / ELIMINAR INFORME */
async function crearInforme(){
  try{
    const ref = await addDoc(collection(db,'informes'),{
      titulo: 'Nuevo informe',
      estado: 'pendiente',
      nota: null,
      rendicionIds: [],
      creadoEn: serverTimestamp(),
      _lastUpdate: serverTimestamp()
    })
    await reload(true)
    const nuevo = informes.value.find(i=>i.id===ref.id)
    if (nuevo) openDetail(nuevo)
    showToast('Informe creado', 'bi-plus-circle')
  }catch(e){
    console.error(e); error.value='No se pudo crear el informe.'
  }
}
async function eliminarInforme(inf){
  openConfirm({
    title: 'Eliminar informe',
    message: `¿Eliminar el informe “${inf.titulo || inf.id}”? Se limpiará el enlace en sus rendiciones.`,
    confirmText: 'Eliminar',
    onConfirm: async () => {
      try{
        // limpia informeId en rendiciones vinculadas y las marca como borrador
        const q = query(collection(db,'rendiciones'), where('informeId','==', inf.id), limit(400))
        const snap = await getDocs(q)
        const batch = writeBatch(db)
        snap.docs.forEach(d=> batch.update(doc(db,'rendiciones', d.id), { informeId: null, estado: 'borrador', _lastUpdate: serverTimestamp() }))
        batch.delete(doc(db,'informes', inf.id))
        await batch.commit()

        informes.value = informes.value.filter(x=>x.id!==inf.id)
        if (selected.value?.id===inf.id){ selected.value=null; rendicionesInforme.value=[] }
        showToast('Informe eliminado y rendiciones marcadas como borrador', 'bi-trash')
      }catch(e){
        console.error(e); error.value='No se pudo eliminar el informe.'
      }
    }
  })
}

/* AGREGAR / SACAR RENDICIÓN (consistencia en ambos lados) */
async function agregarAInforme(r, informeId){
  if (!informeId || !r?.id) return
  try{
    const infRef = doc(db,'informes', informeId)
    const infSnap = await getDoc(infRef)
    if (!infSnap.exists()) throw new Error('Informe no existe')
    const inf = infSnap.data()
    if (inf.estado !== 'pendiente') throw new Error('El informe no está pendiente')

    const batch = writeBatch(db)
    batch.update(infRef, { rendicionIds: arrayUnion(r.id), _lastUpdate: serverTimestamp() })
    batch.update(doc(db,'rendiciones', r.id), { informeId, estado: 'pendiente', _lastUpdate: serverTimestamp() })
    await batch.commit()

    await loadRendicionesDeInforme(informeId)

    const idx = informes.value.findIndex(i=>i.id===informeId)
    if (idx>=0){
      const curr = informes.value[idx].rendicionIds || []
      if (!curr.includes(r.id)) informes.value[idx].rendicionIds = [...curr, r.id]
      if (selected.value?.id===informeId) selected.value.rendicionIds = informes.value[idx].rendicionIds
    }

    // 🔽 cerrar el picker al agregar
    closePicker()

    showToast('Rendición agregada al informe y marcada como pendiente', 'bi-journal-plus')
  }catch(e){
    console.error(e); error.value = e?.message || 'No se pudo agregar la rendición.'
  }
}
async function sacarDeInforme(r){
  if (!selected.value?.id || !r?.id) return
  openConfirm({
    title: 'Sacar rendición del informe',
    message: `¿Quitar la rendición del informe “${selected.value.titulo || selected.value.id}”?`,
    confirmText: 'Sacar',
    onConfirm: async () => {
      try{
        const infId = selected.value.id
        const batch = writeBatch(db)
        batch.update(doc(db,'informes', infId), { rendicionIds: arrayRemove(r.id), _lastUpdate: serverTimestamp() })
        batch.update(doc(db,'rendiciones', r.id), { informeId: null, estado: 'borrador', _lastUpdate: serverTimestamp() })
        await batch.commit()

        rendicionesInforme.value = rendicionesInforme.value.filter(x=>x.id!==r.id)
        const idx = informes.value.findIndex(i=>i.id===infId)
        if (idx>=0){
          informes.value[idx].rendicionIds = (informes.value[idx].rendicionIds||[]).filter(x=>x!==r.id)
          if (selected.value?.id===infId) selected.value.rendicionIds = informes.value[idx].rendicionIds
        }

        // 🔽 cerrar el detalle si estaba abierto sobre esa rendición
        if (detailOpen.value && selectedRendicion.value?.id === r.id){
          closeDetail()
          selectedRendicion.value = null
        }

        showToast('Rendición sacada del informe y marcada como borrador', 'bi-box-arrow-left')
      }catch(e){
        console.error(e); error.value='No se pudo sacar la rendición.'
      }
    }
  })
}


/* DETALLE RENDICIÓN (offcanvas + zoom/rotación) */
const detailOpen = ref(false)
const selectedRendicion = ref(null)
const zoom = ref(1)
const rotation = ref(0)
function openRendicionDetail(r){ selectedRendicion.value = r; detailOpen.value = true; zoom.value=1; rotation.value=0 }
function closeDetail(){ detailOpen.value=false }
function zoomIn(){ zoom.value = Math.min(3, +(zoom.value + .2).toFixed(1)) }
function zoomOut(){ zoom.value = Math.max(0.5, +(zoom.value - .2).toFixed(1)) }
function zoomReset(){ zoom.value = 1 }
function rotateLeft(){ rotation.value = (rotation.value - 90 + 360) % 360 }
function rotateRight(){ rotation.value = (rotation.value + 90) % 360 }
function rotateReset(){ rotation.value = 0 }
const imgTransform = computed(()=>({
  transform: `rotate(${rotation.value}deg) scale(${zoom.value})`,
  transformOrigin: 'center center',
  transition: 'transform .12s ease',
  maxWidth: '100%', maxHeight: '100%'
}))

/* PICKER DE RENDICIONES (solo sin informeId) */
const pickerOpen = ref(false)
const pickerLoading = ref(false)
const pickerRows = ref([])
const pickerSearch = ref('')
const pickerSolicitante = ref('')
const pickerCategoria = ref('')
const pickerSoloPendientes = ref(true)
const pickerSolicitantes = ref([])
const pickerCategorias = ref([])

function openPicker(){ pickerOpen.value=true; loadPicker() }
function closePicker(){ pickerOpen.value=false }
watch([pickerSearch, pickerSolicitante, pickerCategoria, pickerSoloPendientes], ()=> loadPickerDebounced())
let pickerDebounce
function loadPickerDebounced(){ clearTimeout(pickerDebounce); pickerDebounce=setTimeout(loadPicker, 200) }

async function loadPicker(){
  if (!selected.value?.id) return
  pickerLoading.value=true; error.value=''
  try{
    const clauses = [ where('informeId','==', null) ]
    if (pickerSoloPendientes.value) clauses.push(where('estado','==','pendiente'))
    const q = query(
      collection(db,'rendiciones'),
      ...clauses,
      orderBy('creadoEn','desc'),
      limit(200)
    )
    const snap = await getDocs(q)
    const all = snap.docs.map(d=>({ id:d.id, ...d.data(), userEmail: d.data().userEmail || d.data().email || null }))

    // build options (emails/categorías)
    const emails = new Set(), cats=new Set()
    all.forEach(r=>{ if(r.userEmail) emails.add(r.userEmail); if(r.categoria) cats.add(r.categoria) })
    pickerSolicitantes.value = Array.from(emails).sort((a,b)=>a.localeCompare(b))
    pickerCategorias.value = Array.from(cats).sort()

    // filtros cliente
    const term = (pickerSearch.value||'').toLowerCase().trim()
    pickerRows.value = all.filter(r=>{
      if (pickerSolicitante.value && r.userEmail !== pickerSolicitante.value) return false
      if (pickerCategoria.value && r.categoria !== pickerCategoria.value) return false
      if (term){
        const t = [r.motivo, r.empresa, r.numeroDocumento, r.folio].filter(Boolean).join(' ').toLowerCase()
        if (!t.includes(term)) return false
      }
      return true
    })
  }catch(e){
    console.error(e); error.value='No fue posible cargar rendiciones para agregar.'
  }finally{ pickerLoading.value=false }
}

/* PAGINACIÓN */
async function nextPage(){ if(!hasNextPage.value || loading.value) return; page.value+=1; await fetchPage() }
async function prevPage(){ if(page.value===0 || loading.value) return; page.value-=1; await fetchPage() }

/* INIT */
onMounted(()=> reload(true))

/* NOTAS DE ÍNDICES
Colección: informes
- creadoEn (Desc), estado (Asc)

Colección: rendiciones
- informeId (Asc), creadoEn (Desc)
- creadoEn (Desc), estado (Asc)  [por picker "solo pendientes"]
*/
</script>

<style scoped>
.table td, .table th { vertical-align: middle; }
.card { border-radius: 0.5rem; }
.badge { font-weight: 600; letter-spacing: .2px; }
.btn-group .btn { white-space: nowrap; }
.row-hover { cursor: pointer; }
.row-hover:hover { background: rgba(0,0,0,.02); }

.offcanvas { width: min(560px, 96vw); z-index: 1075; border-left: 1px solid rgba(0,0,0,.08); }
.offcanvas-header { border-bottom: 1px solid rgba(0,0,0,.06); }
.img-viewport { height: 340px; overflow: hidden; }

.modal-backdrop { z-index: 1060; }
.modal { z-index: 1070; }

/* Modal SPA de confirmación */
.modal-backdrop-custom {
  position: fixed; inset: 0; background: rgba(0,0,0,.55);
  display: grid; place-items: center; z-index: 1080;
}
.modal-card {
  width: min(560px, 94vw); background: #fff; border-radius: 14px;
  overflow: hidden; box-shadow: 0 14px 40px rgba(0,0,0,.22);
}
.modal-header, .modal-footer { padding: .75rem 1rem; border-bottom: 1px solid rgba(0,0,0,.06); }
.modal-footer { border-top: 1px solid rgba(0,0,0,.06); border-bottom: 0; }
.modal-title { margin: 0; font-size: 1rem; }

/* Snackbar / Toast */
.snackbar{
  position: fixed; bottom: 18px; right: 18px;
  background: rgba(25,25,25,.92); color: #fff; padding: .65rem .9rem;
  border-radius: 10px; display: inline-flex; align-items: center; z-index: 2100;
}
.snackbar-enter-from{ transform: translateY(12px); opacity: 0; }
.snackbar-enter-active{ transition: all .22s ease; }
.snackbar-leave-to{ transform: translateY(10px); opacity: 0; }
.snackbar-leave-active{ transition: all .16s ease; }
</style>
