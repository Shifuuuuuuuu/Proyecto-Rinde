<template>
  <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
    <h2 class="h5 mb-0">Mis rendiciones</h2>
    <div class="d-flex gap-2">
      <RouterLink class="btn btn-danger" to="/crear">
        <i class="bi bi-plus-lg"></i> Nueva
      </RouterLink>
      <RouterLink class="btn btn-outline-secondary" to="/">
        <i class="bi bi-house"></i> Inicio
      </RouterLink>
    </div>
  </div>

  <div v-if="error" class="alert alert-danger">{{ error }}</div>

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

  <!-- Resumen -->
  <div class="d-flex justify-content-between align-items-center mb-2">
    <div class="small text-muted">
      Mostrando <strong>{{ filtradas.length }}</strong> de {{ items.length }} rendiciones
      <span v-if="fMoneda !== 'todas'">· Total ({{ fMoneda }}): <strong>{{ totalFiltradoMoneda }}</strong></span>
    </div>
  </div>

  <!-- Tabla responsive -->
  <div class="table-responsive">
    <table class="table table-hover align-middle">
      <thead class="table-light">
        <tr>
          <th>Fecha</th>
          <th>Categoría</th>
          <th>Motivo</th>
          <th class="text-end">Monto</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="x in paginadas" :key="x.id">
          <td class="small text-nowrap">{{ formatFecha(x.fecha) }}</td>
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
          </td>
          <td class="text-end">
            <RouterLink class="btn btn-sm btn-outline-secondary" :to="{ name: 'detalle', params: { id: x.id } }">
              <i class="bi bi-eye"></i> Ver
            </RouterLink>
          </td>
        </tr>
        <tr v-if="!paginadas.length">
          <td colspan="6" class="text-center text-muted py-4">
            No hay resultados con los filtros aplicados.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Paginación simple (client-side) -->
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
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { db } from '@/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const items = ref([])
const error = ref('')
const cargando = ref(true)

// Filtros/orden
const q = ref('')
const fEstado = ref('todos')   // pendiente/aprobada/rechazada/todos
const fMoneda = ref('todas')   // CLP/USD/EUR/UF/todas
const fDesde = ref('')         // yyyy-mm-dd
const fHasta = ref('')         // yyyy-mm-dd
const orden = ref('fecha_desc')

// paginación (client-side)
const pagina = ref(1)
const porPagina = ref(10)

onMounted(() => {
  try {
    const qRef = query(
      collection(db, 'rendiciones'),
      where('userId', '==', auth.uid),
      orderBy('creadoEn', 'desc')
    )
    onSnapshot(qRef, (snap) => {
      items.value = snap.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          ...data,
        }
      })
      cargando.value = false
      pagina.value = 1
    })
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    error.value = 'No fue posible cargar tus rendiciones.'
    cargando.value = false
  }
})

watch([q, fEstado, fMoneda, fDesde, fHasta, orden], () => {
  pagina.value = 1
})

// Helpers de formato
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
  ({ pendiente:'text-bg-warning', aprobada:'text-bg-success', rechazada:'text-bg-danger' }[estado] || 'text-bg-secondary')

// Utils
const inRange = (ts, desde, hasta) => {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    if (desde) { const dd = new Date(desde); if (d < dd) return false }
    if (hasta) { const hh = new Date(hasta); hh.setHours(23,59,59,999); if (d > hh) return false }
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
    // usar fecha (timestamp) y monto numérico
    const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha)
    const dbb = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha)
    const ma = Number(a.monto || 0)
    const mb = Number(b.monto || 0)
    switch (orden.value) {
      case 'fecha_asc':  return da - dbb
      case 'fecha_desc': return dbb - da
      case 'monto_asc':  return ma - mb
      case 'monto_desc': return mb - ma
      default: return dbb - da
    }
  })

  return arr
})

// Total por moneda filtrada (si se selecciona una)
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
const paginadas = computed(() => {
  const start = (pagina.value - 1) * porPagina.value
  return filtradas.value.slice(start, start + porPagina.value)
})

const resetFiltros = () => {
  q.value = ''
  fEstado.value = 'todos'
  fMoneda.value = 'todas'
  fDesde.value = ''
  fHasta.value = ''
  orden.value = 'fecha_desc'
  pagina.value = 1
}
</script>
