<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <!-- Header -->
  <div class="p-4 rounded-3 border bg-white shadow-sm mb-3">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
      <div>
        <h1 class="h5 mb-1">Reportes</h1>
        <p class="text-muted mb-0">Analiza tus rendiciones por fecha, estado, moneda y categoría.</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="router.back()">
          <i class="bi bi-arrow-left"></i> Volver
        </button>
        <RouterLink class="btn btn-outline-secondary" :to="{ name: 'informes' }">
          <i class="bi bi-file-earmark-text me-1"></i> Ver informes
        </RouterLink>
        <button class="btn btn-outline-secondary" @click="resetFiltros">
          <i class="bi bi-arrow-counterclockwise me-1"></i> Reset
        </button>
      </div>
    </div>
  </div>

  <div v-if="error" class="alert alert-danger mb-3">{{ error }}</div>

  <!-- Filtros -->
  <div class="card shadow-sm mb-3">
    <div class="card-body">
      <div class="row g-3">
        <div class="col-12 col-lg-3">
          <label class="form-label">Buscar</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input v-model.trim="q" type="text" class="form-control" placeholder="Motivo, categoría, notas..." />
          </div>
          <div class="form-text">Coincide en motivo, categoría y notas.</div>
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
          <label class="form-label">Estado</label>
          <select v-model="fEstado" class="form-select">
            <option value="todos">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>

        <div class="col-6 col-lg-1">
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
          <label class="form-label">Categoría</label>
          <select v-model="fCategoria" class="form-select">
            <option value="todas">Todas</option>
            <option v-for="c in categoriasDisponibles" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="col-6 col-lg-2">
          <label class="form-label">Ordenar</label>
          <select v-model="orden" class="form-select">
            <option value="fecha_desc">Fecha ↓ (recientes)</option>
            <option value="fecha_asc">Fecha ↑ (antiguas)</option>
            <option value="monto_desc">Monto ↓</option>
            <option value="monto_asc">Monto ↑</option>
            <option value="categoria_asc">Categoría A→Z</option>
            <option value="categoria_desc">Categoría Z→A</option>
          </select>
        </div>
      </div>

      <!-- Chips de filtros activos -->
      <div class="d-flex flex-wrap gap-2 mt-3">
        <span v-if="q" class="badge rounded-pill bg-light border text-body">
          <i class="bi bi-search me-1"></i> {{ q }}
          <button class="btn btn-sm btn-link py-0 ms-1" @click="q = ''">Quitar</button>
        </span>
        <span v-if="fDesde" class="badge rounded-pill bg-light border text-body">
          <i class="bi bi-calendar me-1"></i> Desde {{ fDesde }}
          <button class="btn btn-sm btn-link py-0 ms-1" @click="fDesde = ''">Quitar</button>
        </span>
        <span v-if="fHasta" class="badge rounded-pill bg-light border text-body">
          <i class="bi bi-calendar2 me-1"></i> Hasta {{ fHasta }}
          <button class="btn btn-sm btn-link py-0 ms-1" @click="fHasta = ''">Quitar</button>
        </span>
        <span v-if="fEstado !== 'todos'" class="badge rounded-pill bg-light border text-body">
          <i class="bi bi-flag me-1"></i> {{ fEstado }}
          <button class="btn btn-sm btn-link py-0 ms-1" @click="fEstado = 'todos'">Quitar</button>
        </span>
        <span v-if="fMoneda !== 'todas'" class="badge rounded-pill bg-light border text-body">
          <i class="bi bi-cash-coin me-1"></i> {{ fMoneda }}
          <button class="btn btn-sm btn-link py-0 ms-1" @click="fMoneda = 'todas'">Quitar</button>
        </span>
        <span v-if="fCategoria !== 'todas'" class="badge rounded-pill bg-light border text-body">
          <i class="bi bi-tag me-1"></i> {{ fCategoria }}
          <button class="btn btn-sm btn-link py-0 ms-1" @click="fCategoria = 'todas'">Quitar</button>
        </span>
      </div>
    </div>
  </div>

  <!-- KPIs -->
  <div class="row g-3">
    <div class="col-12 col-lg-4">
      <div class="card shadow-sm h-100">
        <div class="card-body d-flex justify-content-between align-items-start">
          <div>
            <div class="text-muted small">Total (filtrado)</div>
            <div class="fs-4 fw-semibold">{{ cantidadFiltradas }}</div>
            <div class="small text-muted">rendición(es)</div>
          </div>
          <i class="bi bi-receipt fs-3 text-secondary"></i>
        </div>
        <div class="card-footer bg-light">
          <div class="d-flex flex-wrap gap-3 small">
            <div v-for="(monto, code) in totalesPorMonedaFiltrado" :key="'kpi-'+code">
              <span class="text-muted">{{ code }}:</span> <strong>{{ formatMoney(monto, code) }}</strong>
            </div>
            <span v-if="!Object.keys(totalesPorMonedaFiltrado).length" class="text-muted">—</span>
          </div>
        </div>
      </div>
    </div>

    <div class="col-4 col-lg-2">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="text-muted small">Pendientes</div>
          <div class="fs-4 fw-semibold">{{ countEstado('pendiente') }}</div>
          <span class="badge text-bg-warning">pendiente</span>
        </div>
      </div>
    </div>
    <div class="col-4 col-lg-2">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="text-muted small">Aprobadas</div>
          <div class="fs-4 fw-semibold">{{ countEstado('aprobada') }}</div>
          <span class="badge text-bg-success">aprobada</span>
        </div>
      </div>
    </div>
    <div class="col-4 col-lg-2">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="text-muted small">Rechazadas</div>
          <div class="fs-4 fw-semibold">{{ countEstado('rechazada') }}</div>
          <span class="badge text-bg-danger">rechazada</span>
        </div>
      </div>
    </div>
    <div class="col-4 col-lg-2">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="text-muted small">Borrador</div>
          <div class="fs-4 fw-semibold">{{ countEstado('borrador') }}</div>
          <span class="badge text-bg-secondary">borrador</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Gráficos -->
  <div class="row g-3 mt-1">
    <div class="col-12 col-lg-6">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Distribución por categoría</h6>
            <small class="text-muted">Dona</small>
          </div>
          <div v-if="!chartReady" class="text-muted small">Cargando gráfico…</div>
          <div v-else-if="!hayDatosCategoria" class="text-muted small">Sin datos suficientes.</div>
          <canvas ref="catCanvas" height="220" v-show="chartReady && hayDatosCategoria"></canvas>
        </div>
      </div>
    </div>
    <div class="col-12 col-lg-6">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Gasto por mes</h6>
            <small class="text-muted">Barras</small>
          </div>
          <div v-if="!chartReady" class="text-muted small">Cargando gráfico…</div>
          <div v-else-if="!hayDatosMes" class="text-muted small">Sin datos suficientes.</div>
          <canvas ref="mesCanvas" height="220" v-show="chartReady && hayDatosMes"></canvas>
        </div>
      </div>
    </div>
  </div>

  <!-- Tabla -->
  <div class="card shadow-sm mt-3">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">Detalle filtrado</h6>
        <small class="text-muted">{{ cantidadFiltradas }} resultado(s)</small>
      </div>

      <div v-if="cargando" class="text-center py-4">
        <div class="spinner-border"></div>
      </div>
      <div v-else class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Motivo</th>
              <th class="text-end">Monto</th>
              <th>Moneda</th>
              <th>Estado</th>
              <th class="text-end"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="x in filtradasOrdenadas" :key="x.id">
              <td class="small text-nowrap">{{ formatFecha(x.fecha || x.creadoEn) }}</td>
              <td>{{ x.categoria }}</td>
              <td class="text-truncate" style="max-width: 360px;">{{ x.motivo }}</td>
              <td class="text-end">{{ formatMoney(x.monto, x.moneda || 'CLP') }}</td>
              <td>{{ x.moneda || 'CLP' }}</td>
              <td><span :class="['badge', badgeClass(x.estado)]">{{ x.estado }}</span></td>
              <td class="text-end">
                <RouterLink class="btn btn-sm btn-outline-secondary" :to="{ name: 'detalle', params: { id: x.id } }">
                  Ver
                </RouterLink>
              </td>
            </tr>
            <tr v-if="!filtradasOrdenadas.length">
              <td colspan="7" class="text-center text-muted py-4">No hay resultados para los filtros aplicados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card-footer bg-light">
      <div class="d-flex flex-wrap gap-3 small">
        <div v-for="(monto, code) in totalesPorMonedaFiltrado" :key="'foot-'+code">
          <span class="text-muted">{{ code }} total:</span> <strong>{{ formatMoney(monto, code) }}</strong>
        </div>
        <span v-if="!Object.keys(totalesPorMonedaFiltrado).length" class="text-muted">—</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '@/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
const router = useRouter()
const auth = useAuthStore()

// ===== Estado base =====
const items = ref([])
const error = ref('')
const cargando = ref(true)

// Filtros
const q = ref('')
const fDesde = ref('')
const fHasta = ref('')
const fEstado = ref('todos')
const fMoneda = ref('todas')
const fCategoria = ref('todas')
const orden = ref('fecha_desc')

// Catálogo de categorías
const categoriasDisponibles = ref([
  'Gastos de estacionamiento',
  'Gastos notariales y legales',
  'Gastos de bencina con boleta',
  'Artículos de aseo con boleta',
  'Útiles y Artículos de oficina con boleta',
  'Gastos varios con boleta',
  'proveedores',
  'Gastos de colación con boleta',
  'Gastos de movilización - pasajes con boletas'
])

// Suscripción a Firestore
onMounted(() => {
  try {
    const qRef = query(
      collection(db, 'rendiciones'),
      where('userId', '==', auth.uid),
      orderBy('creadoEn', 'desc')
    )
    onSnapshot(qRef, (snap) => {
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // actualizar catálogo según datos reales
      const setCats = new Set(categoriasDisponibles.value)
      for (const r of items.value) if (r.categoria) setCats.add(r.categoria)
      categoriasDisponibles.value = Array.from(setCats).sort()
      cargando.value = false
      refreshCharts()
    })
  } catch (e) {
    console.error(e)
    error.value = 'No fue posible cargar los datos.'
    cargando.value = false
  }
})

watch([q, fDesde, fHasta, fEstado, fMoneda, fCategoria, orden], () => {
  refreshCharts()
})

// ===== Helpers formato
const formatFecha = (ts) => {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    return new Intl.DateTimeFormat('es-CL').format(d)
  } catch { return '-' }
}
const formatMoney = (value, code) => {
  const n = Number(value || 0)
  if (code === 'CLP') return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
  if (code === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  if (code === 'EUR') return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
  if (code === 'UF')  return `UF ${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`
  return n
}
const badgeClass = (estado) =>
  ({ pendiente: 'text-bg-warning', aprobada: 'text-bg-success', rechazada: 'text-bg-danger' }[estado] || 'text-bg-secondary')

// ===== Filtros / Orden
const inRange = (ts, desde, hasta) => {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    if (desde) { const dd = new Date(desde); if (d < dd) return false }
    if (hasta) { const hh = new Date(hasta); hh.setHours(23, 59, 59, 999); if (d > hh) return false }
    return true
  } catch { return true }
}

const filtradas = computed(() => {
  const queryText = q.value.toLowerCase()
  let arr = items.value.filter(x => inRange(x.fecha || x.creadoEn, fDesde.value, fHasta.value))

  if (queryText) {
    arr = arr.filter(x => {
      const texto = `${x.motivo || ''} ${x.categoria || ''} ${x.notas || ''}`.toLowerCase()
      return texto.includes(queryText)
    })
  }
  if (fEstado.value !== 'todos') arr = arr.filter(x => x.estado === fEstado.value)
  if (fMoneda.value !== 'todas') arr = arr.filter(x => (x.moneda || 'CLP') === fMoneda.value)
  if (fCategoria.value !== 'todas') arr = arr.filter(x => x.categoria === fCategoria.value)

  return arr
})

const filtradasOrdenadas = computed(() => {
  const arr = [...filtradas.value]
  arr.sort((a, b) => {
    const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha || a.creadoEn)
    const dbb = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha || b.creadoEn)
    const ma = Number(a.monto || 0)
    const mb = Number(b.monto || 0)
    switch (orden.value) {
      case 'fecha_asc':  return da - dbb
      case 'fecha_desc': return dbb - da
      case 'monto_asc':  return ma - mb
      case 'monto_desc': return mb - ma
      case 'categoria_asc':  return (a.categoria || '').localeCompare(b.categoria || '')
      case 'categoria_desc': return (b.categoria || '').localeCompare(a.categoria || '')
      default: return dbb - da
    }
  })
  return arr
})

const cantidadFiltradas = computed(() => filtradas.value.length)

const totalesPorMonedaFiltrado = computed(() => {
  const tot = {}
  for (const x of filtradas.value) {
    const m = x.moneda || 'CLP'
    tot[m] = (tot[m] || 0) + Number(x.monto || 0)
  }
  return tot
})

const countEstado = (estado) => filtradas.value.filter(x => x.estado === estado).length

const resetFiltros = () => {
  q.value = ''
  fDesde.value = ''
  fHasta.value = ''
  fEstado.value = 'todos'
  fMoneda.value = 'todas'
  fCategoria.value = 'todas'
  orden.value = 'fecha_desc'
}

// ===== Gráficos (Chart.js)
const catCanvas = ref(null)
const mesCanvas = ref(null)
let ChartRef = null
let catChart = null
let mesChart = null
const chartReady = ref(false)

const loadChartJS = () => new Promise((resolve, reject) => {
  if (ChartRef) return resolve(ChartRef)
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
  s.async = true
  s.onload = () => { ChartRef = window.Chart; resolve(ChartRef) }
  s.onerror = reject
  document.head.appendChild(s)
})

const yyyymm = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

const groupByCategoria = (arr) => {
  const map = new Map()
  for (const r of arr) {
    const key = r.categoria || 'Sin categoría'
    const moneda = r.moneda || 'CLP'
    // Solo sumamos la moneda seleccionada o CLP si no hay filtro
    if (fMoneda.value === 'todas' ? moneda === 'CLP' : moneda === fMoneda.value) {
      map.set(key, (map.get(key) || 0) + Number(r.monto || 0))
    }
  }
  return map
}
const groupByMes = (arr) => {
  const map = new Map()
  for (const r of arr) {
    const d = r.fecha?.toDate ? r.fecha.toDate()
      : (r.fecha ? new Date(r.fecha)
      : (r.creadoEn?.toDate ? r.creadoEn.toDate()
      : new Date()))
    const key = yyyymm(d)
    const moneda = r.moneda || 'CLP'
    if (fMoneda.value === 'todas' ? moneda === 'CLP' : moneda === fMoneda.value) {
      map.set(key, (map.get(key) || 0) + Number(r.monto || 0))
    }
  }
  return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])))
}

const destroyCharts = () => {
  if (catChart) { catChart.destroy(); catChart = null }
  if (mesChart) { mesChart.destroy(); mesChart = null }
}

const hayDatosCategoria = computed(() => {
  const m = groupByCategoria(filtradas.value)
  return m.size > 0
})
const hayDatosMes = computed(() => {
  const m = groupByMes(filtradas.value)
  return m.size > 0
})

const refreshCharts = async () => {
  await nextTick()
  try {
    await loadChartJS()
    chartReady.value = true
    destroyCharts()

    const catMap = groupByCategoria(filtradas.value)
    const catLabels = Array.from(catMap.keys())
    const catData = Array.from(catMap.values())

    if (catCanvas.value && catLabels.length) {
      catChart = new ChartRef(catCanvas.value.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: catLabels,
          datasets: [{ data: catData }]
        },
        options: {
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.label}: ${formatMoney(
                  ctx.raw,
                  fMoneda.value === 'todas' ? 'CLP' : fMoneda.value
                )}`
              }
            }
          }
        }
      })
    }

    const mesMap = groupByMes(filtradas.value)
    const mesLabels = Array.from(mesMap.keys())
    const mesData = Array.from(mesMap.values())

    if (mesCanvas.value && mesLabels.length) {
      mesChart = new ChartRef(mesCanvas.value.getContext('2d'), {
        type: 'bar',
        data: {
          labels: mesLabels,
          datasets: [{ label: 'Monto', data: mesData }]
        },
        options: {
          scales: { y: { ticks: { callback: (v) => v.toLocaleString('es-CL') } } },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => formatMoney(
                  ctx.raw,
                  fMoneda.value === 'todas' ? 'CLP' : fMoneda.value
                )
              }
            }
          }
        }
      })
    }
  } catch (e) {
    console.warn('No se pudo cargar Chart.js', e)
  }
}

onMounted(() => {
  loadChartJS()
    .then(() => { chartReady.value = true; refreshCharts() })
    .catch(() => { chartReady.value = false })
})

</script>

<style scoped>
.table td, .table th { vertical-align: middle; }
.badge .btn-link{ text-decoration: none; }
</style>
