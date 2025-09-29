// src/utils/generarPdfProfesional.js
import jsPDF from 'jspdf'

// Carga una imagen (URL o import de Vite) y la convierte a DataURL
export async function toDataURL(src) {
  if (!src) return null
  // Si es un dataURL ya
  if (typeof src === 'string' && src.startsWith('data:')) return src

  const res = await fetch(src)
  const blob = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

/**
 * Genera un PDF profesional en UNA SOLA HOJA.
 * @param {{
 *  titulo: string,
 *  logoSrc?: string, // ruta (assets) o URL
 *  categorias: Array<{
 *    nombre: string,
 *    registros: Array<{ fecha:string|Date, folio:string|number, motivo:string, monto:number }>
 *  }>
 * }} params
 */
export async function generarPdfProfesional({ titulo = 'Resumen', logoSrc = '', categorias = [] } = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' }) // 595 x 842 pt aproximadamente
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Márgenes
  const margin = { l: 40, r: 40, t: 40, b: 38 }

  // Tipografías y tamaños
  const font = {
    headerTitle: 14,
    category: 11,
    tableHeader: 9,
    tableRow: 9,
    totalRow: 10,
    footer: 8,
  }

  // Colores (gris suave para separadores)
  const color = {
    text: [20, 20, 20],
    sub: [90, 90, 90],
    line: [220, 220, 220],
    chip: [245, 245, 245],
  }

  // Cargar logo
  let logoDataURL = null
  try { logoDataURL = await toDataURL(logoSrc) } catch {console.error(logoDataURL);
  }

  // Encabezado (logo + título centrado)
  let y = margin.t

  if (logoDataURL) {
    const logoW = 110
    const logoH = 32
    doc.addImage(logoDataURL, 'PNG', margin.l, y, logoW, logoH, undefined, 'FAST')
  }

  // Título centrado
  doc.setTextColor(...color.text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(font.headerTitle)
  const title = titulo || 'Resumen'
  const titleW = doc.getTextWidth(title)
  doc.text(title, (pageW - titleW) / 2, y + 24)

  // Línea divisoria
  y += 50
  doc.setDrawColor(...color.line)
  doc.setLineWidth(0.5)
  doc.line(margin.l, y, pageW - margin.r, y)
  y += 12

  // Config de columnas para registros
  // Fecha | Folio | Motivo | Monto
  const col = {
    fecha: { x: margin.l, w: 80 },
    folio: { x: margin.l + 80, w: 80 },
    motivo: { x: margin.l + 160, w: pageW - margin.r - (margin.l + 160) - 90 }, // flexible
    monto: { x: pageW - margin.r - 90, w: 90 },
  }

  // Funciones de dibujo
  const drawText = (text, x, y, options = {}) => {
    const {
      bold = false,
      size = 10,
      colorRGB = color.text,
      align = 'left',
      maxW = 9999,
      lineHeight = 11,
      ellipsis = true,
    } = options

    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...colorRGB)

    // saltos de línea mínimos por ancho
    const lines = doc.splitTextToSize(String(text ?? ''), maxW)
    let usedY = 0
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      let xPos = x
      if (align === 'right') {
        xPos = x + maxW // text() con align 'right' usa x como borde derecho virtual
        doc.text(line, xPos, y + usedY, { align: 'right', maxWidth: maxW })
      } else if (align === 'center') {
        xPos = x + maxW / 2
        doc.text(line, xPos, y + usedY, { align: 'center', maxWidth: maxW })
      } else {
        doc.text(line, xPos, y + usedY, { maxWidth: maxW })
      }
      usedY += (i === lines.length - 1 ? 0 : lineHeight)
      // Seguridad: si nos vamos a salir de la página, cortamos
      if (y + usedY > pageH - margin.b) break
    }

    // Si el texto ocuparía más de lo permitido y hay que cortar
    if (ellipsis) {
      const hNeeded = (lines.length - 1) * lineHeight
      if (y + hNeeded > pageH - margin.b) {
        // no hacemos nada más: se habrá cortado por split según espacio
      }
    }
    return y + (lines.length > 1 ? (lines.length - 1) * lineHeight : 0)
  }

  const drawRow = (rowY, { fecha, folio, motivo, monto }) => {
    // altura base de fila
    const baseLineH = 12
    // Pintamos texto
    drawText(fecha, col.fecha.x, rowY, { size: font.tableRow, maxW: col.fecha.w })
    drawText(String(folio ?? ''), col.folio.x, rowY, { size: font.tableRow, maxW: col.folio.w })
    const motivoEndY = drawText(motivo, col.motivo.x, rowY, {
      size: font.tableRow,
      maxW: col.motivo.w,
      lineHeight: 11,
    })
    drawText(
      typeof monto === 'number' ? formatoMoneda(monto) : String(monto ?? ''),
      col.monto.x,
      rowY,
      { size: font.tableRow, maxW: col.monto.w, align: 'right' }
    )

    // línea separadora
    const rowHeight = Math.max(baseLineH, motivoEndY - rowY + baseLineH)
    doc.setDrawColor(...color.line)
    doc.setLineWidth(0.35)
    doc.line(margin.l, rowY + rowHeight - 4, pageW - margin.r, rowY + rowHeight - 4)
    return rowY + rowHeight
  }

  const drawTableHeader = (headerY) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(font.tableHeader)
    doc.setTextColor(...color.sub)

    drawText('Fecha', col.fecha.x, headerY, { size: font.tableHeader, maxW: col.fecha.w })
    drawText('Folio', col.folio.x, headerY, { size: font.tableHeader, maxW: col.folio.w })
    drawText('Motivo', col.motivo.x, headerY, { size: font.tableHeader, maxW: col.motivo.w })
    drawText('Monto', col.monto.x, headerY, { size: font.tableHeader, maxW: col.monto.w, align: 'right' })

    // línea bajo encabezado
    doc.setDrawColor(...color.line)
    doc.setLineWidth(0.5)
    doc.line(margin.l, headerY + 6, pageW - margin.r, headerY + 6)
    return headerY + 12
  }

  const drawCategoryHeader = (catY, nombre) => {
    // chip de categoría
    const chipH = 18
    doc.setFillColor(...color.chip)
    doc.rect(margin.l, catY - chipH + 12, pageW - margin.l - margin.r, chipH, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(font.category)
    doc.setTextColor(...color.text)
    const label = String(nombre ?? 'Categoría')
    drawText(label, margin.l + 8, catY, { size: font.category, maxW: pageW - margin.l - margin.r - 16 })
    return catY + 6
  }

  const drawCategoryTotal = (totY, total) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(font.totalRow)
    doc.setTextColor(...color.text)
    const label = `Total categoría: ${formatoMoneda(total)}`
    drawText(label, col.monto.x - 4, totY, { size: font.totalRow, maxW: col.monto.w + 4, align: 'right' })
    return totY + 12
  }

  // Formateo CLP (ajusta si quieres otra moneda)
  function formatoMoneda(n) {
    try {
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0)
    } catch {
      return String(n || 0)
    }
  }

  // Render por categorías, forzando 1 página (si se excede, resumimos)
  let totalGeneral = 0
  let contenidoRecortado = false

  for (const cat of categorias) {
    // Espacio antes de cada categoría
    const minSpaceNeeded = 40 // encabezado cat + encabezado tabla
    if (y + minSpaceNeeded > pageH - margin.b) { contenidoRecortado = true; break }

    y = drawCategoryHeader(y + 12, cat?.nombre)
    y = drawTableHeader(y + 8)

    // filas
    let totalCat = 0
    const rows = Array.isArray(cat?.registros) ? cat.registros : []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {}
      const fila = {
        fecha: r.fecha instanceof Date ? new Intl.DateTimeFormat('es-CL').format(r.fecha) : (r.fecha ?? ''),
        folio: r.folio ?? '',
        motivo: r.motivo ?? '',
        monto: r.monto ?? 0,
      }

      // Verificar espacio para fila + total de categoría (reserva ~22pt)
      if (y + 22 > pageH - margin.b) { contenidoRecortado = true; break }
      y = drawRow(y + 6, fila)
      totalCat += Number(fila.monto || 0)

      // Si muy justo para seguir y además queremos asegurar espacio del total:
      if (y + 16 > pageH - margin.b) { contenidoRecortado = true; break }
    }

    // Total de categoría
    if (y + 16 > pageH - margin.b) { contenidoRecortado = true; break }
    y = drawCategoryTotal(y + 8, totalCat)
    totalGeneral += totalCat
  }

  // Línea antes del bloque de totales (si hay espacio)
  if (y + 18 <= pageH - margin.b) {
    doc.setDrawColor(...color.line)
    doc.setLineWidth(0.5)
    doc.line(margin.l, y + 6, pageW - margin.r, y + 6)
    y += 16
  }

  // Total general (siempre intentamos dibujarlo)
  const totalLabel = `TOTAL GENERAL: ${formatoMoneda(totalGeneral)}`
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(font.totalRow + 1)
  doc.setTextColor(...color.text)
  if (y + 14 > pageH - margin.b) {
    // si ya no cabe arriba, lo ponemos pegado al pie
    y = pageH - margin.b - 16
  }
  drawText(totalLabel, col.monto.x - 4, y, { size: font.totalRow + 1, maxW: col.monto.w + 4, align: 'right' })

  // Pie de página: fecha de generación
  const gen = new Date()
  const pie = `Generado el ${new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(gen)}`
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(font.footer)
  doc.setTextColor(...color.sub)

  // Si hubo recorte de contenido, avisamos
  const aviso = contenidoRecortado ? ' • Documento resumido para ajustar a 1 hoja' : ''
  const footerText = pie + aviso

  doc.text(footerText, margin.l, pageH - 16) // esquina inferior izquierda

  // Descargar
  const safeTitle = String(titulo || 'resumen').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  doc.save(`${safeTitle}.pdf`)
}
