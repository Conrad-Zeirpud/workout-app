/**
 * Compresse une vidéo côté client en utilisant Canvas + MediaRecorder.
 *
 * Stratégie :
 * 1. Charge la vidéo source dans un <video> element (caché)
 * 2. Crée un <canvas> à la résolution cible (480p)
 * 3. À chaque frame, dessine la frame du video sur le canvas
 * 4. Capture le flux du canvas avec MediaRecorder en MP4/WebM
 * 5. Retourne le Blob compressé
 *
 * Limitations :
 * - Le navigateur doit supporter MediaRecorder (tous les navigateurs modernes)
 * - Sur iOS Safari, le format de sortie est WebM (sera converti par Supabase si besoin)
 * - Sur Chrome/Firefox/Edge, sortie en WebM aussi (compatibilité maximale)
 *
 * Note : on pourrait utiliser ffmpeg.wasm pour du vrai MP4 mais c'est ~25 Mo
 * de WASM à charger, overkill pour notre cas. WebM marche très bien sur tous les
 * navigateurs modernes et donne d'aussi bonnes vidéos.
 */

const TARGET_HEIGHT = 480       // 480p suffit largement pour un aperçu de mouvement
const TARGET_BITRATE = 800_000  // 800 Kbps : bonne qualité pour 480p
const MAX_DURATION_SEC = 10     // Cap à 10s, suffisant pour démontrer un mouvement

/**
 * Compresse une vidéo. Retourne un Blob.
 */
export async function compressVideo(file, onProgress) {
  if (!file) throw new Error('Pas de fichier')

  // Charger la vidéo source dans un élément <video> en mémoire
  const sourceUrl = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.src = sourceUrl
  video.muted = true
  video.playsInline = true
  video.crossOrigin = 'anonymous'

  // Attendre le chargement des métadonnées pour avoir width/height
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve
    video.onerror = () => reject(new Error('Impossible de lire la vidéo'))
  })

  // Calculer la résolution cible en gardant le ratio
  const ratio = video.videoWidth / video.videoHeight
  const targetH = Math.min(TARGET_HEIGHT, video.videoHeight)
  const targetW = Math.round(targetH * ratio / 2) * 2  // arrondi pair (requis pour H264/VP9)

  // Cap la durée
  const duration = Math.min(video.duration, MAX_DURATION_SEC)

  // Créer le canvas
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')

  // Démarrer la capture du canvas
  const stream = canvas.captureStream(30)  // 30 fps
  const mimeType = pickMimeType()
  if (!mimeType) throw new Error('Format vidéo non supporté par ton navigateur')

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: TARGET_BITRATE
  })

  const chunks = []
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      URL.revokeObjectURL(sourceUrl)
      const blob = new Blob(chunks, { type: mimeType })
      resolve({
        blob,
        mimeType,
        duration,
        width: targetW,
        height: targetH,
        sizeBytes: blob.size
      })
    }
    recorder.onerror = reject

    // Démarrer l'enregistrement
    recorder.start()

    // Lancer la lecture et boucler les frames
    video.currentTime = 0

    const draw = () => {
      if (video.currentTime >= duration || video.ended) {
        recorder.stop()
        return
      }
      ctx.drawImage(video, 0, 0, targetW, targetH)
      if (onProgress) {
        onProgress(Math.min(100, Math.round((video.currentTime / duration) * 100)))
      }
      requestAnimationFrame(draw)
    }

    video.onplaying = () => requestAnimationFrame(draw)
    video.onended = () => recorder.stop()
    video.play().catch(reject)
  })
}

/**
 * Détecte le meilleur format vidéo supporté par le navigateur courant.
 * MP4 H.264 si possible (compatibilité maximale + iOS), sinon WebM.
 */
function pickMimeType() {
  const candidates = [
    'video/mp4;codecs=h264',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ]
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c
  }
  return null
}

/**
 * Format human-readable d'une taille en octets
 */
export function formatBytes(bytes) {
  if (!bytes) return '0 o'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export const MAX_FILE_SIZE_MB = 50
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
