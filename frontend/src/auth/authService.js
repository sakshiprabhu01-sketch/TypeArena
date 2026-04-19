import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";

const provider = new GoogleAuthProvider();

function getDefaultUsername(user) {
  return user.displayName || user.email?.split("@")[0] || "User";
}

function getProfileRef(uid) {
  return doc(db, "users", uid);
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}


async function ensureUserProfileDocument(user) {
  if (!user?.uid) return null;

  const ref = getProfileRef(user.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    const profile = {
      username: getDefaultUsername(user),
      email: user.email || "",
      wpm: 0, 
      battlesPlayed: 0,
      streak: 0,
      lastActiveDate: null,
      socialLinks: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, profile, { merge: true });
    return profile;
  }

  return snapshot.data();
}


export async function updateUserStreak(uid) {
  if (!uid) return;

  const ref = getProfileRef(uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data();
  const today = getTodayDate();

  if (data.lastActiveDate === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak = 1;

  if (data.lastActiveDate === yesterdayStr) {
    newStreak = (data.streak || 0) + 1;
  }

  await setDoc(
    ref,
    {
      streak: newStreak,
      lastActiveDate: today,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  await ensureUserProfileDocument(result.user);
  await updateUserStreak(result.user.uid);
  return result.user;
}

export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfileDocument(result.user);
  await updateUserStreak(result.user.uid);
  return result.user;
}

export async function signUpWithEmail(email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const username = getDefaultUsername(result.user);

  await updateProfile(result.user, { displayName: username });

  await ensureUserProfileDocument(result.user);

  await setDoc(
    getProfileRef(result.user.uid),
    {
      username,
      email: result.user.email || email,
      wpm: 0,
      battlesPlayed: 0,
      streak: 1,
      lastActiveDate: getTodayDate(),
      socialLinks: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return result.user;
}

export async function ensureUserProfile(user) {
  return ensureUserProfileDocument(user);
}


export function subscribeToUserProfile(uid, onChange) {
  if (!uid) return () => {};

  const ref = getProfileRef(uid);

  return onSnapshot(
    ref,
    (snapshot) => {
      onChange(snapshot.exists() ? snapshot.data() : null);
    },
    (error) => {
      console.error(error);
      onChange(null);
    }
  );
}


export async function updateUserProfile(uid, updates) {
  if (!uid) return;

  await setDoc(
    getProfileRef(uid),
    {
      ...updates,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}


export async function recordPracticeResult(uid, wpm) {
  if (!uid) return;

  const profileRef = getProfileRef(uid);
  const snapshot = await getDoc(profileRef);

  const currentBest = Number(snapshot.data()?.wpm || 0);
  const nextWpm = Number.isFinite(Number(wpm)) ? Number(wpm) : 0;

  const newBest = Math.max(currentBest, nextWpm);

  await setDoc(
    profileRef,
    {
      wpm: newBest,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await updateUserStreak(uid);
}


export async function recordBattleResult(uid, wpm) {
  if (!uid) return;

  const nextWpm = Number.isFinite(Number(wpm)) ? Number(wpm) : 0;

  await setDoc(
    getProfileRef(uid),
    {
      battlesPlayed: increment(1),
      lastBattleWpm: nextWpm,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await updateUserStreak(uid);
}