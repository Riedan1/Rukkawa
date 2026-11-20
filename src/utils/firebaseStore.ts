import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer,
  serverTimestamp,
  type Firestore
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { auth } from "./googleSheets";

// Check if credentials are placeholders or dummy demo values
export const isPlaceholderConfig = !firebaseConfig.apiKey || 
  firebaseConfig.apiKey.includes("Placeholder") || 
  firebaseConfig.apiKey.startsWith("AIzaSyDemo") ||
  firebaseConfig.projectId === "algerian-commerce-map";

// Silence internal @firebase/firestore WebChannel timeout console.error spam in iframe/offline environments
try {
  setLogLevel("silent");
} catch (_) {}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use initializeFirestore with experimentalAutoDetectLongPolling and databaseId so iframe/proxy connections don't hang
function initFirestoreDb(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = initFirestoreDb();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isTransientOffline =
    errMsg.includes("client is offline") ||
    errMsg.includes("Could not reach Cloud Firestore backend") ||
    errMsg.includes("unavailable");

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  if (isTransientOffline) {
    console.warn("Firestore operating in offline fallback mode:", errInfo.path);
  } else {
    console.warn("Firestore Error:", JSON.stringify(errInfo));
  }
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection() {
  if (isPlaceholderConfig) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      // Client is temporarily offline or WebChannel is initializing; operate gracefully with local fallback
      console.warn("Firestore client is currently offline; operating with local persistence fallback.");
    }
  }
}

testFirestoreConnection();

// Save authenticated user profile to Firestore (/users/{uid})
export async function saveUserProfileToFirestore(profile: {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  authProvider: "google" | "password";
}): Promise<void> {
  if (!profile.uid || isPlaceholderConfig) return;
  const cleanUid = profile.uid.slice(0, 128);
  const cleanName = (profile.name || "YUME Member").trim().slice(0, 120);
  const cleanEmail = profile.email.trim().toLowerCase().slice(0, 254);
  const cleanPhoto = (profile.photoURL || "").trim().slice(0, 1024);

  const path = `users/${cleanUid}`;
  try {
    await setDoc(doc(db, "users", cleanUid), {
      uid: cleanUid,
      name: cleanName,
      email: cleanEmail,
      photoURL: cleanPhoto,
      authProvider: profile.authProvider,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch (_) {}
  }
}

export function isCurrentUserAdmin(): boolean {
  return Boolean(
    auth.currentUser &&
    auth.currentUser.emailVerified &&
    auth.currentUser.email === "th3p2014@gmail.com"
  );
}

// Save the user's wishlist with reliable local persistence fallback
export async function saveWishlistToFirestore(userId: string, productIds: string[]): Promise<void> {
  if (!userId) return;
  
  const boundedIds = productIds.slice(0, 200).map((id) => String(id).slice(0, 128));

  // Local cache persistence
  try {
    localStorage.setItem(`yume_wishlist_${userId}`, JSON.stringify(boundedIds));
  } catch (_) {}

  const firebaseUid = auth.currentUser?.uid;
  if (isPlaceholderConfig || !firebaseUid || !auth.currentUser?.emailVerified) return;

  const path = `wishlists/${firebaseUid}`;
  try {
    await setDoc(doc(db, "wishlists", firebaseUid), {
      productIds: boundedIds,
      updatedAt: new Date().toISOString().slice(0, 64),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch (_) {}
  }
}

// Load the user's wishlist with reliable local persistence fallback
export async function loadWishlistFromFirestore(userId: string): Promise<string[] | null> {
  if (!userId) return null;

  // Check local cache first
  try {
    const cached = localStorage.getItem(`yume_wishlist_${userId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}

  const firebaseUid = auth.currentUser?.uid;
  if (isPlaceholderConfig || !firebaseUid || !auth.currentUser?.emailVerified) return [];

  const path = `wishlists/${firebaseUid}`;
  try {
    const docSnap = await getDoc(doc(db, "wishlists", firebaseUid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      const productIds = data.productIds || [];
      try {
        localStorage.setItem(`yume_wishlist_${userId}`, JSON.stringify(productIds));
      } catch (_) {}
      return productIds;
    }
    return [];
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.GET, path);
    } catch (_) {}
    return [];
  }
}
