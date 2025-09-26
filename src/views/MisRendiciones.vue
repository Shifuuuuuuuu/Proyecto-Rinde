<!-- src/views/MisRendiciones.vue -->
<!-- eslint-disable vue/require-toggle-inside-transition -->
<template>
  <!-- Header -->
  <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
    <h2 class="h5 mb-0">Mis rendiciones</h2>
    <div class="d-flex gap-2">
      <RouterLink class="btn btn-danger" to="/crear">
        <i class="bi bi-plus-lg"></i> Nueva
      </RouterLink>
      <RouterLink class="btn btn-outline-secondary" to="/">
        <i class="bi bi-house"></i> Inicio
      </RouterLink>

      <!-- Botón alternar vista -->
      <button class="btn btn-outline-secondary" @click="toggleVista"
        :title="viewMode === 'list' ? 'Ver como tarjetas' : 'Ver en lista'">
        <i class="bi" :class="viewMode === 'list' ? 'bi-grid' : 'bi-list'"></i>
        {{ viewMode === 'list' ? 'Cuadritos' : 'Lineal' }}
      </button>
    </div>
  </div>

  <div v-if="error" class="alert alert-danger mb-3">{{ error }}</div>

  <!-- Filtros -->
  <div class="card shadow-sm mb-3">
    <div class="card-body">
      <div class="row g-3">
        <div class="col-12 col-lg-4">
          <label class="form-label">Buscar</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input v-model.trim="q" type="text" class="form-control" placeholder="Motivo, categoría..." />
          </div>
          <div class="form-text">Búsqueda por motivo y categoría.</div>
        </div>

        <div class="col-6 col-lg-2">
          <label class="form-label">Estado</label>
          <select v-model="fEstado" class="form-select">
            <option value="todos">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>

        <div class="col-6 col-lg-2">
          <label class="form-label">Moneda</label>
          <select v-model="fMoneda" class="form-select">
            <option value="todas">Todas</option>
            <option value="CLP">CLP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="UF">UF</option>
          </select>
        </div>

        <div class="col-6 col-lg-2">
          <label class="form-label">Desde</label>
          <input v-model="fDesde" type="date" class="form-control" />
        </div>

        <div class="col-6 col-lg-2">
          <label class="form-label">Hasta</label>
          <input v-model="fHasta" type="date" class="form-control" />
        </div>

        <div class="col-6 col-lg-2">
          <label class="form-label">Ordenar</label>
          <select v-model="orden" class="form-select">
            <option value="fecha_desc">Fecha ↓ (recientes)</option>
            <option value="fecha_asc">Fecha ↑ (antiguas)</option>
            <option value="monto_desc">Monto ↓</option>
            <option value="monto_asc">Monto ↑</option>
          </select>
        </div>

        <div class="col-6 col-lg-2 d-flex align-items-end">
          <button class="btn btn-outline-secondary w-100" @click="resetFiltros">
            <i class="bi bi-arrow-counterclockwise"></i> Reset
          </button>
        </div>
      </div>
    </div>
  </div>
  <div class="card shadow-sm mb-3">
    <div class="card-body">
      <!-- Resumen -->
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="small text-muted">
          Mostrando <strong>{{ filtradas.length }}</strong> de {{ items.length }} rendiciones
          <span v-if="fMoneda !== 'todas'">· Total ({{ fMoneda }}): <strong>{{ totalFiltradoMoneda }}</strong></span>
        </div>
        <RouterLink class="btn btn-outline-secondary btn-sm" to="/informes">
          <i class="bi bi-file-earmark-text"></i> Ver informes
        </RouterLink>
      </div>

      <!-- ====== Vista LISTA (tabla) ====== -->
      <div v-if="viewMode === 'list'" class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th style="width:36px;">
                <input type="checkbox" class="form-check-input" :checked="todosMarcadosPagina" @change="toggleSeleccionPagina" />
              </th>
              <th>Fecha</th>
              <th style="width: 64px;"></th>
              <th>Categoría</th>
              <th>Motivo</th>
              <th class="text-end">Monto</th>
              <th>Estado</th>
              <th class="text-end"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="x in paginadas" :key="x.id">
              <td>
                <input
                  type="checkbox"
                  class="form-check-input"
                  :disabled="!esSeleccionable(x)"
                  :checked="seleccionadosMap.get(x.id) || false"
                  @change="toggleItem(x)"
                  :title="!esSeleccionable(x) ? 'Solo borradores/pendientes sin informe' : 'Seleccionar'"
                />
              </td>
              <td class="small text-nowrap">{{ formatFecha(x.fecha) }}</td>

              <!-- Miniatura en tabla -->
              <td>
                <div class="thumb-sm border rounded bg-light d-flex align-items-center justify-content-center">
                  <img v-if="x.fotoPreview" :src="x.fotoPreview" alt="thumb" />
                  <i v-else class="bi bi-receipt text-muted"></i>
                </div>
              </td>

              <td>{{ x.categoria }}</td>

              <td class="text-truncate" style="max-width: 360px;">
                <span class="text-muted small me-1" v-if="x.notas" title="Notas"><i class="bi bi-sticky"></i></span>
                {{ x.motivo }}
              </td>

              <td class="text-end">
                <div class="fw-semibold">{{ formatMoney(x.monto, x.moneda || 'CLP') }}</div>
                <div class="small text-muted">{{ x.moneda || 'CLP' }}</div>
              </td>

              <td>
                <span :class="['badge', badgeClass(x.estado)]">{{ x.estado }}</span>
                <span v-if="x.informeId" class="badge text-bg-info ms-1" title="Vinculada a un informe">en informe</span>
              </td>

              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary" @click="copiarRendicion(x)"
                    title="Copiar esta rendición y abrir el formulario de creación">
                    <i class="bi bi-files"></i> Copiar
                  </button>
                  <RouterLink class="btn btn-outline-secondary" :to="{ name: 'detalle', params: { id: x.id } }">
                    <i class="bi bi-eye"></i> Ver
                  </RouterLink>
                  <RouterLink v-if="x.informeId" class="btn btn-outline-dark"
                    :to="{ name: 'informeDetalle', params: { id: x.informeId } }" title="Ver informe">
                    <i class="bi bi-file-earmark-text"></i> Informe
                  </RouterLink>
                </div>
              </td>
            </tr>

            <tr v-if="!paginadas.length">
              <td colspan="8" class="text-center text-muted py-4">
                No hay resultados con los filtros aplicados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ====== Vista GRID (cards con imagen) ====== -->
      <div v-else>
        <div class="row g-3 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
          <div v-for="x in paginadas" :key="x.id" class="col">
            <div class="card h-100 shadow-sm">
              <div class="position-relative">
                <div class="thumb border-bottom">
                  <img v-if="x.fotoPreview" :src="x.fotoPreview" alt="comprobante" />
                  <div v-else class="thumb-empty">
                    <i class="bi bi-receipt fs-2"></i>
                    <div class="small text-muted mt-1">Sin imagen</div>
                  </div>
                </div>

                <!-- Checkbox selección en la esquina -->
                <div class="position-absolute top-0 start-0 p-2">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    :disabled="!esSeleccionable(x)"
                    :checked="seleccionadosMap.get(x.id) || false"
                    @change="toggleItem(x)"
                    :title="!esSeleccionable(x) ? 'Solo borradores/pendientes sin informe' : 'Seleccionar'"
                  />
                </div>

                <!-- Estado -->
                <div class="position-absolute top-0 end-0 p-2 d-flex gap-1">
                  <span :class="['badge', badgeClass(x.estado)]">{{ x.estado }}</span>
                  <span v-if="x.informeId" class="badge text-bg-info">en informe</span>
                </div>
              </div>

              <div class="card-body d-flex flex-column">
                <div class="d-flex align-items-start justify-content-between">
                  <div class="small text-muted">{{ formatFecha(x.fecha) }}</div>
                  <div class="text-end">
                    <div class="fw-semibold">{{ formatMoney(x.monto, x.moneda || 'CLP') }}</div>
                    <div class="small text-muted">{{ x.moneda || 'CLP' }}</div>
                  </div>
                </div>

                <div class="mt-2">
                  <div class="text-muted small">Categoría</div>
                  <div class="fw-semibold text-truncate" :title="x.categoria">{{ x.categoria }}</div>
                </div>

                <div class="mt-2">
                  <div class="text-muted small">Motivo</div>
                  <div class="text-truncate-2" :title="x.motivo">{{ x.motivo }}</div>
                </div>

                <div class="mt-3 d-flex gap-2 mt-auto">
                  <button class="btn btn-sm btn-outline-primary w-100" @click="copiarRendicion(x)">
                    <i class="bi bi-files"></i> Copiar
                  </button>
                  <RouterLink class="btn btn-sm btn-outline-secondary w-100"
                    :to="{ name: 'detalle', params: { id: x.id } }">
                    <i class="bi bi-eye"></i> Ver
                  </RouterLink>
                  <RouterLink v-if="x.informeId" class="btn btn-sm btn-outline-dark w-100"
                    :to="{ name: 'informeDetalle', params: { id: x.informeId } }">
                    <i class="bi bi-file-earmark-text"></i> Informe
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- vacío -->
        <div v-if="!paginadas.length" class="text-center text-muted py-4">
          No hay resultados con los filtros aplicados.
        </div>
      </div>

      <!-- Paginación -->
      <div class="d-flex justify-content-between align-items-center mt-2" v-if="filtradas.length">
        <div class="small text-muted">Página {{ pagina }} de {{ totalPaginas }}</div>
        <div class="btn-group">
          <button class="btn btn-outline-secondary btn-sm" @click="pagina--" :disabled="pagina <= 1">
            <i class="bi bi-chevron-left"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm" @click="pagina++" :disabled="pagina >= totalPaginas">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- Barra flotante de acciones (animada) -->
  <Transition name="slide-up-blur">
    <div v-if="seleccionCount > 0" class="fab-bar glass shadow-xl border-top">
      <div class="container d-flex flex-wrap align-items-center justify-content-between gap-2 py-2">
        <div class="small">
          <strong>{{ seleccionCount }}</strong> seleccionada(s)
        </div>

        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-outline-secondary" type="button" :disabled="seleccionCount !== 1"
            @click="editarSeleccionado">
            <i class="bi bi-pencil"></i> Editar
          </button>

          <button class="btn btn-outline-danger" type="button" @click="openConfirm('eliminar')">
            <i class="bi bi-trash"></i> Eliminar
          </button>

          <button class="btn btn-outline-info" type="button" @click="openConfirm('informe')">
            <i class="bi bi-file-earmark-plus"></i> Crear informe
          </button>

          <button class="btn btn-outline-dark" type="button"
            :disabled="!(seleccionCount === 1 && seleccionTieneInforme)" @click="verInformeSeleccionado"
            title="Ver informe del elemento seleccionado">
            <i class="bi bi-file-earmark-text"></i> Ver informe
          </button>

          <button class="btn btn-outline-primary" type="button" :disabled="seleccionCount !== 1"
            @click="copiarSeleccionado">
            <i class="bi bi-files"></i> Copiar
          </button>
          <button class="btn btn-outline-secondary" @click="limpiarSeleccion" :disabled="seleccionCount === 0">
            <i class="bi bi-x-circle"></i> Limpiar selección
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Modal ProConfirm (elegante) -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="confirm.show" class="pro-backdrop" @click.self="closeConfirm">
        <Transition name="zoom">
          <div class="pro-confirm" :class="confirm.kind === 'danger' ? 'is-danger' : 'is-primary'" role="dialog"
            aria-modal="true">
            <!-- Header con gradiente e icono -->
            <div class="pro-head">
              <div class="pro-icon">
                <i class="bi" :class="confirm.icon"></i>
              </div>
              <div class="pro-title">
                <div class="pro-eyebrow">{{ kindLabel(confirm.kind) }}</div>
                <h5 class="m-0">{{ confirm.title }}</h5>
              </div>
              <button class="pro-close" @click="closeConfirm" aria-label="Cerrar">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- Body con callout elegante -->
            <div class="pro-body">
              <div class="pro-callout">
                <i class="bi" :class="calloutIcon(confirm.kind)"></i>
                <div>
                  <div class="pro-callout-title">{{ confirmTitleAux(confirm.kind) }}</div>
                  <div class="pro-callout-text">{{ confirm.message }}</div>
                </div>
              </div>
              <div v-if="confirm.mode === 'informe'" class="mt-3">
                <label class="form-label mb-1">Título del informe</label>
                <input v-model.trim="tituloInforme" type="text" class="form-control pro-textarea"
                  placeholder="Ej.: Informe de gastos — Viaje a cliente X (Semana 36)" maxlength="120" />
                <div class="small text-muted mt-2">Un título ayuda a identificar el informe en la lista.</div>

                <label class="form-label mb-1 mt-3">Nota del informe (opcional)</label>
                <textarea v-model="notaInforme" class="form-control pro-textarea" rows="3"
                  placeholder="Ej.: Rendiciones de viaje a cliente X, semana 36."></textarea>
                <div class="small text-muted mt-2">Esta nota se guardará en el documento del informe.</div>
                <div v-if="confirm.extra" class="small text-muted mt-2">{{ confirm.extra }}</div>
              </div>
              <div v-else-if="confirm.extra" class="small text-muted mt-2">{{ confirm.extra }}</div>
            </div>

            <!-- Footer con botones -->
            <div class="pro-footer">
              <button class="btn btn-light pro-btn-ghost" @click="closeConfirm">Cancelar</button>
              <button class="btn pro-btn-cta" :class="confirm.kind === 'danger' ? 'btn-danger' : 'btn-primary'"
                @click="confirm.ok()">
                <i class="bi" :class="confirm.kind === 'danger' ? 'bi-trash' : 'bi-check2-circle'"></i>
                {{ confirm.cta }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Toast / Snackbar -->
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
import { onMounted, ref, computed, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { db } from '@/firebase'
import {
  collection, query, where, orderBy, onSnapshot,
  doc, writeBatch, addDoc, serverTimestamp
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const items = ref([])
const error = ref('')
const cargando = ref(true)

// ===== Vista: list | grid (persistente) =====
const viewMode = ref(localStorage.getItem('rendiciones:viewMode') || 'list')
const toggleVista = () => {
  viewMode.value = viewMode.value === 'list' ? 'grid' : 'list'
  localStorage.setItem('rendiciones:viewMode', viewMode.value)
}

// Filtros/orden
const q = ref('')
const fEstado = ref('todos')
const fMoneda = ref('todas')
const fDesde = ref('')
const fHasta = ref('')
const orden = ref('fecha_desc')

// paginación
const pagina = ref(1)
const porPagina = ref(12) // 12 para que el grid quede bien

onMounted(() => {
  try {
    const qRef = query(
      collection(db, 'rendiciones'),
      where('userId', '==', auth.uid),
      orderBy('creadoEn', 'desc')
    )
    onSnapshot(qRef, (snap) => {
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      cargando.value = false
      pagina.value = 1
    })
  } catch (e) {
    console.error(e)
    error.value = 'No fue posible cargar tus rendiciones.'
    cargando.value = false
  }
})

watch([q, fEstado, fMoneda, fDesde, fHasta, orden], () => { pagina.value = 1 })

// Helpers formato
const formatFecha = (ts) => {
  try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return new Intl.DateTimeFormat('es-CL').format(d) }
  catch { return '-' }
}
const formatMoney = (value, code) => {
  const n = Number(value || 0)
  if (code === 'CLP') return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
  if (code === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  if (code === 'EUR') return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
  if (code === 'UF') return `UF ${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2 }).format(n)}`
  return n
}
const badgeClass = (estado) =>
({
  borrador: 'text-bg-secondary',
  pendiente: 'text-bg-warning',
  aprobada: 'text-bg-success',
  rechazada: 'text-bg-danger'
}[estado] || 'text-bg-secondary')

// Utils
const inRange = (ts, desde, hasta) => {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    if (desde) { const dd = new Date(desde); if (d < dd) return false }
    if (hasta) { const hh = new Date(hasta); hh.setHours(23, 59, 59, 999); if (d > hh) return false }
    return true
  } catch { return true }
}

// Filtrado + ordenamiento
const filtradas = computed(() => {
  const queryText = q.value.toLowerCase()
  const estado = fEstado.value
  const moneda = fMoneda.value
  const desde = fDesde.value
  const hasta = fHasta.value

  let arr = items.value.filter(x => {
    const texto = `${x.motivo || ''} ${x.categoria || ''}`.toLowerCase()
    const matchTexto = !queryText || texto.includes(queryText)
    const matchEstado = estado === 'todos' || x.estado === estado
    const m = x.moneda || 'CLP'
    const matchMoneda = moneda === 'todas' || m === moneda
    const matchFecha = inRange(x.fecha, desde, hasta)
    return matchTexto && matchEstado && matchMoneda && matchFecha
  })

  // orden
  arr.sort((a, b) => {
    const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha)
    const dbb = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha)
    const ma = Number(a.monto || 0)
    const mb = Number(b.monto || 0)
    switch (orden.value) {
      case 'fecha_asc': return da - dbb
      case 'fecha_desc': return dbb - da
      case 'monto_asc': return ma - mb
      case 'monto_desc': return mb - ma
      default: return dbb - da
    }
  })

  return arr
})

const totalFiltradoMoneda = computed(() => {
  if (fMoneda.value === 'todas') return ''
  const code = fMoneda.value
  const total = filtradas.value
    .filter(x => (x.moneda || 'CLP') === code)
    .reduce((acc, x) => acc + Number(x.monto || 0), 0)
  return formatMoney(total, code)
})

// Paginación
const totalPaginas = computed(() => Math.max(1, Math.ceil(filtradas.value.length / porPagina.value)))
const paginadas = computed(() => filtradas.value.slice((pagina.value - 1) * porPagina.value, (pagina.value) * porPagina.value))

const resetFiltros = () => {
  q.value = ''; fEstado.value = 'todos'; fMoneda.value = 'todas'; fDesde.value = ''; fHasta.value = ''
  orden.value = 'fecha_desc'; pagina.value = 1
}

// --- Selección múltiple ---
// Permitimos seleccionar BORRADOR y PENDIENTE (sin informe)
const seleccionActiva = ref(true)
const seleccionadosMap = ref(new Map())
const seleccionados = computed(() => Array.from(seleccionadosMap.value.keys()))
const seleccionCount = computed(() => seleccionados.value.length)
const esSeleccionable = (x) => (x.estado === 'borrador' || x.estado === 'pendiente') && !x.informeId
const limpiarSeleccion = () => { seleccionadosMap.value = new Map() }
const toggleItem = (x) => {
  const m = new Map(seleccionadosMap.value)
  if (m.get(x.id)) m.delete(x.id); else m.set(x.id, true)
  seleccionadosMap.value = m
}
const todosMarcadosPagina = computed(() => {
  const pageIds = paginadas.value.filter(esSeleccionable).map(x => x.id)
  return pageIds.length > 0 && pageIds.every(id => seleccionadosMap.value.get(id))
})
const toggleSeleccionPagina = () => {
  const page = paginadas.value.filter(esSeleccionable)
  const m = new Map(seleccionadosMap.value)
  const allMarked = page.every(x => m.get(x.id))
  if (allMarked) page.forEach(x => m.delete(x.id))
  else page.forEach(x => m.set(x.id, true))
  seleccionadosMap.value = m
}

// Saber si la (única) seleccionada tiene informe
const seleccionTieneInforme = computed(() => {
  if (seleccionCount.value !== 1) return false
  const id = seleccionados.value[0]
  const x = items.value.find(i => i.id === id)
  return !!x?.informeId
})
// NUEVO: título del informe
const tituloInforme = ref('')

// --- Confirm / Crear informe (con nota) ---
const notaInforme = ref('')
const confirm = ref({
  show: false,
  title: '',
  message: '',
  cta: '',
  kind: 'primary', // 'primary' | 'danger'
  icon: 'bi-question-circle',
  extra: '',
  ok: () => { },
  mode: '' // '', 'informe', 'eliminar'
})

function openConfirm(type) {
  if (type === 'eliminar') {
    confirm.value = {
      show: true,
      title: 'Eliminar rendiciones',
      message: `¿Seguro que deseas eliminar ${seleccionCount.value} rendición(es) en estado borrador? Esta acción no se puede deshacer.`,
      cta: 'Eliminar definitivamente',
      kind: 'danger',
      icon: 'bi-trash',
      extra: 'No se eliminarán rendiciones que estén en un informe.',
      ok: async () => { await eliminarSeleccionados(true) },
      mode: 'eliminar'
    }
  } else if (type === 'informe') {
    notaInforme.value = ''
    tituloInforme.value = '' // NUEVO: reset título
    confirm.value = {
      show: true,
      title: 'Crear informe',
      message: `Crear un nuevo informe con ${seleccionCount.value} rendición(es) seleccionadas.`,
      cta: 'Crear informe',
      kind: 'primary',
      icon: 'bi-file-earmark-plus',
      extra: 'Solo se incluyen rendiciones en estado borrador o pendiente y sin informe asignado.',
      ok: async () => { await crearInformeDesdeSeleccion(true) },
      mode: 'informe'
    }
  }
}
function closeConfirm() { confirm.value.show = false }

// Helpers visuales para el modal pro
const kindLabel = (k) => (k === 'danger' ? 'Confirmación crítica' : 'Confirmación')
const calloutIcon = (k) => (k === 'danger' ? 'bi-exclamation-octagon' : 'bi-info-circle')
const confirmTitleAux = (k) => (k === 'danger' ? 'Acción irreversible' : 'Revisa los detalles')

// --- Toast / Snackbar ---
const toast = ref({ show: false, text: '', icon: 'bi-check-circle' })
let toastTimer
function showToast(text, icon = 'bi-check-circle') {
  toast.value = { show: true, text, icon }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value.show = false), 3000)
}

// Acciones selección (internas)
const editarSeleccionado = () => {
  if (seleccionCount.value !== 1) return
  const id = seleccionados.value[0]
  router.push({ name: 'detalle', params: { id }, query: { edit: 1 } })
}

const verInformeSeleccionado = () => {
  if (seleccionCount.value !== 1) return
  const id = seleccionados.value[0]
  const x = items.value.find(i => i.id === id)
  if (x?.informeId) router.push({ name: 'informeDetalle', params: { id: x.informeId } })
}

const eliminarSeleccionados = async (fromConfirm = false) => {
  if (!seleccionCount.value) return
  if (!fromConfirm) return openConfirm('eliminar')
  const batch = writeBatch(db)
  const ids = seleccionados.value
  ids.forEach(id => batch.delete(doc(db, 'rendiciones', id)))
  await batch.commit()
  seleccionadosMap.value = new Map()
  seleccionActiva.value = false
  closeConfirm()
  showToast('Rendiciones eliminadas', 'bi-trash')
}

const crearInformeDesdeSeleccion = async (fromConfirm = false) => {
  if (!seleccionCount.value) return
  if (!fromConfirm) return openConfirm('informe')

  // Filtrar efectivamente seleccionables (borrador/pendiente sin informe)
  const seleccionDocs = items.value.filter(x => seleccionadosMap.value.get(x.id))
  const invalid = seleccionDocs.some(
    x => !(x.estado === 'borrador' || x.estado === 'pendiente') || x.informeId
  )
  if (invalid) {
    closeConfirm()
    return showToast('Solo se pueden incluir borradores o pendientes sin informe.', 'bi-exclamation-triangle')
  }

  if (!tituloInforme.value?.trim()) {
    return showToast('Ingresa un título para el informe', 'bi-exclamation-triangle')
  }

  // Totales por moneda
  const totales = seleccionDocs.reduce((acc, x) => {
    const m = x.moneda || 'CLP'
    acc[m] = (acc[m] || 0) + Number(x.monto || 0)
    return acc
  }, {})

  // Crear informe
  const informeRef = await addDoc(collection(db, 'informes'), {
    userId: auth.uid,
    creadoEn: serverTimestamp(),
    estado: 'pendiente',
    rendicionIds: seleccionados.value,
    totalesPorMoneda: totales,
    titulo: tituloInforme.value.trim(),
    nota: (notaInforme.value || '').trim() || null
  })

  // Vincular rendiciones + ponerlas en estado 'pendiente'
  const batch = writeBatch(db)
  seleccionados.value.forEach(id => {
    batch.update(doc(db, 'rendiciones', id), {
      informeId: informeRef.id,
      estado: 'pendiente' // 👈 cambia el estado al crear el informe
    })
  })
  await batch.commit()

  // Limpiar UI
  seleccionadosMap.value = new Map()
  seleccionActiva.value = false
  closeConfirm()
  showToast('Informe creado y rendiciones vinculadas', 'bi-file-earmark-check')

  // Ir al detalle del informe
  router.push({ name: 'informeDetalle', params: { id: informeRef.id } })
}


// Copiar (fila o selección)
const copiarRendicion = (x) => {
  router.push({ name: 'crear', query: { copyFrom: x.id } })
}
const copiarSeleccionado = () => {
  if (seleccionCount.value !== 1) return
  const id = seleccionados.value[0]
  router.push({ name: 'crear', query: { copyFrom: id } })
}
</script>

<style scoped>
/* ===== Thumbs ===== */
.thumb {
  height: 160px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-empty {
  color: #6c757d;
  display: grid;
  place-items: center;
  height: 100%;
}

/* Mini thumb en tabla */
.thumb-sm {
  width: 56px;
  height: 40px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-sm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Truncar 2 líneas en grid */
.text-truncate-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===== Barra flotante con animación ===== */
.fab-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  z-index: 1040;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.glass {
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, .9);
}

.shadow-xl {
  box-shadow: 0 -12px 30px rgba(0, 0, 0, .12);
}

/* Slide-up con ligera elevación y blur */
.slide-up-blur-enter-from {
  opacity: 0;
  transform: translateY(20px);
  filter: blur(2px);
}

.slide-up-blur-enter-active {
  transition: all .28s ease;
}

.slide-up-blur-leave-to {
  opacity: 0;
  transform: translateY(12px);
  filter: blur(2px);
}

.slide-up-blur-leave-active {
  transition: all .2s ease;
}

/* ===== Snackbar / Toast ===== */
.snackbar {
  position: fixed;
  bottom: 18px;
  right: 18px;
  background: rgba(25, 25, 25, .92);
  color: #fff;
  padding: .65rem .9rem;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  z-index: 2100;
}

.snackbar-enter-from {
  transform: translateY(12px);
  opacity: 0;
}

.snackbar-enter-active {
  transition: all .22s ease;
}

.snackbar-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

.snackbar-leave-active {
  transition: all .16s ease;
}

/* ===== Modal ProConfirm (elegante) ===== */
.pro-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(12, 16, 24, .55);
  backdrop-filter: blur(2px);
  display: grid;
  place-items: center;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .18s ease;
}

.zoom-enter-from {
  transform: translateY(8px) scale(.98);
  opacity: 0;
}

.zoom-enter-active {
  transition: all .22s cubic-bezier(.21, .8, .35, 1);
}

.zoom-leave-to {
  transform: translateY(4px) scale(.995);
  opacity: 0;
}

.zoom-leave-active {
  transition: all .16s ease;
}

/* Card */
.pro-confirm {
  width: min(680px, 96vw);
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 24px 60px rgba(9, 11, 15, .28),
    0 8px 24px rgba(9, 11, 15, .18);
  border: 1px solid rgba(16, 24, 40, .06);
}

/* Variantes */
.pro-confirm.is-primary .pro-head {
  --grad-a: #0ea5e9;
  --grad-b: #6366f1;
}

.pro-confirm.is-danger .pro-head {
  --grad-a: #ef4444;
  --grad-b: #ea2323;
}

/* Header */
.pro-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: .75rem;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, var(--grad-a), var(--grad-b));
  color: #fff;
}

.pro-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, .18);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .22);
}

.pro-title h5 {
  font-weight: 700;
  letter-spacing: .2px;
}

.pro-eyebrow {
  font-size: .72rem;
  opacity: .9;
  letter-spacing: .4px;
  text-transform: uppercase;
}

.pro-close {
  border: 0;
  background: rgba(255, 255, 255, .14);
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 10px;
}

.pro-close:hover {
  background: rgba(255, 255, 255, .22);
}

/* Body */
.pro-body {
  padding: 16px;
}

.pro-callout {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: .75rem;
  padding: .9rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(2, 6, 23, .06);
  background: linear-gradient(0deg, #fff, #fff) padding-box,
    linear-gradient(135deg, rgba(14, 165, 233, .2), rgba(99, 102, 241, .12)) border-box;
}

.pro-confirm.is-danger .pro-callout {
  background: linear-gradient(0deg, #fff, #fff) padding-box,
    linear-gradient(135deg, rgba(239, 68, 68, .18), rgba(245, 158, 11, .12)) border-box;
}

.pro-callout>i {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(2, 6, 23, .05);
  display: grid;
  place-items: center;
  color: #0f172a;
}

.pro-confirm.is-danger .pro-callout>i {
  color: #7f1d1d;
  background: rgba(127, 29, 29, .08);
}

.pro-callout-title {
  font-weight: 600;
  color: #0f172a;
  line-height: 1.25;
}

.pro-callout-text {
  color: #334155;
  margin-top: 2px;
}

.pro-textarea {
  border-radius: 12px;
  border-color: rgba(2, 6, 23, .12);
}

.pro-textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 .2rem rgba(99, 102, 241, .15);
}

.pro-confirm.is-danger .pro-textarea:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 .2rem rgba(239, 68, 68, .15);
}

/* Footer */
.pro-footer {
  display: flex;
  justify-content: flex-end;
  gap: .5rem;
  padding: 12px 16px;
  border-top: 1px solid rgba(16, 24, 40, .06);
  background: linear-gradient(180deg, #fff, #fafafa);
}

.pro-btn-ghost {
  border-radius: 10px;
  border: 1px solid rgba(2, 6, 23, .12);
}

.pro-btn-cta {
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: .4rem;
}
</style>
