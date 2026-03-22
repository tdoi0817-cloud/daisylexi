// src/lib/firestore.js
// ─── Toàn bộ Firestore operations ──────────────────────────────
import {
  collection, doc,
  getDocs, getDoc, addDoc, setDoc, updateDoc,
  query, where, orderBy, limit,
  serverTimestamp, increment,
} from 'firebase/firestore'
import { db } from './firebase'

// ══════════════════════════════════════════════════════
//  STORIES
// ══════════════════════════════════════════════════════

/** Lấy danh sách truyện, sắp xếp theo views */
export async function getStories({ genre = null, limitN = 20 } = {}) {
  let q = query(
    collection(db, 'stories'),
    orderBy('views', 'desc'),
    limit(limitN)
  )
  if (genre) {
    q = query(collection(db, 'stories'), where('genres', 'array-contains', genre), orderBy('views', 'desc'), limit(limitN))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/** Lấy 1 truyện theo id */
export async function getStory(storyId) {
  const snap = await getDoc(doc(db, 'stories', storyId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/** Tăng view count */
export async function incrementView(storyId) {
  await updateDoc(doc(db, 'stories', storyId), { views: increment(1) })
}

// ══════════════════════════════════════════════════════
//  CHAPTERS
// ══════════════════════════════════════════════════════

/** Lấy tất cả chapter của 1 truyện */
export async function getChapters(storyId) {
  const q    = query(collection(db, 'stories', storyId, 'chapters'), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/** Lấy 1 chapter (bao gồm mảng imageUrls) */
export async function getChapter(storyId, chapterId) {
  const snap = await getDoc(doc(db, 'stories', storyId, 'chapters', chapterId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ══════════════════════════════════════════════════════
//  UNLOCK — ghi nhận user đã mở khoá chapter
// ══════════════════════════════════════════════════════

/** Kiểm tra user đã mở khoá chapter chưa */
export async function isChapterUnlocked(uid, storyId, chapterId) {
  const ref  = doc(db, 'users', uid, 'unlocked', `${storyId}_${chapterId}`)
  const snap = await getDoc(ref)
  return snap.exists()
}

/** Ghi nhận mở khoá + trừ xu (transaction đơn giản) */
export async function unlockChapter(uid, storyId, chapterId, cost) {
  // Trừ xu
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, { coins: increment(-cost) })
  // Ghi nhận unlock
  await setDoc(doc(db, 'users', uid, 'unlocked', `${storyId}_${chapterId}`), {
    unlockedAt: serverTimestamp(),
    cost,
  })
}

// ══════════════════════════════════════════════════════
//  COMMENTS
// ══════════════════════════════════════════════════════

/** Lấy comment của 1 chapter */
export async function getComments(storyId, chapterId, limitN = 30) {
  const q    = query(
    collection(db, 'stories', storyId, 'chapters', chapterId, 'comments'),
    orderBy('createdAt', 'desc'),
    limit(limitN)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/** Thêm comment mới */
export async function addComment(storyId, chapterId, { uid, displayName, photoURL, text }) {
  await addDoc(
    collection(db, 'stories', storyId, 'chapters', chapterId, 'comments'),
    { uid, displayName, photoURL, text, likes: 0, createdAt: serverTimestamp() }
  )
}

/** Like/unlike comment */
export async function likeComment(storyId, chapterId, commentId, delta) {
  const ref = doc(db, 'stories', storyId, 'chapters', chapterId, 'comments', commentId)
  await updateDoc(ref, { likes: increment(delta) })
}

// ══════════════════════════════════════════════════════
//  FIRESTORE SCHEMA (tài liệu tham khảo)
// ══════════════════════════════════════════════════════
/*
stories/{storyId}
  title:       string
  description: string
  coverUrl:    string       ← Firebase Storage URL
  team:        string
  genres:      string[]
  views:       number
  rating:      number
  updatedAt:   timestamp

  chapters/{chapterId}
    title:     string
    order:     number       ← số thứ tự, dùng để sort
    locked:    boolean
    coinCost:  number       ← 0 nếu miễn phí
    imageUrls: string[]     ← mảng URL ảnh từ Storage
    createdAt: timestamp

    comments/{commentId}
      uid:         string
      displayName: string
      photoURL:    string
      text:        string
      likes:       number
      createdAt:   timestamp

users/{uid}
  displayName: string
  email:       string
  photoURL:    string
  coins:       number
  role:        'reader' | 'ctv' | 'admin'
  createdAt:   timestamp

  unlocked/{storyId_chapterId}
    unlockedAt: timestamp
    cost:       number
*/
