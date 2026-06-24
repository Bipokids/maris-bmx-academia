import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
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

function saveInscription(data) {
  const key = 'maris_bmx_inscripciones'
  const current = JSON.parse(localStorage.getItem(key) || '[]')

  const newRecord = {
    ...data,
    id: createId(),
    fechaRegistro: new Date().toISOString()
  }

  localStorage.setItem(key, JSON.stringify([...current, newRecord]))
  return newRecord
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

function App() {
  const [form, setForm] = useState(initialForm)
  const [sent, setSent] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    if (sent) {
      setSent(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    saveInscription(form)
    setSent(true)

    const message = encodeURIComponent(buildWhatsappText(form))
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank')

    setForm(initialForm)
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

      <section className="titleBlock pilotSection">
        <p className="sectionTag">Academia de Verano de BMX 2027</p>

        <div className="pilotHighlight">
          <div className="pilotNameBox">
            <span className="pilotKicker">bicampeón olímpico de BMX Racing</span>

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
            Completá tus datos y te abrimos WhatsApp con el mensaje listo para
            pedir el PDF informativo. Esta primera versión guarda los registros
            localmente para pruebas; luego conectamos Firebase o Google Sheets.
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

        <form className="form" onSubmit={handleSubmit}>
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

          <button className="btn primary full" type="submit">
            Enviar y pedir PDF
          </button>

          {sent && (
            <p className="success">
              Registro guardado para prueba y WhatsApp abierto correctamente.
            </p>
          )}
        </form>
      </section>

      <footer>
  <div className="footerEvent">
    <strong>Academia de Verano BMX 2027</strong>
    <span>Buenos Aires, Argentina · Cupos limitados</span>
  </div>

  <div className="footerBrand">
    <span>Desarrollado por</span>
    <strong>NexoTech</strong>
  </div>
</footer>
    </main>
  )
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