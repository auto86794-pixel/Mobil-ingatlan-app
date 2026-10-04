const { test } = require("node:test"),
  assert = require("node:assert/strict");
const { environment } = require("./helpers.cjs");
const post = {
  userId: "owner",
  title: "Penthouse",
  city: "Debrecen",
  price: 109900000,
  area: 93,
  rooms: 3,
  status: "active",
  featured: true,
  version: 0,
  images: ["https://example.invalid/photo.jpg"],
};
test("Contact delivery failure still acknowledges a durably saved inquiry; retry sends no duplicate", async () => {
  const e = environment();
  let sends = 0;
  e.setFetch(async () => {
    sends++;
    return new Response("Provider unavailable", { status: 503 });
  });
  const keys = ["BREVO_API_KEY", "BREVO_FROM_EMAIL", "BREVO_TO_EMAIL"];
  const before = keys.map((key) => process.env[key]);
  keys.forEach((key) => (process.env[key] = "test-only"));
  try {
    const route = e.load("app/api/contact/route.ts");
    const body = {
      name: "Test",
      email: "test@test.invalid",
      message: "Interested",
      propertyTitle: "Test property",
      submissionId: "22222222-2222-4222-8222-222222222222",
    };
    const first = await route.POST(e.request("", body));
    assert.equal(first.status, 200);
    assert.equal((await first.json()).success, true);
    assert.equal(
      e.store.get(`inquiries/${body.submissionId}`).delivery,
      "failed",
    );
    assert.equal((await route.POST(e.request("", body))).status, 200);
    assert.equal(sends, 1);
  } finally {
    keys.forEach((key, i) => {
      if (before[i] === undefined) delete process.env[key];
      else process.env[key] = before[i];
    });
  }
});
test("Contact does not claim success when saving fails, and honeypot saves nothing", async () => {
  const e = environment(),
    route = e.load("app/api/contact/route.ts");
  const body = {
    name: "Test",
    email: "test@test.invalid",
    message: "Interested",
    submissionId: "33333333-3333-4333-8333-333333333333",
  };
  e.db.failCommit = `inquiries/${body.submissionId}`;
  assert.equal((await route.POST(e.request("", body))).status, 500);
  assert.equal(e.store.has(`inquiries/${body.submissionId}`), false);
  assert.equal(
    (await route.POST(e.request("", { ...body, website: "bot" }))).status,
    200,
  );
  assert.equal(e.store.has(`inquiries/${body.submissionId}`), false);
});
test("Owner edit saves the old snapshot atomically and rejects stale overwrite", async () => {
  const e = environment();
  e.store.set("posts/p", post);
  const route = e.load("app/api/posts/[id]/route.ts");
  const first = await route.PATCH(
    e.request(
      "owner",
      {
        action: "update",
        expectedVersion: 0,
        patch: { price: 108000000, userId: "stranger", version: 99 },
      },
      "PATCH",
    ),
    { params: { id: "p" } },
  );
  assert.equal(first.status, 200);
  assert.equal(e.store.get("posts/p").userId, "owner");
  assert.equal(e.store.get("posts/p").version, 1);
  assert.equal(
    [...e.store].find(([key]) => key.startsWith("posts/p/history/"))[1].before
      .price,
    109900000,
  );
  const stale = await route.PATCH(
    e.request(
      "owner",
      { action: "update", expectedVersion: 0, patch: { price: 1 } },
      "PATCH",
    ),
    { params: { id: "p" } },
  );
  assert.equal(stale.status, 409);
  assert.equal(e.store.get("posts/p").price, 108000000);
  assert.ok(e.auth.verifyChecks.every(Boolean));
});
test("Failed commit leaves both property and history untouched", async () => {
  const e = environment();
  e.store.set("posts/p", post);
  e.db.failCommit = "posts/p";
  const result = await e
    .load("app/api/posts/[id]/route.ts")
    .PATCH(
      e.request(
        "admin",
        { action: "update", expectedVersion: 0, patch: { price: 1 } },
        "PATCH",
      ),
      { params: { id: "p" } },
    );
  assert.equal(result.status, 500);
  assert.equal(e.store.get("posts/p").price, post.price);
  assert.equal(
    [...e.store.keys()].filter((key) => key.includes("/history/")).length,
    0,
  );
});
test("Stranger cannot edit/read history and owner cannot change featured", async () => {
  const e = environment();
  e.store.set("posts/p", post);
  const route = e.load("app/api/posts/[id]/route.ts");
  assert.equal(
    (
      await route.GET(e.request("stranger", undefined, "GET"), {
        params: { id: "p" },
      })
    ).status,
    403,
  );
  for (const [uid, patch] of [
    ["stranger", { price: 1 }],
    ["owner", { featured: false }],
  ])
    assert.equal(
      (
        await route.PATCH(
          e.request(
            uid,
            { action: "update", expectedVersion: 0, patch },
            "PATCH",
          ),
          { params: { id: "p" } },
        )
      ).status,
      403,
    );
});
test("Archive preserves images, blocks edits, and unarchive restores sold status", async () => {
  const e = environment();
  e.store.set("posts/p", { ...post, status: "sold" });
  const route = e.load("app/api/posts/[id]/route.ts");
  const change = (action, version) =>
    route.PATCH(
      e.request(
        "owner",
        { action, expectedVersion: version, patch: { title: "Changed" } },
        "PATCH",
      ),
      { params: { id: "p" } },
    );
  assert.equal((await change("archive", 0)).status, 200);
  assert.deepEqual(e.store.get("posts/p").images, post.images);
  assert.equal((await change("archive", 1)).status, 400);
  assert.equal((await change("update", 1)).status, 400);
  assert.equal((await change("unarchive", 1)).status, 200);
  assert.equal(e.store.get("posts/p").status, "sold");
});
test("History restoration does not revert transferred ownership", async () => {
  const e = environment();
  e.store.set("posts/p", { ...post, userId: "admin", version: 3, price: 1 });
  e.store.set("posts/p/history/old", { before: post, version: 1 });
  const route = e.load("app/api/posts/[id]/route.ts");
  assert.equal(
    (
      await route.PATCH(
        e.request(
          "admin",
          { action: "restore", expectedVersion: 3, historyId: "old" },
          "PATCH",
        ),
        { params: { id: "p" } },
      )
    ).status,
    200,
  );
  assert.equal(e.store.get("posts/p").userId, "admin");
  assert.equal(e.store.get("posts/p").price, post.price);
  assert.equal(e.store.get("posts/p").version, 4);
});
test("Self/admin deletion and incorrect typed confirmation never mutate data", async () => {
  const e = environment();
  const route = e.load("app/api/admin/users/[uid]/route.ts");
  const before = JSON.stringify([...e.store]);
  for (const [uid, confirmation] of [
    ["admin", "admin@test.invalid"],
    ["owner", "wrong"],
  ]) {
    assert.ok(
      (
        await route.POST(
          e.request("admin", {
            action: "delete",
            recipient: "admin",
            confirmation,
          }),
          { params: { uid } },
        )
      ).status >= 400,
    );
  }
  assert.equal(JSON.stringify([...e.store]), before);
  assert.equal(
    (
      await route.POST(e.request("stranger", { action: "disable" }), {
        params: { uid: "owner" },
      })
    ).status,
    403,
  );
});
test("Disable and re-enable coordinate Auth with the private profile", async () => {
  const e = environment(),
    route = e.load("app/api/admin/users/[uid]/route.ts");
  assert.equal(
    (
      await route.POST(e.request("admin", { action: "disable" }), {
        params: { uid: "owner" },
      })
    ).status,
    200,
  );
  assert.equal(e.accounts.get("owner").disabled, true);
  assert.equal(e.store.get("users/owner").disabled, true);
  assert.equal(
    (
      await route.POST(e.request("admin", { action: "enable" }), {
        params: { uid: "owner" },
      })
    ).status,
    200,
  );
  assert.equal(e.accounts.get("owner").disabled, false);
  assert.equal(e.store.get("users/owner").disabled, false);
});
test("Auth deletion failure is retryable without losing or transferring properties twice", async () => {
  const e = environment();
  e.store.set("posts/p", post);
  e.store.set("favorites/f", { userId: "owner", postId: "p" });
  e.auth.failDelete = true;
  const route = e.load("app/api/admin/users/[uid]/route.ts");
  const remove = () =>
    route.POST(
      e.request("admin", {
        action: "delete",
        recipient: "admin",
        confirmation: "owner@test.invalid",
      }),
      { params: { uid: "owner" } },
    );
  assert.equal((await remove()).status, 500);
  assert.equal(e.store.get("posts/p").userId, "admin");
  assert.ok(e.accounts.has("owner"));
  assert.equal(e.store.get("users/owner").accountState, "deleting");
  assert.equal((await remove()).status, 200);
  assert.equal(e.accounts.has("owner"), false);
  assert.equal(e.store.has("users/owner"), false);
  assert.equal(e.store.has("favorites/f"), false);
  assert.equal(e.store.get("accountOperations/owner").state, "completed");
  assert.equal(e.store.get("posts/p").version, 1);
  assert.deepEqual(e.store.get("posts/p").images, post.images);
  assert.equal((await remove()).status, 200);
});
test("Large account transfer is bounded and can be resumed", async () => {
  const e = environment();
  for (let i = 0; i < 43; i++) e.store.set(`posts/p${i}`, post);
  const route = e.load("app/api/admin/users/[uid]/route.ts");
  const remove = () =>
    route.POST(
      e.request("admin", {
        action: "delete",
        recipient: "admin",
        confirmation: "owner@test.invalid",
      }),
      { params: { uid: "owner" } },
    );
  assert.equal((await (await remove()).json()).pending, true);
  assert.ok(e.accounts.has("owner"));
  assert.equal((await (await remove()).json()).pending, false);
  assert.equal(
    [...e.store].filter(
      ([key, value]) =>
        key.startsWith("posts/") &&
        !key.includes("/history/") &&
        value.userId === "admin",
    ).length,
    43,
  );
});
test("Active operation lease blocks parallel disable/delete", async () => {
  const e = environment();
  e.store.set("accountOperations/owner", {
    state: "transferring",
    leaseUntil: Date.now() + 120000,
    lease: "other",
  });
  const result = await e
    .load("app/api/admin/users/[uid]/route.ts")
    .POST(e.request("admin", { action: "disable" }), {
      params: { uid: "owner" },
    });
  assert.equal(result.status, 409);
  assert.equal(e.store.get("accountOperations/owner").lease, "other");
});
test("Inquiry duplicate submissions create exactly one stored lead and throttle persists", async () => {
  const e = environment(),
    { captureInquiry } = e.load("app/lib/inquiryCapture.ts");
  const body = { name: "Test", email: "test@test.invalid", message: "Hello" };
  const id = "11111111-1111-4111-8111-111111111111";
  assert.equal((await captureInquiry(body, id, "test-ip")).duplicate, false);
  assert.equal((await captureInquiry(body, id, "test-ip")).duplicate, true);
  assert.equal(
    [...e.store.keys()].filter((key) => key.startsWith("inquiries/")).length,
    1,
  );
  await assert.rejects(
    captureInquiry({ ...body, message: "Different" }, id, "test-ip"),
    /SUBMISSION_CONFLICT/,
  );
  for (let i = 0; i < 4; i++) await captureInquiry(body, undefined, "test-ip");
  await assert.rejects(
    captureInquiry(body, undefined, "test-ip"),
    /RATE_LIMIT/,
  );
});
test("Inquiry management is private, preserves history and rejects stale changes", async () => {
  const e = environment();
  e.store.set("inquiries/i", { status: "new", notes: "", version: 0 });
  const route = e.load("app/api/admin/inquiries/route.ts");
  assert.equal(
    (await route.GET(e.request("owner", undefined, "GET"))).status,
    403,
  );
  const body = {
    id: "i",
    status: "viewing",
    notes: "Called",
    viewingAt: "2026-10-05T12:00:00Z",
    expectedVersion: 0,
  };
  assert.equal(
    (await route.PATCH(e.request("admin", body, "PATCH"))).status,
    200,
  );
  assert.equal(e.store.get("inquiries/i").version, 1);
  assert.equal(
    (await route.PATCH(e.request("admin", body, "PATCH"))).status,
    409,
  );
});
test("Policy validates positive numeric fields and identifies missing essentials", () => {
  const e = environment(),
    { cleanPropertyPatch, missingPropertyFields } = e.load(
      "app/lib/managementPolicy.ts",
    );
  for (const price of [0, -1, Infinity, "109.9"])
    assert.throws(() => cleanPropertyPatch({ price }));
  assert.deepEqual(
    missingPropertyFields({
      area: 93,
      rooms: 3,
      phone: "123",
      imageUrl: "https://example.invalid",
      propertyType: "lakás",
    }),
    [],
  );
  assert.equal(missingPropertyFields({}).length, 5);
});
test("Cross-origin mutations and disabled profile tokens are rejected", async () => {
  const e = environment();
  e.store.set("posts/p", post);
  const route = e.load("app/api/posts/[id]/route.ts");
  const request = new Request("https://debrecenhomes.hu/api/posts/p", {
    method: "PATCH",
    headers: {
      authorization: "Bearer admin",
      origin: "https://evil.invalid",
      "content-type": "application/json",
    },
    body: JSON.stringify({ action: "archive", expectedVersion: 0 }),
  });
  assert.equal(
    (await route.PATCH(request, { params: { id: "p" } })).status,
    403,
  );
  e.store.set("users/owner", { role: "user", disabled: true });
  assert.equal(
    (
      await route.PATCH(
        e.request("owner", { action: "archive", expectedVersion: 0 }, "PATCH"),
        { params: { id: "p" } },
      )
    ).status,
    403,
  );
  assert.equal(e.store.get("posts/p").status, "active");
});
test("Orphan profile deletion keeps properties and does not require an Auth account", async () => {
  const e = environment();
  e.accounts.delete("owner");
  e.store.set("posts/p", post);
  const list = await e
    .load("app/api/admin/users/route.ts")
    .GET(e.request("admin", undefined, "GET"));
  assert.equal(
    (await list.json()).users.find((user) => user.id === "owner").hasAuth,
    false,
  );
  const route = e.load("app/api/admin/users/[uid]/route.ts");
  assert.equal(
    (
      await route.POST(
        e.request("admin", {
          action: "delete",
          recipient: "admin",
          confirmation: "owner@test.invalid",
        }),
        { params: { uid: "owner" } },
      )
    ).status,
    200,
  );
  assert.equal(e.store.get("posts/p").userId, "admin");
  assert.equal(e.store.has("users/owner"), false);
});
