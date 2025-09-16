<template>
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1 class="h5 mb-0">Soporte</h1>
  </div>

  <!-- Aviso estado del sistema (manual) -->
  <div v-if="banner.visible" class="alert" :class="banner.class" role="alert">
    <i :class="banner.icon" class="me-2"></i>{{ banner.text }}
  </div>

  <div class="row g-3">
    <!-- Columna izquierda: FAQs -->
    <div class="col-12 col-lg-5">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <h6 class="mb-3">Ayuda rápida</h6>
          <div class="accordion" id="faq">
            <div class="accordion-item" v-for="(f, i) in faqs" :key="i">
              <h2 class="accordion-header">
                <button class="accordion-button" :class="{collapsed: i!==0}" type="button"
                        data-bs-toggle="collapse" :data-bs-target="`#faq-${i}`">
                  {{ f.q }}
                </button>
              </h2>
              <div :id="`faq-${i}`" class="accordion-collapse collapse" :class="{show: i===0}" data-bs-parent="#faq">
                <div class="accordion-body">
                  <div v-html="f.a"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 p-3 bg-light rounded border">
            <div class="fw-semibold mb-1"><i class="bi bi-life-preserver me-1"></i> ¿Necesitas más ayuda?</div>
            <ul class="small mb-0 ps-3">
              <li>Reinicia sesión si ves errores de permisos.</li>
              <li>Comprueba tu conexión y vuelve a intentar.</li>
              <li>Incluye capturas de rendición para acelerar la asistencia.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Columna derecha: Ticket + Mis tickets -->
    <div class="col-12 col-lg-7">
      <!-- Formulario de ticket -->
      <div class="card shadow-sm mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="mb-0">Crear ticket</h6>
            <span class="text-muted small">Tiempo de respuesta: 24 – 48 h hábiles</span>
          </div>

          <div v-if="ok" class="alert alert-success py-2">
            <i class="bi bi-check-circle me-1"></i> ¡Tu ticket fue enviado! Te avisaremos por correo si hay novedades.
          </div>
          <div v-if="error" class="alert alert-danger py-2">
            <i class="bi bi-exclamation-triangle me-1"></i> {{ error }}
          </div>

          <form @submit.prevent="enviar" class="needs-validation" novalidate>
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <label class="form-label">Categoría</label>
                <select v-model="categoria" class="form-select" required>
                  <option disabled value="">Selecciona…</option>
                  <option>Problema técnico</option>
                  <option>Pregunta de uso</option>
                  <option>Solicitud de mejora</option>
                  <option>Facturación</option>
                </select>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label">Prioridad</label>
                <select v-model="prioridad" class="form-select" required>
                  <option>Normal</option>
                  <option>Alta</option>
                </select>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label">ID rendición (opcional)</label>
                <input v-model.trim="rendicionId" class="form-control" placeholder="abc123…" />
              </div>

              <div class="col-12">
                <label class="form-label">Asunto</label>
                <input v-model.trim="asunto" class="form-control" required maxlength="120" />
              </div>

              <div class="col-12">
                <label class="form-label">Descripción</label>
                <textarea v-model.trim="descripcion" class="form-control" rows="4" required
                          placeholder="Cuéntanos qué ocurrió, pasos para replicar, mensajes de error, etc."></textarea>
              </div>

              <div class="col-12">
                <label class="form-label">Captura (opcional)</label>
                <div class="input-group">
                  <input ref="fileInput" type="file" class="form-control" accept="image/*" @change="onFile" capture="environment" />
                  <button class="btn btn-outline-secondary" type="button" @click="limpiarFoto" :disabled="!fotoPreview">
                    Quitar
                  </button>
                </div>
                <div class="form-text">Se comprime a máx. 1280 px · &lt;= 250KB · JPG/PNG.</div>
                <div class="mt-2" v-if="fotoPreview">
                  <img :src="fotoPreview" alt="captura" class="img-fluid rounded border" style="max-height:200px;">
                </div>
              </div>
            </div>

            <div class="d-flex gap-2 mt-3">
              <button class="btn btn-danger" :disabled="cargando">
                <span v-if="!cargando"><i class="bi bi-send me-1"></i> Enviar ticket</span>
                <span v-else class="spinner-border spinner-border-sm"></span>
              </button>
              <button class="btn btn-outline-secondary" type="button" @click="resetForm" :disabled="cargando">
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Mis tickets -->
      <div class="card shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Mis tickets</h6>
            <div class="text-muted small">{{ tickets.length }} registro(s)</div>
          </div>

          <div v-if="cargandoTickets" class="text-center py-4">
            <div class="spinner-border"></div>
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Asunto</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Categoría</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in tickets" :key="t.id">
                  <td class="small text-nowrap">{{ formatFechaHora(t.creadoEn) }}</td>
                  <td class="text-truncate" style="max-width: 260px;" :title="t.asunto">{{ t.asunto }}</td>
                  <td><span :class="['badge', badgeEstado(t.estado)]">{{ t.estado }}</span></td>
                  <td>{{ t.prioridad }}</td>
                  <td>{{ t.categoria }}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary" @click="verTicket(t)">Ver</button>
                  </td>
                </tr>
                <tr v-if="!tickets.length">
                  <td colspan="6" class="text-center text-muted py-4">Aún no has creado tickets.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Modal simple para ver detalle del ticket -->
          <div class="modal fade" tabindex="-1" :class="{ show: modalTicket!=null }" style="display:block" v-if="modalTicket" @click.self="modalTicket=null">
            <div class="modal-dialog modal-dialog-centered modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Ticket</h5>
                  <button type="button" class="btn-close" @click="modalTicket=null"></button>
                </div>
                <div class="modal-body">
                  <div class="row g-3">
                    <div class="col-12 col-md-8">
                      <div class="mb-2"><span class="text-muted small">Asunto</span><div class="fw-semibold">{{ modalTicket.asunto }}</div></div>
                      <div class="mb-2"><span class="text-muted small">Descripción</span><div style="white-space:pre-wrap">{{ modalTicket.descripcion }}</div></div>
                      <div class="row g-2">
                        <div class="col-6">
                          <div class="text-muted small">Estado</div>
                          <span :class="['badge', badgeEstado(modalTicket.estado)]">{{ modalTicket.estado }}</span>
                        </div>
                        <div class="col-6">
                          <div class="text-muted small">Prioridad</div>
                          <div class="fw-semibold">{{ modalTicket.prioridad }}</div>
                        </div>
                      </div>
                      <div class="mt-2">
                        <div class="text-muted small">Creado</div>
                        <div class="fw-semibold">{{ formatFechaHora(modalTicket.creadoEn) }}</div>
                      </div>
                    </div>
                    <div class="col-12 col-md-4">
                      <div class="text-muted small mb-1">Captura</div>
                      <div v-if="modalTicket.fotoPreview" class="border rounded p-2 bg-light text-center">
                        <img :src="modalTicket.fotoPreview" class="img-fluid rounded" alt="captura" />
                        <a :href="modalTicket.fotoPreview" download="captura.jpg" class="btn btn-sm btn-outline-secondary mt-2 w-100">
                          Descargar
                        </a>
                      </div>
                      <div v-else class="small text-muted">No adjunta</div>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" @click="modalTicket=null">Cerrar</button>
                </div>
              </div>
            </div>
          </div>
          <!-- /modal -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/firebase'
import { addDoc, collection, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore'

const auth = useAuthStore()

// Banner (puedes apagarlo cambiando visible:false)
const banner = ref({
  visible: false,
  class: 'alert-info',
  icon: 'bi bi-info-circle',
  text: 'Todos los sistemas operativos con normalidad.',
})

// FAQs
const faqs = ref([
  {
    q: '¿Cómo creo una rendición?',
    a: 'Ve a <b>Crear</b> desde el menú o el botón en la parte superior y completa los campos. Adjunta una foto clara del comprobante.'
  },
  {
    q: '¿Por qué fue rechazada mi rendición?',
    a: 'Revisa que la <b>categoría</b> sea correcta, que la <b>fecha</b> coincida con el comprobante y que el <b>monto</b> respete las políticas internas.'
  },
  {
    q: 'Olvidé mi contraseña',
    a: 'Usa la opción <b>Recuperar contraseña</b> desde la pantalla de inicio de sesión. Te enviaremos un correo con un enlace seguro.'
  },
])

// Formulario
const categoria = ref('')
const prioridad = ref('Normal')
const rendicionId = ref('')
const asunto = ref('')
const descripcion = ref('')
const fileInput = ref(null)
const fotoPreview = ref(null)

const cargando = ref(false)
const ok = ref(false)
const error = ref('')

// Tickets del usuario
const tickets = ref([])
const cargandoTickets = ref(true)
const modalTicket = ref(null)

onMounted(() => {
  try {
    const qRef = query(
      collection(db, 'soporte'),
      where('userId', '==', auth.uid),
      orderBy('creadoEn', 'desc')
    )
    onSnapshot(qRef, (snap) => {
      tickets.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      cargandoTickets.value = false
    })
  } catch (e) {
    cargandoTickets.value = false
  }
})

const enviar = async () => {
  error.value = ''; ok.value = false; cargando.value = true
  try {
    if (!auth.uid) throw new Error('No hay sesión activa.')
    if (!categoria.value || !asunto.value || !descripcion.value) throw new Error('Completa los campos obligatorios.')

    await addDoc(collection(db, 'soporte'), {
      userId: auth.uid,
      correo: auth.user?.email || null,
      empresa: auth.perfil?.empresa || null,
      categoria: categoria.value,
      prioridad: prioridad.value,
      rendicionId: rendicionId.value || null,
      asunto: asunto.value.trim(),
      descripcion: descripcion.value.trim(),
      fotoPreview: fotoPreview.value || null, // miniatura base64
      estado: 'abierto', // abierto | en progreso | resuelto
      creadoEn: serverTimestamp(),
    })

    resetForm()
    ok.value = true
  } catch (e) {
    error.value = e.message || 'No se pudo enviar el ticket.'
  } finally {
    cargando.value = false
  }
}

const resetForm = () => {
  categoria.value = ''
  prioridad.value = 'Normal'
  rendicionId.value = ''
  asunto.value = ''
  descripcion.value = ''
  limpiarFoto()
  ok.value = false
  error.value = ''
}

const verTicket = (t) => { modalTicket.value = t }

// Imagen (similar a CrearRendicion)
const onFile = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    fotoPreview.value = await compressImageToDataURL(file, { maxW: 1280, maxH: 1280, quality: 0.7 })
  } catch (err) {
    console.error(err)
    error.value = 'No pudimos procesar la imagen (intenta con una captura más liviana).'
    limpiarFoto()
  }
}
const limpiarFoto = () => {
  fotoPreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}
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

// Helpers UI
const formatFechaHora = (ts) => {
  try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return new Intl.DateTimeFormat('es-CL', { dateStyle:'medium', timeStyle:'short'}).format(d) }
  catch { return '-' }
}
const badgeEstado = (estado) =>
  ({ abierto:'text-bg-warning', 'en progreso':'text-bg-info', resuelto:'text-bg-success' }[estado] || 'text-bg-secondary')
</script>

<style scoped>
/* Modal sin JS de Bootstrap (SPA) */
.modal.show { display:block; background: rgba(0,0,0,.5); }
</style>
