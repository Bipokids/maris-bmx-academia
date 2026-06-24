import { initializeApp } from 'firebase/app'
import {
  getDatabase,
  ref as dbRef,
  push,
  update,
  get,
  onValue,
  serverTimestamp
} from 'firebase/database'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyC6yN-FdiRYS9C2RMsj6Guv3KRG1W5yipU',
  authDomain: 'bmx-academia.firebaseapp.com',
  databaseURL: 'https://bmx-academia-default-rtdb.firebaseio.com',
  projectId: 'bmx-academia',
  storageBucket: 'bmx-academia.firebasestorage.app',
  messagingSenderId: '183595329815',
  appId: '1:183595329815:web:f6752aebed33b71a166f52'
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const storage = getStorage(app)
const auth = getAuth(app)

function sanitizeFileExtension(fileName = '') {
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'webp']

  return allowed.includes(extension) ? extension : 'jpg'
}

function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const values = new Uint32Array(8)
  window.crypto.getRandomValues(values)

  const code = Array.from(values, (value) => chars[value % chars.length]).join('')
  return `BMX-${code.slice(0, 4)}-${code.slice(4)}`
}

function normalizeAccessCode(code = '') {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^BMX/, '')
}

export function formatAccessCode(code = '') {
  const normalized = normalizeAccessCode(code)

  if (!normalized) {
    return ''
  }

  const sliced = normalized.slice(0, 8)

  if (sliced.length <= 4) {
    return `BMX-${sliced}`
  }

  return `BMX-${sliced.slice(0, 4)}-${sliced.slice(4)}`
}

function orderByCreatedAt(a, b) {
  const dateA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.fechaRegistro || 0).getTime()
  const dateB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.fechaRegistro || 0).getTime()
  return dateB - dateA
}

function buildPortalPayload(inscripcion, overrides = {}) {
  const resultados = overrides.resultados || inscripcion.resultados || {
    diagnostico: '',
    tecnica: '',
    fisico: '',
    mentalidad: '',
    nutricion: '',
    recomendaciones: ''
  }

  return {
    id: inscripcion.id,
    codigoAcceso: inscripcion.codigoAcceso,
    habilitado: Boolean(overrides.habilitado ?? inscripcion.accesoHabilitado),
    pagoConfirmado: Boolean(overrides.pagoConfirmado ?? inscripcion.pagoConfirmado),
    estado: overrides.estado || inscripcion.estado || 'pendiente_pago',
    nombre: inscripcion.nombre || '',
    edad: Number(inscripcion.edad || 0),
    whatsapp: inscripcion.whatsapp || '',
    email: inscripcion.email || '',
    ciudad: inscripcion.ciudad || '',
    categoria: inscripcion.categoria || '',
    club: inscripcion.club || '',
    objetivo: inscripcion.objetivo || '',
    fotoUrl: inscripcion.fotoUrl || '',
    devolucion: overrides.devolucion ?? inscripcion.devolucion ?? '',
    devolucionCargada: Boolean(overrides.devolucionCargada ?? inscripcion.devolucionCargada),
    resultados,
    fechaRegistro: inscripcion.fechaRegistro || '',
    updatedAt: serverTimestamp()
  }
}

export async function guardarInscripcion(data, fotoFile) {
  if (!fotoFile) {
    throw new Error('La foto del piloto es obligatoria.')
  }

  const inscripcionRef = push(dbRef(database, 'inscripciones'))
  const id = inscripcionRef.key
  const codigoAcceso = generateAccessCode()

  const extension = sanitizeFileExtension(fotoFile.name)
  const fotoPath = `inscripciones/${id}/foto-perfil.${extension}`
  const fotoStorageRef = storageRef(storage, fotoPath)

  await uploadBytes(fotoStorageRef, fotoFile, {
    contentType: fotoFile.type || 'image/jpeg'
  })

  const fotoUrl = await getDownloadURL(fotoStorageRef)

  const record = {
    id,
    codigoAcceso,
    nombre: data.nombre.trim(),
    edad: Number(data.edad),
    whatsapp: data.whatsapp.trim(),
    email: data.email.trim().toLowerCase(),
    ciudad: data.ciudad.trim(),
    categoria: data.categoria.trim(),
    club: data.club.trim(),
    objetivo: data.objetivo.trim(),
    acepta: Boolean(data.acepta),
    fotoUrl,
    fotoPath,
    estado: 'pendiente_pago',
    pagoConfirmado: false,
    accesoHabilitado: false,
    codigoEntregado: false,
    devolucion: '',
    devolucionCargada: false,
    resultados: {
      diagnostico: '',
      tecnica: '',
      fisico: '',
      mentalidad: '',
      nutricion: '',
      recomendaciones: ''
    },
    origen: 'landing-maris-bmx',
    fechaRegistro: new Date().toISOString(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  const updates = {
    [`inscripciones/${id}`]: record,
    [`codigosAcceso/${codigoAcceso}`]: {
      habilitado: false,
      pagoConfirmado: false,
      estado: 'pendiente_pago',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  }

  await update(dbRef(database), updates)

  return record
}

export function iniciarSesionAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password)
}

export function cerrarSesionAdmin() {
  return signOut(auth)
}

export function escucharSesionAdmin(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function esUsuarioAdmin(uid) {
  if (!uid) {
    return false
  }

  const snapshot = await get(dbRef(database, `admins/${uid}`))
  return snapshot.exists() && snapshot.val() === true
}

export function escucharInscripciones(callback, onError) {
  return onValue(
    dbRef(database, 'inscripciones'),
    (snapshot) => {
      const data = snapshot.val() || {}
      const inscripciones = Object.values(data).sort(orderByCreatedAt)
      callback(inscripciones)
    },
    (error) => {
      if (onError) {
        onError(error)
      }
    }
  )
}

export async function actualizarPagoInscripcion(inscripcion, pagoConfirmado) {
  if (!inscripcion?.id || !inscripcion?.codigoAcceso) {
    throw new Error('No se encontró el ID o el código de acceso de la inscripción.')
  }

  const estado = pagoConfirmado ? 'pago_confirmado' : 'pendiente_pago'
  const portalPayload = buildPortalPayload(inscripcion, {
    habilitado: pagoConfirmado,
    pagoConfirmado,
    estado
  })

  const updates = {
    [`inscripciones/${inscripcion.id}/pagoConfirmado`]: pagoConfirmado,
    [`inscripciones/${inscripcion.id}/accesoHabilitado`]: pagoConfirmado,
    [`inscripciones/${inscripcion.id}/estado`]: estado,
    [`inscripciones/${inscripcion.id}/updatedAt`]: serverTimestamp(),
    [`codigosAcceso/${inscripcion.codigoAcceso}/habilitado`]: pagoConfirmado,
    [`codigosAcceso/${inscripcion.codigoAcceso}/pagoConfirmado`]: pagoConfirmado,
    [`codigosAcceso/${inscripcion.codigoAcceso}/estado`]: estado,
    [`codigosAcceso/${inscripcion.codigoAcceso}/updatedAt`]: serverTimestamp(),
    [`portalPilotos/${inscripcion.codigoAcceso}`]: portalPayload
  }

  await update(dbRef(database), updates)
}

export async function actualizarCodigoEntregado(inscripcion, codigoEntregado) {
  if (!inscripcion?.id) {
    throw new Error('No se encontró la inscripción.')
  }

  await update(dbRef(database), {
    [`inscripciones/${inscripcion.id}/codigoEntregado`]: codigoEntregado,
    [`inscripciones/${inscripcion.id}/updatedAt`]: serverTimestamp()
  })
}

export async function guardarDevolucionPiloto(inscripcion, payload) {
  if (!inscripcion?.id || !inscripcion?.codigoAcceso) {
    throw new Error('No se encontró la inscripción.')
  }

  const resultados = {
    diagnostico: payload.resultados?.diagnostico?.trim() || '',
    tecnica: payload.resultados?.tecnica?.trim() || '',
    fisico: payload.resultados?.fisico?.trim() || '',
    mentalidad: payload.resultados?.mentalidad?.trim() || '',
    nutricion: payload.resultados?.nutricion?.trim() || '',
    recomendaciones: payload.resultados?.recomendaciones?.trim() || ''
  }

  const devolucion = payload.devolucion?.trim() || ''
  const devolucionCargada = Boolean(devolucion) || Object.values(resultados).some(Boolean)
  const portalPayload = buildPortalPayload(inscripcion, {
    devolucion,
    resultados,
    devolucionCargada,
    habilitado: Boolean(inscripcion.accesoHabilitado),
    pagoConfirmado: Boolean(inscripcion.pagoConfirmado),
    estado: inscripcion.estado || 'pendiente_pago'
  })

  await update(dbRef(database), {
    [`inscripciones/${inscripcion.id}/devolucion`]: devolucion,
    [`inscripciones/${inscripcion.id}/resultados`]: resultados,
    [`inscripciones/${inscripcion.id}/devolucionCargada`]: devolucionCargada,
    [`inscripciones/${inscripcion.id}/updatedAt`]: serverTimestamp(),
    [`portalPilotos/${inscripcion.codigoAcceso}`]: portalPayload
  })
}

export async function buscarPilotoPorCodigo(rawCode) {
  const codigoAcceso = formatAccessCode(rawCode)

  if (!codigoAcceso || codigoAcceso.length < 12) {
    return {
      ok: false,
      status: 'invalid',
      message: 'Ingresá un código válido.'
    }
  }

  const codeSnapshot = await get(dbRef(database, `codigosAcceso/${codigoAcceso}`))

  if (!codeSnapshot.exists()) {
    return {
      ok: false,
      status: 'not_found',
      message: 'No encontramos una inscripción asociada a ese código.'
    }
  }

  const codeData = codeSnapshot.val()

  if (!codeData.habilitado || !codeData.pagoConfirmado) {
    return {
      ok: false,
      status: 'pending_payment',
      message: 'Tu inscripción está registrada, pero el acceso todavía no está habilitado. La organización debe confirmar el pago.'
    }
  }

  const portalSnapshot = await get(dbRef(database, `portalPilotos/${codigoAcceso}`))

  if (!portalSnapshot.exists()) {
    return {
      ok: false,
      status: 'portal_missing',
      message: 'El pago está confirmado, pero todavía falta preparar tu perfil. Avisá a la organización.'
    }
  }

  const piloto = portalSnapshot.val()

  if (!piloto.habilitado || !piloto.pagoConfirmado) {
    return {
      ok: false,
      status: 'blocked',
      message: 'El acceso a este perfil todavía no está habilitado.'
    }
  }

  return {
    ok: true,
    status: 'enabled',
    piloto
  }
}

export { app, database, storage, auth }
