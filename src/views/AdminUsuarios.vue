<!-- src/views/AdminUsuarios.vue -->
<template>
  <div class="container-fluid py-4">
    <!-- HEADER -->
    <div class="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
      <div class="d-flex align-items-center gap-2">
        <h2 class="h5 mb-0">Administración de usuarios</h2>
        <span class="badge text-bg-secondary">CRUD + filtros + paginación</span>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="reload(true)">
          <i class="bi bi-arrow-clockwise"></i>
          <span class="ms-1">Recargar</span>
        </button>
        <button class="btn btn-primary btn-sm" @click="openCreate()">
          <i class="bi bi-person-plus"></i>
          <span class="ms-1">Agregar usuario</span>
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
              <input
                v-model="search"
                class="form-control"
                placeholder="Nombre o correo..."
                @input="onSearchChange"
              />
            </div>
            <small class="text-muted">Búsqueda en la página actual.</small>
          </div>

          <div class="col-6 col-md-3">
            <label class="form-label small">Rol</label>
            <select v-model="rol" class="form-select" @change="reload(true)">
              <option value="todos">Todos</option>
              <option v-for="r in rolOpts" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>

          <div class="col-6 col-md-2">
            <label class="form-label small">Por página</label>
            <select v-model.number="pageSize" class="form-select" @change="reload(true)">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>

          <div class="col-12 col-md-3 d-flex align-items-end justify-content-md-end">
            <div>
              <div class="small text-muted">Total (página): {{ renderRows.length }} de {{ pageSize }}</div>
              <div class="small text-muted">Página {{ page + 1 }}</div>
            </div>
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
              <th style="min-width: 220px;">Nombre</th>
              <th style="min-width: 220px;">Correo</th>
              <th>Empresa</th>
              <th>Moneda</th>
              <th>Rol</th>
              <th style="min-width: 160px;">Creado</th>
              <th class="text-end" style="min-width: 200px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-4">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Cargando usuarios...
              </td>
            </tr>

            <tr v-for="u in renderRows" :key="u.id">
              <td>
                <div class="fw-semibold">{{ u.nombre || '—' }}</div>
                <small class="text-muted">{{ u.id }}</small>
              </td>
              <td>
                <div class="fw-semibold">{{ u.email || '—' }}</div>
                <small class="text-muted">{{ u.empresa || '—' }}</small>
              </td>
              <td>{{ u.empresa || '—' }}</td>
              <td>{{ u.monedaPref || '—' }}</td>
              <td>
                <span class="badge rounded-pill" :class="badgeRol(u.rol)">{{ u.rol || '—' }}</span>
              </td>
              <td>
                <div>{{ formatFechaHora(u.creadoEn) }}</div>
                <small class="text-muted">{{ formatFecha(u.creadoEn) }}</small>
              </td>
              <td class="text-end">
                <div class="btn-group">
                  <button class="btn btn-outline-primary btn-sm" @click="openEdit(u)" title="Editar">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button class="btn btn-outline-danger btn-sm" @click="remove(u)" title="Eliminar">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!loading && renderRows.length === 0">
              <td colspan="7" class="text-center text-muted py-4">Sin usuarios para mostrar</td>
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

    <!-- MODAL CREAR/EDITAR -->
    <div class="modal fade" id="userModal" tabindex="-1" aria-hidden="true" ref="userModalEl">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editing ? 'Editar usuario' : 'Agregar usuario' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label">Nombre</label>
                <input v-model.trim="form.nombre" type="text" class="form-control" placeholder="Nombre completo" />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label">Correo</label>
                <input v-model.trim="form.email" type="email" class="form-control" placeholder="correo@empresa.com" />
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label">Empresa</label>
                <input v-model.trim="form.empresa" type="text" class="form-control" placeholder="Empresa" />
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">Moneda preferida</label>
                <select v-model="form.monedaPref" class="form-select">
                  <option v-for="m in monedaOpts" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">Rol</label>
                <select v-model="form.rol" class="form-select">
                  <option v-for="r in rolOpts" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" :disabled="saving" @click="save()">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ editing ? 'Guardar cambios' : 'Crear usuario' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Modal } from 'bootstrap' // ✅ IMPORTA EL MODAL DE BOOTSTRAP
import { db } from '@/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'

// ------ STATE ------
const loading = ref(false)
const saving = ref(false)
const error = ref('')

// filtros
const rol = ref('todos')
const search = ref('')

// opciones
const rolOpts = ['admin', 'operador', 'visualizador', 'usuario']
const monedaOpts = ['CLP', 'USD', 'EUR']

// paginación
const pageSize = ref(10)
const page = ref(0)
const cursors = ref([]) // lastDoc por página
const hasNextPage = ref(false)

// datos
const rows = ref([])

// modal refs
const userModalEl = ref(null)
let userModal // instancia Modal de Bootstrap

// formulario
const editing = ref(false)
const editingId = ref(null)
const form = ref({
  nombre: '',
  email: '',
  empresa: 'Xtreme Servicios',
  monedaPref: 'CLP',
  rol: 'usuario',
  creadoEn: null,
})

// ------ HELPERS ------
const formatFecha = (ts) => {
  try {
    const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null)
    if (!d) return '—'
    return new Intl.DateTimeFormat('es-CL').format(d)
  } catch { return '—' }
}

const formatFechaHora = (ts) => {
  try {
    const d = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null)
    if (!d) return '—'
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(d)
  } catch { return '—' }
}

const badgeRol = (r) => ({
  admin: 'text-bg-danger',
  operador: 'text-bg-primary',
  visualizador: 'text-bg-secondary',
  usuario: 'text-bg-success',
}[r] || 'text-bg-dark')

// ------ FETCH (server-side con filtros gruesos) ------
async function fetchPage(opts = { reset: false }) {
  loading.value = true
  error.value = ''
  try {
    if (opts.reset) {
      page.value = 0
      cursors.value = []
    }

    const col = collection(db, 'users')
    const clauses = []

    if (rol.value !== 'todos') clauses.push(where('rol', '==', rol.value))

    let q = query(col, ...clauses, orderBy('creadoEn', 'desc'), limit(pageSize.value))

    if (page.value > 0 && cursors.value[page.value - 1]) {
      q = query(col, ...clauses, orderBy('creadoEn', 'desc'), startAfter(cursors.value[page.value - 1]), limit(pageSize.value))
    }

    const snap = await getDocs(q)
    rows.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    hasNextPage.value = snap.docs.length === pageSize.value
    if (snap.docs.length > 0) {
      const lastDoc = snap.docs[snap.docs.length - 1]
      cursors.value[page.value] = lastDoc
    }
  } catch (e) {
    console.error(e)
    error.value = 'No fue posible cargar los usuarios.'
  } finally {
    loading.value = false
  }
}

// ------ SEARCH (cliente en la página actual) ------
let searchDebounce
function onSearchChange() {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {}, 200)
}

const renderRows = computed(() => {
  const term = (search.value || '').toLowerCase().trim()
  if (!term) return rows.value
  return rows.value.filter(u => {
    const blob = [u.nombre, u.email].filter(Boolean).join(' ').toLowerCase()
    return blob.includes(term)
  })
})

// ------ PAGINACIÓN ------
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

// ------ MODAL ------
function openCreate() {
  editing.value = false
  editingId.value = null
  form.value = {
    nombre: '',
    email: '',
    empresa: 'Xtreme Servicios',
    monedaPref: 'CLP',
    rol: 'usuario',
    creadoEn: null,
  }
  showModal()
}

function openEdit(u) {
  editing.value = true
  editingId.value = u.id
  form.value = {
    nombre: u.nombre || '',
    email: u.email || '',
    empresa: u.empresa || 'Xtreme Servicios',
    monedaPref: u.monedaPref || 'CLP',
    rol: u.rol || 'usuario',
    creadoEn: u.creadoEn || null,
  }
  showModal()
}

function showModal() {
  if (!userModal) {
    userModal = new Modal(userModalEl.value) // ✅ sin ReferenceError
  }
  userModal.show()
}

async function save() {
  // validación sencilla
  if (!form.value.nombre || !form.value.email) {
    error.value = 'Nombre y correo son obligatorios.'
    return
  }

  saving.value = true
  error.value = ''
  try {
    if (editing.value && editingId.value) {
      await updateDoc(doc(db, 'users', editingId.value), {
        nombre: form.value.nombre,
        email: form.value.email,
        empresa: form.value.empresa,
        monedaPref: form.value.monedaPref,
        rol: form.value.rol,
      })
    } else {
      await addDoc(collection(db, 'users'), {
        nombre: form.value.nombre,
        email: form.value.email,
        empresa: form.value.empresa,
        monedaPref: form.value.monedaPref,
        rol: form.value.rol,
        creadoEn: serverTimestamp(),
      })
    }

    if (userModal) userModal.hide()
    await fetchPage({ reset: !editing.value })
  } catch (e) {
    console.error(e)
    error.value = 'No fue posible guardar el usuario.'
  } finally {
    saving.value = false
  }
}

async function remove(u) {
  const ok = confirm(`¿Eliminar al usuario ${u.nombre || u.email}? Esta acción no se puede deshacer.`)
  if (!ok) return
  try {
    await deleteDoc(doc(db, 'users', u.id))
    rows.value = rows.value.filter(x => x.id !== u.id)
  } catch (e) {
    console.error(e)
    error.value = 'No fue posible eliminar el usuario.'
  }
}

// ------ RELOAD / WATCHERS ------
async function reload(reset = false) {
  await fetchPage({ reset })
}

watch(pageSize, () => reload(true))
watch(rol, () => reload(true))

onMounted(async () => {
  // Inicializa instancia del modal si existe el ref
  if (userModalEl.value) {
    userModal = new Modal(userModalEl.value)
  }
  await reload(true)
})
</script>

<style scoped>
.card { border-radius: 1rem; }
.badge { font-weight: 600; letter-spacing: .2px; }
.table td, .table th { vertical-align: middle; }
.btn-group .btn { white-space: nowrap; }
</style>
