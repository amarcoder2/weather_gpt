import pkg from '@next/env';
const { loadEnvConfig } = pkg;
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

// Load environment variables from .env.local
loadEnvConfig(process.cwd());

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('===============================================================');
console.log('WEATHERGPT — FINAL LIVE FIRESTORE VERIFICATION');
console.log('Target Firebase Project:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);
console.log('===============================================================\n');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const testNonce = Date.now();
const testEmail = `sih.final.verifier.${testNonce}@weathergpt.gov.in`;
const testPassword = `Sih2026!VerifiedPass#${Math.floor(Math.random() * 90000 + 10000)}`;

const report = {};

async function runTest() {
  let createdUser = null;
  let userUid = null;
  let chatSessionDocId = null;

  try {
    // ------------------------------------------------------------------------
    // CHECK 1: Authenticated test user creation
    // ------------------------------------------------------------------------
    console.log('[CHECK 1] Creating authenticated test user via Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    createdUser = userCredential.user;
    userUid = createdUser.uid;
    console.log(` -> [PASS] Test user created. UID: ${userUid}`);
    report.check1_createUser = { status: 'PASS', uid: userUid, email: testEmail };

    // ------------------------------------------------------------------------
    // CHECK 2: Create users/{uid}
    // ------------------------------------------------------------------------
    console.log('\n[CHECK 2] Creating profile at users/' + userUid + '...');
    const userDocRef = doc(db, 'users', userUid);
    const initialProfile = {
      uid: userUid,
      displayName: 'SIH Final Live Verifier',
      email: testEmail,
      role: 'USER',
      status: 'ACTIVE',
      preferredLanguage: 'en-IN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, initialProfile);
    console.log(' -> [PASS] Profile document created successfully.');
    report.check2_createProfile = { status: 'PASS', docPath: `users/${userUid}` };

    // ------------------------------------------------------------------------
    // CHECK 3: Read users/{uid}
    // ------------------------------------------------------------------------
    console.log('\n[CHECK 3] Reading back users/' + userUid + '...');
    const readSnap = await getDoc(userDocRef);
    if (!readSnap.exists()) {
      throw new Error(`Profile users/${userUid} not found after write!`);
    }
    const readData = readSnap.data();
    console.log(` -> [PASS] Read succeeded. Role: ${readData.role}, Status: ${readData.status}, Name: ${readData.displayName}`);
    report.check3_readProfile = {
      status: 'PASS',
      role: readData.role,
      statusField: readData.status,
      displayName: readData.displayName,
    };

    // ------------------------------------------------------------------------
    // CHECK 4: Update allowed profile field
    // ------------------------------------------------------------------------
    console.log('\n[CHECK 4] Updating allowed profile fields (displayName, preferredLanguage)...');
    const updatedName = 'SIH Final Live Verifier (Updated Name)';
    await updateDoc(userDocRef, {
      displayName: updatedName,
      preferredLanguage: 'hi',
      updatedAt: new Date().toISOString(),
    });
    const updatedSnap = await getDoc(userDocRef);
    const updatedData = updatedSnap.data();
    if (updatedData.displayName !== updatedName || updatedData.preferredLanguage !== 'hi') {
      throw new Error('Updated profile fields do not match written values!');
    }
    console.log(` -> [PASS] Update verified. New Name: ${updatedData.displayName}, Lang: ${updatedData.preferredLanguage}`);
    report.check4_updateAllowedFields = { status: 'PASS', newDisplayName: updatedData.displayName };

    // ------------------------------------------------------------------------
    // CHECK 5: Confirm role modification is DENIED
    // ------------------------------------------------------------------------
    console.log('\n[CHECK 5] Testing role modification rejection (attempting role: ADMIN)...');
    try {
      await updateDoc(userDocRef, { role: 'ADMIN' });
      throw new Error('UNEXPECTED: Client successfully updated role to ADMIN!');
    } catch (err) {
      if (err.code === 'permission-denied' || err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions')) {
        console.log(` -> [PASS] Role modification DENIED as expected. Code: ${err.code}`);
        report.check5_roleModificationDenied = { status: 'PASS', code: err.code };
      } else {
        throw err;
      }
    }

    // ------------------------------------------------------------------------
    // CHECK 6: Confirm status tampering is DENIED
    // ------------------------------------------------------------------------
    console.log('\n[CHECK 6] Testing status tampering rejection (attempting status: BANNED)...');
    try {
      await updateDoc(userDocRef, { status: 'BANNED' });
      throw new Error('UNEXPECTED: Client successfully modified status to BANNED!');
    } catch (err) {
      if (err.code === 'permission-denied' || err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions')) {
        console.log(` -> [PASS] Status tampering DENIED as expected. Code: ${err.code}`);
        report.check6_statusTamperingDenied = { status: 'PASS', code: err.code };
      } else {
        throw err;
      }
    }

    // ------------------------------------------------------------------------
    // CHECK 7: Confirm another user's profile cannot be accessed
    // ------------------------------------------------------------------------
    console.log('\n[CHECK 7] Testing cross-user access rejection (target: users/victim_uid_999)...');
    const victimDocRef = doc(db, 'users', 'victim_uid_999');
    let crossReadDenied = false;
    let crossWriteDenied = false;

    try {
      await getDoc(victimDocRef);
      // In Firestore, if doc doesn't exist and read is denied, it throws permission-denied
      throw new Error('UNEXPECTED: Cross-user read succeeded without permission error!');
    } catch (err) {
      if (err.code === 'permission-denied' || err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions')) {
        crossReadDenied = true;
      } else {
        throw err;
      }
    }

    try {
      await setDoc(victimDocRef, { displayName: 'Spoofed Profile', role: 'ADMIN' });
      throw new Error('UNEXPECTED: Cross-user write succeeded!');
    } catch (err) {
      if (err.code === 'permission-denied' || err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions')) {
        crossWriteDenied = true;
      } else {
        throw err;
      }
    }

    if (crossReadDenied && crossWriteDenied) {
      console.log(' -> [PASS] Both cross-user read and write were strictly DENIED.');
      report.check7_crossUserAccessDenied = { status: 'PASS', crossReadDenied, crossWriteDenied };
    } else {
      throw new Error(`Cross-user protection failure: read=${crossReadDenied}, write=${crossWriteDenied}`);
    }

    // ------------------------------------------------------------------------
    // CHECK 8: Confirm unauthenticated Firestore access is DENIED
    // ------------------------------------------------------------------------
    console.log('\n[CHECK 8] Testing unauthenticated access rejection...');
    await signOut(auth);
    console.log(' -> Signed out test user.');

    try {
      await getDoc(userDocRef);
      throw new Error('UNEXPECTED: Unauthenticated read succeeded!');
    } catch (err) {
      if (err.code === 'permission-denied' || err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions')) {
        console.log(` -> [PASS] Unauthenticated access DENIED as expected. Code: ${err.code}`);
        report.check8_unauthenticatedDenied = { status: 'PASS', code: err.code };
      } else {
        throw err;
      }
    }

    // ------------------------------------------------------------------------
    // RE-AUTHENTICATE FOR CHECKS 9, 10, 11
    // ------------------------------------------------------------------------
    console.log('\n[AUTH RECONNECT] Logging user back in...');
    const reAuthCred = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    const reAuthUser = reAuthCred.user;
    console.log(` -> Logged back in. UID: ${reAuthUser.uid}`);

    // ------------------------------------------------------------------------
    // CHECK 9: Confirm chat session creation requires authenticated user's UID
    // ------------------------------------------------------------------------
    console.log('\n[CHECK 9] Testing chat session ownership enforcement...');
    // 9a: Attempt with wrong/spoofed userId
    const spoofedSessionRef = doc(db, 'chatSessions', `session_spoofed_${testNonce}`);
    let spoofedRejected = false;
    try {
      await setDoc(spoofedSessionRef, {
        userId: 'attacker_or_other_uid_999',
        title: 'Spoofed Session',
        createdAt: new Date().toISOString(),
      });
      throw new Error('UNEXPECTED: Chat session created with non-matching userId!');
    } catch (err) {
      if (err.code === 'permission-denied' || err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions')) {
        spoofedRejected = true;
        console.log(' -> [PASS] Chat session with spoofed userId DENIED.');
      } else {
        throw err;
      }
    }

    // 9b: Attempt with authenticated user's own UID
    chatSessionDocId = `session_valid_${testNonce}`;
    const validSessionRef = doc(db, 'chatSessions', chatSessionDocId);
    await setDoc(validSessionRef, {
      userId: userUid,
      title: 'Valid Verification Session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(` -> [PASS] Chat session with own UID created successfully: chatSessions/${chatSessionDocId}`);

    // Verify session owner can read it
    const sessionSnap = await getDoc(validSessionRef);
    if (!sessionSnap.exists() || sessionSnap.data().userId !== userUid) {
      throw new Error('Valid chat session not readable by its owner!');
    }
    console.log(' -> [PASS] Chat session read verified by owner.');

    // Clean up test chat session
    await deleteDoc(validSessionRef);
    console.log(' -> [PASS] Test chat session deleted by owner.');

    report.check9_chatSessionOwnership = {
      status: 'PASS',
      spoofedSessionRejected: spoofedRejected,
      ownSessionAllowed: true,
      ownerReadAllowed: true,
      ownerDeleteAllowed: true,
    };

    // ------------------------------------------------------------------------
    // CHECK 10: Confirm client audit-log creation is DENIED
    // ------------------------------------------------------------------------
    console.log('\n[CHECK 10] Testing client audit-log write rejection...');
    const auditDocRef = doc(db, 'auditLogs', `client_log_${testNonce}`);
    try {
      await setDoc(auditDocRef, {
        action: 'CLIENT_ATTEMPTED_AUDIT_INJECTION',
        userId: userUid,
        timestamp: new Date().toISOString(),
        severity: 'HIGH',
      });
      throw new Error('UNEXPECTED: Client was able to write to auditLogs!');
    } catch (err) {
      if (err.code === 'permission-denied' || err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions')) {
        console.log(` -> [PASS] Client audit-log creation DENIED as expected. Code: ${err.code}`);
        report.check10_auditLogDenied = { status: 'PASS', code: err.code };
      } else {
        throw err;
      }
    }

    // ------------------------------------------------------------------------
    // CHECK 11: Confirm Authentication signup/login/logout still works
    // ------------------------------------------------------------------------
    console.log('\n[CHECK 11] Confirming full Authentication lifecycle (signup, logout, login)...');
    await signOut(auth);
    const postSignOutUser = auth.currentUser;
    const reLoginCredFinal = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    const finalUser = reLoginCredFinal.user;
    const token = await finalUser.getIdToken();
    const tokenValid = Boolean(token && token.length > 50);

    console.log(` -> [PASS] Auth lifecycle confirmed. Signed out=${postSignOutUser === null}, Re-logged UID=${finalUser.uid}, Token length=${token.length}`);
    report.check11_authLifecycle = {
      status: 'PASS',
      signedOutClearedCurrentUser: postSignOutUser === null,
      reLoginUidMatches: finalUser.uid === userUid,
      tokenReceived: tokenValid,
    };

    // ------------------------------------------------------------------------
    // CHECK 12: Delete temporary test user after successful testing
    // ------------------------------------------------------------------------
    console.log('\n[CHECK 12] Deleting temporary test user from Firebase Auth...');
    await deleteUser(finalUser);
    console.log(` -> [PASS] Temporary test user deleted from Firebase Auth: ${userUid}`);
    report.check12_userDeleted = { status: 'PASS', deletedUid: userUid };

    console.log('\n===============================================================');
    console.log('ALL 12 LIVE FIRESTORE VERIFICATION CHECKS PASSED!');
    console.log('===============================================================\n');
    console.log(JSON.stringify(report, null, 2));

    return { success: true, report };
  } catch (err) {
    console.error('\nLIVE VERIFICATION FAILED AT CHECK:');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    if (err.stack) console.error(err.stack);

    // Attempt best-effort cleanup of test account if created
    if (createdUser) {
      try {
        await deleteUser(createdUser);
        console.log('Cleanup: Deleted test user after error.');
      } catch (_) {}
    }

    process.exit(1);
  }
}

runTest();
