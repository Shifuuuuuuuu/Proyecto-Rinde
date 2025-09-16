<template>
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1 class="h5 mb-0">Mi perfil</h1>
    <RouterLink class="btn btn-outline-secondary" to="/">
      <i class="bi bi-house"></i> Inicio
    </RouterLink>
  </div>

  <!-- Mensajes -->
  <div v-if="ok" class="alert alert-success d-flex align-items-center">
    <i class="bi bi-check-circle me-2"></i> Tus cambios fueron guardados.
  </div>
  <div v-if="error" class="alert alert-danger d-flex align-items-center">
    <i class="bi bi-exclamation-triangle me-2"></i> {{ error }}
  </div>

  <div class="card shadow-sm">
    <div class="card-body">
      <!-- Encabezado compacto -->
      <div class="d-flex align-items-center gap-3 flex-wrap mb-3">
        <div class="position-relative">
          <img
            v-if="avatarPreview"
            :src="avatarPreview"
            class="avatar-img"
            alt="Foto de perfil"
          />
          <div v-else class="avatar-initials-lg">{{ avatarIniciales }}</div>
        </div>

        <div class="flex-grow-1">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <h2 class="h5 mb-0">{{ displayNombre }}</h2>
            <span v-if="auth.esAdmin" class="badge bg-dark">Admin</span>
          </div>
          <div class="text-muted small">
            {{ auth.user?.email }}
            <span class="mx-2">•</span>
            {{ original.empresa || 'Sin empresa' }}
          </div>
        </div>

        <div class="text-end">
          <RouterLink to="/cuenta/cambiar-password" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-key me-1"></i> Cambiar contraseña
          </RouterLink>
        </div>
      </div>

      <!-- Form único -->
      <form @submit.prevent="guardar" class="row g-3">

        <!-- Foto de perfil -->
        <div class="col-12">
          <label class="form-label">Foto de perfil</label>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <div class="input-group" style="max-width: 420px;">
              <input
                ref="fileInput"
                class="form-control"
                type="file"
                accept="image/*"
                capture="environment"
                @change="onFile"
              />
              <button class="btn btn-outline-secondary" type="button" @click="quitarFoto" :disabled="!avatarPreview && !original.fotoPerfil">
                Quitar
              </button>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <label class="form-label">Nombre completo</label>
          <input v-model.trim="form.nombre" class="form-control" placeholder="Tu nombre" />
        </div>

        <div class="col-12 col-md-6">
          <label class="form-label">Empresa</label>
          <input v-model.trim="form.empresa" class="form-control" placeholder="Opcional" />
        </div>

        <div class="col-12 col-md-6">
          <label class="form-label">Moneda preferida</label>
          <select v-model="form.monedaPref" class="form-select">
            <option value="CLP">CLP (Peso chileno)</option>
            <option value="USD">USD (Dólar)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="UF">UF</option>
          </select>
          <div class="form-text">Se usa por defecto en creación de rendiciones y reportes.</div>
        </div>

        <div class="col-12">
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-danger" :disabled="!hasChanges || cargando">
              <span v-if="!cargando"><i class="bi bi-save me-1"></i> Guardar cambios</span>
              <span v-else class="spinner-border spinner-border-sm"></span>
            </button>
            <button type="button" class="btn btn-outline-secondary" @click="deshacer" :disabled="!hasChanges || cargando">
              Deshacer
            </button>
          </div>
          <div v-if="!hasChanges" class="small text-muted mt-2">
            No hay cambios por guardar.
          </div>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/firebase'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const auth = useAuthStore()

// Estado UI
const cargando = ref(false)
const ok = ref(false)
const error = ref('')

// Archivo
const fileInput = ref(null)

// Datos originales (para detectar cambios y deshacer)
const original = ref({
  nombre: '',
  empresa: '',
  monedaPref: 'CLP',
  fotoPerfil: null, // dataURL base64
})

// Form de edición (reactivo)
const form = ref({
  nombre: '',
  empresa: '',
  monedaPref: 'CLP',
  fotoPerfil: null, // dataURL base64 (nueva)
})

// Preview de imagen (si el usuario selecciona un archivo)
const avatarPreview = ref(null)

// Carga inicial
onMounted(async () => {
  try {
    if (!auth.uid) return
    const ref = doc(db, 'users', auth.uid)
    const snap = await getDoc(ref)
    const data = snap.exists() ? snap.data() : (auth.perfil || {})

    original.value = {
      nombre: data?.nombre || '',
      empresa: data?.empresa || '',
      monedaPref: data?.monedaPref || 'CLP',
      fotoPerfil: data?.fotoPerfil || null,
    }
    form.value = { ...original.value }
    avatarPreview.value = original.value.fotoPerfil || null
  } catch (e) {
    // silencioso, pero podrías mostrar un toast
  }
})

// Computados visuales
const displayNombre = computed(() => form.value.nombre || auth.perfil?.nombre || auth.user?.email || 'Usuario')
const avatarIniciales = computed(() => {
  const base = (form.value.nombre || auth.perfil?.nombre || auth.user?.email || 'U')
  const partes = base.split('@')[0].split(' ').filter(Boolean)
  const ini = (partes[0]?.[0] || base[0] || 'U') + (partes[1]?.[0] || '')
  return ini.toUpperCase()
})

// ¿Hay cambios?
const hasChanges = computed(() => {
  return (
    form.value.nombre !== original.value.nombre ||
    form.value.empresa !== original.value.empresa ||
    form.value.monedaPref !== original.value.monedaPref ||
    (form.value.fotoPerfil || null) !== (original.value.fotoPerfil || null)
  )
})

// Acciones
const deshacer = () => {
  form.value = { ...original.value }
  avatarPreview.value = original.value.fotoPerfil || null
  if (fileInput.value) fileInput.value.value = ''
  ok.value = false
  error.value = ''
}

const guardar = async () => {
  if (!hasChanges.value) return
  error.value = ''; ok.value = false; cargando.value = true
  try {
    if (!auth.uid) throw new Error('No hay sesión activa.')
    const ref = doc(db, 'users', auth.uid)

    // si no existe el doc, merge crea
    await setDoc(ref, {
      nombre: form.value.nombre || null,
      empresa: form.value.empresa || null,
      monedaPref: form.value.monedaPref || 'CLP',
      fotoPerfil: form.value.fotoPerfil || null,
      actualizadoEn: serverTimestamp(),
    }, { merge: true })

    // refrescar originales y store
    original.value = { ...form.value }
    if (auth.perfil) {
      auth.perfil = { ...auth.perfil, ...original.value }
    }
    ok.value = true
  } catch (e) {
    error.value = e.message || 'No se pudo guardar tu perfil.'
  } finally {
    cargando.value = false
  }
}

// Imagen
const onFile = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const dataURL = await compressImageToDataURL(file, { maxW: 1280, maxH: 1280, quality: 0.8 })
    form.value.fotoPerfil = dataURL
    avatarPreview.value = dataURL
  } catch (err) {
    console.error(err)
    error.value = 'No pudimos procesar la imagen (prueba una más liviana).'
    if (fileInput.value) fileInput.value.value = ''
  }
}

const quitarFoto = () => {
  form.value.fotoPerfil = null
  avatarPreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// Compresor simple (dataURL)
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
        if (approxBytes > 250 * 1024) return reject(new Error('La imagen quedó grande (>250KB).'))
        resolve(dataURL)
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
</script>

<style scoped>
.avatar-initials-lg {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.25rem;
  background: #f8d7da;  /* rosado suave */
  color: #b02a37;        /* danger dark */
}
.avatar-img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #f1f1f1;
}
</style>
