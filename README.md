# Academia de Verano BMX 2027 - Māris Štrombergs Argentina

Sitio web inicial creado con Vite + React.

## Cómo correrlo

```bash
npm install
npm run dev
```

## Fotos de Māris

Colocar las imágenes autorizadas en:

- `public/maris/maris-hero.jpg`
- `public/maris/maris-training.jpg`
- `public/maris/maris-track.jpg`

Importante: usar fotos propias, autorizadas por Māris/su equipo, o con licencia válida para uso promocional/comercial.

## Inscripciones

La primera versión guarda registros en `localStorage` para probar el flujo y abre WhatsApp con el mensaje listo.
Luego se puede reemplazar la función `saveInscription()` en `src/main.jsx` para guardar en:

- Firebase Realtime Database / Firestore
- Google Sheets mediante Apps Script
- Backend propio
