const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript");
function environment() {
  const store = new Map(),
    accounts = new Map();
  let seq = 0;
  const copy = (x) => (x === undefined ? undefined : structuredClone(x));
  const snapshot = (ref) => ({
    id: ref.id,
    ref,
    exists: store.has(ref.path),
    data: () => copy(store.get(ref.path)),
  });
  function doc(p) {
    return {
      path: p,
      id: p.split("/").at(-1),
      get: async () => snapshot(doc(p)),
      collection: (name) => collection(`${p}/${name}`),
      update: async (data) => store.set(p, { ...store.get(p), ...copy(data) }),
    };
  }
  function collection(p, filters = [], count = Infinity, ordering, cursor) {
    return {
      doc: (id) => doc(`${p}/${id || `test-${++seq}`}`),
      where: (field, op, value) =>
        collection(p, [...filters, [field, value]], count, ordering, cursor),
      limit: (n) => collection(p, filters, n, ordering, cursor),
      orderBy: (field, direction) =>
        collection(p, filters, count, [field, direction], cursor),
      startAfter: (snap) => collection(p, filters, count, ordering, snap.id),
      get: async () => {
        let rows = [...store].filter(
          ([key, value]) =>
            key.startsWith(`${p}/`) &&
            key.split("/").length === p.split("/").length + 1 &&
            filters.every(([field, target]) => value[field] === target),
        );
        if (ordering)
          rows.sort(
            (a, b) =>
              (a[1][ordering[0]] < b[1][ordering[0]] ? -1 : 1) *
              (ordering[1] === "desc" ? -1 : 1),
          );
        if (cursor)
          rows = rows.slice(
            rows.findIndex(([key]) => key.split("/").at(-1) === cursor) + 1,
          );
        const docs = rows.slice(0, count).map(([key]) => snapshot(doc(key)));
        return { docs, empty: !docs.length, size: docs.length };
      },
    };
  }
  const db = {
    doc,
    collection,
    getAll: async (...refs) => refs.map(snapshot),
    failCommit: null,
    batch() {
      const refs = [];
      return {
        delete: (ref) => refs.push(ref),
        commit: async () => refs.forEach((ref) => store.delete(ref.path)),
      };
    },
    async runTransaction(fn) {
      const writes = [];
      let wrote = false;
      const tx = {
        get: async (ref) => {
          if (wrote) throw Error("READ_AFTER_WRITE");
          return snapshot(ref);
        },
        getAll: async (...refs) => {
          if (wrote) throw Error("READ_AFTER_WRITE");
          return refs.map(snapshot);
        },
        set: (ref, data, options) => {
          wrote = true;
          writes.push(["set", ref, data, options]);
        },
        update: (ref, data) => {
          wrote = true;
          writes.push(["set", ref, data, { merge: true }]);
        },
        delete: (ref) => {
          wrote = true;
          writes.push(["delete", ref]);
        },
      };
      const result = await fn(tx);
      if (
        db.failCommit &&
        writes.some(([, ref]) => ref.path === db.failCommit)
      ) {
        db.failCommit = null;
        throw Error("COMMIT_FAILED");
      }
      for (const [action, ref, data, options] of writes)
        if (action === "delete") store.delete(ref.path);
        else
          store.set(
            ref.path,
            options?.merge
              ? { ...copy(store.get(ref.path)), ...copy(data) }
              : copy(data),
          );
      return result;
    },
  };
  const auth = {
    app: {},
    failDelete: false,
    verifyChecks: [],
    async verifyIdToken(token, revoked) {
      auth.verifyChecks.push(revoked);
      const user = accounts.get(token);
      if (!user || user.disabled) throw Error("INVALID_TOKEN");
      return {
        uid: token,
        email: user.email,
        email_verified: user.emailVerified,
      };
    },
    async getUser(uid) {
      if (!accounts.has(uid))
        throw Object.assign(Error("NOT_FOUND"), {
          code: "auth/user-not-found",
        });
      return copy(accounts.get(uid));
    },
    async updateUser(uid, patch) {
      accounts.set(uid, { ...accounts.get(uid), ...patch });
    },
    async revokeRefreshTokens() {},
    async deleteUser(uid) {
      if (auth.failDelete) {
        auth.failDelete = false;
        throw Error("AUTH_DELETE_FAILED");
      }
      accounts.delete(uid);
    },
    async listUsers() {
      return { users: [...accounts.values()] };
    },
  };
  function seed(uid, role = "user") {
    store.set(`users/${uid}`, { role, email: `${uid}@test.invalid` });
    accounts.set(uid, {
      uid,
      email: `${uid}@test.invalid`,
      emailVerified: true,
      disabled: false,
    });
  }
  seed("admin", "admin");
  seed("owner");
  seed("stranger");
  const cache = new Map();
  let mockFetch = async () => {
    throw Error("NO_NETWORK_IN_TESTS");
  };
  function load(file) {
    const absolute = path.resolve(file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} };
    cache.set(absolute, module);
    const source = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const customRequire = (name) => {
      if (name.endsWith("/firebaseAdmin") || name === "./firebaseAdmin")
        return { getAdminAuth: () => auth };
      if (name === "firebase-admin/firestore")
        return {
          getFirestore: () => db,
          FieldValue: { serverTimestamp: () => "2026-10-04T12:00:00.000Z" },
        };
      if (name === "next/server")
        return {
          NextResponse: {
            json: (data, options) => Response.json(data, options),
          },
        };
      if (name === "next/cache") return { revalidatePath() {} };
      if (name.startsWith("@/") || name.startsWith("."))
        return load(
          (name.startsWith("@/")
            ? path.resolve(name.slice(2))
            : path.resolve(path.dirname(absolute), name)) + ".ts",
        );
      return require(name);
    };
    vm.runInThisContext(
      `(function(require,module,exports,fetch){${source}\n})`,
      { filename: absolute },
    )(customRequire, module, module.exports, (...args) => mockFetch(...args));
    return module.exports;
  }
  function request(uid, body, method = "POST") {
    return new Request("https://debrecenhomes.hu/api/test", {
      method,
      headers: {
        authorization: `Bearer ${uid}`,
        origin: "https://debrecenhomes.hu",
        "content-type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  return {
    store,
    accounts,
    db,
    auth,
    load,
    request,
    setFetch(fn) {
      mockFetch = fn;
    },
  };
}
module.exports = { environment };
