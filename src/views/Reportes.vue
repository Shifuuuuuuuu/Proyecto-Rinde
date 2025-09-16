<template>
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1 class="h5 mb-0">Reportes</h1>
  </div>

  <!-- Filtros -->
  <div class="card shadow-sm mb-3">
    <div class="card-body">
      <div class="row g-3">
        <div class="col-12 col-md-3">
          <label class="form-label">Desde</label>
          <input v-model="fDesde" type="date" class="form-control" />
        </div>
        <div class="col-12 col-md-3">
          <label class="form-label">Hasta</label>
          <input v-model="fHasta" type="date" class="form-control" />
        </div>
        <div class="col-6 col-md-2">
          <label class="form-label">Estado</label>
          <select v-model="fEstado" class="form-select">
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>
        <div class="col-6 col-md-2">
          <label class="form-label">Moneda</label>
          <select v-model="fMoneda" class="form-select">
            <option value="todas">Todas</option>
            <option value="CLP">CLP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="UF">UF</option>
          </select>
        </div>
        <div class="col-12 col-md-2">
          <label class="form-label">Categoría</label>
          <select v-model="fCategoria" class="form-select">
            <option value="todas">Todas</option>
            <option v-for="c in categoriasDisponibles" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>

      <div class="d-flex flex-wrap gap-2 mt-3">
        <button class="btn btn-outline-secondary" @click="resetFiltros">
          <i class="bi bi-arrow-counterclockwise"></i> Reset
        </button>
      </div>
    </div>
  </div>

  <!-- KPIs -->
  <div class="row g-3">
    <div class="col-12 col-md-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="text-muted small">Total filtrado</div>
          <div class="fs-4 fw-semibold">{{ totalFiltradoTexto }}</div>
          <div class="small text-muted">{{ filtradas.length }} rendición(es)</div>
        </div>
      </div>
    </div>
    <div class="col-4 col-md-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="text-muted small">Pendientes</div>
          <div class="fs-4 fw-semibold">{{ countEstado('pendiente') }}</div>
          <span class="badge text-bg-warning">pendiente</span>
        </div>
      </div>
    </div>
    <div class="col-4 col-md-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="text-muted small">Aprobadas</div>
          <div class="fs-4 fw-semibold">{{ countEstado('aprobada') }}</div>
          <span class="badge text-bg-success">aprobada</span>
        </div>
      </div>
    </div>
    <div class="col-4 col-md-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="text-muted small">Rechazadas</div>
          <div class="fs-4 fw-semibold">{{ countEstado('rechazada') }}</div>
          <span class="badge text-bg-danger">rechazada</span>
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
          <canvas ref="catCanvas" height="220"></canvas>
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
          <canvas ref="mesCanvas" height="220"></canvas>
        </div>
      </div>
    </div>
  </div>

  <!-- Tabla -->
  <div class="card shadow-sm mt-3">
    <div class="card-body">
      <h6 class="mb-2">Detalle filtrado</h6>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Motivo</th>
              <th class="text-end">Monto</th>
              <th>Moneda</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="x in filtradas" :key="x.id">
              <td class="small text-nowrap">{{ formatFecha(x.fecha) }}</td>
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
            <tr v-if="!filtradas.length">
              <td colspan="7" class="text-center text-muted py-4">No hay resultados para los filtros aplicados.</td>
            </tr>
          </tbody>
        </table>
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

const auth = useAuthStore()

// Datos brutos
const items = ref([])
const error = ref('')
const cargando = ref(true)

// Filtros
const fDesde = ref('')       // yyyy-mm-dd
const fHasta = ref('')
const fEstado = ref('todos')
const fMoneda = ref('todas')
const fCategoria = ref('todas')

// Categorías disponibles (se llenan con lo que trae BD)
const categoriasDisponibles = ref(['Transporte', 'Alimentación', 'Alojamiento', 'Insumos', 'Otros'])

// Suscripción Firestore
onMounted(() => {
  try {
    const qRef = query(
      collection(db, 'rendiciones'),
      where('userId', '==', auth.uid),
      orderBy('creadoEn', 'desc')
    )
    onSnapshot(qRef, (snap) => {
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // refrescar catálogo de categorías reales
      const setCats = new Set(categoriasDisponibles.value)
      for (const r of items.value) if (r.categoria) setCats.add(r.categoria)
      categoriasDisponibles.value = Array.from(setCats).sort()
      cargando.value = false
      refreshCharts()
    })
  } catch (e) {
    error.value = 'No fue posible cargar los datos.'
    cargando.value = false
  }
})

watch([fDesde, fHasta, fEstado, fMoneda, fCategoria], () => {
  refreshCharts()
})

// ---- Helpers formato
const formatFecha = (ts) => {
  try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return new Intl.DateTimeFormat('es-CL').format(d) }
  catch { return '-' }
}
const formatMoney = (value, code) => {
  const n = Number(value || 0)
  if (code === 'CLP') return new Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 }).format(n)
  if (code === 'USD') return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n)
  if (code === 'EUR') return new Intl.NumberFormat('es-ES', { style:'currency', currency:'EUR' }).format(n)
  if (code === 'UF')  return `UF ${new Intl.NumberFormat('es-CL', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(n)}`
  return n
}
const badgeClass = (estado) =>
  ({ pendiente:'text-bg-warning', aprobada:'text-bg-success', rechazada:'text-bg-danger' }[estado] || 'text-bg-secondary')

// ---- Lógica de filtros
const inRange = (ts, desde, hasta) => {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    if (desde) { const dd = new Date(desde); if (d < dd) return false }
    if (hasta) { const hh = new Date(hasta); hh.setHours(23,59,59,999); if (d > hh) return false }
    return true
  } catch { return true }
}

const filtradas = computed(() => {
  let arr = items.value.filter(x => inRange(x.fecha || x.creadoEn, fDesde.value, fHasta.value))
  if (fEstado.value !== 'todos') arr = arr.filter(x => x.estado === fEstado.value)
  if (fMoneda.value !== 'todas') arr = arr.filter(x => (x.moneda || 'CLP') === fMoneda.value)
  if (fCategoria.value !== 'todas') arr = arr.filter(x => x.categoria === fCategoria.value)
  return arr
})

const totalFiltradoTexto = computed(() => {
  // muestra total solo cuando hay una moneda seleccionada; si no, suma por CLP para referencia
  if (fMoneda.value !== 'todas') {
    const tot = filtradas.value.filter(x => (x.moneda || 'CLP') === fMoneda.value)
      .reduce((acc, x) => acc + Number(x.monto || 0), 0)
    return formatMoney(tot, fMoneda.value)
  } else {
    const tot = filtradas.value
      .filter(x => (x.moneda || 'CLP') === 'CLP')
      .reduce((acc, x) => acc + Number(x.monto || 0), 0)
    return formatMoney(tot, 'CLP') + ' (solo CLP)'
  }
})

const countEstado = (estado) => filtradas.value.filter(x => x.estado === estado).length

const resetFiltros = () => {
  fDesde.value = ''
  fHasta.value = ''
  fEstado.value = 'todos'
  fMoneda.value = 'todas'
  fCategoria.value = 'todas'
}

// ---- Gráficos (Chart.js via CDN loader)
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

const yyyymm = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`

const groupByMes = (arr) => {
  const map = new Map()
  for (const r of arr) {
    const d = r.fecha?.toDate ? r.fecha.toDate() : (r.fecha ? new Date(r.fecha) : (r.creadoEn?.toDate ? r.creadoEn.toDate() : new Date()))
    const key = yyyymm(d)
    const moneda = r.moneda || 'CLP'
    if (fMoneda.value === 'todas' ? moneda === 'CLP' : moneda === fMoneda.value) {
      map.set(key, (map.get(key) || 0) + Number(r.monto || 0))
    }
  }
  // ordenar por mes
  return new Map([...map.entries()].sort((a,b) => a[0].localeCompare(b[0])))
}

const destroyCharts = () => {
  if (catChart) { catChart.destroy(); catChart = null }
  if (mesChart) { mesChart.destroy(); mesChart = null }
}

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
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatMoney(ctx.raw, fMoneda.value === 'todas' ? 'CLP' : fMoneda.value)}` } }
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
            tooltip: { callbacks: { label: (ctx) => formatMoney(ctx.raw, fMoneda.value === 'todas' ? 'CLP' : fMoneda.value) } }
          }
        }
      })
    }
  } catch (e) {
    // Si no carga Chart.js, no rompemos la vista (quedan KPIs y tabla)
    console.warn('No se pudo cargar Chart.js', e)
  }
}

// ---- Exportar CSV
const exportCSV = () => {
  const rows = [
    ['Fecha', 'Categoría', 'Motivo', 'Monto', 'Moneda', 'Estado', 'ID']
  ]
  for (const x of filtradas.value) {
    const d = x.fecha?.toDate ? x.fecha.toDate() : new Date(x.fecha || x.creadoEn?.toDate?.() || Date.now())
    rows.push([
      d.toISOString().slice(0,10),
      x.categoria || '',
      (x.motivo || '').replace(/\n/g,' ').trim(),
      String(Number(x.monto || 0)),
      x.moneda || 'CLP',
      x.estado || '',
      x.id
    ])
  }
  const csv = rows.map(r => r.map(cell => /[",\n]/.test(cell) ? `"${cell.replace(/"/g,'""')}"` : cell).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'reportes_rendiciones.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
