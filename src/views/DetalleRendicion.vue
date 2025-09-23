<template>
  <!-- Header (no se imprime) -->
  <div class="d-flex align-items-center justify-content-between mb-3 no-print flex-wrap gap-2">
    <div class="d-flex align-items-center gap-2 flex-wrap">
      <button class="btn btn-outline-secondary btn-sm" @click="volver">
        <i class="bi bi-arrow-left"></i> Volver
      </button>
      <h2 class="h5 mb-0 text-truncate" style="max-width: 60vw;">Detalle de rendición</h2>
      <span v-if="item" :class="['badge', badgeClass(item.estado)]">{{ item.estado }}</span>
    </div>

    <div class="btn-group btn-group-sm w-auto w-sm-auto d-flex flex-column flex-sm-row gap-2 gap-sm-0">
      <button class="btn btn-outline-secondary" @click="imprimir" :disabled="!item">
        <i class="bi bi-printer"></i> Imprimir
      </button>
      <RouterLink class="btn btn-outline-secondary" to="/mis-rendiciones">
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

          <!-- Encabezado con logo + estado (sí se imprime) -->
          <div class="d-flex justify-content-between align-items-start mb-3">
            <img :src="logoUrl" alt="Xtreme" class="xtreme-logo" />
            <span :class="['badge', badgeClass(item.estado)]">{{ item.estado }}</span>
          </div>

          <!-- Fechas -->
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

          <!-- Datos principales -->
          <div class="row g-3">
            <div class="col-12 col-sm-6">
              <div class="border rounded p-3 h-100">
                <div class="text-muted small">Monto</div>
                <div class="fs-4 fw-semibold">{{ formatMoney(item.monto, item.moneda || 'CLP') }}</div>
                <div class="small text-muted">{{ item.moneda || 'CLP' }}</div>
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <div class="border rounded p-3 h-100">
                <div class="text-muted small">Categoría</div>
                <div class="fw-semibold">{{ item.categoria || '—' }}</div>
                <div class="text-muted small mt-2">Empresa</div>
                <div class="fw-semibold">{{ item.empresa || '—' }}</div>
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <div class="border rounded p-3 h-100">
                <div class="text-muted small">Folio / N° documento</div>
                <div class="fw-semibold">{{ item.folio || '—' }}</div>
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <div class="border rounded p-3 h-100">
                <div class="text-muted small">Usuario</div>
                <div class="fw-semibold">{{ item.nombre || '—' }}</div>
                <div class="small text-muted">{{ item.email || '—' }}</div>
              </div>
            </div>

            <div class="col-12">
              <div class="border rounded p-3">
                <div class="text-muted small">Motivo</div>
                <div class="fw-semibold">{{ item.motivo }}</div>
                <div v-if="item.notas" class="mt-2">
                  <div class="text-muted small">Notas</div>
                  <div style="white-space: pre-wrap">{{ item.notas }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Decisión / Respuesta del aprobador -->
          <div class="mt-3">
            <div class="border rounded p-3 decision-box">
              <div class="d-flex justify-content-between align-items-start">
                <h6 class="mb-2">
                  {{ decisionInfo.titulo }}
                </h6>
                <span :class="['badge', badgeClass(item.estado)]">{{ item.estado }}</span>
              </div>

              <div v-if="decisionInfo.tieneDecision" class="row g-2">
                <div class="col-12 col-sm-4">
                  <div class="text-muted small">{{ decisionInfo.labelPor }}</div>
                  <div class="fw-semibold">{{ decisionInfo.por || '—' }}</div>
                </div>
                <div class="col-12 col-sm-4">
                  <div class="text-muted small">Fecha</div>
                  <div class="fw-semibold">{{ formatFechaHora(decisionInfo.en) }}</div>
                </div>
                <div class="col-12">
                  <div class="text-muted small mt-2">Comentario</div>
                  <div style="white-space: pre-wrap">{{ decisionInfo.comentario || '—' }}</div>
                </div>
              </div>

              <div v-else class="text-muted">
                Aún no hay respuesta del aprobador.
              </div>
            </div>
          </div>

          <!-- Acciones (SIN "Marcar pendiente") -->
          <div class="mt-3 d-flex flex-wrap gap-2 no-print">
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
      <div class="card shadow-sm h-100 image-card">
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

          <div v-if="item.fotoPreview" class="d-flex gap-2 mt-2 no-print flex-column flex-sm-row">
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

  <!-- Modal imagen (no imprime) -->
  <div
    class="modal fade no-print"
    tabindex="-1"
    :class="{ show: abrirModalImagen }"
    style="display: block;"
    v-if="abrirModalImagen"
    @click.self="abrirModalImagen=false"
  >
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
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { db } from '@/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const item = ref(null)
const error = ref('')
const abrirModalImagen = ref(false)

/** Logo: coloca el archivo en /public o ajusta la ruta */
const logoUrl = '/Logo XT Servicios.png'

onMounted(async () => {
  try {
    const snap = await getDoc(doc(db, 'rendiciones', route.params.id))
    if (!snap.exists()) {
      error.value = 'Rendición no encontrada.'
      return
    }
    item.value = { id: snap.id, ...snap.data() }
  } catch (e) {
    console.error(e)
    error.value = 'Error al cargar.'
  }
})

/** Info de decisión que se imprime bonita */
const decisionInfo = computed(() => {
  const it = item.value || {}
  const estado = it.estado || 'pendiente'
  if (estado === 'aprobada') {
    return {
      titulo: 'Decisión del aprobador',
      labelPor: 'Aprobado por',
      por: it.aprobadoPor || it.revisadoPor || '—',
      comentario: it.comentarioAprob || it.comentario || '',
      en: it.aprobadoEn || it.actualizadoEn || it.creadoEn,
      tieneDecision: true
    }
  }
  if (estado === 'rechazada') {
    return {
      titulo: 'Decisión del aprobador',
      labelPor: 'Rechazado por',
      por: it.rechazadoPor || '—',
      comentario: it.comentarioRechazo || '',
      en: it.rechazadoEn || it.actualizadoEn || it.creadoEn,
      tieneDecision: true
    }
  }
  return {
    titulo: 'Decisión del aprobador',
    labelPor: '—',
    por: '',
    comentario: '',
    en: it.actualizadoEn || it.creadoEn,
    tieneDecision: false
  }
})

/** Cambiar estado (solo admin) */
const cambiarEstado = async (estado) => {
  try {
    const updates = { estado, actualizadoEn: serverTimestamp() }
    await updateDoc(doc(db, 'rendiciones', item.value.id), updates)
    item.value = { ...item.value, ...updates }
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo actualizar el estado.'
  }
}

// Navegación header
const volver = () => router.back()

// --- Impresión: blanquea temporalmente el título del documento ---
let originalTitle = document.title
const beforePrint = () => {
  originalTitle = document.title
  document.title = ' '
}
const afterPrint = () => {
  document.title = originalTitle
}
onMounted(() => {
  window.addEventListener('beforeprint', beforePrint)
  window.addEventListener('afterprint', afterPrint)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeprint', beforePrint)
  window.removeEventListener('afterprint', afterPrint)
})

const imprimir = () => {
  beforePrint()
  window.print()
  setTimeout(afterPrint, 1500)
}

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
/* Logo en la vista */
.xtreme-logo { height: 50px; width: auto; }

/* Modal en SPA */
.modal.show { display: block; background: rgba(0,0,0,.5); }

/* ======= RESPONSIVE (≤576px) ======= */
@media (max-width: 576px) {
  /* Títulos y badges un poco más chicos */
  .h5 { font-size: 1rem; }
  .badge { font-size: .75rem; }

  /* Logo más pequeño y que no rompa el layout */
  .xtreme-logo { height: 36px; max-width: 50vw; object-fit: contain; }

  /* Cards: menos padding para ganar espacio */
  .card .card-body { padding: .75rem; }

  /* Bloques internos: algo menos de padding */
  .row.g-3 > [class*="col-"] .border.p-3 { padding: .75rem !important; }

  /* Imagen del comprobante: alto relativo a la ventana */
  .image-card img { max-height: 52vh !important; object-fit: contain; }

  /* Grupo de botones del header apilados (por si utilidades no aplican) */
  .btn-group { width: 100%; }
  .btn-group .btn,
  .btn-group a.btn { width: 100%; }

  /* Fechas: apilar y alinear a la izquierda */
  .d-flex.justify-content-between.align-items-start.mb-2 {
    flex-direction: column;
    gap: .25rem;
  }
  .d-flex.justify-content-between.align-items-start.mb-2 .text-end {
    text-align: left !important;
  }

  /* Evitar cortes feos en decisiones y tarjetas */
  .decision-box { break-inside: avoid; }
}

/* ======= Modal: fullscreen en móvil ======= */
@media (max-width: 576px) {
  .modal-dialog.modal-lg {
    max-width: 100%;
    width: 100%;
    margin: 0;
    height: 100%;
  }
  .modal-content {
    height: 100%;
    border-radius: 0;
  }
  .modal-body { padding: 0; }
  .modal-body img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    max-height: none;
  }
}

/* ======= IMPRESIÓN ======= */
@media print {
  :host { display: block; }
  .no-print, .btn, .btn-group, .modal, .modal * { display: none !important; }

  /* Oculta navbar / header / footer del layout global al imprimir */
  :global(header), :global(nav), :global(.navbar),
  :global(.app-header), :global(.navbar-brand),
  :global(footer), :global(.app-footer) { display: none !important; }

  @page { size: A4; margin: 12mm; }

  /* Una sola columna en papel */
  .row { display: block !important; }
  .col-12, .col-lg-8, .col-lg-4 {
    width: 100% !important; max-width: 100% !important; display: block !important;
  }

  .card, .border, .rounded, .shadow-sm {
    box-shadow: none !important; border: 1px solid #bbb !important;
  }

  .xtreme-logo { height: 26px; }

  .decision-box { break-inside: avoid; }

  .image-card {
    break-before: page; page-break-before: always;
  }
  .image-card img {
    max-height: 300vh !important; object-fit: contain !important;
  }
}
</style>
