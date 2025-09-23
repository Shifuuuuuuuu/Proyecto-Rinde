<template>
  <div class="container py-3">
    <!-- Header -->
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div class="d-flex align-items-center gap-2">
        <h2 class="h5 mb-0">Aprobador · Rendiciones</h2>
        <span class="badge text-bg-secondary d-none d-sm-inline">{{ listadoMes.length }} en el mes</span>
      </div>

      <!-- Controles header -->
      <div class="d-none d-lg-flex align-items-center gap-2">
        <select v-model.number="filtroMes" class="form-select form-select-sm">
          <option v-for="m in meses" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <select v-model.number="filtroAnio" class="form-select form-select-sm">
          <option v-for="y in anios" :key="y" :value="y">{{ y }}</option>
        </select>
        <button class="btn btn-sm btn-outline-secondary" @click="goExport" title="Exportar / Generar informe">
          <i class="bi bi-file-earmark-arrow-down"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary" @click="recargarMes" title="Recargar">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      <!-- Botón filtros (móvil/tablet) -->
      <div class="d-flex d-lg-none w-100">
        <button class="btn btn-outline-secondary w-100" @click="showFiltros = !showFiltros">
          <i class="bi bi-funnel me-1"></i> Filtros del período
        </button>
      </div>
      <div class="d-lg-none w-100 mt-2">
        <button class="btn btn-danger w-100" @click="goExport">
          <i class="bi bi-file-earmark-arrow-down"></i> Exportar / Generar informe
        </button>
      </div>
    </div>

    <!-- Filtros responsive (móvil/tablet) -->
    <div v-if="showFiltros" class="card card-filtros mb-3 d-lg-none">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-12 col-sm-6">
            <label class="form-label small">Mes</label>
            <select v-model.number="filtroMes" class="form-select form-select-sm">
              <option v-for="m in meses" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="col-12 col-sm-6">
            <label class="form-label small">Año</label>
            <select v-model.number="filtroAnio" class="form-select form-select-sm">
              <option v-for="y in anios" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
        </div>
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-danger flex-fill" @click="recargarMes">
            <i class="bi bi-arrow-clockwise me-1"></i> Aplicar
          </button>
          <button class="btn btn-outline-secondary flex-fill" @click="showFiltros=false">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="row g-3 mb-3">
      <div class="col-6 col-md-3">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="text-muted small">Total monto (mes)</div>
            <div class="fs-5 fw-semibold">{{ formatCLP(totalMontoMes) }}</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="text-muted small">Pendientes</div>
            <div class="fs-5 fw-semibold">{{ kpis.pendientes }}</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="text-muted small">Aprobadas</div>
            <div class="fs-5 fw-semibold">{{ kpis.aprobadas }}</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="text-muted small">Rechazadas</div>
            <div class="fs-5 fw-semibold">{{ kpis.rechazadas }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top categorías -->
    <div class="card shadow-sm mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <h6 class="mb-0">Categorías con más gasto (mes)</h6>
          <div class="small text-muted">{{ topCategorias.length }} categoría(s)</div>
        </div>
        <div v-if="!topCategorias.length" class="text-muted small">No hay datos en el período.</div>
        <div v-else class="vstack gap-2">
          <div v-for="c in topCategorias" :key="c.categoria">
            <div class="d-flex justify-content-between">
              <div class="fw-semibold text-truncate pe-2">{{ c.categoria }}</div>
              <div class="small text-muted text-nowrap">{{ formatCLP(c.monto) }} · {{ Math.round(c.pct) }}%</div>
            </div>
            <div class="progress" style="height:8px">
              <div class="progress-bar" role="progressbar" :style="{ width: c.pct + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dos columnas -->
    <div class="row g-3">
      <!-- Últimas pendientes -->
      <div class="col-12 col-lg-5">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">Últimas rendiciones pendientes</h6>
              <div class="small text-muted">{{ ultimasPendientes.length }}</div>
            </div>

            <div v-if="cargandoPend" class="text-center py-4">
              <div class="spinner-border"></div>
            </div>

            <div v-else-if="!ultimasPendientes.length" class="text-muted small">No hay pendientes por ahora.</div>

            <div v-else class="list-group list-group-flush">
              <div
                v-for="r in ultimasPendientes"
                :key="r.id"
                class="list-group-item d-flex justify-content-between align-items-start"
              >
                <div class="me-2 w-100" @click="abrir(r)" style="cursor:pointer">
                  <div class="d-flex justify-content-between">
                    <div class="text-truncate" :title="r.descripcion">
                      <span class="fw-semibold">{{ r.categoria || 'Rendición' }}</span>
                      <span class="small text-muted"> · {{ nameOf(r) }}</span>
                      <span class="small text-muted d-block d-sm-inline"> · {{ emailOf(r) || '—' }}</span>
                    </div>
                    <div class="fw-semibold text-nowrap ms-2">{{ formatCLP(r.monto || 0) }}</div>
                  </div>
                  <div class="small text-muted">
                    {{ r.categoria || '—' }} · {{ formatFecha(r.creadoEn) }}
                  </div>
                </div>

                <!-- checkbox selección móvil/desktop -->
                <div class="form-check ms-2 mt-1">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :value="r.id"
                    v-model="selectedIds"
                    @click.stop
                    :id="`sel-pend-${r.id}`"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rendiciones del mes -->
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <h6 class="mb-0">Rendiciones del mes</h6>
            <div class="d-flex align-items-center gap-2">
              <select v-model="filtroEstadoListado" class="form-select form-select-sm">
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
              </select>
            </div>
          </div>

          <!-- BARRA DE ACCIONES MASIVAS -->
          <div v-if="selectedIds.length" class="alert alert-warning py-2 px-3 mb-3">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <strong>Acciones masivas</strong>
              <div class="small text-muted">{{ selectedIds.length }} seleccionada(s)</div>
              <div class="d-flex gap-2 ms-auto">
                <button class="btn btn-outline-secondary btn-sm" @click="clearSelection">Quitar selección</button>
                <button class="btn btn-outline-primary btn-sm" @click="selectAllVisible">Seleccionar visibles</button>
              </div>
            </div>
            <div class="d-flex flex-column flex-lg-row gap-2 mt-2">
              <textarea
                v-model.trim="batchComment"
                class="form-control"
                rows="2"
                placeholder="Comentario para todas (obligatorio)"
              ></textarea>
              <div class="d-flex flex-column flex-sm-row gap-2">
                <button class="btn btn-success" :disabled="guardandoBatch || !batchComment" @click="batchApprove">
                  <i class="bi bi-check2-circle me-1"></i> Aprobar seleccionadas
                </button>
                <button class="btn btn-outline-danger" :disabled="guardandoBatch || !batchComment" @click="batchReject">
                  <i class="bi bi-x-circle me-1"></i> Rechazar seleccionadas
                </button>
              </div>
            </div>
            <div class="small mt-2">
              <span v-if="batchError" class="text-danger">{{ batchError }}</span>
              <span v-if="batchOk" class="text-success">{{ batchOk }}</span>
            </div>
          </div>

          <div v-if="cargandoMes" class="text-center py-4">
            <div class="spinner-border"></div>
          </div>

          <template v-else>
            <!-- Mobile list (cards) -->
            <div class="d-lg-none">
              <div class="list-group list-group-flush">
                <div
                  v-for="r in listadoMesFiltrado"
                  :key="r.id"
                  class="list-group-item"
                >
                  <div class="d-flex">
                    <div class="form-check me-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :value="r.id"
                        v-model="selectedIds"
                        @click.stop
                        :id="`sel-m-${r.id}`"
                      />
                    </div>
                    <div class="flex-grow-1" @click="abrir(r)" style="cursor:pointer">
                      <div class="d-flex justify-content-between">
                        <div class="pe-2">
                          <div class="fw-semibold text-truncate">{{ nameOf(r) }}</div>
                          <div class="small text-muted text-truncate">{{ emailOf(r) || '—' }}</div>
                          <div class="small text-muted">{{ r.categoria || '—' }} · {{ formatFecha(r.creadoEn) }}</div>
                        </div>
                        <div class="text-end">
                          <div class="fw-semibold text-nowrap">{{ formatCLP(r.monto || 0) }}</div>
                          <span :class="['badge mt-1', badgeEstado(r.estado)]">{{ r.estado }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="!listadoMesFiltrado.length" class="text-center text-muted py-3">
                  Sin resultados en el período.
                </div>
              </div>
            </div>

            <!-- Desktop table -->
            <div class="table-responsive d-none d-lg-block">
              <table class="table table-hover align-middle">
                <thead class="table-light">
                  <tr>
                    <th style="width:36px;" class="text-center">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :checked="allVisibleSelected"
                        @change="toggleSelectAllVisible"
                        :aria-label="'Seleccionar visibles'"
                      />
                    </th>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Categoría</th>
                    <th class="text-end">Monto</th>
                    <th class="text-nowrap">Estado</th>
                    <th class="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in listadoMesFiltrado" :key="r.id">
                    <td class="text-center">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :value="r.id"
                        v-model="selectedIds"
                        @click.stop
                        :aria-label="`Seleccionar ${r.id}`"
                      />
                    </td>
                    <td class="small text-nowrap" @click="abrir(r)" style="cursor:pointer">{{ formatFecha(r.creadoEn) }}</td>
                    <td class="text-truncate" style="max-width: 240px;" @click="abrir(r)">
                      <div class="fw-semibold text-truncate">{{ nameOf(r) }}</div>
                      <div class="small text-muted text-truncate">{{ emailOf(r) || '—' }}</div>
                    </td>
                    <td @click="abrir(r)" style="cursor:pointer">{{ r.categoria || '—' }}</td>
                    <td class="text-end" @click="abrir(r)" style="cursor:pointer">{{ formatCLP(r.monto || 0) }}</td>
                    <td><span :class="['badge', badgeEstado(r.estado)]">{{ r.estado }}</span></td>
                    <td class="text-end">
                      <div class="btn-group btn-group-sm" @click.stop>
                        <button class="btn btn-outline-success" @click="abrir(r)">Revisar</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!listadoMesFiltrado.length">
                    <td colspan="7" class="text-center text-muted py-4">Sin resultados en el período.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Offcanvas detalle (individual) -->
    <div class="offcanvas offcanvas-end show" tabindex="-1" v-if="detalle" @click.self="cerrarDetalle">
      <div class="offcanvas-header border-bottom">
        <h5 class="offcanvas-title">
          Rendición
          <span :class="['badge ms-2', badgeEstado(detalle.estado)]">{{ detalle.estado }}</span>
        </h5>
        <button type="button" class="btn-close" @click="cerrarDetalle"></button>
      </div>
      <div class="offcanvas-body">
        <div class="row g-3">
          <div class="col-12 col-md-7">
            <div class="mb-2">
              <span class="text-muted small">Usuario</span>
              <div class="fw-semibold">{{ nameOf(detalle) }}</div>
              <div class="small text-muted text-truncate">{{ emailOf(detalle) || '—' }}</div>
            </div>
            <div class="mb-2">
              <span class="text-muted small">Categoría</span>
              <div class="fw-semibold">{{ detalle.categoria || '—' }}</div>
            </div>
            <div class="row g-2 mb-2">
              <div class="col-6">
                <div class="text-muted small">Monto</div>
                <div class="fw-semibold">{{ formatCLP(detalle.monto || 0) }}</div>
              </div>
              <div class="col-6">
                <div class="text-muted small">Fecha</div>
                <div class="fw-semibold">{{ formatFecha(detalle.creadoEn) }}</div>
              </div>
            </div>
            <div class="mb-2">
              <div class="text-muted small">Descripción</div>
              <div style="white-space: pre-wrap">{{ detalle.notas || '—' }}</div>
            </div>

            <!-- Comentario obligatorio -->
            <div class="mb-2">
              <label class="form-label">Comentario (obligatorio para aprobar/rechazar)</label>
              <textarea v-model.trim="comentario" class="form-control" rows="3" placeholder="Motivo de aprobación o rechazo..."></textarea>
              <div v-if="errorComentario" class="text-danger small mt-1">{{ errorComentario }}</div>
            </div>

            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-success flex-grow-1" @click="aprobar" :disabled="guardando || detalle.estado==='aprobada'">
                <i class="bi bi-check2-circle me-1"></i> Aprobar
              </button>
              <button class="btn btn-outline-danger flex-grow-1" @click="rechazar" :disabled="guardando || detalle.estado==='rechazada'">
                <i class="bi bi-x-circle me-1"></i> Rechazar
              </button>
            </div>
          </div>

          <div class="col-12 col-md-5">
            <div class="text-muted small mb-1">Comprobante</div>
            <div v-if="detalle.fotoPreview" class="border rounded p-2 bg-light text-center">
              <img
                :src="detalle.fotoPreview"
                class="img-fluid rounded comprobante-thumb"
                alt="comprobante"
                @click="abrirVisor(detalle.fotoPreview)"
                title="Toca para ampliar"
              />
              <a :href="detalle.fotoPreview" download="comprobante.jpg" class="btn btn-sm btn-outline-secondary mt-2 w-100">
                Descargar
              </a>
              <div class="small text-muted mt-1">Toca la imagen para verla en grande</div>
            </div>
            <div v-else class="small text-muted">Sin imagen adjunta</div>
          </div>
        </div>

        <div v-if="accionError" class="alert alert-danger mt-3 py-2">
          <i class="bi bi-exclamation-triangle me-1"></i> {{ accionError }}
        </div>
      </div>
      <div class="offcanvas-footer border-top p-3 d-flex justify-content-end">
        <button class="btn btn-secondary" @click="cerrarDetalle">Cerrar</button>
      </div>
    </div>

    <!-- Visor de imagen -->
    <div v-if="visor.abierto" class="modal show image-viewer" tabindex="-1" style="display:block;" @click.self="cerrarVisor">
      <div class="modal-dialog modal-fullscreen-sm-down modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Comprobante</h5>
            <div class="d-flex align-items-center gap-2 me-2">
              <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-outline-secondary" @click="zoomOut" :disabled="visor.zoom <= 0.4" title="Zoom -">−</button>
                <button class="btn btn-outline-secondary" @click="zoomReset" :disabled="visor.zoom === 1" title="100%">100%</button>
                <button class="btn btn-outline-secondary" @click="zoomIn" :disabled="visor.zoom >= 3" title="Zoom +">+</button>
              </div>
              <a :href="visor.src || '#'" download="comprobante.jpg" class="btn btn-outline-secondary btn-sm" :class="{ disabled: !visor.src }">
                <i class="bi bi-download me-1"></i> Descargar
              </a>
            </div>
            <button type="button" class="btn-close" @click="cerrarVisor"></button>
          </div>
          <div class="modal-body p-0">
            <div class="viewer-canvas" ref="viewerCanvas">
              <img
                v-if="visor.src"
                :src="visor.src"
                class="viewer-image"
                :style="{ transform: 'scale(' + visor.zoom + ')' }"
                alt="comprobante ampliado"
                @dblclick="toggleZoom"
              />
            </div>
          </div>
          <div class="modal-footer">
            <small class="text-muted">Doble toque para alternar zoom. Usa scroll para desplazarte.</small>
            <button class="btn btn-secondary" @click="cerrarVisor">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
    <!-- /Visor -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { db } from '@/firebase'
import {
  collection, query, where, orderBy, limit, onSnapshot,
  doc, updateDoc, serverTimestamp, writeBatch
} from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()
function goExport () {
  const query = {
    anio: String(filtroAnio.value),
    mes: String(filtroMes.value),
  }
  if (selectedIds.value.length) {
    query.ids = selectedIds.value.join(',')     // ej: ids=abc,def,ghi
  }

  // Usa el NOMBRE de la ruta (recomendado):
  router.push({ name: 'exportar.rendiciones', query })

  // Si en tu router usaste path en vez de name:
  // router.push({ path: '/exportar-rendiciones', query })
}
/* ---------------- UI responsive ---------------- */
const showFiltros = ref(false)

/* ---------------- CONFIG ---------------- */
const COL = 'rendiciones'
const FECHA_CAMPO = 'creadoEn'

/* ---------------- Fechas ---------------- */
const ahora = new Date()
const meses = [
  { value: 0,  label: 'Enero' }, { value: 1,  label: 'Febrero' }, { value: 2,  label: 'Marzo' },
  { value: 3,  label: 'Abril' }, { value: 4,  label: 'Mayo' },    { value: 5,  label: 'Junio' },
  { value: 6,  label: 'Julio' }, { value: 7,  label: 'Agosto' },  { value: 8,  label: 'Septiembre' },
  { value: 9,  label: 'Octubre' }, { value: 10, label: 'Noviembre' }, { value: 11, label: 'Diciembre' }
]
const anioActual = ahora.getFullYear()
const anios = [anioActual, anioActual - 1, anioActual - 2]
const filtroMes = ref(ahora.getMonth())
const filtroAnio = ref(anioActual)
const rangoMes = computed(() => {
  const start = new Date(filtroAnio.value, filtroMes.value, 1, 0, 0, 0, 0)
  const end   = new Date(filtroAnio.value, filtroMes.value + 1, 1, 0, 0, 0, 0)
  return { start, end }
})

/* ---------------- Estado ---------------- */
const cargandoPend = ref(true)
const cargandoMes = ref(true)
const ultimasPendientes = ref([])
const listadoMes = ref([])

const filtroEstadoListado = ref('') // '', 'pendiente', 'aprobada', 'rechazada'

/* -------- KPIs -------- */
const kpis = computed(() => {
  const p = listadoMes.value.filter(r => r.estado === 'pendiente').length
  const a = listadoMes.value.filter(r => r.estado === 'aprobada').length
  const r = listadoMes.value.filter(r => r.estado === 'rechazada').length
  return { pendientes: p, aprobadas: a, rechazadas: r }
})
const totalMontoMes = computed(() => listadoMes.value.reduce((acc, r) => acc + (Number(r.monto) || 0), 0))

const topCategorias = computed(() => {
  const tot = totalMontoMes.value || 1
  const map = new Map()
  for (const r of listadoMes.value) {
    const cat = r.categoria || '—'
    const m = Number(r.monto) || 0
    map.set(cat, (map.get(cat) || 0) + m)
  }
  const arr = [...map.entries()].map(([categoria, monto]) => ({ categoria, monto, pct: (monto * 100) / tot }))
  arr.sort((a, b) => b.monto - a.monto)
  return arr.slice(0, 6)
})

const listadoMesFiltrado = computed(() => {
  if (!filtroEstadoListado.value) return listadoMes.value
  return listadoMes.value.filter(r => r.estado === filtroEstadoListado.value)
})

/* -------- Helpers nombre/email -------- */
function emailOf (r) {
  const e = r?.correo ?? r?.email ?? r?.userEmail ?? r?.perfil?.email
  if (e) return e
  if (typeof r?.usuario === 'string' && r.usuario.includes('@')) return r.usuario
  return null
}
function nameOf (r) {
  const n = r?.usuarioNombre ?? r?.nombre ?? r?.usuario ?? r?.displayName ?? r?.perfil?.nombre
  if (n) return n
  const e = emailOf(r)
  if (e) return e.split('@')[0]
  return r?.userId || '—'
}

/* ---------------- Detalle (individual) ---------------- */
const detalle = ref(null)
const comentario = ref('')
const guardando = ref(false)
const errorComentario = ref('')
const accionError = ref('')

/* ---------------- Visor de imagen ---------------- */
const visor = ref({ abierto: false, src: null, zoom: 1 })
const abrirVisor = (src) => { visor.value = { abierto: true, src, zoom: 1 }; document.body.style.overflow = 'hidden' }
const cerrarVisor = () => { visor.value = { abierto: false, src: null, zoom: 1 }; document.body.style.overflow = '' }
const zoomIn = () => { visor.value.zoom = Math.min(3, +(visor.value.zoom + 0.2).toFixed(2)) }
const zoomOut = () => { visor.value.zoom = Math.max(0.4, +(visor.value.zoom - 0.2).toFixed(2)) }
const zoomReset = () => { visor.value.zoom = 1 }
const toggleZoom = () => { visor.value.zoom = visor.value.zoom === 1 ? 1.6 : 1 }

/* ---------------- Selección múltiple ---------------- */
const selectedIds = ref([])  // array de IDs seleccionados
const batchComment = ref('')
const guardandoBatch = ref(false)
const batchError = ref('')
const batchOk = ref('')

const clearSelection = () => { selectedIds.value = [] }
const selectAllVisible = () => { selectedIds.value = [...new Set([...selectedIds.value, ...listadoMesFiltrado.value.map(r => r.id)])] }
const allVisibleSelected = computed(() =>
  listadoMesFiltrado.value.length > 0 &&
  listadoMesFiltrado.value.every(r => selectedIds.value.includes(r.id))
)
const toggleSelectAllVisible = (e) => {
  if (e.target.checked) selectAllVisible()
  else {
    const visibles = new Set(listadoMesFiltrado.value.map(r => r.id))
    selectedIds.value = selectedIds.value.filter(id => !visibles.has(id))
  }
}

/* ---------------- Subscripciones ---------------- */
let unsubPend = null
let unsubMes = null

onMounted(() => {
  recargarPendientes()
  recargarMes()
})
onUnmounted(() => {
  if (unsubPend) unsubPend()
  if (unsubMes) unsubMes()
  document.body.style.overflow = ''
})
watch([filtroMes, filtroAnio], () => recargarMes())

function recargarPendientes () {
  if (unsubPend) unsubPend()
  cargandoPend.value = true
  const qRef = query(collection(db, COL), where('estado', '==', 'pendiente'), orderBy(FECHA_CAMPO, 'desc'), limit(10))
  unsubPend = onSnapshot(qRef, (snap) => {
    ultimasPendientes.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    cargandoPend.value = false
  }, () => (cargandoPend.value = false))
}

function recargarMes () {
  if (unsubMes) unsubMes()
  cargandoMes.value = true
  const { start, end } = rangoMes.value
  const qRef = query(
    collection(db, COL),
    where(FECHA_CAMPO, '>=', start),
    where(FECHA_CAMPO, '<', end),
    orderBy(FECHA_CAMPO, 'desc')
  )
  unsubMes = onSnapshot(qRef, (snap) => {
    listadoMes.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    cargandoMes.value = false
  }, () => (cargandoMes.value = false))
}

/* ---------------- Abrir/cerrar detalle ---------------- */
function abrir (r) { detalle.value = r; comentario.value = ''; errorComentario.value = ''; accionError.value = '' }
function cerrarDetalle () { detalle.value = null; comentario.value = ''; errorComentario.value = ''; accionError.value = '' }

/* ---------------- Acciones individuales ---------------- */
async function aprobar () {
  if (!detalle.value) return
  if (!comentario.value.trim()) { errorComentario.value = 'Debes ingresar un comentario.'; return }
  errorComentario.value = ''; accionError.value = ''
  try {
    guardando.value = true
    await updateDoc(doc(db, COL, detalle.value.id), {
      estado: 'aprobada',
      comentarioAprob: comentario.value.trim(),
      aprobadoPor: 'aprobador',
      aprobadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    })
    detalle.value.estado = 'aprobada'
  } catch (err) {
    console.error(err); accionError.value = err?.message || 'No se pudo aprobar.'
  } finally { guardando.value = false }
}

async function rechazar () {
  if (!detalle.value) return
  if (!comentario.value.trim()) { errorComentario.value = 'Debes ingresar un comentario.'; return }
  errorComentario.value = ''; accionError.value = ''
  try {
    guardando.value = true
    await updateDoc(doc(db, COL, detalle.value.id), {
      estado: 'rechazada',
      comentarioRechazo: comentario.value.trim(),
      rechazadoPor: 'aprobador',
      rechazadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    })
    detalle.value.estado = 'rechazada'
  } catch (err) {
    console.error(err); accionError.value = err?.message || 'No se pudo rechazar.'
  } finally { guardando.value = false }
}

/* ---------------- Acciones MASIVAS ---------------- */
async function batchUpdateEstado (ids, nuevoEstado, comentarioComun) {
  guardandoBatch.value = true
  batchError.value = ''
  batchOk.value = ''
  try {
    const chunkSize = 400
    for (let i = 0; i < ids.length; i += chunkSize) {
      const slice = ids.slice(i, i + chunkSize)
      const batch = writeBatch(db)
      for (const id of slice) {
        const ref = doc(db, COL, id)
        if (nuevoEstado === 'aprobada') {
          batch.update(ref, {
            estado: 'aprobada',
            comentarioAprob: comentarioComun,
            aprobadoPor: 'aprobador',
            aprobadoEn: serverTimestamp(),
            actualizadoEn: serverTimestamp()
          })
        } else {
          batch.update(ref, {
            estado: 'rechazada',
            comentarioRechazo: comentarioComun,
            rechazadoPor: 'aprobador',
            rechazadoEn: serverTimestamp(),
            actualizadoEn: serverTimestamp()
          })
        }
      }
      await batch.commit()
    }
    batchOk.value = `Se actualizaron ${ids.length} rendición(es).`
    selectedIds.value = []
    batchComment.value = ''
  } catch (e) {
    console.error(e)
    batchError.value = e?.message || 'No se pudieron actualizar las rendiciones seleccionadas.'
  } finally {
    guardandoBatch.value = false
  }
}

function batchApprove () {
  if (!selectedIds.value.length) { batchError.value = 'Selecciona al menos una rendición.'; return }
  if (!batchComment.value.trim()) { batchError.value = 'Debes ingresar un comentario para la acción masiva.'; return }
  batchUpdateEstado(selectedIds.value, 'aprobada', batchComment.value.trim())
}
function batchReject () {
  if (!selectedIds.value.length) { batchError.value = 'Selecciona al menos una rendición.'; return }
  if (!batchComment.value.trim()) { batchError.value = 'Debes ingresar un comentario para la acción masiva.'; return }
  batchUpdateEstado(selectedIds.value, 'rechazada', batchComment.value.trim())
}

const formatCLP = (n) => { try { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0) } catch { return `$${n}` } }
const formatFecha = (ts) => {
  try {
    const d = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts))
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(d)
  } catch { return '-' }
}
const badgeEstado = (estado) => ({ pendiente:'text-bg-warning', aprobada:'text-bg-success', rechazada:'text-bg-danger' }[estado] || 'text-bg-secondary')
</script>

<style scoped>

.card-filtros { border-radius: 12px; }

.offcanvas {
  display: block;
  visibility: visible;
  background: #fff;
  width: 640px;
  max-width: 100vw;
  position: fixed;
  inset: 0 0 0 auto;
  box-shadow: -12px 0 24px rgba(0,0,0,.08);
  z-index: 1080;
}
.offcanvas-body {
  max-height: calc(100vh - 56px - 56px);
  overflow: auto;
}
@media (max-width: 991.98px) {
  .offcanvas { width: 100vw; }
}

.comprobante-thumb { cursor: zoom-in; user-select: none; }

.image-viewer { background: rgba(0,0,0,.6); z-index: 1080; }
.image-viewer .modal-dialog { max-width: min(1100px, 96vw); margin: 1.25rem auto; }
.viewer-canvas {
  height: 70vh; width: 100%; overflow: auto;
  background: #111; display: flex; align-items: center; justify-content: center;
}
.viewer-image { max-width: none; transform-origin: center center; transition: transform .12s ease; user-select: none; pointer-events: auto; }
</style>
