// src/lib/storage.js — Firebase Storage upload helpers
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

/**
 * Upload ảnh bìa truyện
 * @param {File}   file
 * @param {string} storyId
 * @param {fn}     onProgress  (0–100)
 * @returns {Promise<string>}  download URL
 */
export async function uploadCover(file, storyId, onProgress) {
  const path     = `stories/${storyId}/cover_${Date.now()}.${file.name.split('.').pop()}`
  const storageRef = ref(storage, path)
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type })
    task.on('state_changed',
      snap => onProgress && onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    )
  })
}

/**
 * Upload ảnh chapter (nhiều file)
 * @param {File[]} files
 * @param {string} storyId
 * @param {string} chapterId
 * @param {fn}     onProgress
 * @returns {Promise<string[]>}  mảng download URLs theo thứ tự
 */
export async function uploadChapterImages(files, storyId, chapterId, onProgress) {
  const urls = []
  for (let i = 0; i < files.length; i++) {
    const f    = files[i]
    const path = `stories/${storyId}/chapters/${chapterId}/${String(i+1).padStart(3,'0')}_${Date.now()}.${f.name.split('.').pop()}`
    const url  = await new Promise((resolve, reject) => {
      const task = uploadBytesResumable(ref(storage, path), f, { contentType: f.type })
      task.on('state_changed',
        snap => onProgress && onProgress(i, files.length, Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      )
    })
    urls.push(url)
  }
  return urls
}

/**
 * Upload thumbnail chapter nhỏ
 */
export async function uploadThumbnail(file, storyId, chapterId) {
  const path = `stories/${storyId}/chapters/${chapterId}/thumb_${Date.now()}.${file.name.split('.').pop()}`
  const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type })
  await new Promise((res, rej) => task.on('state_changed', null, rej, res))
  return getDownloadURL(task.snapshot.ref)
}

export async function deleteFile(url) {
  try { await deleteObject(ref(storage, url)) } catch (_) {}
}
