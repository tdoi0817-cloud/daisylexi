// src/lib/admin.js — Tất cả operations cho Admin/CTV
import {
  collection, doc,
  getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, limit, serverTimestamp,
  ref as storageRef,
} from 'firebase/firestore'
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject
} from 'firebase/storage'
import { db, storage } from './firebase'

// ══════════════════════════════════════════════════
//  ROLES:  reader | ctv | admin
//  reader  → chỉ đọc
//  ctv     → upload/edit truyện của mình
//  admin   → full quyền: quản lý user, xoá, phân quyền
// ══════════════════════════════════════════════════

// ── Lấy role của user ──
export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data().role ?? 'reader') : 'reader'
}

// ── Set role (chỉ admin gọi được, Firestore rules bảo vệ) ──
export async function setUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), { role })
}

// ── Lấy danh sách users (admin only) ──
export async function getUsers(limitN = 50) {
  const q    = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(limitN))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ══════════════════════════════════════════════════
//  STORY CRUD
// ══════════════════════════════════════════════════

export async function createStory(data, coverFile) {
  let coverUrl = data.coverUrl || ''
  if (coverFile) coverUrl = await uploadImage(coverFile, `stories/covers/${Date.now()}_${coverFile.name}`)
  const ref = await addDoc(collection(db, 'stories'), {
    ...data, coverUrl,
    views: 0, rating: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateStory(storyId, data, newCoverFile) {
  let coverUrl = data.coverUrl
  if (newCoverFile) coverUrl = await uploadImage(newCoverFile, `stories/covers/${storyId}_${Date.now()}`)
  await updateDoc(doc(db, 'stories', storyId), {
    ...data, coverUrl, updatedAt: serverTimestamp(),
  })
}

export async function deleteStory(storyId) {
  // Xoá document (chapters sẽ bị orphaned — có thể dùng Cloud Function để clean)
  await deleteDoc(doc(db, 'stories', storyId))
}

// ══════════════════════════════════════════════════
//  CHAPTER CRUD
// ══════════════════════════════════════════════════

export async function createChapter(storyId, data, imageFiles = [], thumbnailFile = null) {
  // Upload ảnh pages
  const imageUrls = await Promise.all(
    imageFiles.map((f, i) => uploadImage(f, `stories/${storyId}/chapters/${Date.now()}_${i}_${f.name}`))
  )
  // Upload thumbnail
  let thumbnailUrl = ''
  if (thumbnailFile) thumbnailUrl = await uploadImage(thumbnailFile, `stories/${storyId}/thumbs/${Date.now()}_${thumbnailFile.name}`)

  await addDoc(collection(db, 'stories', storyId, 'chapters'), {
    ...data, imageUrls, thumbnailUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // Cập nhật updatedAt của story
  await updateDoc(doc(db, 'stories', storyId), { updatedAt: serverTimestamp() })
}

export async function updateChapter(storyId, chapterId, data, newImageFiles = [], newThumbnailFile = null) {
  let updates = { ...data, updatedAt: serverTimestamp() }
  if (newImageFiles.length) {
    updates.imageUrls = await Promise.all(
      newImageFiles.map((f, i) => uploadImage(f, `stories/${storyId}/chapters/${chapterId}_${i}_${f.name}`))
    )
  }
  if (newThumbnailFile) {
    updates.thumbnailUrl = await uploadImage(newThumbnailFile, `stories/${storyId}/thumbs/${chapterId}_${Date.now()}`)
  }
  await updateDoc(doc(db, 'stories', storyId, 'chapters', chapterId), updates)
}

export async function deleteChapter(storyId, chapterId) {
  await deleteDoc(doc(db, 'stories', storyId, 'chapters', chapterId))
}

// ══════════════════════════════════════════════════
//  STORAGE UPLOAD (với progress callback)
// ══════════════════════════════════════════════════

export function uploadImage(file, path, onProgress = null) {
  return new Promise((resolve, reject) => {
    const storageReference = ref(storage, path)
    const task = uploadBytesResumable(storageReference, file)
    task.on('state_changed',
      snap => onProgress && onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    )
  })
}
