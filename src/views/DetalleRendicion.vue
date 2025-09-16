<template>
  <div class="d-flex justify-content-between align-items-center mb-3">
    <div class="d-flex align-items-center gap-2">
      <button class="btn btn-outline-secondary btn-sm" @click="volver">
        <i class="bi bi-arrow-left"></i> Volver
      </button>
      <h2 class="h5 mb-0">Detalle de rendición</h2>
      <span v-if="item" :class="['badge', badgeClass(item.estado)]">{{ item.estado }}</span>
    </div>
    <div class="btn-group">
      <button class="btn btn-outline-secondary btn-sm" @click="copiarId" :disabled="!item">
        <i class="bi bi-clipboard"></i> Copiar ID
      </button>
      <button class="btn btn-outline-secondary btn-sm" @click="imprimir" :disabled="!item">
        <i class="bi bi-printer"></i> Imprimir
      </button>
      <RouterLink class="btn btn-outline-secondary btn-sm" to="/mis-rendiciones">
        <i class="bi bi-journal-text"></i> Mis rendiciones
      </RouterLink>
    </div>
  </div>

  <div v-if="error" class="alert alert-danger">{{ error }}</div>

  <div v-else-if="!item" class="text-center py-5">
    <div class="spinner-border"></div>
  </div>

  <div v-else class="row g-3">
    <!-- Columna izquierda: detalles -->
    <div class="col-12 col-lg-8">
      <div class="card shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div class="text-muted small">Creada</div>
              <div class="fw-semibold">{{ formatFechaHora(item.creadoEn || item.fecha) }}</div>
            </div>
            <div class="text-end">
              <div class="text-muted small">Fecha del gasto</div>
              <div class="fw-semibold">{{ formatFecha(item.fecha) }}</div>
            </div>
          </div>

          <hr />

          <div class="row g-3">
            <div class="col-md-6">
              <div class="border rounded p-3 h-100">
                <div class="text-muted small">Monto</div>
                <div class="fs-4 fw-semibold">{{ formatMoney(item.monto, item.moneda || 'CLP') }}</div>
                <div class="small text-muted">{{ item.moneda || 'CLP' }}</div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="border rounded p-3 h-100">
                <div class="text-muted small">Categoría</div>
                <div class="fw-semibold">{{ item.categoria }}</div>
                <div class="text-muted small mt-2">Empresa</div>
                <div class="fw-semibold">{{ item.empresa || '—' }}</div>
              </div>
            </div>

            <div class="col-12">
              <div class="border rounded p-3">
                <div class="text-muted small">Motivo</div>
                <div class="fw-semibold">{{ item.motivo }}</div>
                <div v-if="item.notas" class="mt-2">
                  <div class="text-muted small">Notas</div>
                  <div>{{ item.notas }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3 d-flex flex-wrap gap-2">
            <button v-if="puedeEditar" @click="cambiarEstado('pendiente')" class="btn btn-outline-warning">
              <i class="bi bi-hourglass-split"></i> Marcar pendiente
            </button>
            <button v-if="auth.esAdmin" @click="cambiarEstado('aprobada')" class="btn btn-success">
              <i class="bi bi-check2-circle"></i> Aprobar
            </button>
            <button v-if="auth.esAdmin" @click="cambiarEstado('rechazada')" class="btn btn-danger">
              <i class="bi bi-x-circle"></i> Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Columna derecha: comprobante -->
    <div class="col-12 col-lg-4">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Comprobante</h6>
            <span v-if="!item.fotoPreview" class="badge text-bg-secondary">Sin imagen</span>
          </div>

          <div v-if="item.fotoPreview" class="border rounded p-2 text-center bg-light">
            <img
              :src="item.fotoPreview"
              alt="Comprobante"
              class="img-fluid rounded"
              style="cursor: zoom-in; max-height: 360px;"
              @click="abrirModalImagen = true"
            />
          </div>
          <div v-else class="text-muted small">
            No se adjuntó imagen. Puedes añadirla al crear nuevas rendiciones.
          </div>

          <div v-if="item.fotoPreview" class="d-flex gap-2 mt-2">
            <a :href="item.fotoPreview" download="comprobante.jpg" class="btn btn-outline-secondary btn-sm w-100">
              <i class="bi bi-download"></i> Descargar
            </a>
            <button class="btn btn-outline-secondary btn-sm w-100" @click="abrirModalImagen = true">
              <i class="bi bi-arrows-fullscreen"></i> Ampliar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal imagen -->
  <div class="modal fade" tabindex="-1" :class="{ show: abrirModalImagen }" style="display: block;" v-if="abrirModalImagen" @click.self="abrirModalImagen=false">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-body p-0">
          <img :src="item.fotoPreview" alt="Comprobante" class="img-fluid w-100" />
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="abrirModalImagen=false">Cerrar</button>
          <a :href="item.fotoPreview" download="comprobante.jpg" class="btn btn-primary">
            Descargar
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { db } from '@/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const item = ref(null)
const error = ref('')
const abrirModalImagen = ref(false)

onMounted(async () => {
  try {
    const snap = await getDoc(doc(db, 'rendiciones', route.params.id))
    if (!snap.exists()) {
      error.value = 'Rendición no encontrada.'
      return
    }
    item.value = { id: snap.id, ...snap.data() }
  } catch (e) {
    error.value = 'Error al cargar.'
  }
})

const puedeEditar = computed(() => auth.esAdmin || item.value?.userId === auth.uid)

const cambiarEstado = async (estado) => {
  try {
    await updateDoc(doc(db, 'rendiciones', item.value.id), { estado })
    item.value.estado = estado
  } catch {
    error.value = 'No se pudo actualizar el estado.'
  }
}

// --- acciones header ---
const volver = () => router.back()
const copiarId = async () => {
  try {
    await navigator.clipboard.writeText(item.value?.id || '')
  } catch {}
}
const imprimir = () => window.print()

// --- helpers de formato ---
const formatFecha = (ts) => {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    return new Intl.DateTimeFormat('es-CL').format(d)
  } catch { return '-' }
}
const formatFechaHora = (ts) => {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(d)
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
</script>

<style scoped>
/* Mejora visual del modal sin depender de JS de Bootstrap en SPA */
.modal.show { display: block; background: rgba(0,0,0,.5); }
</style>
