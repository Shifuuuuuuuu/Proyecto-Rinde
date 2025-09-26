<!-- src/views/AprobadorInformes.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="container py-3">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="router.back()">
          <i class="bi bi-arrow-left"></i> Volver
        </button>
        <h2 class="h5 mb-0">Aprobador · Informes</h2>
      </div>
      <div class="d-flex gap-2">
        <RouterLink class="btn btn-outline-secondary btn-sm" :to="{ name: 'aprobador.rendiciones' }">
          <i class="bi bi-list-check"></i> Ver por rendiciones
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
              <input v-model.trim="q" type="text" class="form-control" placeholder="Título o nota del informe..." />
            </div>
            <div class="form-text">Coincide con título y nota.</div>
          </div>

          <div class="col-6 col-lg-2">
            <label class="form-label">Estado</label>
            <select v-model="fEstado" class="form-select">
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="parcial">Parcial</option>
              <option value="rechazado">Rechazado</option>
              <option value="devuelto">Devuelto</option>
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
              <option value="fecha_desc">Fecha ↓</option>
              <option value="fecha_asc">Fecha ↑</option>
              <option value="titulo_asc">Título A→Z</option>
              <option value="titulo_desc">Título Z→A</option>
            </select>
          </div>
        </div>

        <div class="d-flex flex-wrap gap-2 mt-3">
          <button class="btn btn-outline-secondary" @click="reset">
            <i class="bi bi-arrow-counterclockwise"></i> Reset
          </button>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="row g-3 mb-3">
      <div class="col-6 col-md-3" v-for="(k, key) in kpis" :key="key">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <div class="text-muted small text-capitalize">{{ key }}</div>
            <div class="fs-4 fw-semibold">{{ k }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card shadow-sm mb-3">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Fecha</th>
                <th>Título</th>
                <th class="d-none d-md-table-cell">Nota</th>
                <th class="text-center"># Rendiciones</th>
                <th>Estado</th>
                <th class="text-end">Totales</th>
                <th class="text-end"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="x in paginadas" :key="x.id" @click="ver(x.id)" style="cursor:pointer">
                <td class="small text-nowrap">{{ formatFecha(x.creadoEn) }}</td>
                <td class="fw-semibold">{{ x.titulo || '(Sin título)' }}</td>
                <td class="d-none d-md-table-cell text-truncate" style="max-width: 360px;">{{ x.nota || '—' }}</td>
                <td class="text-center">{{ x.rendicionIds?.length || 0 }}</td>
                <td><span :class="['badge', badgeClass(x.estado)]">{{ x.estado }}</span></td>
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
                    :to="{ name: 'aprobadorInforme', params: { id: x.id } }" @click.stop>
                    <i class="bi bi-eye"></i> Revisar
                  </RouterLink>
                </td>
              </tr>
              <tr v-if="!paginadas.length">
                <td colspan="7" class="text-center text-muted py-4">Sin resultados con los filtros.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación simple (client) -->
        <div class="d-flex justify-content-between align-items-center mt-2" v-if="filtradas.length">
          <div class="small text-muted">Mostrando {{ paginadas.length }} de {{ filtradas.length }}</div>
          <div class="btn-group">
            <button class="btn btn-outline-secondary btn-sm" @click="pagina--" :disabled="pagina <= 1"><i
                class="bi bi-chevron-left"></i></button>
            <button class="btn btn-outline-secondary btn-sm" @click="pagina++" :disabled="pagina >= totalPaginas"><i
                class="bi bi-chevron-right"></i></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { db } from '@/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const items = ref([])
const error = ref('')

/* Filtros UI */
const q = ref('')
const fEstado = ref('todos')
const fDesde = ref('')
const fHasta = ref('')
const orden = ref('fecha_desc')

/* paginación */
const pagina = ref(1)
const porPagina = ref(12)

/* rol */
const rol = computed(() => auth.perfil?.rol || auth.rol || 'rendidor')
const esAprobadorOAdmin = computed(() => rol.value === 'aprobador' || rol.value === 'admin')

onMounted(() => {
  try {
    // Si es aprobador o admin: ve TODOS los informes
    // Si es rendidor: solo los suyos
    const base = collection(db, 'informes')
    const qRef = esAprobadorOAdmin.value
      ? query(base, orderBy('creadoEn', 'desc'))
      : query(base, where('userId', '==', auth.uid), orderBy('creadoEn', 'desc'))

    onSnapshot(qRef, (snap) => {
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      pagina.value = 1
    })
  } catch (e) {
    console.error(e)
    error.value = 'No fue posible cargar los informes.'
  }
})

watch([q, fEstado, fDesde, fHasta, orden], () => { pagina.value = 1 })

/* helpers */
const inRange = (ts, desde, hasta) => {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    if (desde) { const dd = new Date(desde); if (d < dd) return false }
    if (hasta) { const hh = new Date(hasta); hh.setHours(23, 59, 59, 999); if (d > hh) return false }
    return true
  } catch { return true }
}

const filtradas = computed(() => {
  const text = q.value.toLowerCase()

  return items.value
    // ⛔️ no mostrar informes devueltos
    .filter(x => (x.estado || '').toLowerCase() !== 'devuelto')
    // filtros existentes
    .filter(x => {
      const t = `${x.titulo || ''} ${x.nota || ''}`.toLowerCase()
      const matchText = !text || t.includes(text)
      const matchEstado = fEstado.value === 'todos' || x.estado === fEstado.value
      const matchFecha = inRange(x.creadoEn, fDesde.value, fHasta.value)
      return matchText && matchEstado && matchFecha
    })
    .sort((a, b) => {
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
})


const totalPaginas = computed(() => Math.max(1, Math.ceil(filtradas.value.length / porPagina.value)))
const paginadas = computed(() => filtradas.value.slice((pagina.value - 1) * porPagina.value, pagina.value * porPagina.value))

const kpis = computed(() => {
  const count = (s) => filtradas.value.filter(x => x.estado === s).length
  return {
    pendientes: count('pendiente'),
    aprobados: count('aprobado'),
    parciales: count('parcial'),
    rechazados: count('rechazado'),
  }
})

const reset = () => {
  q.value = ''
  fEstado.value = 'todos'
  fDesde.value = ''
  fHasta.value = ''
  orden.value = 'fecha_desc'
}

const ver = (id) => {
  const inf = items.value.find(i => i.id === id)
  if (!inf) return

  // Si el informe está devuelto, no permitir abrir el detalle
  if ((inf.estado || '').toLowerCase() === 'devuelto') {
    // Opcional: muestra feedback
    // alert('Este informe fue devuelto al rendidor y no se puede revisar.');
    return
  }

  router.push({ name: 'aprobadorInforme', params: { id } })
}



const formatFecha = (ts) => {
  try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return new Intl.DateTimeFormat('es-CL').format(d) } catch { return '-' }
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
  rechazado: 'text-bg-danger',
  devuelto: 'text-bg-secondary'
}[estado] || 'text-bg-secondary')
</script>
