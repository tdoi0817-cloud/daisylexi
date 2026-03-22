// src/lib/adminFirestore.js — CRUD cho admin/CTV
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

// ══ STORY ══════════════════════════════════════════════════════
export async function createStory(data) {
  const ref = await addDoc(collection(db, 'stories'), {
    ...data,
    views: 0, rating: 0, ratingCount: 0,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateStory(storyId, data) {
  await updateDoc(doc(db, 'stories', storyId), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteStory(storyId) {
  await deleteDoc(doc(db, 'stories', storyId))
}

export async function getAllStories() {
  const snap = await getDocs(query(collection(db, 'stories'), orderBy('updatedAt','desc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ══ CHAPTER ════════════════════════════════════════════════════
export async function createChapter(storyId, data) {
  const ref = await addDoc(collection(db, 'stories', storyId, 'chapters'), {
    ...data,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  // Cập nhật updatedAt của story
  await updateDoc(doc(db, 'stories', storyId), { updatedAt: serverTimestamp() })
  return ref.id
}

export async function updateChapter(storyId, chapterId, data) {
  await updateDoc(doc(db, 'stories', storyId, 'chapters', chapterId), {
    ...data, updatedAt: serverTimestamp(),
  })
}

export async function deleteChapter(storyId, chapterId) {
  await deleteDoc(doc(db, 'stories', storyId, 'chapters', chapterId))
}

export async function getChaptersAdmin(storyId) {
  const snap = await getDocs(query(collection(db, 'stories', storyId, 'chapters'), orderBy('order','asc')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
