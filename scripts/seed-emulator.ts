import * as admin from 'firebase-admin';

// Point to emulators
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

admin.initializeApp({
  projectId: 'goodwin-squares-prod',
});

const auth = admin.auth();
const db = admin.firestore();

async function seed() {
  const email = 'blake@goodwin.io';
  const uid = 'super-admin-blake';

  console.log(`Checking for user: ${email}...`);

  try {
    await auth.getUser(uid);
    console.log('User already exists in Auth.');
  } catch {
    console.log('Creating user in Auth...');
    await auth.createUser({
      uid: uid,
      email: email,
      displayName: 'Blake Goodwin',
      emailVerified: true,
    });
  }

  console.log('Setting super_admins collection...');
  await db.collection('super_admins').doc(uid).set({
    email: email,
    role: 'super_admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✅ Success! You can now log in with:');
  console.log(`Email: ${email}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error seeding emulator:', err);
  process.exit(1);
});
