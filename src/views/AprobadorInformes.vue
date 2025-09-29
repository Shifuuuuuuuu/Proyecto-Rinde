<!-- src/views/AprobadorInformes.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="container py-3">
    <!-- Header -->
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="router.back()">
          <i class="bi bi-arrow-left"></i> Volver
        </button>
        <h2 class="h5 mb-0">Aprobador · Informes</h2>
      </div>

      <div class="d-flex gap-2">
        <!-- Generar PDF (multi-hoja, total al final, estilo clásico) -->
        <button
          class="btn btn-primary btn-sm"
          :disabled="seleccionadosCount === 0 || loadingPdf"
          @click="generarPdf"
          title="Generar PDF profesional (multi-hoja) con las rendiciones seleccionadas"
        >
          <i class="bi bi-filetype-pdf"></i>
          {{ loadingPdf ? 'Generando...' : `Generar PDF (${seleccionadosCount})` }}
        </button>

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
                <!-- Selección -->
                <th class="text-center" style="width:40px;">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :checked="allPageSelected"
                    :indeterminate.prop="somePageSelected && !allPageSelected"
                    @change="toggleSelectPage($event)"
                  />
                </th>

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
              <tr
                v-for="x in paginadas"
                :key="x.id"
                @click="ver(x.id)"
                style="cursor:pointer"
              >
                <td class="text-center" @click.stop>
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :checked="seleccionados.has(x.id)"
                    @change="toggleSeleccion(x.id, $event)"
                  />
                </td>

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
                <td class="text-end" @click.stop>
                  <RouterLink
                    class="btn btn-sm btn-outline-secondary"
                    :to="{ name: 'aprobadorInforme', params: { id: x.id } }"
                  >
                    <i class="bi bi-eye"></i> Revisar
                  </RouterLink>
                </td>
              </tr>
              <tr v-if="!paginadas.length">
                <td colspan="8" class="text-center text-muted py-4">Sin resultados con los filtros.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación simple (client) -->
        <div class="d-flex justify-content-between align-items-center mt-2" v-if="filtradas.length">
          <div class="small text-muted">Mostrando {{ paginadas.length }} de {{ filtradas.length }}</div>
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
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { db } from '@/firebase'
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

// PDF
import jsPDF from 'jspdf'
const logoPublicPath = '/Logo XT Servicios.png' // si está en /public

const router = useRouter()
const auth = useAuthStore()

/* Datos */
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

/* Selección PDF */
const seleccionados = ref(new Set())
const loadingPdf = ref(false)
const seleccionadosCount = computed(() => seleccionados.value.size)

onMounted(() => {
  try {
    const base = collection(db, 'informes')
    const qRef = esAprobadorOAdmin.value
      ? query(base, orderBy('creadoEn', 'desc'))
      : query(base, where('userId', '==', auth.uid), orderBy('creadoEn', 'desc'))

    onSnapshot(qRef, (snap) => {
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      pagina.value = 1

      const ids = new Set(items.value.map(i => i.id))
      seleccionados.value.forEach(id => { if (!ids.has(id)) seleccionados.value.delete(id) })
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
    .filter(x => (x.estado || '').toLowerCase() !== 'devuelto')
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
  if ((inf.estado || '').toLowerCase() === 'devuelto') return
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

/* selección por página */
const allPageSelected = computed(() =>
  paginadas.value.length > 0 && paginadas.value.every(x => seleccionados.value.has(x.id))
)
const somePageSelected = computed(() =>
  paginadas.value.some(x => seleccionados.value.has(x.id))
)
const toggleSeleccion = (id, ev) => {
  if (ev.target.checked) seleccionados.value.add(id)
  else seleccionados.value.delete(id)
}
const toggleSelectPage = (ev) => {
  if (ev.target.checked) paginadas.value.forEach(x => seleccionados.value.add(x.id))
  else paginadas.value.forEach(x => seleccionados.value.delete(x.id))
}

/* ==== PDF Helpers ==== */
const moneyCLP = (n) => {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(n || 0))
  } catch { return String(n || 0) }
}

async function toDataURL(src) {
  if (!src) return null
  const res = await fetch(src)
  const blob = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

/* Traer rendiciones por IDs (en chunks) */
async function fetchRendicionesByIds(ids = []) {
  const results = []
  const chunkSize = 10
  for (let i = 0; i < ids.length; i += chunkSize) {
    const slice = ids.slice(i, i + chunkSize)
    const got = await Promise.all(slice.map(async rid => {
      try {
        const dref = doc(db, 'rendiciones', rid)
        const snap = await getDoc(dref)
        return snap.exists() ? { id: snap.id, ...snap.data() } : null
      } catch (e) {
        console.error(e); return null
      }
    }))
    results.push(...got.filter(Boolean))
  }
  return results
}

/* ==== Generación PDF multi-hoja con anti-superposición y líneas correctas ==== */
async function generarPdf() {
  if (seleccionados.value.size === 0) return
  loadingPdf.value = true
  try {
    // Rendiciones de todos los informes seleccionados
    const selectedInfos = items.value.filter(i => seleccionados.value.has(i.id))
    const allRids = [...new Set(selectedInfos.flatMap(i => Array.isArray(i.rendicionIds) ? i.rendicionIds : []))]
    const rendiciones = allRids.length ? await fetchRendicionesByIds(allRids) : []

    // Agrupar por categoría
    const map = new Map()
    for (const r of rendiciones) {
      const catName = (r.categoria || r.categoriaNombre || 'Sin categoría').toString()
      if (!map.has(catName)) map.set(catName, [])
      map.get(catName).push({
        fecha: r.creadoEn?.toDate ? r.creadoEn.toDate() : (r.fecha ? new Date(r.fecha) : null),
        folio: r.folio || r.id || '',
        motivo: r.motivo || r.descripcion || r.titulo || r.nota || '',
        monto: Number(r.monto ?? r.total ?? 0),
      })
    }
    const categorias = [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([nombre, registros]) => ({ nombre, registros }))

    // Conteo para densidad
    const totalFilas = categorias.reduce((acc, c) => acc + c.registros.length, 0)
    const compact = totalFilas > 36 // si son >36, compactamos un poco

    // Documento
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = { l: 40, r: 40, t: 40, b: 38 }

    const font = {
      headerTitle: 14,
      category: compact ? 10 : 11,
      headerCol: compact ? 8 : 9,
      row: compact ? 8 : 9,
      totalRow: compact ? 10 : 11,
      footer: 8,
    }

    // alturas/espaciados (ajuste clave)
    const lineH = compact ? 11 : 12              // distancia entre líneas en texto multilínea
    const baseRowTextMin = compact ? 10 : 11     // altura mínima del bloque de texto (1 línea)
    const rowPadTop = compact ? 6 : 7            // padding superior por fila
    const rowPadBottom = compact ? 6 : 7         // padding inferior por fila
    const headerPadTop = compact ? 6 : 7         // padding superior encabezado
    const headerPadBottom = compact ? 6 : 7      // padding inferior encabezado
    const colGapAfterCategory = compact ? 6 : 8  // espacio tras chip
    const categoryBlockMin = compact ? 48 : 54   // alto mínimo para abrir categoría
    const spaceAfterCatTotal = compact ? 12 : 16 // espacio tras total categoría
    const categorySpacing = compact ? 8 : 10     // colchón antes de siguiente categoría

    const color = {
      text: [20, 20, 20],
      sub: [90, 90, 90],
      line: [220, 220, 220],
      chip: [245, 245, 245],
    }

    // Columnas
    const col = {
      fecha: { x: margin.l, w: 80 },
      folio: { x: margin.l + 80, w: 90 },
      motivo: { x: margin.l + 170, w: pageW - margin.r - (margin.l + 170) - 110 },
      monto: { x: pageW - margin.r - 110, w: 110 },
    }

    // Estado de página
    let y = margin.t
    let totalGeneral = 0
    let logoData = null

    try { logoData = await toDataURL(logoPublicPath) } catch(e) { console.error(e) }

    const drawPageHeader = () => {
      if (logoData) {
        const logoW = 110
        const logoH = 32
        doc.addImage(logoData, 'PNG', margin.l, y, logoW, logoH, undefined, 'FAST')
      }
      const titulo = 'RENDICIÓN GRUPO XTREME'
      doc.setFont('helvetica', 'bold'); doc.setFontSize(font.headerTitle); doc.setTextColor(...color.text)
      const titleW = doc.getTextWidth(titulo)
      doc.text(titulo, (pageW - titleW) / 2, y + 24)
      y += 50
      doc.setDrawColor(...color.line); doc.setLineWidth(0.5)
      doc.line(margin.l, y, pageW - margin.r, y)
      y += 12
    }

    const newPage = () => {
      doc.addPage()
      y = margin.t
      drawPageHeader()
    }

    const ensureSpace = (needed) => {
      if (y + needed <= pageH - margin.b) return
      newPage()
    }

    const drawText = (text, x, yy, { bold = false, size = 10, colorRGB = color.text, align = 'left', maxW = 9999 } = {}) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setFontSize(size)
      doc.setTextColor(...colorRGB)
      if (align === 'right') {
        doc.text(String(text ?? ''), x + maxW, yy, { align: 'right', maxWidth: maxW })
      } else if (align === 'center') {
        doc.text(String(text ?? ''), x + maxW / 2, yy, { align: 'center', maxWidth: maxW })
      } else {
        doc.text(String(text ?? ''), x, yy, { maxWidth: maxW })
      }
    }

    const drawHeaderCols = () => {
      // baseline del texto del header con padding
      const baseY = y + headerPadTop + font.headerCol

      drawText('Fecha', col.fecha.x, baseY, { size: font.headerCol, colorRGB: color.sub })
      drawText('Folio', col.folio.x, baseY, { size: font.headerCol, colorRGB: color.sub })
      drawText('Motivo', col.motivo.x, baseY, { size: font.headerCol, colorRGB: color.sub })
      drawText('Monto', col.monto.x, baseY, { size: font.headerCol, colorRGB: color.sub, align: 'right', maxW: col.monto.w })

      // línea debajo del texto
      doc.setDrawColor(...color.line); doc.setLineWidth(0.5)
      doc.line(margin.l, baseY + 4, pageW - margin.r, baseY + 4)

      // avanzar cursor dejando padding inferior + grosor de línea
      y = baseY + headerPadBottom + 4
    }

    const drawCategoryChip = (nombre, cont = false) => {
      const chipH = 20
      const boxTop = y + 2 // pequeño respiro arriba
      doc.setFillColor(...color.chip)
      doc.rect(margin.l, boxTop, pageW - margin.l - margin.r, chipH, 'F')
      // texto centrado verticalmente en el chip
      drawText(`${nombre || 'Categoría'}${cont ? ' (cont.)' : ''}`, margin.l + 8, boxTop + chipH - 6, {
        bold: true, size: font.category
      })
      y = boxTop + chipH + colGapAfterCategory
    }

    const splitMotivo = (texto) => doc.splitTextToSize(String(texto ?? ''), col.motivo.w)

    const drawRow = ({ fecha, folio, motivo, monto }) => {
      const lines = splitMotivo(motivo)

      // alto del bloque de texto (n líneas)
      const textBlockH = Math.max(baseRowTextMin, lines.length * lineH)
      // alto total de la fila (padding + texto + padding)
      const rowH = rowPadTop + textBlockH + rowPadBottom

      // si no cabe, nueva página
      ensureSpace(rowH + 1) // +1 para asegurar línea separadora

      // baseline del texto (después del padding superior)
      const baseY = y + rowPadTop + font.row

      // fecha/folio 1 línea
      drawText(fecha, col.fecha.x, baseY, { size: font.row, maxW: col.fecha.w })
      drawText(folio, col.folio.x, baseY, { size: font.row, maxW: col.folio.w })

      // motivo multilínea
      let yy = baseY
      doc.setFont('helvetica', 'normal'); doc.setFontSize(font.row); doc.setTextColor(...color.text)
      lines.forEach((ln) => {
        doc.text(ln, col.motivo.x, yy, { maxWidth: col.motivo.w })
        yy += lineH
      })

      // monto alineado a la primera línea
      drawText(moneyCLP(monto), col.monto.x, baseY, { size: font.row, maxW: col.monto.w, align: 'right' })

      // línea separadora va al FINAL de la fila (debajo del contenido)
      const sepY = y + rowH
      doc.setDrawColor(...color.line); doc.setLineWidth(0.35)
      doc.line(margin.l, sepY, pageW - margin.r, sepY)

      // avanzar cursor al final de la fila
      y += rowH
    }

    const drawCategoryTotal = (total) => {
      // dejamos espacio para que no se pegue a la línea anterior
      ensureSpace(spaceAfterCatTotal)
      // texto del total alineado a la derecha
      drawText(`Total categoría: ${moneyCLP(total)}`, col.monto.x - 4, y + font.totalRow, {
        size: font.totalRow, bold: true, align: 'right', maxW: col.monto.w + 4
      })
      // línea ligera bajo el total de categoría (opcional; comenta si no la quieres)
      const lineY = y + font.totalRow + 4
      doc.setDrawColor(...color.line); doc.setLineWidth(0.3)
      doc.line(margin.l, lineY, pageW - margin.r, lineY)
      // avanzar cursor
      y = lineY + (spaceAfterCatTotal - 4)
    }

    const drawTotalGeneralChip = (total) => {
      const chipH = 30
      ensureSpace(chipH + 18)
      const boxY = y
      doc.setFillColor(...color.chip)
      doc.rect(margin.l, boxY, pageW - margin.l - margin.r, chipH, 'F')
      drawText(`TOTAL GENERAL: ${moneyCLP(total)}`, col.monto.x - 4, boxY + chipH - 10, {
        size: font.totalRow + 1, bold: true, align: 'right', maxW: col.monto.w + 4
      })
      y = boxY + chipH + 12
    }

    const drawFooter = () => {
      const gen = new Date()
      const pie = `Generado el ${new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(gen)}`
      doc.setFont('helvetica', 'normal'); doc.setFontSize(font.footer); doc.setTextColor(...color.sub)
      doc.text(pie, margin.l, pageH - 16)
    }

    // Primera página
    drawPageHeader()

    // Pintado con paginación y sin superposición
    for (const cat of categorias) {
      // abrir bloque de categoría con espacio mínimo (chip + header cols)
      ensureSpace(categoryBlockMin)
      drawCategoryChip(cat.nombre)
      drawHeaderCols()

      let totalCat = 0
      for (let i = 0; i < cat.registros.length; i++) {
        const r = cat.registros[i]
        const fila = {
          fecha: r.fecha ? new Intl.DateTimeFormat('es-CL').format(r.fecha) : '',
          folio: r.folio ?? '',
          motivo: r.motivo ?? '',
          monto: Number(r.monto || 0)
        }

        // Medimos alto estimado de fila y, si no cabe, saltamos de página y reponemos chip+cols con "(cont.)"
        const lines = splitMotivo(fila.motivo)
        const textBlockH = Math.max(baseRowTextMin, lines.length * lineH)
        const rowH = rowPadTop + textBlockH + rowPadBottom
        if (y + rowH + 1 > pageH - margin.b) {
          newPage()
          ensureSpace(categoryBlockMin)
          drawCategoryChip(cat.nombre, true)
          drawHeaderCols()
        }

        drawRow(fila)
        totalCat += fila.monto
      }

      // asegurar que el total de categoría entre limpio (si no cabe, nueva página)
      if (y + spaceAfterCatTotal + font.totalRow + 6 > pageH - margin.b) {
        newPage()
        // no redibujamos filas; solo pintamos el total
      }
      drawCategoryTotal(totalCat)

      // colchón antes de la siguiente categoría
      y += categorySpacing
      totalGeneral += totalCat
    }

    // TOTAL GENERAL (solo al final, con chip y espacio reservado)
    drawTotalGeneralChip(totalGeneral)
    drawFooter()

    doc.save('resumen-transacciones.pdf')
  } catch (e) {
    console.error(e)
    error.value = 'No fue posible generar el PDF.'
  } finally {
    loadingPdf.value = false
  }
}
</script>

<style scoped>
.table thead th {
  vertical-align: middle;
}
.text-truncate {
  max-width: 360px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
