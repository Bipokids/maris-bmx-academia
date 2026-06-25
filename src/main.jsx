import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import {
  guardarInscripcion,
  observarCupos,
  escucharSesionAdmin,
  iniciarSesionAdmin,
  cerrarSesionAdmin,
  esUsuarioAdmin,
  escucharInscripciones,
  actualizarPagoInscripcion,
  actualizarCodigoEntregado,
  guardarDevolucionPiloto,
  buscarPilotoPorCodigo,
  formatAccessCode,
  eliminarInscripcion
} from '../firebase'
import './styles.css'

const WHATSAPP_NUMBER = '5491157558486'

const pillars = [
  {
    icon: 'diagnostico',
    tone: 'yellow',
    title: 'Diagnóstico y Medición',
    text: 'Evaluamos tus parámetros en pista para detectar fortalezas, oportunidades y prioridades reales de trabajo.'
  },
  {
    icon: 'nutricion',
    tone: 'green',
    title: 'Nutrición Deportiva',
    text: 'Combustible real para entrenar, recuperar y sostener una semana de alto rendimiento.'
  },
  {
    icon: 'psicologia',
    tone: 'cyan',
    title: 'Psicología del Deporte',
    text: 'Herramientas para competir mejor, manejar presión y pensar como un piloto de élite.'
  },
  {
    icon: 'fisico',
    tone: 'red',
    title: 'Preparación Física',
    text: 'Trabajo específico para potencia, reacción, estabilidad, movilidad y prevención.'
  }
]

const schedule = [
  'Bienvenida, evaluación inicial y objetivos individuales',
  'Técnica de largada, primera recta y lectura de pista',
  'Curvas, saltos, líneas de carrera y toma de decisiones',
  'Preparación física, movilidad, recuperación y nutrición',
  'Psicología competitiva y mentalidad de carrera',
  'Simulaciones, feedback personalizado y ajustes finales',
  'Cierre, medición final y plan de evolución'
]

const initialForm = {
  nombre: '',
  edad: '',
  whatsapp: '',
  email: '',
  ciudad: '',
  categoria: '',
  club: '',
  objetivo: '',
  acepta: false
}

function createId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `inscripcion-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function saveLocalBackup(record) {
  const key = 'maris_bmx_inscripciones_backup'
  const current = JSON.parse(localStorage.getItem(key) || '[]')
  localStorage.setItem(key, JSON.stringify([...current, record]))
}

async function saveInscription(data, photoFile) {
  const backupRecord = {
    ...data,
    id: createId(),
    fotoNombre: photoFile?.name || '',
    fechaRegistro: new Date().toISOString()
  }

  try {
    const record = await guardarInscripcion(data, photoFile)

    return {
      ...record,
      guardadoEnFirebase: true
    }
  } catch (error) {
    console.error('Error guardando inscripción en Firebase:', error)

    const cupoCompleto = error?.code === 'CUPO_COMPLETO' || error?.message === 'CUPO_COMPLETO'

    if (!cupoCompleto) {
      saveLocalBackup({
        ...backupRecord,
        guardadoEnFirebase: false,
        firebaseError: error.message
      })
    }

    return {
      ...backupRecord,
      guardadoEnFirebase: false,
      cupoCompleto,
      firebaseError: error.message
    }
  }
}

function buildWhatsappText(data) {
  return [
    'Hola, quiero recibir el PDF informativo de la Academia de Verano BMX 2027 con Māris Štrombergs.',
    '',
    `Nombre: ${data.nombre}`,
    `Edad: ${data.edad}`,
    `WhatsApp: ${data.whatsapp}`,
    `Email: ${data.email}`,
    `Ciudad: ${data.ciudad}`,
    `Categoría / nivel: ${data.categoria}`,
    `Club / equipo: ${data.club || '-'}`,
    `Objetivo: ${data.objetivo || '-'}`
  ].join('\n')
}

function ModernIcon({ name }) {
  if (name === 'diagnostico') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path className="iconStroke" d="M10 48H54" />
        <path className="iconStroke" d="M16 42L26 30L36 36L49 18" />
        <path className="iconStroke" d="M43 18H49V24" />
        <circle className="iconDot" cx="26" cy="30" r="3" />
        <circle className="iconDot" cx="36" cy="36" r="3" />
      </svg>
    )
  }

  if (name === 'nutricion') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path className="iconStroke" d="M32 52C22 43 16 34 16 25C16 17 21 12 28 12C32 12 35 14 37 17C39 14 42 12 46 12C51 12 55 16 55 22C55 33 43 43 32 52Z" />
        <path className="iconStroke" d="M27 28C32 28 38 25 43 18" />
        <path className="iconStroke" d="M22 38H42" />
      </svg>
    )
  }

  if (name === 'psicologia') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path className="iconStroke" d="M22 49V43C15 39 12 33 12 26C12 15 21 8 32 8C43 8 52 15 52 26C52 34 48 40 42 43V49" />
        <path className="iconStroke" d="M24 55H40" />
        <path className="iconStroke" d="M26 26H38" />
        <path className="iconStroke" d="M32 20V34" />
        <circle className="iconDot" cx="24" cy="26" r="3" />
        <circle className="iconDot" cx="40" cy="26" r="3" />
      </svg>
    )
  }

  if (name === 'fisico') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path className="iconStroke" d="M12 36H20L26 24L38 44L44 36H52" />
        <path className="iconStroke" d="M19 18L13 24" />
        <path className="iconStroke" d="M45 18L51 24" />
        <path className="iconStroke" d="M18 18H46" />
        <path className="iconStroke" d="M20 46H44" />
      </svg>
    )
  }

  if (name === 'calendar') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="iconStroke" x="13" y="16" width="38" height="36" rx="8" />
        <path className="iconStroke" d="M21 10V21" />
        <path className="iconStroke" d="M43 10V21" />
        <path className="iconStroke" d="M13 28H51" />
        <path className="iconStroke" d="M23 38H25" />
        <path className="iconStroke" d="M32 38H34" />
        <path className="iconStroke" d="M41 38H43" />
      </svg>
    )
  }

  if (name === 'location') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path className="iconStroke" d="M32 55C32 55 48 39 48 25C48 16 41 9 32 9C23 9 16 16 16 25C16 39 32 55 32 55Z" />
        <circle className="iconStroke" cx="32" cy="25" r="8" />
      </svg>
    )
  }

  if (name === 'slots') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="iconStroke" cx="24" cy="22" r="8" />
        <circle className="iconStroke" cx="44" cy="24" r="6" />
        <path className="iconStroke" d="M11 52C13 42 18 36 25 36C32 36 37 42 39 52" />
        <path className="iconStroke" d="M36 39C43 38 49 43 52 52" />
      </svg>
    )
  }

  return null
}

function LandingPage() {
  const [form, setForm] = useState(initialForm)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [formKey, setFormKey] = useState(0)
  const [sent, setSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [cupos, setCupos] = useState({
    ocupados: 0,
    disponibles: 36,
    completo: false,
    maximo: 36
  })

  useEffect(() => {
    const unsubscribe = observarCupos(setCupos)
    return () => unsubscribe()
  }, [])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    if (sent) {
      setSent(false)
      setStatusMessage('')
    }
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      setPhotoFile(null)
      setPhotoPreview('')
      return
    }

    if (!file.type.startsWith('image/')) {
      setPhotoFile(null)
      setPhotoPreview('')
      setStatusMessage('El archivo seleccionado debe ser una imagen.')
      setSent(true)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoFile(null)
      setPhotoPreview('')
      setStatusMessage('La foto no puede superar los 5 MB.')
      setSent(true)
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setSent(false)
    setStatusMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (cupos.completo) {
      setSent(true)
      setStatusMessage('El cupo máximo de 36 pilotos ya fue cubierto.')
      return
    }

    if (!photoFile) {
      setSent(true)
      setStatusMessage('Para completar la inscripción necesitamos la foto del piloto.')
      return
    }

    setSaving(true)
    setSent(false)
    setStatusMessage('')

    const formSnapshot = { ...form }
    const savedRecord = await saveInscription(formSnapshot, photoFile)

    if (savedRecord.guardadoEnFirebase) {
      setStatusMessage('Inscripción registrada correctamente. WhatsApp se abrió para pedir el PDF informativo.')

      const message = encodeURIComponent(buildWhatsappText(formSnapshot))
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank')

      setForm(initialForm)
      setPhotoFile(null)
      setPhotoPreview('')
      setFormKey((current) => current + 1)
    } else if (savedRecord.cupoCompleto) {
      setStatusMessage('El cupo máximo de 36 pilotos ya fue cubierto.')
    } else {
      setStatusMessage('WhatsApp se abrió, pero no pudimos guardar en Firebase. Dejamos un backup local en este navegador.')

      const message = encodeURIComponent(buildWhatsappText(formSnapshot))
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank')
    }

    setSent(true)
    setSaving(false)
  }

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top" aria-label="Inicio">
          <span className="brandMark">BMX</span>
          <span>Academia 2027</span>
        </a>

        <div className="navLinks">
          <a href="#experiencia">Experiencia</a>
          <a href="#programa">Programa</a>
          <a href="#inscripcion">Inscripción</a>
          <a href="/acceso">Acceso piloto</a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="heroCopy">
          <p className="eyebrow">Argentina · Verano 2027</p>

          <h1>
            EL GOAT DEL BMX LLEGA A <span className="textRed">ARGENTINA</span>
          </h1>

          <p className="lead">
            ¿Te imaginás entrenar y convivir una semana entera con el máximo exponente de la historia del BMX Racing?
          </p>

          <div className="heroActions">
            <a className="btn primary" href="#inscripcion">
              Quiero mi lugar
            </a>

            <a
              className="btn ghost"
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
            >
              Pedir PDF por WhatsApp
            </a>
          </div>
        </div>

        <div className="heroCard" aria-label="Foto principal de Māris Štrombergs">
          <div className="heroImage"></div>
          <div className="floatingBadge heroSlots">solo 36 cupos</div>
        </div>
      </section>

      <section className="titleBlock">
        <p className="sectionTag">Academia de Verano de BMX 2027</p>

        <div className="pilotHighlight">
          <div className="pilotText">
            <h2>māris štrombergs</h2>
            <p>
              El único bicampeón olímpico de oro en la historia del BMX Racing.
            </p>
          </div>

          <div className="pilotSecondPhoto">
            <img
              src="/maris/maris-secondary.jpg"
              alt="Māris Štrombergs en acción durante una sesión de BMX"
            />
          </div>
        </div>
      </section>

      <section className="experience" id="experiencia">
        <div>
          <p className="sectionTag">No es una clínica más</p>
          <h2>
            Más que una clínica, una <span className="textRed">experiencia de élite</span>
          </h2>
        </div>

        <p>
          No venís solo a pedalear. Venís a vivir, entrenar y evolucionar bajo
          la mirada del número 1. Un programa integral de alto rendimiento
          durante 7 días, con cupos limitados para trabajar de verdad con cada
          piloto.
        </p>
      </section>

      <section className="pillars">
        {pillars.map((pillar) => (
          <article className="pillar" key={pillar.title}>
            <div className={`modernIcon ${pillar.tone}`}>
              <ModernIcon name={pillar.icon} />
            </div>

            <h3>{pillar.title}</h3>
            <p>{pillar.text}</p>
          </article>
        ))}
      </section>

      <section className="stats">
        <article>
          <div className="statIcon yellow">
            <ModernIcon name="calendar" />
          </div>

          <h3>31 Ene. al 7 Feb.</h3>
          <p>Del domingo 31 de enero al domingo 7 de febrero de 2027.</p>
        </article>

        <article>
          <div className="statIcon cyan">
            <ModernIcon name="location" />
          </div>

          <h3>Vicente López</h3>
          <p>Circuito Campo 3, Buenos Aires, Argentina.</p>
        </article>

        <article>
          <div className="statIcon red">
            <ModernIcon name="slots" />
          </div>

          <h3>36 cupos</h3>
          <p>Exclusividad absoluta para pilotos que buscan el siguiente nivel.</p>
        </article>
      </section>

      <section className="program" id="programa">
        <div className="programHeader">
          <p className="sectionTag">Plan de trabajo</p>
          <h2>
            Una semana para medir, entrenar, <span className="textRed">corregir y evolucionar</span>
          </h2>
        </div>

        <div className="timeline">
          {schedule.map((item, index) => (
            <div className="timelineItem" key={item}>
              <span>Día {index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="inscription" id="inscripcion">
        <div className="inscriptionCopy">
          <p className="sectionTag">Asegurá tu lugar</p>

          <h2>
            ¿Estás listo para el siguiente <span className="textRed">nivel?</span>
          </h2>

          <p>
            Completá tus datos, cargá la foto del piloto y te abrimos WhatsApp
            con el mensaje listo para pedir el PDF informativo. El acceso privado
            se habilitará más adelante cuando la organización confirme el pago.
          </p>

          <div className="qrBox">
            <img
              src="/assets/qr-whatsapp-maris-bmx.png"
              alt="QR de WhatsApp para pedir PDF informativo"
            />

            <div>
              <strong>Escaneá el QR</strong>
              <span>o escribinos al +54 9 11 5755 8486</span>
            </div>
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit} key={formKey}>
          <div className="field two">
            <label>
              Nombre y apellido
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Juan Pérez"
              />
            </label>

            <label>
              Edad
              <input
                name="edad"
                value={form.edad}
                onChange={handleChange}
                required
                type="number"
                min="6"
                placeholder="Ej: 15"
              />
            </label>
          </div>

          <div className="field two">
            <label>
              WhatsApp
              <input
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                required
                placeholder="Ej: 11 5755 8486"
              />
            </label>

            <label>
              Email
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                type="email"
                placeholder="mail@ejemplo.com"
              />
            </label>
          </div>

          <div className="field two">
            <label>
              Ciudad / Provincia
              <input
                name="ciudad"
                value={form.ciudad}
                onChange={handleChange}
                required
                placeholder="Ej: Vicente López, Buenos Aires"
              />
            </label>

            <label>
              Categoría / nivel
              <input
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                required
                placeholder="Ej: Novicio, Experto, Elite"
              />
            </label>
          </div>

          <label>
            Club / equipo
            <input
              name="club"
              value={form.club}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </label>

          <label className="photoField">
            Foto del piloto
            <input
              name="fotoPiloto"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              required
            />
            <span className="photoHelp">JPG, PNG o WEBP · máximo 5 MB</span>
            {photoPreview && (
              <img className="photoPreview" src={photoPreview} alt="Vista previa de la foto del piloto" />
            )}
          </label>

          <label>
            Objetivo para la academia
            <textarea
              name="objetivo"
              value={form.objetivo}
              onChange={handleChange}
              rows="4"
              placeholder="Contanos qué querés mejorar: largada, curvas, saltos, mentalidad, físico..."
            />
          </label>

          <label className="check">
            <input
              name="acepta"
              checked={form.acepta}
              onChange={handleChange}
              type="checkbox"
              required
            />

            <span>
              Acepto ser contactado por WhatsApp para recibir información del evento.
            </span>
          </label>

          <div className={`cuposBox ${cupos.completo ? 'full' : ''}`}>
            <strong>
              {cupos.completo ? 'Cupos agotados' : `${cupos.disponibles} cupos disponibles`}
            </strong>
            <span>
              {cupos.ocupados} de {cupos.maximo} lugares reservados
            </span>
          </div>

          <button className="btn primary full" type="submit" disabled={saving || cupos.completo}>
            {cupos.completo ? 'Cupos agotados' : saving ? 'Guardando...' : 'Enviar y pedir PDF'}
          </button>

          {sent && (
            <p className="success">
              {statusMessage}
            </p>
          )}
        </form>
      </section>

      <footer className="siteFooter">
        <div className="footerEvent">
          <strong>Academia de Verano BMX 2027</strong>
          <span>Buenos Aires, Argentina · Cupos limitados</span>
        </div>

        <div className="footerBrand">
          <span>desarrollado por</span>
          <a
            className="footerLogoLink"
            href="https://www.nexotechsys.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Sitio web de NexoTech"
          >
            <img className="footerLogo" src="/assets/nexotech-logo.png" alt="NexoTech" />
          </a>
          <a className="footerWebsite" href="https://www.nexotechsys.com" target="_blank" rel="noreferrer">
            www.nexotechsys.com
          </a>
          <a className="footerWebsite">
            (+54) 11-7829-7199
          </a>
        </div>
      </footer>
    </main>
  )
}


const emptyFeedbackForm = {
  devolucion: '',
  resultados: {
    diagnostico: '',
    tecnica: '',
    fisico: '',
    mentalidad: '',
    nutricion: '',
    recomendaciones: ''
  }
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const date = typeof value === 'number' ? new Date(value) : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function getStatusInfo(inscripcion) {
  if (inscripcion.pagoConfirmado && inscripcion.accesoHabilitado) {
    return {
      label: 'pago confirmado',
      className: 'paid'
    }
  }

  return {
    label: 'pendiente de pago',
    className: 'pending'
  }
}

function normalizeWhatsappNumber(phone = '') {
  const digits = phone.replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  if (digits.startsWith('54')) {
    return digits
  }

  return `549${digits}`
}

function buildAccessCodeMessage(inscripcion) {
  return [
    `Hola ${inscripcion.nombre}.`,
    '',
    'Tu pago fue confirmado y ya tenés habilitado el acceso privado de la Academia de Verano BMX 2027.',
    '',
    `Tu código único es: ${inscripcion.codigoAcceso}`,
    '',
    'Ingresá al sitio, entrá en Acceso Piloto y cargá ese código para ver tu perfil y la devolución del evento.'
  ].join('\n')
}


function exportarInscriptosExcel(inscriptos) {
  const rows = inscriptos.map((piloto) => ({
    'Nro cupo': piloto.numeroCupo || '',
    'Código acceso': piloto.codigoAcceso || '',
    'Nombre': piloto.nombre || '',
    'Edad': piloto.edad || '',
    'WhatsApp': piloto.whatsapp || '',
    'Email': piloto.email || '',
    'Ciudad / Provincia': piloto.ciudad || '',
    'Categoría': piloto.categoria || '',
    'Club / equipo': piloto.club || '',
    'Objetivo': piloto.objetivo || '',
    'Estado': piloto.estado || '',
    'Pago confirmado': piloto.pagoConfirmado ? 'SI' : 'NO',
    'Acceso habilitado': piloto.accesoHabilitado ? 'SI' : 'NO',
    'Código entregado': piloto.codigoEntregado ? 'SI' : 'NO',
    'Devolución cargada': piloto.devolucionCargada ? 'SI' : 'NO',
    'Foto URL': piloto.fotoUrl || '',
    'Fecha registro': piloto.fechaRegistro || '',
    'Devolución general': piloto.devolucion || '',
    'Diagnóstico': piloto.resultados?.diagnostico || '',
    'Técnica': piloto.resultados?.tecnica || '',
    'Físico': piloto.resultados?.fisico || '',
    'Mentalidad': piloto.resultados?.mentalidad || '',
    'Nutrición': piloto.resultados?.nutricion || '',
    'Recomendaciones': piloto.resultados?.recomendaciones || ''
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 18 },
    { wch: 28 },
    { wch: 8 },
    { wch: 18 },
    { wch: 30 },
    { wch: 26 },
    { wch: 18 },
    { wch: 24 },
    { wch: 44 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 45 },
    { wch: 24 },
    { wch: 48 },
    { wch: 48 },
    { wch: 48 },
    { wch: 48 },
    { wch: 48 },
    { wch: 48 },
    { wch: 48 }
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscriptos')

  const fecha = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `inscriptos-bmx-academia-${fecha}.xlsx`)
}


const resultLabels = {
  diagnostico: 'Diagnóstico y medición',
  tecnica: 'Técnica en pista',
  fisico: 'Preparación física',
  mentalidad: 'Mentalidad competitiva',
  nutricion: 'Nutrición / hábitos',
  recomendaciones: 'Recomendaciones'
}

function cleanFileName(value = 'piloto') {
  return String(value || 'piloto')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'piloto'
}

function safePdfText(value) {
  const text = String(value ?? '').trim()
  return text || '-'
}

function addPdfPageIfNeeded(doc, y, needed = 18) {
  const pageHeight = doc.internal.pageSize.getHeight()

  if (y + needed <= pageHeight - 18) {
    return y
  }

  doc.addPage()
  return 18
}

function addPdfSectionTitle(doc, title, y) {
  y = addPdfPageIfNeeded(doc, y, 14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(227, 36, 36)
  doc.text(title, 16, y)
  doc.setDrawColor(227, 36, 36)
  doc.line(16, y + 2, 194, y + 2)
  return y + 9
}

function addPdfKeyValue(doc, label, value, y) {
  y = addPdfPageIfNeeded(doc, y, 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(`${label}:`, 16, y)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  const lines = doc.splitTextToSize(safePdfText(value), 118)
  doc.text(lines, 62, y)
  return y + Math.max(7, lines.length * 5)
}

function addPdfTextBlock(doc, title, value, y) {
  const text = safePdfText(value)

  if (text === '-') {
    return y
  }

  y = addPdfSectionTitle(doc, title, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(25, 25, 25)

  const lines = doc.splitTextToSize(text, 178)
  for (const line of lines) {
    y = addPdfPageIfNeeded(doc, y, 6)
    doc.text(line, 16, y)
    y += 5.6
  }

  return y + 5
}

async function imageUrlToDataUrl(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('No se pudo descargar la foto.')
  }

  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function descargarPdfPiloto(piloto) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 18

  doc.setFillColor(8, 8, 8)
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('Academia de Verano BMX 2027', 16, 18)

  doc.setFontSize(10)
  doc.setTextColor(227, 36, 36)
  doc.text('Perfil del piloto y devolución del evento', 16, 27)

  doc.setFontSize(9)
  doc.setTextColor(210, 210, 210)
  doc.text(`Generado: ${formatDate(Date.now())}`, 16, 36)

  y = 58
  let profileTextX = 16
  let profileBlockBottom = y

  if (piloto.fotoUrl) {
    try {
      const imageData = await imageUrlToDataUrl(piloto.fotoUrl)
      const imageFormat = String(imageData).startsWith('data:image/png') ? 'PNG' : 'JPEG'

      doc.setDrawColor(227, 36, 36)
      doc.setLineWidth(0.6)
      doc.rect(16, 54, 38, 38)
      doc.addImage(imageData, imageFormat, 18, 56, 34, 34)

      profileTextX = 62
      profileBlockBottom = 96
    } catch (error) {
      console.warn('No se pudo insertar la foto en el PDF:', error)
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(21)
  doc.setTextColor(20, 20, 20)
  doc.text(safePdfText(piloto.nombre), profileTextX, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(90, 90, 90)
  doc.text(`${safePdfText(piloto.categoria)} · ${safePdfText(piloto.ciudad)}`, profileTextX, y)

  y = Math.max(y + 14, profileBlockBottom)

  y = addPdfSectionTitle(doc, 'Datos del piloto', y)
  const datos = [
    ['Código de acceso', piloto.codigoAcceso],
    ['Edad', piloto.edad],
    ['WhatsApp', piloto.whatsapp],
    ['Email', piloto.email],
    ['Ciudad / Provincia', piloto.ciudad],
    ['Categoría / nivel', piloto.categoria],
    ['Club / equipo', piloto.club],
    ['Fecha de registro', formatDate(piloto.fechaRegistro)],
    ['Objetivo', piloto.objetivo]
  ]

  datos.forEach(([label, value]) => {
    y = addPdfKeyValue(doc, label, value, y)
  })

  y += 4
  y = addPdfTextBlock(doc, 'Devolución general', piloto.devolucion, y)

  const resultados = piloto.resultados || {}
  const hasResults = Object.values(resultados).some((value) => String(value || '').trim())

  if (hasResults) {
    y = addPdfSectionTitle(doc, 'Resultados y recomendaciones', y)

    Object.entries(resultLabels).forEach(([key, label]) => {
      const value = resultados[key]

      if (!String(value || '').trim()) {
        return
      }

      y = addPdfPageIfNeeded(doc, y, 12)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(227, 36, 36)
      doc.text(label, 16, y)
      y += 6

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(25, 25, 25)
      const lines = doc.splitTextToSize(String(value), 178)
      lines.forEach((line) => {
        y = addPdfPageIfNeeded(doc, y, 6)
        doc.text(line, 16, y)
        y += 5.4
      })
      y += 4
    })
  }

  if (!piloto.devolucionCargada && !hasResults) {
    y = addPdfTextBlock(
      doc,
      'Devolución del evento',
      'La devolución del evento todavía no fue cargada por la organización.',
      y
    )
  }

  const totalPages = doc.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(130, 130, 130)
    doc.text('Academia de Verano BMX 2027 · NexoTech', 16, 288)
    doc.text(`Página ${page} de ${totalPages}`, pageWidth - 36, 288)
  }

  const fileName = `devolucion-bmx-${cleanFileName(piloto.nombre)}-${cleanFileName(piloto.codigoAcceso)}.pdf`
  doc.save(fileName)
}

function AdminPage({ onGoHome }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loadingSession, setLoadingSession] = useState(true)
  const [loadingLogin, setLoadingLogin] = useState(false)
  const [message, setMessage] = useState('')
  const [inscripciones, setInscripciones] = useState([])
  const [loadingInscriptions, setLoadingInscriptions] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [savingPaymentId, setSavingPaymentId] = useState('')
  const [savingCodeId, setSavingCodeId] = useState('')
  const [savingFeedback, setSavingFeedback] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [adminNotice, setAdminNotice] = useState('')
  const [feedbackForm, setFeedbackForm] = useState(emptyFeedbackForm)

  useEffect(() => {
    const unsubscribe = escucharSesionAdmin(async (firebaseUser) => {
      setLoadingSession(true)
      setMessage('')

      if (!firebaseUser) {
        setUser(null)
        setIsAdmin(false)
        setInscripciones([])
        setSelectedId('')
        setLoadingSession(false)
        return
      }

      const admin = await esUsuarioAdmin(firebaseUser.uid)

      if (!admin) {
        setMessage('El usuario inició sesión, pero no está marcado como administrador.')
        await cerrarSesionAdmin()
        setUser(null)
        setIsAdmin(false)
        setLoadingSession(false)
        return
      }

      setUser(firebaseUser)
      setIsAdmin(true)
      setLoadingSession(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      return undefined
    }

    setLoadingInscriptions(true)

    const unsubscribe = escucharInscripciones(
      (items) => {
        setInscripciones(items)
        setLoadingInscriptions(false)

        if (!selectedId && items.length > 0) {
          setSelectedId(items[0].id)
        }
      },
      (error) => {
        console.error('Error cargando inscripciones:', error)
        setAdminNotice('No pudimos cargar las inscripciones. Revisá las reglas de Realtime Database.')
        setLoadingInscriptions(false)
      }
    )

    return () => unsubscribe()
  }, [isAdmin, selectedId])

  const selectedInscription = inscripciones.find((item) => item.id === selectedId) || null

  useEffect(() => {
    if (!selectedInscription) {
      setFeedbackForm(emptyFeedbackForm)
      return
    }

    setFeedbackForm({
      devolucion: selectedInscription.devolucion || '',
      resultados: {
        diagnostico: selectedInscription.resultados?.diagnostico || '',
        tecnica: selectedInscription.resultados?.tecnica || '',
        fisico: selectedInscription.resultados?.fisico || '',
        mentalidad: selectedInscription.resultados?.mentalidad || '',
        nutricion: selectedInscription.resultados?.nutricion || '',
        recomendaciones: selectedInscription.resultados?.recomendaciones || ''
      }
    })
  }, [selectedInscription?.id])

  const filteredInscriptions = inscripciones.filter((inscripcion) => {
    const normalizedSearch = search.trim().toLowerCase()
    const matchesSearch = !normalizedSearch || [
      inscripcion.nombre,
      inscripcion.email,
      inscripcion.whatsapp,
      inscripcion.ciudad,
      inscripcion.categoria,
      inscripcion.club,
      inscripcion.codigoAcceso
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch))

    const hasFeedback = Boolean(inscripcion.devolucionCargada)
    const matchesStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'pagos' && inscripcion.pagoConfirmado) ||
      (statusFilter === 'pendientes' && !inscripcion.pagoConfirmado) ||
      (statusFilter === 'devoluciones' && hasFeedback)

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: inscripciones.length,
    pagos: inscripciones.filter((item) => item.pagoConfirmado).length,
    pendientes: inscripciones.filter((item) => !item.pagoConfirmado).length,
    devoluciones: inscripciones.filter((item) => item.devolucionCargada).length
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoadingLogin(true)
    setMessage('')

    try {
      await iniciarSesionAdmin(email, password)
      setPassword('')
    } catch (error) {
      console.error('Error iniciando sesión admin:', error)
      setMessage('No pudimos iniciar sesión. Revisá el email y la contraseña.')
    } finally {
      setLoadingLogin(false)
    }
  }

  const handleLogout = async () => {
    await cerrarSesionAdmin()
  }

  const handleTogglePayment = async (inscripcion) => {
    setSavingPaymentId(inscripcion.id)
    setAdminNotice('')

    try {
      await actualizarPagoInscripcion(inscripcion, !inscripcion.pagoConfirmado)
      setAdminNotice(!inscripcion.pagoConfirmado ? 'Pago confirmado y acceso habilitado.' : 'Pago desmarcado y acceso deshabilitado.')
    } catch (error) {
      console.error('Error actualizando pago:', error)
      setAdminNotice('No pudimos actualizar el estado de pago.')
    } finally {
      setSavingPaymentId('')
    }
  }

  const handleCopyCode = async (inscripcion) => {
    setAdminNotice('')

    try {
      await navigator.clipboard.writeText(inscripcion.codigoAcceso)
      setAdminNotice(`Código copiado: ${inscripcion.codigoAcceso}`)
    } catch (error) {
      console.error('Error copiando código:', error)
      setAdminNotice(`No pudimos copiar automáticamente. Código: ${inscripcion.codigoAcceso}`)
    }
  }

  const handleMarkCodeDelivered = async (inscripcion) => {
    setSavingCodeId(inscripcion.id)
    setAdminNotice('')

    try {
      await actualizarCodigoEntregado(inscripcion, !inscripcion.codigoEntregado)
      setAdminNotice(!inscripcion.codigoEntregado ? 'Código marcado como entregado.' : 'Código marcado como no entregado.')
    } catch (error) {
      console.error('Error actualizando entrega de código:', error)
      setAdminNotice('No pudimos actualizar la entrega del código.')
    } finally {
      setSavingCodeId('')
    }
  }

  const handleFeedbackChange = (event) => {
    const { name, value } = event.target

    if (name === 'devolucion') {
      setFeedbackForm((prev) => ({ ...prev, devolucion: value }))
      return
    }

    setFeedbackForm((prev) => ({
      ...prev,
      resultados: {
        ...prev.resultados,
        [name]: value
      }
    }))
  }

  const handleSaveFeedback = async (event) => {
    event.preventDefault()

    if (!selectedInscription) {
      return
    }

    setSavingFeedback(true)
    setAdminNotice('')

    try {
      await guardarDevolucionPiloto(selectedInscription, feedbackForm)
      setAdminNotice('Devolución guardada correctamente.')
    } catch (error) {
      console.error('Error guardando devolución:', error)
      setAdminNotice('No pudimos guardar la devolución del piloto.')
    } finally {
      setSavingFeedback(false)
    }
  }


  const handleDeleteInscription = async (inscripcion) => {
    if (!inscripcion) {
      return
    }

    const confirmed = window.confirm(
      `¿Eliminar definitivamente a ${inscripcion.nombre}? Esta acción eliminará sus datos de inscripciones, códigos de acceso y portal de pilotos.`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(inscripcion.id)
    setAdminNotice('')

    try {
      await eliminarInscripcion(inscripcion)
      setSelectedId('')
      setAdminNotice('Piloto eliminado correctamente de Realtime Database.')
    } catch (error) {
      console.error('Error eliminando piloto:', error)
      setAdminNotice('No pudimos eliminar el piloto. Revisá las reglas de Realtime Database.')
    } finally {
      setDeletingId('')
    }
  }

  if (loadingSession) {
    return (
      <main className="adminPage">
        <section className="adminCard compact">
          <p className="sectionTag">Panel administrador</p>
          <h1>verificando acceso</h1>
          <p className="adminMuted">Estamos validando la sesión del administrador.</p>
        </section>
      </main>
    )
  }

  if (!user || !isAdmin) {
    return (
      <main className="adminPage">
        <nav className="adminTopbar">
          <a className="brand" href="/" onClick={(event) => { event.preventDefault(); onGoHome() }}>
            <span className="brandMark">BMX</span>
            <span>Academia 2027</span>
          </a>
        </nav>

        <section className="adminCard">
          <p className="sectionTag">Acceso privado</p>
          <h1>panel administrador</h1>
          <p className="adminMuted">
            Ingresá con el usuario administrador para gestionar pilotos, pagos y devoluciones del evento.
          </p>

          <form className="adminForm" onSubmit={handleLogin}>
            <label>
              Email administrador
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="admin@ejemplo.com"
                autoComplete="email"
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            <button className="btn primary full" type="submit" disabled={loadingLogin}>
              {loadingLogin ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {message && <p className="adminMessage error">{message}</p>}
        </section>
      </main>
    )
  }

  return (
    <main className="adminPage panel">
      <nav className="adminTopbar">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); onGoHome() }}>
          <span className="brandMark">BMX</span>
          <span>Academia 2027</span>
        </a>

        <button className="adminLogout" type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </nav>

      <section className="adminPanelHeader">
        <div>
          <p className="sectionTag">Administrador</p>
          <h1>pilotos inscriptos</h1>
          <p className="adminMuted">
            Desde este panel podés ver datos, confirmar pagos, copiar códigos de acceso y cargar devoluciones por piloto.
          </p>

          <div className="adminHeaderActions">
            <button
              className="adminMiniBtn export"
              type="button"
              onClick={() => exportarInscriptosExcel(inscripciones)}
              disabled={inscripciones.length === 0}
            >
              Descargar Excel
            </button>
          </div>
        </div>

        <div className="adminStatusGrid dashboardStats">
          <article>
            <span>Total</span>
            <strong>{stats.total}</strong>
          </article>
          <article>
            <span>Pagos confirmados</span>
            <strong>{stats.pagos}</strong>
          </article>
          <article>
            <span>Pendientes</span>
            <strong>{stats.pendientes}</strong>
          </article>
          <article>
            <span>Devoluciones</span>
            <strong>{stats.devoluciones}</strong>
          </article>
        </div>
      </section>

      {adminNotice && <p className="adminMessage notice">{adminNotice}</p>}

      <section className="adminWorkspace">
        <aside className="pilotListPanel">
          <div className="pilotFilters">
            <label>
              Buscar piloto
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre, email, ciudad o código"
              />
            </label>

            <label>
              Estado
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="todos">Todos</option>
                <option value="pagos">Pagos confirmados</option>
                <option value="pendientes">Pendientes de pago</option>
                <option value="devoluciones">Con devolución</option>
              </select>
            </label>
          </div>

          {loadingInscriptions && <p className="adminMuted small">Cargando inscripciones...</p>}

          {!loadingInscriptions && filteredInscriptions.length === 0 && (
            <div className="emptyState">
              <strong>No hay pilotos para mostrar</strong>
              <span>Cuando se inscriban o cambies los filtros, aparecerán acá.</span>
            </div>
          )}

          <div className="pilotList">
            {filteredInscriptions.map((inscripcion) => {
              const status = getStatusInfo(inscripcion)
              const isSelected = selectedId === inscripcion.id

              return (
                <button
                  className={`pilotListItem ${isSelected ? 'selected' : ''}`}
                  type="button"
                  key={inscripcion.id}
                  onClick={() => setSelectedId(inscripcion.id)}
                >
                  <img src={inscripcion.fotoUrl} alt={`Foto de ${inscripcion.nombre}`} />

                  <span>
                    <strong>{inscripcion.nombre}</strong>
                    <small>{inscripcion.categoria || 'Sin categoría'} · {inscripcion.ciudad || 'Sin ciudad'}</small>
                    <em className={`statusPill ${status.className}`}>{status.label}</em>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="pilotDetailPanel">
          {!selectedInscription && (
            <div className="emptyState large">
              <strong>Seleccioná un piloto</strong>
              <span>Elegí una inscripción de la lista para ver sus datos completos.</span>
            </div>
          )}

          {selectedInscription && (
            <>
              <div className="pilotDetailHero">
                <img src={selectedInscription.fotoUrl} alt={`Foto de ${selectedInscription.nombre}`} />

                <div>
                  <span className={`statusPill ${getStatusInfo(selectedInscription).className}`}>
                    {getStatusInfo(selectedInscription).label}
                  </span>
                  <h2>{selectedInscription.nombre}</h2>
                  <p>{selectedInscription.categoria} · {selectedInscription.ciudad}</p>
                </div>
              </div>

              <div className="pilotDataGrid">
                <article>
                  <span>Edad</span>
                  <strong>{selectedInscription.edad || '-'}</strong>
                </article>
                <article>
                  <span>WhatsApp</span>
                  <strong>{selectedInscription.whatsapp || '-'}</strong>
                </article>
                <article>
                  <span>Email</span>
                  <strong>{selectedInscription.email || '-'}</strong>
                </article>
                <article>
                  <span>Club / equipo</span>
                  <strong>{selectedInscription.club || '-'}</strong>
                </article>
                <article>
                  <span>Registro</span>
                  <strong>{formatDate(selectedInscription.createdAt || selectedInscription.fechaRegistro)}</strong>
                </article>
                <article>
                  <span>Objetivo</span>
                  <strong>{selectedInscription.objetivo || '-'}</strong>
                </article>
              </div>

              <div className="accessBox">
                <div>
                  <span>Código único</span>
                  <strong>{selectedInscription.codigoAcceso}</strong>
                  <small>
                    {selectedInscription.pagoConfirmado
                      ? 'El piloto tendrá acceso habilitado con este código.'
                      : 'El código existe, pero el acceso está bloqueado hasta confirmar el pago.'}
                  </small>
                </div>

                <div className="adminActions">
                  <button className="adminMiniBtn" type="button" onClick={() => handleCopyCode(selectedInscription)}>
                    Copiar código
                  </button>

                  <button
                    className="adminMiniBtn"
                    type="button"
                    onClick={() => handleTogglePayment(selectedInscription)}
                    disabled={savingPaymentId === selectedInscription.id}
                  >
                    {savingPaymentId === selectedInscription.id
                      ? 'Actualizando...'
                      : selectedInscription.pagoConfirmado
                        ? 'Desmarcar pago'
                        : 'Confirmar pago'}
                  </button>

                  <button
                    className="adminMiniBtn"
                    type="button"
                    onClick={() => handleMarkCodeDelivered(selectedInscription)}
                    disabled={savingCodeId === selectedInscription.id}
                  >
                    {savingCodeId === selectedInscription.id
                      ? 'Guardando...'
                      : selectedInscription.codigoEntregado
                        ? 'Código entregado'
                        : 'Marcar código entregado'}
                  </button>

                  {selectedInscription.pagoConfirmado && normalizeWhatsappNumber(selectedInscription.whatsapp) && (
                    <a
                      className="adminMiniBtn whatsapp"
                      href={`https://wa.me/${normalizeWhatsappNumber(selectedInscription.whatsapp)}?text=${encodeURIComponent(buildAccessCodeMessage(selectedInscription))}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Enviar por WhatsApp
                    </a>
                  )}

                  <button
                    className="adminMiniBtn danger"
                    type="button"
                    onClick={() => handleDeleteInscription(selectedInscription)}
                    disabled={deletingId === selectedInscription.id}
                  >
                    {deletingId === selectedInscription.id ? 'Eliminando...' : 'Eliminar piloto'}
                  </button>
                </div>
              </div>

              <form className="feedbackForm" onSubmit={handleSaveFeedback}>
                <div className="feedbackHeader">
                  <div>
                    <p className="sectionTag">Devolución del evento</p>
                    <h3>Cargar resultados</h3>
                  </div>
                  {selectedInscription.devolucionCargada && <span className="statusPill paid">devolución cargada</span>}
                </div>

                <label>
                  Devolución general
                  <textarea
                    name="devolucion"
                    value={feedbackForm.devolucion}
                    onChange={handleFeedbackChange}
                    rows="4"
                    placeholder="Resumen general del rendimiento, actitud, evolución y próximos pasos."
                  />
                </label>

                <div className="feedbackGrid">
                  <label>
                    Diagnóstico y medición
                    <textarea
                      name="diagnostico"
                      value={feedbackForm.resultados.diagnostico}
                      onChange={handleFeedbackChange}
                      rows="3"
                    />
                  </label>

                  <label>
                    Técnica en pista
                    <textarea
                      name="tecnica"
                      value={feedbackForm.resultados.tecnica}
                      onChange={handleFeedbackChange}
                      rows="3"
                    />
                  </label>

                  <label>
                    Preparación física
                    <textarea
                      name="fisico"
                      value={feedbackForm.resultados.fisico}
                      onChange={handleFeedbackChange}
                      rows="3"
                    />
                  </label>

                  <label>
                    Mentalidad competitiva
                    <textarea
                      name="mentalidad"
                      value={feedbackForm.resultados.mentalidad}
                      onChange={handleFeedbackChange}
                      rows="3"
                    />
                  </label>

                  <label>
                    Nutrición / hábitos
                    <textarea
                      name="nutricion"
                      value={feedbackForm.resultados.nutricion}
                      onChange={handleFeedbackChange}
                      rows="3"
                    />
                  </label>

                  <label>
                    Recomendaciones
                    <textarea
                      name="recomendaciones"
                      value={feedbackForm.resultados.recomendaciones}
                      onChange={handleFeedbackChange}
                      rows="3"
                    />
                  </label>
                </div>

                <button className="btn primary full" type="submit" disabled={savingFeedback}>
                  {savingFeedback ? 'Guardando devolución...' : 'Guardar devolución'}
                </button>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  )
}


function hasAnyResult(resultados = {}) {
  return Object.values(resultados).some((value) => String(value || '').trim())
}

function PilotAccessPage({ onGoHome }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle')
  const [piloto, setPiloto] = useState(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const handleCodeChange = (event) => {
    const formatted = formatAccessCode(event.target.value)
    setCode(formatted)
    setMessage('')
    setStatus('idle')
    setPiloto(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setStatus('idle')
    setPiloto(null)

    try {
      const result = await buscarPilotoPorCodigo(code)
      setStatus(result.status)

      if (!result.ok) {
        setMessage(result.message)
        return
      }

      setPiloto(result.piloto)
      setMessage('Acceso habilitado correctamente.')
    } catch (error) {
      console.error('Error buscando piloto por código:', error)
      setStatus('error')
      setMessage('No pudimos validar el código. Intentá nuevamente en unos minutos.')
    } finally {
      setLoading(false)
    }
  }


  const handleDownloadPdf = async () => {
    if (!piloto) {
      return
    }

    setDownloadingPdf(true)
    setMessage('')

    try {
      await descargarPdfPiloto(piloto)
    } catch (error) {
      console.error('Error generando PDF del piloto:', error)
      setStatus('error')
      setMessage('No pudimos generar el PDF. Intentá nuevamente en unos minutos.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <main className="pilotAccessPage">
      <nav className="adminTopbar">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); onGoHome() }}>
          <span className="brandMark">BMX</span>
          <span>Academia 2027</span>
        </a>

        <a className="adminLogout" href="/admin">
          Admin
        </a>
      </nav>

      <section className="accessIntro">
        <p className="sectionTag">Acceso piloto</p>
        <h1>tu perfil de la academia</h1>
        <p>
          Ingresá el código único que te entrega la organización una vez confirmado el pago. Allí vas a encontrar tus datos, tu foto de perfil y la devolución del evento.
        </p>
      </section>

      <section className="pilotAccessGrid">
        <form className="pilotCodeCard" onSubmit={handleSubmit}>
          <label>
            Código único
            <input
              value={code}
              onChange={handleCodeChange}
              required
              placeholder="BMX-ABCD-1234"
              autoComplete="off"
            />
          </label>

          <button className="btn primary full" type="submit" disabled={loading}>
            {loading ? 'Validando...' : 'Ingresar a mi perfil'}
          </button>

          {message && (
            <p className={`adminMessage ${status === 'enabled' ? 'notice' : 'error'}`}>
              {message}
            </p>
          )}
        </form>

        {!piloto && (
          <div className="pilotAccessEmpty">
            <strong>Acceso privado por código</strong>
            <span>
              Si tu pago todavía no fue confirmado, el sistema reconocerá el código pero mantendrá bloqueado el perfil hasta que el administrador habilite el acceso.
            </span>
          </div>
        )}

        {piloto && (
          <article className="pilotPortalCard">
            <div className="portalHero">
              <img src={piloto.fotoUrl} alt={`Foto de ${piloto.nombre}`} />
              <div>
                <span className="statusPill paid">acceso habilitado</span>
                <h2>{piloto.nombre}</h2>
                <p>{piloto.categoria || 'Sin categoría'} · {piloto.ciudad || 'Sin ciudad'}</p>
              </div>
            </div>

            <div className="portalActions">
              <button
                className="adminMiniBtn export"
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? 'Generando PDF...' : 'Descargar PDF'}
              </button>
            </div>

            <div className="pilotDataGrid portalData">
              <article>
                <span>Edad</span>
                <strong>{piloto.edad || '-'}</strong>
              </article>
              <article>
                <span>Club / equipo</span>
                <strong>{piloto.club || '-'}</strong>
              </article>
              <article>
                <span>Email</span>
                <strong>{piloto.email || '-'}</strong>
              </article>
              <article>
                <span>WhatsApp</span>
                <strong>{piloto.whatsapp || '-'}</strong>
              </article>
              <article>
                <span>Objetivo</span>
                <strong>{piloto.objetivo || '-'}</strong>
              </article>
              <article>
                <span>Código</span>
                <strong>{piloto.codigoAcceso}</strong>
              </article>
            </div>

            <section className="portalFeedback">
              <div className="feedbackHeader">
                <div>
                  <p className="sectionTag">Devolución del evento</p>
                  <h3>resultados y recomendaciones</h3>
                </div>

                {piloto.devolucionCargada ? (
                  <span className="statusPill paid">devolución cargada</span>
                ) : (
                  <span className="statusPill pending">pendiente</span>
                )}
              </div>

              {!piloto.devolucionCargada && (
                <p className="adminMuted">
                  Tu perfil ya está habilitado. La devolución del evento aparecerá acá cuando la organización la cargue.
                </p>
              )}

              {piloto.devolucion && (
                <article className="feedbackReadBlock mainFeedback">
                  <span>Devolución general</span>
                  <p>{piloto.devolucion}</p>
                </article>
              )}

              {hasAnyResult(piloto.resultados) && (
                <div className="feedbackReadGrid">
                  {Object.entries({
                    diagnostico: 'Diagnóstico y medición',
                    tecnica: 'Técnica en pista',
                    fisico: 'Preparación física',
                    mentalidad: 'Mentalidad competitiva',
                    nutricion: 'Nutrición / hábitos',
                    recomendaciones: 'Recomendaciones'
                  }).map(([key, label]) => (
                    piloto.resultados?.[key] ? (
                      <article className="feedbackReadBlock" key={key}>
                        <span>{label}</span>
                        <p>{piloto.resultados[key]}</p>
                      </article>
                    ) : null
                  ))}
                </div>
              )}
            </section>
          </article>
        )}
      </section>
    </main>
  )
}

function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const goHome = () => {
    window.history.pushState({}, '', '/')
    setPath('/')
  }

  if (path.startsWith('/admin')) {
    return <AdminPage onGoHome={goHome} />
  }

  if (path.startsWith('/acceso')) {
    return <PilotAccessPage onGoHome={goHome} />
  }

  return <LandingPage />
}

const rootElement = document.getElementById('root')

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

export default App
