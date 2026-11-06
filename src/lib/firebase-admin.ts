import fs from "fs";
import path from "path";
import * as admin from "firebase-admin";

const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), "service-account.json");

function hasServiceAccountFile(): boolean {
  try {
    return fs.existsSync(SERVICE_ACCOUNT_PATH);
  } catch {
    return false;
  }
}

export function isFirebaseAdminConfigured(): boolean {
  if (hasServiceAccountFile()) {
    return true;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  return Boolean(
    projectId &&
      clientEmail &&
      privateKey &&
      !privateKey.includes("SUA_CHAVE_PRIVADA_AQUI") &&
      privateKey.includes("BEGIN PRIVATE KEY")
  );
}

function getFirebaseAdminApp(): admin.app.App | null {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  try {
    if (hasServiceAccountFile()) {
      const rawJson = fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8");
      const serviceAccount = JSON.parse(rawJson) as admin.ServiceAccount;
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error("[FirebaseAdmin] Falha ao inicializar SDK Admin:", error);
    return null;
  }
}

export function getAdminDb(): admin.firestore.Firestore | null {
  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }
  return app.firestore();
}

export function getAdminAuth(): admin.auth.Auth | null {
  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }
  return app.auth();
}
