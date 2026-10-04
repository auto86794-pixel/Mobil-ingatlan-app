const { test, before, after } = require("node:test"),
  assert = require("node:assert/strict");
// Hard guard: these tests can only target a local demo Firebase project.
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8089";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9098";
const {
  initializeApp: initializeAdmin,
  deleteApp: deleteAdmin,
} = require("firebase-admin/app");
const { getFirestore: getAdminDb } = require("firebase-admin/firestore");
const { getAuth: getAdminAuth } = require("firebase-admin/auth");
const { initializeApp, deleteApp } = require("firebase/app");
const {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
} = require("firebase/auth");
const {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} = require("firebase/firestore");
const {
  getStorage,
  connectStorageEmulator,
  ref,
  uploadBytes,
  deleteObject,
} = require("firebase/storage");
const projectId = "demo-debrecenhomes",
  clients = {};
let admin, db;
const property = {
  title: "Emulator property",
  city: "Debrecen",
  price: 109900000,
  area: 93,
  rooms: 3,
  status: "active",
  featured: false,
  userId: "owner",
  version: 0,
};
async function client(name, signed = true) {
  const app = initializeApp(
    {
      projectId,
      apiKey: "fake-key",
      storageBucket: `${projectId}.appspot.com`,
    },
    `${name}-${Date.now()}`,
  );
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9098", { disableWarnings: true });
  const firestore = getFirestore(app);
  connectFirestoreEmulator(firestore, "127.0.0.1", 8089);
  const storage = getStorage(app);
  connectStorageEmulator(storage, "127.0.0.1", 9198);
  if (signed)
    await signInWithEmailAndPassword(
      auth,
      `${name}@test.invalid`,
      "Emulator-only-password-123",
    );
  clients[name] = { app, db: firestore, storage };
  return clients[name];
}
before(async () => {
  await fetch(
    "http://127.0.0.1:8089/emulator/v1/projects/demo-debrecenhomes/databases/(default)/documents",
    { method: "DELETE" },
  );
  admin = initializeAdmin({ projectId }, `rules-${Date.now()}`);
  db = getAdminDb(admin);
  for (const name of ["owner", "stranger", "admin", "disabled", "deleting"]) {
    try {
      await getAdminAuth(admin).deleteUser(name);
    } catch {}
    await getAdminAuth(admin).createUser({
      uid: name,
      email: `${name}@test.invalid`,
      emailVerified: true,
      password: "Emulator-only-password-123",
    });
    await db.doc(`users/${name}`).set({
      role: name === "admin" ? "admin" : "user",
      disabled: name === "disabled",
      accountState: name === "deleting" ? "deleting" : "",
    });
    await client(name);
  }
  await client("public", false);
  await db.doc("posts/active").set(property);
  await db.doc("posts/archive").set({ ...property, status: "archived" });
  await db.doc("inquiries/private").set({ email: "private@test.invalid" });
  await db.doc("posts/active/history/private").set({ before: property });
  await db.doc("accountOperations/owner").set({ state: "idle" });
});
after(async () => {
  await Promise.all(Object.values(clients).map((item) => deleteApp(item.app)));
  if (db) await db.terminate();
  if (admin) await deleteAdmin(admin);
});
test("Public queries only active properties; archive is private to owner/admin", async () => {
  assert.equal(
    (await getDoc(doc(clients.public.db, "posts/active"))).exists(),
    true,
  );
  assert.equal(
    (
      await getDocs(
        query(
          collection(clients.public.db, "posts"),
          where("status", "==", "active"),
        ),
      )
    ).size >= 1,
    true,
  );
  await assert.rejects(getDoc(doc(clients.public.db, "posts/archive")));
  await assert.rejects(getDoc(doc(clients.stranger.db, "posts/archive")));
  assert.equal(
    (await getDoc(doc(clients.owner.db, "posts/archive"))).exists(),
    true,
  );
  assert.equal(
    (await getDoc(doc(clients.admin.db, "posts/archive"))).exists(),
    true,
  );
});
test("Every client including admin is denied direct post mutation/deletion/history access", async () => {
  for (const name of ["owner", "admin", "stranger"]) {
    await assert.rejects(
      updateDoc(doc(clients[name].db, "posts/active"), { price: 1 }),
    );
    await assert.rejects(deleteDoc(doc(clients[name].db, "posts/active")));
    await assert.rejects(
      getDoc(doc(clients[name].db, "posts/active/history/private")),
    );
  }
  assert.equal(
    (await db.doc("posts/active").get()).data().price,
    property.price,
  );
});
test("Valid owner create succeeds; ownership/featured/blocked-account bypasses fail", async () => {
  await setDoc(doc(clients.owner.db, "posts/new-valid"), property);
  await assert.rejects(
    setDoc(doc(clients.owner.db, "posts/new-other"), {
      ...property,
      userId: "stranger",
    }),
  );
  await assert.rejects(
    setDoc(doc(clients.owner.db, "posts/new-featured"), {
      ...property,
      featured: true,
    }),
  );
  for (const name of ["disabled", "deleting"])
    await assert.rejects(
      setDoc(doc(clients[name].db, `posts/new-${name}`), {
        ...property,
        userId: name,
      }),
    );
});
test("Private inquiries/journals and privilege/lifecycle changes are denied", async () => {
  for (const name of ["owner", "admin", "public"]) {
    await assert.rejects(getDoc(doc(clients[name].db, "inquiries/private")));
    await assert.rejects(
      getDoc(doc(clients[name].db, "accountOperations/owner")),
    );
  }
  await assert.rejects(
    updateDoc(doc(clients.owner.db, "users/owner"), { role: "admin" }),
  );
  await assert.rejects(
    updateDoc(doc(clients.admin.db, "users/owner"), { disabled: false }),
  );
  await assert.rejects(
    updateDoc(doc(clients.disabled.db, "users/disabled"), { disabled: false }),
  );
  await db.doc("users/owner").delete();
  await assert.rejects(
    setDoc(doc(clients.owner.db, "users/owner"), {
      email: "owner@test.invalid",
      role: "user",
    }),
  );
  await db.doc("users/owner").set({ role: "user" });
});
test("Storage permits new owner images, preserves old images, blocks disabled/deleting uploads", async () => {
  const data = new Uint8Array([255, 216, 255, 217]),
    image = ref(
      clients.owner.storage,
      `properties/owner/rules-${Date.now()}.jpg`,
    );
  await uploadBytes(image, data, { contentType: "image/jpeg" });
  await assert.rejects(uploadBytes(image, data, { contentType: "image/jpeg" }));
  await assert.rejects(deleteObject(image));
  for (const name of ["disabled", "deleting"])
    await assert.rejects(
      uploadBytes(
        ref(clients[name].storage, `properties/${name}/blocked.jpg`),
        data,
        { contentType: "image/jpeg" },
      ),
    );
  await assert.rejects(
    uploadBytes(
      ref(clients.stranger.storage, "properties/owner/not-yours.jpg"),
      data,
      { contentType: "image/jpeg" },
    ),
  );
});
