import { supabase } from './supabase'

const BUCKET = 'exercise-videos'

/**
 * Upload une vidéo (Blob) sur Supabase Storage et retourne l'URL publique.
 *
 * @param {string} exerciseId - id de l'exercice (utilisé pour nommer le fichier)
 * @param {Blob} blob - le fichier vidéo compressé
 * @param {string} mimeType - mime type (video/mp4 ou video/webm)
 * @returns {Promise<{publicUrl: string, path: string}>}
 */
export async function uploadExerciseVideo(exerciseId, blob, mimeType) {
  // Extension selon le mime type
  const ext = mimeType.includes('webm') ? 'webm' : 'mp4'

  // Nom de fichier déterministe : permet de remplacer simplement en upsert
  const path = `${exerciseId}.${ext}`

  // Upload (upsert = remplace si existe déjà)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: mimeType,
      upsert: true,
      cacheControl: '3600'
    })

  if (error) throw error

  // Récupérer l'URL publique
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  if (!urlData?.publicUrl) throw new Error('URL publique introuvable')

  // Append timestamp pour bypasser le cache navigateur lors d'une mise à jour
  const cacheBust = `?v=${Date.now()}`

  return {
    publicUrl: urlData.publicUrl + cacheBust,
    path
  }
}

/**
 * Supprime une vidéo du bucket
 */
export async function deleteExerciseVideo(exerciseId) {
  // On essaie les deux extensions possibles
  const paths = [`${exerciseId}.mp4`, `${exerciseId}.webm`]
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) throw error
}
