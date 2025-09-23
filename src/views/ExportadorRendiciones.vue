<template>
  <div class="container py-3">
    <!-- Header -->
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div class="d-flex align-items-center gap-2">
        <h2 class="h5 mb-0">Exportador · Rendiciones</h2>
        <span class="badge text-bg-secondary d-none d-sm-inline">{{ filasVisibles.length }} visibles</span>
      </div>

    <!-- Filtros header -->
      <div class="d-flex align-items-center flex-wrap gap-2">
        <select v-model.number="filtroMes" class="form-select form-select-sm">
          <option v-for="m in meses" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <select v-model.number="filtroAnio" class="form-select form-select-sm">
          <option v-for="y in anios" :key="y" :value="y">{{ y }}</option>
        </select>

        <select v-model="filtroEstado" class="form-select form-select-sm">
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobada">Aprobada</option>
          <option value="rechazada">Rechazada</option>
        </select>

        <div class="form-check">
          <input id="ocultarExp" class="form-check-input" type="checkbox" v-model="ocultarExportadas">
          <label for="ocultarExp" class="form-check-label small">Ocultar ya exportadas</label>
        </div>

        <button class="btn btn-sm btn-outline-secondary" @click="recargar">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>

    <!-- Barra de acciones -->
    <div class="card shadow-sm mb-3">
      <div class="card-body d-flex flex-wrap gap-2 align-items-center">
        <div class="me-auto small text-muted">
          Seleccionadas: <strong>{{ seleccionadas.length }}</strong>
        </div>

        <button class="btn btn-outline-secondary btn-sm" @click="selectAllVisible" :disabled="!filasVisibles.length">
          Seleccionar visibles
        </button>
        <button class="btn btn-outline-secondary btn-sm" @click="clearSelection" :disabled="!seleccionadas.length">
          Quitar selección
        </button>

        <div class="vr d-none d-sm-block"></div>

        <button class="btn btn-outline-primary btn-sm" @click="exportExcel" :disabled="!seleccionadas.length || exportando">
          <span v-if="!exportando"><i class="bi bi-file-earmark-excel me-1"></i> Exportar Excel</span>
          <span v-else class="spinner-border spinner-border-sm"></span>
        </button>

        <button class="btn btn-outline-danger btn-sm" @click="exportPdf" :disabled="!seleccionadas.length || exportando">
          <span v-if="!exportando"><i class="bi bi-filetype-pdf me-1"></i> Exportar PDF</span>
          <span v-else class="spinner-border spinner-border-sm"></span>
        </button>

        <div class="vr d-none d-sm-block"></div>

        <button class="btn btn-success btn-sm" @click="marcarExportadas" :disabled="!seleccionadas.length || exportando">
          <span v-if="!exportando"><i class="bi bi-check2-circle me-1"></i> Marcar como rendidas</span>
          <span v-else class="spinner-border spinner-border-sm"></span>
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width:36px;" class="text-center">
                <input
                  class="form-check-input"
                  type="checkbox"
                  :checked="allVisibleSelected"
                  @change="toggleSelectAllVisible"
                />
              </th>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Categoría</th>
              <th>Motivo</th>
              <th class="text-end">Monto</th>
              <th>Moneda</th>
              <th>Estado</th>
              <th>Exportada</th>
              <th>Folio</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filasVisibles" :key="r.id">
              <td class="text-center">
                <input
                  class="form-check-input"
                  type="checkbox"
                  :value="r.id"
                  v-model="seleccionadas"
                />
              </td>
              <td class="small text-nowrap">{{ fFecha(r.fecha || r.creadoEn) }}</td>
              <td style="max-width: 220px;">
                <div class="fw-semibold text-truncate">{{ r.nombre || nameOf(r) }}</div>
                <div class="small text-muted text-truncate">{{ r.email || emailOf(r) || '—' }}</div>
              </td>
              <td class="text-truncate" style="max-width: 180px;">{{ r.categoria || '—' }}</td>
              <td class="text-truncate" style="max-width: 260px;" :title="r.motivo">{{ r.motivo || '—' }}</td>
              <td class="text-end">{{ fCLP(r.monto) }}</td>
              <td>{{ r.moneda || 'CLP' }}</td>
              <td><span :class="['badge', badgeEstado(r.estado)]">{{ r.estado }}</span></td>
              <td>
                <span v-if="r.exportado" class="badge text-bg-secondary">Sí</span>
                <span v-else class="badge text-bg-light">No</span>
              </td>
              <td class="text-truncate" style="max-width: 140px;">{{ r.folio || '—' }}</td>
            </tr>
            <tr v-if="!filasVisibles.length">
              <td colspan="10" class="text-center text-muted py-4">Sin resultados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mensajes -->
    <div class="mt-3">
      <div v-if="msgOk" class="alert alert-success py-2">{{ msgOk }}</div>
      <div v-if="msgErr" class="alert alert-danger py-2">{{ msgErr }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { db } from '@/firebase'
import {
  collection, query, where, orderBy, onSnapshot,
  doc, writeBatch, serverTimestamp
} from 'firebase/firestore'

// Export libs
import * as XLSX from 'xlsx-js-style'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/* ---------- Config ---------- */
const COL = 'rendiciones'
const FECHA_CAMPO = 'creadoEn'
const logoUrl = '/xtreme-logo.png' // opcional (pon la imagen en /public)

/* ---------- Fechas ---------- */
const ahora = new Date()
const meses = [
  { value: 0,  label: 'Enero' }, { value: 1,  label: 'Febrero' }, { value: 2,  label: 'Marzo' },
  { value: 3,  label: 'Abril' }, { value: 4,  label: 'Mayo' },    { value: 5,  label: 'Junio' },
  { value: 6,  label: 'Julio' }, { value: 7,  label: 'Agosto' },  { value: 8,  label: 'Septiembre' },
  { value: 9,  label: 'Octubre' }, { value: 10, label: 'Noviembre' }, { value: 11, label: 'Diciembre' }
]
const anios = [ahora.getFullYear(), ahora.getFullYear()-1, ahora.getFullYear()-2]
const filtroMes = ref(ahora.getMonth())
const filtroAnio = ref(ahora.getFullYear())
const filtroEstado = ref('')
const ocultarExportadas = ref(true)
const rangoMes = computed(() => {
  const start = new Date(filtroAnio.value, filtroMes.value, 1, 0, 0, 0, 0)
  const end   = new Date(filtroAnio.value, filtroMes.value + 1, 1, 0, 0, 0, 0)
  return { start, end }
})

/* ---------- Data ---------- */
const listado = ref([])
const stopUnsub = ref(null)
const seleccionadas = ref([])
const exportando = ref(false)
const msgOk = ref('')
const msgErr = ref('')

/* ---------- Sub/Query ---------- */
function recargar () {
  if (stopUnsub.value) stopUnsub.value()
  msgOk.value = ''; msgErr.value = ''

  const { start, end } = rangoMes.value
  const q = query(
    collection(db, COL),
    where(FECHA_CAMPO, '>=', start),
    where(FECHA_CAMPO, '<', end),
    orderBy(FECHA_CAMPO, 'desc')
  )
  stopUnsub.value = onSnapshot(q, (snap) => {
    listado.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
}
onMounted(recargar)
watch([filtroMes, filtroAnio], recargar)

/* ---------- Filtros visibles ---------- */
const filasVisibles = computed(() => {
  let arr = listado.value
  if (filtroEstado.value) arr = arr.filter(r => r.estado === filtroEstado.value)
  if (ocultarExportadas.value) arr = arr.filter(r => !r.exportado)
  return arr
})

/* ---------- Selección ---------- */
const clearSelection = () => { seleccionadas.value = [] }
const selectAllVisible = () => { seleccionadas.value = [...new Set([...seleccionadas.value, ...filasVisibles.value.map(r => r.id)])] }
const allVisibleSelected = computed(() =>
  filasVisibles.value.length > 0 &&
  filasVisibles.value.every(r => seleccionadas.value.includes(r.id))
)
const toggleSelectAllVisible = (e) => {
  if (e.target.checked) selectAllVisible()
  else {
    const visibles = new Set(filasVisibles.value.map(r => r.id))
    seleccionadas.value = seleccionadas.value.filter(id => !visibles.has(id))
  }
}
const rowsSeleccionadas = computed(() => {
  const m = new Map(listado.value.map(r => [r.id, r]))
  return seleccionadas.value.map(id => m.get(id)).filter(Boolean)
})

/* ---------- Export: helpers ---------- */
const fCLP = n => {
  try { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(n) || 0) }
  catch { return `$${n}` }
}
const fFecha = (ts) => {
  try {
    const d = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts))
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(d)
  } catch { return '-' }
}
function emailOf (r) {
  const e = r?.correo ?? r?.email ?? r?.userEmail ?? r?.perfil?.email
  if (e) return e
  if (typeof r?.usuario === 'string' && r.usuario.includes('@')) return r.usuario
  return null
}
function nameOf (r) {
  const n = r?.usuarioNombre ?? r?.nombre ?? r?.usuario ?? r?.displayName ?? r?.perfil?.nombre
  if (n) return n
  const e = emailOf(r)
  if (e) return e.split('@')[0]
  return r?.userId || '—'
}
const badgeEstado = (estado) => ({ pendiente:'text-bg-warning', aprobada:'text-bg-success', rechazada:'text-bg-danger' }[estado] || 'text-bg-secondary')

/* ---------- Export: Excel ---------- */
async function exportExcel () {
  try {
    exportando.value = true; msgOk.value = ''; msgErr.value = ''
    if (!rowsSeleccionadas.value.length) throw new Error('No hay filas seleccionadas.')

    // Data -> AOA para controlar encabezados y estilos
    const headers = ['Fecha','Folio','Usuario','Email','Empresa','Categoria','Motivo','Moneda','Monto','Estado','Exportada']
    const rows = rowsSeleccionadas.value.map(r => ([
      fFecha(r.fecha || r.creadoEn),
      r.folio || '',
      r.nombre || nameOf(r),
      r.email || emailOf(r) || '',
      r.empresa || '',
      r.categoria || '',
      r.motivo || '',
      r.moneda || 'CLP',
      Number(r.monto || 0),
      r.estado || '',
      r.exportado ? 'Sí' : 'No'
    ]))
    const data = [headers, ...rows]

    // Hoja
    const ws = XLSX.utils.aoa_to_sheet(data)

    // Anchos
    ws['!cols'] = [
      { wch: 12 },{ wch: 14 },{ wch: 22 },{ wch: 26 },{ wch: 16 },
      { wch: 20 },{ wch: 30 },{ wch: 8 }, { wch: 14 },{ wch: 12 },{ wch: 10 }
    ]

    // Estilos base
    const BORDER_THIN = { style: 'thin', color: { rgb: 'FF000000' } }
    const allBorders  = { top:BORDER_THIN, right:BORDER_THIN, bottom:BORDER_THIN, left:BORDER_THIN }

    const styleHeader = {
      font: { bold:true, color:{ rgb:'FFFFFFFF' } },
      fill: { fgColor:{ rgb:'FF000000' } },
      alignment: { vertical:'center', horizontal:'center', wrapText:true },
      border: allBorders
    }
    const styleBody = {
      alignment: { vertical:'center', horizontal:'center', wrapText:true },
      border: allBorders
    }
    const styleLeft = {
      alignment: { vertical:'center', horizontal:'left', wrapText:true },
      border: allBorders
    }
    const styleMoney = {
      alignment: { vertical:'center', horizontal:'right' },
      border: allBorders,
      numFmt: '#,##0'
    }

    // Aplicar estilos a todas las celdas
    const range = XLSX.utils.decode_range(ws['!ref'])
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const ref = XLSX.utils.encode_cell({ r:R, c:C })
        const cell = ws[ref]; if (!cell) continue

        // Encabezado (primera fila)
        if (R === 0) {
          cell.s = styleHeader
          continue
        }

        // Cuerpo: por defecto centrado
        if (C === 2 || C === 3 || C === 6) {
          // Usuario, Email, Motivo -> alineado a la izquierda
          cell.s = styleLeft
        } else if (C === 8) {
          // Monto -> derecha + formato
          cell.s = styleMoney
        } else {
          cell.s = styleBody
        }
      }
    }

    // Libro y descarga
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rendiciones')
    const fname = `Rendiciones_${filtroAnio.value}-${String(filtroMes.value+1).padStart(2,'0')}.xlsx`
    XLSX.writeFile(wb, fname)

    msgOk.value = 'Excel generado con formato.'
  } catch (e) {
    console.error(e)
    msgErr.value = e?.message || 'No se pudo generar Excel.'
  } finally {
    exportando.value = false
  }
}


/* ---------- Export: PDF ---------- */
async function exportPdf () {
  try {
    exportando.value = true; msgOk.value = ''; msgErr.value = ''

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const marginX = 36, marginY = 36

    // Encabezado con logo y título (si hay logo disponible)
    try {
      const img = new Image()
      img.src = logoUrl
      await new Promise((res) => { img.onload = res; img.onerror = res }) // no rompas si falla
      if (img.complete && img.naturalWidth) {
        const logoW = 120
        const ratio = img.naturalHeight / img.naturalWidth
        doc.addImage(img, 'PNG', marginX, marginY - 8, logoW, logoW * ratio)
      }
    } catch (e) {
    console.error(e)
    msgErr.value = e?.message || 'No se pudo exportar.'} // no rompas si falla

    doc.setFontSize(14)
    doc.text(`Rendiciones ${meses.find(m=>m.value===filtroMes.value)?.label} ${filtroAnio.value}`, marginX, marginY + 16)

    // Tabla
    const body = rowsSeleccionadas.value.map(r => ([
      fFecha(r.fecha || r.creadoEn),
      r.folio || '',
      (r.nombre || nameOf(r))?.slice(0,40) || '',
      (r.email || emailOf(r) || '')?.slice(0,36),
      r.categoria || '',
      (r.motivo || '')?.slice(0,48),
      r.moneda || 'CLP',
      fCLP(r.monto || 0),
      r.estado || '',
      r.exportado ? 'Sí' : 'No'
    ]))

    autoTable(doc, {
      head: [[ 'Fecha', 'Folio', 'Usuario', 'Email', 'Categoría', 'Motivo', 'Moneda', 'Monto', 'Estado', 'Exportada' ]],
      body,
      startY: marginY + 36,
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [220, 53, 69] },
      columnStyles: {
        0: { cellWidth: 70 },  1: { cellWidth: 60 },  2: { cellWidth: 110 },
        3: { cellWidth: 130 }, 4: { cellWidth: 90 },  5: { cellWidth: 160 },
        6: { cellWidth: 55 },  7: { cellWidth: 75, halign: 'right' },
        8: { cellWidth: 70 },  9: { cellWidth: 70 }
      },
      didDrawPage: (data) => {
        const pageSize = doc.internal.pageSize
        doc.setFontSize(8)
        doc.text(
          `Página ${data.pageNumber}`,
          pageSize.getWidth() - marginX - 48,
          pageSize.getHeight() - 16
        )
      }
    })

    const fname = `Rendiciones_${filtroAnio.value}-${String(filtroMes.value+1).padStart(2,'0')}.pdf`
    doc.save(fname)
    msgOk.value = 'PDF generado.'
  } catch (e) {
    console.error(e)
    msgErr.value = e?.message || 'No se pudo generar PDF.'
  } finally {
    exportando.value = false
  }
}

/* ---------- Marcar como exportadas ---------- */
async function marcarExportadas () {
  try {
    exportando.value = true; msgOk.value = ''; msgErr.value = ''
    if (!rowsSeleccionadas.value.length) throw new Error('No hay filas seleccionadas.')
    const batchId = `exp_${Date.now()}`
    const chunk = 400
    for (let i = 0; i < seleccionadas.value.length; i += chunk) {
      const slice = seleccionadas.value.slice(i, i + chunk)
      const batch = writeBatch(db)
      slice.forEach(id => {
        batch.update(doc(db, COL, id), {
          exportado: true,
          exportadoEn: serverTimestamp(),
          exportBatchId: batchId
        })
      })
      await batch.commit()
    }
    msgOk.value = `Marcadas ${seleccionadas.value.length} como rendidas.`
    // Mantén la selección (o si prefieres, límpiala):
    // seleccionadas.value = []
  } catch (e) {
    console.error(e)
    msgErr.value = e?.message || 'No se pudo marcar como rendidas.'
  } finally {
    exportando.value = false
  }
}
</script>

<style scoped>
.table td, .table th { vertical-align: middle; }
</style>
