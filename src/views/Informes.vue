<!-- eslint-disable vue/multi-word-component-names -->
<!-- eslint-disable vue/require-toggle-inside-transition -->
<template>
  <!-- Header -->
  <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
    <h2 class="h5 mb-0">Informes</h2>
    <div class="d-flex gap-2">
      <button class="btn btn-outline-secondary btn-sm" @click="volver">
        <i class="bi bi-arrow-left"></i> Volver
      </button>
      <RouterLink class="btn btn-outline-secondary" to="/">
        <i class="bi bi-house"></i> Inicio
      </RouterLink>
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
            <input v-model.trim="q" type="text" class="form-control" placeholder="Título, nota..." />
          </div>
          <div class="form-text">Busca en el título y la nota.</div>
        </div>

        <div class="col-6 col-lg-2">
          <label class="form-label">Estado</label>
          <select v-model="fEstado" class="form-select">
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="parcial">Parcial</option>
            <option value="rechazado">Rechazado</option>
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
            <option value="titulo_asc">Título A→Z</option>
            <option value="titulo_desc">Título Z→A</option>
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
          Mostrando <strong>{{ filtradas.length }}</strong> de {{ items.length }} informes
        </div>
      </div>

      <!-- Tabla -->
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Fecha</th>
              <th>Título</th>
              <th class="d-none d-md-table-cell">Nota</th>
              <th class="text-center">Rendiciones</th>
              <th>Estado</th>
              <th class="text-end">Totales (por moneda)</th>
              <th class="text-end"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="x in paginadas" :key="x.id">
              <td class="small text-nowrap">{{ formatFecha(x.creadoEn) }}</td>
              <td class="fw-semibold">{{ x.titulo || '(Sin título)' }}</td>
              <td class="d-none d-md-table-cell text-truncate" style="max-width: 360px;">{{ x.nota || '—' }}</td>
              <td class="text-center">{{ x.rendicionIds?.length || 0 }}</td>
              <td>
                <span :class="['badge', badgeClass(x.estado)]">{{ x.estado }}</span>
              </td>
              <td class="text-end">
                <div v-if="x.totalesPorMoneda" class="small">
                  <div v-for="(monto, code) in x.totalesPorMoneda" :key="code">
                    <span class="text-muted">{{ code }}:</span> <strong>{{ formatMoney(monto, code) }}</strong>
                  </div>
                </div>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="text-end">
                <RouterLink class="btn btn-sm btn-outline-secondary"
                  :to="{ name: 'informeDetalle', params: { id: x.id } }">
                  <i class="bi bi-eye"></i> Ver
                </RouterLink>
              </td>
            </tr>

            <tr v-if="!paginadas.length">
              <td colspan="7" class="text-center text-muted py-4">No hay resultados con los filtros aplicados.</td>
            </tr>
          </tbody>
        </table>
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
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
// para volver atrás en el historial
const router = useRouter()
const volver = () => router.back()

const auth = useAuthStore()
const items = ref([])
const error = ref('')
const cargando = ref(true)

// filtros
const q = ref('')
const fEstado = ref('todos')
const fDesde = ref('')
const fHasta = ref('')
const orden = ref('fecha_desc')

// paginación
const pagina = ref(1)
const porPagina = ref(10)

onMounted(() => {
  try {
    const qRef = query(
      collection(db, 'informes'),
      where('userId', '==', auth.uid),
      orderBy('creadoEn', 'desc')
    )
    onSnapshot(qRef, snap => {
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      cargando.value = false
      pagina.value = 1
    })
  } catch (e) {
    console.error(e)
    error.value = 'No fue posible cargar tus informes.'
    cargando.value = false
  }
})

watch([q, fEstado, fDesde, fHasta, orden], () => { pagina.value = 1 })

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
const badgeClass = (estado) => ({
  pendiente: 'text-bg-warning',
  aprobado: 'text-bg-success',
  parcial: 'text-bg-info',
  rechazado: 'text-bg-danger'
}[estado] || 'text-bg-secondary')

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
  const estado = fEstado.value
  const desde = fDesde.value
  const hasta = fHasta.value

  let arr = items.value.filter(x => {
    const texto = `${x.titulo || ''} ${x.nota || ''}`.toLowerCase()
    const matchTexto = !queryText || texto.includes(queryText)
    const matchEstado = estado === 'todos' || x.estado === estado
    const matchFecha = inRange(x.creadoEn, desde, hasta)
    return matchTexto && matchEstado && matchFecha
  })

  arr.sort((a, b) => {
    const da = a.creadoEn?.toDate ? a.creadoEn.toDate() : new Date(a.creadoEn)
    const dbb = b.creadoEn?.toDate ? b.creadoEn.toDate() : new Date(b.creadoEn)
    switch (orden.value) {
      case 'fecha_asc': return da - dbb
      case 'fecha_desc': return dbb - da
      case 'titulo_asc': return (a.titulo || '').localeCompare(b.titulo || '')
      case 'titulo_desc': return (b.titulo || '').localeCompare(a.titulo || '')
      default: return dbb - da
    }
  })

  return arr
})

const totalPaginas = computed(() => Math.max(1, Math.ceil(filtradas.value.length / porPagina.value)))
const paginadas = computed(() => filtradas.value.slice((pagina.value - 1) * porPagina.value, pagina.value * porPagina.value))

const resetFiltros = () => {
  q.value = ''; fEstado.value = 'todos'; fDesde.value = ''; fHasta.value = ''; orden.value = 'fecha_desc'; pagina.value = 1
}
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}
</style>
