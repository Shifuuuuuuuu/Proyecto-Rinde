<template>
  <div class="card shadow-sm">
    <div class="card-body">
      <!-- Header -->
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h2 class="h5 mb-1">Nueva rendición</h2>
          <p class="text-muted mb-0">Registra un gasto con su detalle y (opcional) una foto del comprobante.</p>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="volver">
            <i class="bi bi-arrow-left me-1"></i> Volver
          </button>
          <RouterLink to="/mis-rendiciones" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-journal-text me-1"></i> Mis rendiciones
          </RouterLink>
        </div>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="guardar" class="needs-validation" novalidate>
        <div class="row g-3">
          <!-- Monto + Moneda -->
          <div class="col-md-4">
            <label class="form-label">Monto</label>
            <div class="input-group">
              <span class="input-group-text">{{ simboloMoneda }}</span>
              <input
                v-model.number="monto"
                @blur="normalizarMonto"
                :step="stepMoneda"
                :min="0"
                type="number"
                inputmode="decimal"
                class="form-control"
                required
              />
            </div>
            <div class="form-text">Ej.: 12500 para CLP, 12.50 para USD/EUR, 1.2 para UF</div>
          </div>

          <div class="col-md-4">
            <label class="form-label">Moneda</label>
            <select v-model="moneda" class="form-select" @change="syncStep" required>
              <option value="CLP">CLP — Peso chileno</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="UF">UF — Unidad de Fomento</option>
            </select>
            <div class="form-text">Solo se guarda el monto con su moneda (sin conversión automática).</div>
          </div>

          <div class="col-md-4">
            <label class="form-label">Fecha del gasto</label>
            <input v-model="fecha" type="date" class="form-control" required />
          </div>

          <div class="col-md-6">
            <label class="form-label">Categoría</label>
            <select v-model="categoria" class="form-select" required>
              <option disabled value="">Selecciona...</option>
              <option>Transporte</option>
              <option>Alimentación</option>
              <option>Alojamiento</option>
              <option>Insumos</option>
              <option>Otros</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Motivo</label>
            <input v-model="motivo" class="form-control" required placeholder="Ej: Taxi a reunión con cliente" />
          </div>

          <div class="col-12">
            <label class="form-label">Notas (opcional)</label>
            <textarea v-model="notas" class="form-control" rows="2" placeholder="Detalle adicional, centro de costo, etc."></textarea>
          </div>

          <!-- Foto del comprobante (opcional) -->
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center">
              <label class="form-label mb-0">Foto del comprobante (opcional)</label>
              <small class="text-muted">Se guardará una miniatura. Para archivos completos activaremos Storage.</small>
            </div>

            <div class="row g-3 mt-1">
              <div class="col-md-7">
                <div class="input-group">
                  <input
                    ref="fileInput"
                    @change="onFile"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    class="form-control"
                  />
                  <button type="button" class="btn btn-outline-secondary" @click="limpiarFoto" :disabled="!fotoPreview">
                    <i class="bi bi-x-circle"></i>
                    Quitar
                  </button>
                </div>
                <div class="form-text">JPG/PNG; se comprime a máx. 1280px para la miniatura.</div>
              </div>

              <div class="col-md-5" v-if="fotoPreview">
                <div class="border rounded p-2 d-flex align-items-center justify-content-center bg-light">
                  <img :src="fotoPreview" alt="Vista previa" class="img-fluid rounded" style="max-height: 220px;" />
                </div>
                <div class="small text-muted mt-1">Vista previa</div>
              </div>
            </div>
          </div>

          <!-- Vista previa de formato -->
          <div class="col-12">
            <div class="alert alert-light border d-flex justify-content-between align-items-center">
              <div>
                <div class="small text-muted">Vista previa del monto</div>
                <div class="fw-semibold">{{ previewMonto }}</div>
              </div>
              <!-- Reemplaza :class="['badge', badgeClass('pendiente')]" por: -->
              <span class="badge text-bg-warning">pendiente</span>
            </div>
          </div>

          <!-- Sugerencias / políticas -->
          <div class="col-12">
            <div class="alert alert-secondary py-2">
              <ul class="mb-0 ps-3">
                <li>Revisa la categoría y la moneda antes de guardar.</li>
                <li>Asegúrate de que la fecha coincida con el comprobante.</li>
                <li>Montos altos podrían requerir aprobación adicional.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-danger" :disabled="cargando">
            <span v-if="!cargando"><i class="bi bi-check2-circle me-1"></i> Guardar</span>
            <span v-else class="spinner-border spinner-border-sm"></span>
          </button>
          <button class="btn btn-outline-secondary" type="button" @click="limpiarFormulario" :disabled="cargando">
            Limpiar
          </button>
        </div>

        <!-- Mensajes -->
        <p v-if="error" class="text-danger small mt-3">{{ error }}</p>
        <p v-if="ok" class="text-success small mt-3">¡Rendición creada!</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/firebase'
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'

const auth = useAuthStore()
const router = useRouter()

// Campos del formulario
const monto = ref(null)
const moneda = ref('CLP')
const categoria = ref('')
const motivo = ref('')
const notas = ref('')
const fecha = ref('')

// Foto (miniatura base64 para Firestore)
const fileInput = ref(null)
const fotoPreview = ref(null) // dataURL comprimido

// Estado UI
const cargando = ref(false)
const error = ref('')
const ok = ref(false)

// --- UI helpers ---
const simboloMoneda = computed(() => ({
  CLP: '$', USD: '$', EUR: '€', UF: 'UF'
}[moneda.value] || '$'))

const stepMoneda = ref(100) // por defecto CLP
const syncStep = () => {
  // CLP: entero/centena; USD/EUR/UF: 2 decimales
  stepMoneda.value = (moneda.value === 'CLP') ? 100 : 0.01
}
syncStep()

const formatMoney = (value, code) => {
  const n = Number(value || 0)
  if (code === 'CLP') {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
  }
  if (code === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  }
  if (code === 'EUR') {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
  }
  if (code === 'UF') {
    // UF no es divisa ISO; se muestra como "UF 12,34"
    return `UF ${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`
  }
  return n
}

const previewMonto = computed(() => formatMoney(monto.value, moneda.value))

const normalizarMonto = () => {
  if (monto.value == null || monto.value === '') return
  let n = Number(monto.value)
  if (Number.isNaN(n) || n < 0) n = 0
  // Redondeo según moneda
  if (moneda.value === 'CLP') n = Math.round(n) // sin decimales
  else n = Math.round(n * 100) / 100
  monto.value = n
}

const volver = () => router.back()

const limpiarFoto = () => {
  fotoPreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const limpiarFormulario = () => {
  monto.value = null
  moneda.value = 'CLP'
  categoria.value = ''
  motivo.value = ''
  notas.value = ''
  fecha.value = ''
  limpiarFoto()
  ok.value = false
  error.value = ''
  syncStep()
}

const onFile = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    fotoPreview.value = await compressImageToDataURL(file, { maxW: 1280, maxH: 1280, quality: 0.7 })
  } catch (err) {
    console.error(err)
    error.value = 'No pudimos procesar la imagen.'
    limpiarFoto()
  }
}

/** Comprime imagen a dataURL (JPEG/PNG) */
const compressImageToDataURL = (file, { maxW = 1280, maxH = 1280, quality = 0.8 } = {}) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = () => {
      img.onload = () => {
        const { width, height } = img
        const ratio = Math.min(maxW / width, maxH / height, 1)
        const w = Math.round(width * ratio)
        const h = Math.round(height * ratio)

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)

        const isPng = file.type.includes('png')
        const mime = isPng ? 'image/png' : 'image/jpeg'
        const dataURL = canvas.toDataURL(mime, isPng ? undefined : quality)

        const approxBytes = Math.ceil((dataURL.length * 3) / 4)
        if (approxBytes > 250 * 1024) return reject(new Error('La miniatura quedó muy grande. Intenta otra foto.'))

        resolve(dataURL)
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const guardar = async () => {
  error.value = ''
  ok.value = false
  cargando.value = true
  try {
    if (!auth.uid) throw new Error('No hay sesión activa.')

    const docData = {
      userId: auth.uid,
      empresa: auth.perfil?.empresa || null,
      monto: Number(monto.value || 0),
      moneda: moneda.value,
      categoria: categoria.value,
      motivo: (motivo.value || '').trim(),
      notas: (notas.value || '').trim() || null,
      fecha: Timestamp.fromDate(new Date(fecha.value)),
      estado: 'pendiente',
      creadoEn: serverTimestamp(),
      fotoPreview: fotoPreview.value || null,
    }

    await addDoc(collection(db, 'rendiciones'), docData)
    limpiarFormulario()
    ok.value = true
  } catch (e) {
    console.error(e)
    error.value = e.message || 'No se pudo guardar la rendición.'
  } finally {
    cargando.value = false
  }
}
</script>
