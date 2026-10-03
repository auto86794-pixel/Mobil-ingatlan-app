const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

function loadRoute({ missing = false, providerStatus = 201 } = {}) {
  const records = new Map();
  let sends = 0;
  const auth = {
    app: {},
    getUserByEmail: async () => { if (missing) throw { code: 'auth/user-not-found' }; return { disabled: false }; },
    generatePasswordResetLink: async () => 'https://example.test/reset?oobCode=private&mode=resetPassword',
  };
  const db = {
    collection: () => ({ doc: (id) => id }),
    runTransaction: async (fn) => fn({
      getAll: async (...ids) => ids.map(id => ({ data: () => records.get(id) })),
      set: (id, data) => records.set(id, data),
    }),
  };
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync('app/api/auth/reset-password/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, {
    exports, require: name => {
      if (name === 'node:crypto') return crypto;
      if (name === 'firebase-admin/firestore') return { getFirestore: () => db };
      if (name === 'next/server') return { NextResponse: { json: (body, options) => Response.json(body, options) } };
      if (name === '@/app/lib/firebaseAdmin') return { getAdminAuth: () => auth };
      throw new Error(name);
    },
    process: { env: { BREVO_API_KEY: 'test', BREVO_FROM_EMAIL: 'sender@example.test' } },
    URL, Date, AbortSignal, console: { info() {}, error() {} },
    fetch: async () => { ++sends; return Response.json({ messageId: 'test-id' }, { status: providerStatus }); },
  });
  return { post: exports.POST, sends: () => sends };
}
const request = (email, origin = 'https://debrecenhomes.hu') => new Request('https://debrecenhomes.hu/api/auth/reset-password', {
  method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ email }),
});

(async () => {
  const valid = loadRoute();
  assert.equal((await valid.post(request('person@example.test'))).status, 200);
  assert.equal(valid.sends(), 1);
  assert.equal((await valid.post(request(' PERSON@example.test '))).status, 429);
  assert.equal(valid.sends(), 1);
  const missing = loadRoute({ missing: true });
  assert.deepEqual(await (await missing.post(request('absent@example.test'))).json(), { success: true });
  assert.equal(missing.sends(), 0);
  assert.equal((await loadRoute().post(request('invalid'))).status, 400);
  assert.equal((await loadRoute().post(request('person@example.test', 'https://other.test'))).status, 403);
  assert.equal((await loadRoute({ providerStatus: 500 }).post(request('person@example.test'))).status, 503);
  const limited = loadRoute();
  for (let i = 0; i < 10; i++) assert.equal((await limited.post(request(`person${i}@example.test`))).status, 200);
  assert.equal((await limited.post(request('extra@example.test'))).status, 429);
  console.log('PASS: reset delivery, duplicate and IP throttling, account privacy, validation, origin, provider failure');
})().catch(error => { console.error(error); process.exitCode = 1; });
