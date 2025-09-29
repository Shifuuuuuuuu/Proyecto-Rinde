<!-- eslint-disable vue/multi-word-component-names -->
<!-- eslint-disable vue/no-deprecated-filter -->
<template>
  <div class="container-fluid py-4">
    <!-- HEADER -->
    <div class="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
      <div class="d-flex align-items-center gap-2">
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-outline-secondary btn-sm" @click="router.back()">
            <i class="bi bi-arrow-left"></i> Volver
          </button>
          <h2 class="h5 mb-0">Panel de rendiciones (Admin)</h2>
        </div>
        <span v-if="onlyCurrentMonth" class="badge text-bg-primary">Mes actual</span>
        <span v-else class="badge text-bg-secondary">Todas</span>
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
              <input v-model="search" class="form-control" placeholder="Motivo, empresa, comentario, número..."
                @input="onSearchChange" />
            </div>
          </div>

          <div class="col-6 col-md-2">
            <label class="form-label small">Estado</label>
            <select v-model="estado" class="form-select" @change="reload()">
              <option value="todas">Todas</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>

          <div class="col-6 col-md-3">
            <label class="form-label small">Categoría</label>
            <select v-model="categoria" class="form-select" @change="reload()">
              <option value="todas">Todas</option>
              <option v-for="c in categoriaOpts" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="col-12 col-md-3">
            <label class="form-label small">Solicitante</label>
            <select v-model="solicitante" class="form-select" @change="reload()">
              <option value="todos">Todos</option>
              <option v-for="u in solicitantesOpts" :key="u" :value="u">{{ u }}</option>
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

          <div class="small text-muted">
            <span v-if="onlyCurrentMonth">
              {{ rangoMesInicio | fechaCorta }} – {{ rangoMesFin | fechaCorta }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ALERTAS -->
    <div v-if="error" class="alert alert-danger d-flex align-items-center" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      <div>{{ error }}</div>
    </div>

    <!-- TABLA -->
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
              <th>Estado</th>
              <th class="text-end" style="min-width: 230px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-4">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Cargando rendiciones...
              </td>
            </tr>

            <tr v-for="r in renderRows" :key="r.id">
              <td>
                <div class="fw-semibold">{{ formatFecha(r.fecha) }}</div>
                <small class="text-muted">{{ r.numero ? ('N° ' + r.numero) : '' }}</small>
              </td>
              <td>
                <div class="fw-semibold">{{ r.nombre }}</div>
                <small class="text-muted">{{ r.email || '-' }}</small>
              </td>
              <td>{{ r.empresa || '-' }}</td>
              <td>{{ r.categoria || '-' }}</td>
              <td class="text-end">{{ formatMonto(r.monto) }}</td>
              <td>
                <span :class="['badge', badgeClass(r.estado)]">{{ r.estado || '—' }}</span>
              </td>
              <td class="text-end">
                <div class="btn-group">
                  <button class="btn btn-outline-secondary btn-sm" @click="ver(r)" title="Ver detalle">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-outline-primary btn-sm" @click="editar(r)" title="Editar">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm" @click="eliminar(r)" title="Eliminar">
                    <i class="bi bi-trash"></i>
                  </button>
                  <!-- Estados rápidos -->
                  <button class="btn btn-secondary btn-sm" @click="cambiarEstado(r, 'borrador')" title="Borrador">
                    <i class="bi bi-file-earmark-font"></i>
                  </button>
                  <button class="btn btn-success btn-sm" @click="cambiarEstado(r, 'aprobada')" title="Aprobar">
                    <i class="bi bi-check2-circle"></i>
                  </button>
                  <button class="btn btn-warning btn-sm" @click="cambiarEstado(r, 'pendiente')"
                    title="Marcar pendiente">
                    <i class="bi bi-hourglass-split"></i>
                  </button>
                  <button class="btn btn-danger btn-sm" @click="cambiarEstado(r, 'rechazada')" title="Rechazar">
                    <i class="bi bi-x-octagon"></i>
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

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'

// -------------------- STATE --------------------
const router = useRouter()

const loading = ref(false)
const error = ref('')

// filtros
const onlyCurrentMonth = ref(true)
const estado = ref('todas')
const categoria = ref('todas')
const solicitante = ref('todos')
const search = ref('')

// opciones (se construyen de lo cargado)
const categoriaOpts = ref([])
const solicitantesOpts = ref([])

// paginación
const pageSize = ref(10)
const page = ref(0)
const cursors = ref([])      // stack de lastDoc por página
const hasNextPage = ref(false)

// datos de la página actual (ya filtrados en server por lo grueso)
const rows = ref([])

// rango de mes
const { inicioMes, finMes } = getRangoMesActual()
const rangoMesInicio = ref(inicioMes)
const rangoMesFin = ref(finMes)

// -------------------- HELPERS FECHAS --------------------
function getRangoMesActual() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return { inicioMes: first, finMes: last }
}

// -------------------- FORMATS --------------------
const formatMonto = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n || 0)

const formatFecha = (ts) => {
  try {
    const d = ts?.toDate ? ts.toDate() : (typeof ts === 'number' ? new Date(ts) : (ts || new Date()))
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  } catch { return '-' }
}

const badgeClass = (e) => ({
  pendiente: 'badge rounded-pill text-bg-warning',
  aprobada: 'badge rounded-pill text-bg-success',
  rechazada: 'badge rounded-pill text-bg-danger'
}[e] || 'badge rounded-pill text-bg-secondary')

// -------------------- QUERY BUILDER --------------------
async function fetchPage(opts = { reset: false }) {
  loading.value = true
  error.value = ''
  try {
    if (opts.reset) {
      page.value = 0
      cursors.value = []
    }

    // base query
    const col = collection(db, 'rendiciones')
    const clauses = []

    // rango de fechas por 'creadoEn' (para "mes actual")
    if (onlyCurrentMonth.value) {
      clauses.push(where('creadoEn', '>=', rangoMesInicio.value))
      clauses.push(where('creadoEn', '<=', rangoMesFin.value))
    }

    // filtros exactos en server
    if (estado.value !== 'todas') clauses.push(where('estado', '==', estado.value))
    if (categoria.value !== 'todas') clauses.push(where('categoria', '==', categoria.value))
    if (solicitante.value !== 'todos') {
      // intenta por userId o userEmail según cómo guardes
      // escoge el que tengas garantizado
      clauses.push(where('userEmail', '==', solicitante.value))
    }

    // orden y límite
    let q = query(col, ...clauses, orderBy('creadoEn', 'desc'), limit(pageSize.value))

    // cursor
    if (page.value > 0 && cursors.value[page.value - 1]) {
      q = query(col, ...clauses, orderBy('creadoEn', 'desc'), startAfter(cursors.value[page.value - 1]), limit(pageSize.value))
    }

    const snap = await getDocs(q)
    rows.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    // preparar nextPage
    hasNextPage.value = snap.docs.length === pageSize.value
    if (snap.docs.length > 0) {
      // lastDoc actual para usar como cursor de la siguiente página
      const lastDoc = snap.docs[snap.docs.length - 1]
      cursors.value[page.value] = lastDoc
    }

    // construir opciones (en base a lo que se ve en la página y/o podrías precargar)
    buildOptionsFrom(rows.value)
  } catch (e) {
    console.error(e)
    error.value = 'No fue posible cargar las rendiciones.'
  } finally {
    loading.value = false
  }
}

function buildOptionsFrom(list) {
  // categorías
  const cats = new Set(categoriaOpts.value)
  list.forEach(x => x?.categoria && cats.add(x.categoria))
  categoriaOpts.value = Array.from(cats).sort()

  // solicitantes (uso email si existe; ajusta si prefieres nombre)
  const users = new Set(solicitantesOpts.value)
  list.forEach(x => (x?.userEmail || x?.userName || x?.userId) && users.add(x.userEmail || x.userName || x.userId))
  solicitantesOpts.value = Array.from(users).sort()
}

// -------------------- BUSCADOR (cliente) --------------------
let searchDebounce
function onSearchChange() {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    // búsqueda en cliente sobre la página actual
    // si quieres server-side: guarda 'search' en estado y llama fetchPage({reset:true})
  }, 250)
}

const renderRows = computed(() => {
  const term = (search.value || '').toLowerCase().trim()
  if (!term) return rows.value
  return rows.value.filter(r => {
    const texto = [
      r.motivo, r.empresa, r.comentario, r.numero, r.solicitanteNombre, r.userEmail
    ].filter(Boolean).join(' ').toLowerCase()
    return texto.includes(term)
  })
})

// -------------------- ACCIONES --------------------
async function cambiarEstado(r, nuevo) {
  try {
    await updateDoc(doc(db, 'rendiciones', r.id), { estado: nuevo, _lastUpdate: serverTimestamp() })
    // refresco suave en memoria:
    r.estado = nuevo
  } catch (e) {
    console.error(e)
    error.value = 'Error al actualizar el estado.'
  }
}

async function eliminar(r) {
  const ok = confirm(`¿Eliminar la rendición N° ${r.numero ?? r.id}? Esta acción no se puede deshacer.`)
  if (!ok) return
  try {
    await deleteDoc(doc(db, 'rendiciones', r.id))
    // quita del listado actual
    rows.value = rows.value.filter(x => x.id !== r.id)
  } catch (e) {
    console.error(e)
    error.value = 'No fue posible eliminar la rendición.'
  }
}

function ver(r) {
  // Ajusta el nombre de la ruta y params según tu router
  router.push({ name: 'VerRendicion', params: { id: r.id } })
}

function editar(r) {
  router.push({ name: 'EditarRendicion', params: { id: r.id } })
}

function goUsuarios() {
  // Placeholder para tu futura vista de usuarios
  router.push({ name: 'AdminUsuarios' })
}

// -------------------- PAGINACIÓN --------------------
async function nextPage() {
  if (!hasNextPage.value || loading.value) return
  page.value += 1
  await fetchPage()
}

async function prevPage() {
  if (page.value === 0 || loading.value) return
  page.value -= 1
  await fetchPage()
}

// -------------------- RELOAD / TOGGLES --------------------
async function reload(resetCursors = true) {
  await fetchPage({ reset: resetCursors })
}

function toggleMonth() {
  onlyCurrentMonth.value = !onlyCurrentMonth.value
  if (onlyCurrentMonth.value) {
    const { inicioMes, finMes } = getRangoMesActual()
    rangoMesInicio.value = inicioMes
    rangoMesFin.value = finMes
  }
  reload(true)
}

// watchers útiles
watch(pageSize, () => reload(true))
watch([estado, categoria, solicitante], () => reload(true))

// init
onMounted(() => {
  reload(true)
})
</script>

<script>
// Filtros globales simples (opcional)
export default {
  filters: {
    fechaCorta(v) {
      try {
        return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(v)
      } catch { return '-' }
    },
  },
}
</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}

.card {
  border-radius: 0.5rem;
}

.badge {
  font-weight: 600;
  letter-spacing: .2px;
}

.btn-group .btn {
  white-space: nowrap;
}
</style>
