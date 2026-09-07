import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const BREVO_TIMEOUT_MS = 12_000;
const PUBLIC_SITE_URL = "https://debrecenhomes.hu";

// Best-effort védelem egy futó szerverpéldányon belül.
// Vercel több példánya között ez nem közös állapot, ezért a tartós,
// megosztott rate limitet a következő botvédelmi lépésben érdemes bevezetni.
const rateLimitStore = new Map<string, number[]>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;

  const recent = (rateLimitStore.get(ip) || []).filter(
    (timestamp) => timestamp > cutoff
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);

  if (rateLimitStore.size > 500) {
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const active = timestamps.filter((timestamp) => timestamp > cutoff);

      if (active.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, active);
      }
    }
  }

  return false;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function isValidEmail(email: string): boolean {
  if (email.length > 254 || /[\r\n]/.test(email)) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  if (!phone) {
    return true;
  }

  if (phone.length > 40 || !/^[0-9+()/.\-\s]+$/.test(phone)) {
    return false;
  }

  const digitCount = phone.replace(/\D/g, "").length;
  return digitCount >= 6 && digitCount <= 15;
}

function isValidPropertyId(propertyId: string): boolean {
  if (!propertyId) {
    return true;
  }

  return /^[A-Za-z0-9_-]{1,100}$/.test(propertyId);
}

function buildPropertyUrl(propertyId: string): string {
  if (!propertyId) {
    return "";
  }

  return `${PUBLIC_SITE_URL}/post/${encodeURIComponent(propertyId)}`;
}

function jsonResponse(
  body: Record<string, unknown>,
  init: { status: number; headers?: Record<string, string> }
) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });
}

type SendBrevoEmailParams = {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  toEmail: string;
  toName?: string;
  replyToEmail?: string;
  replyToName?: string;
  subject: string;
  htmlContent: string;
};

async function sendBrevoEmail({
  apiKey,
  senderEmail,
  senderName,
  toEmail,
  toName,
  replyToEmail,
  replyToName,
  subject,
  htmlContent,
}: SendBrevoEmailParams) {
  const payload: Record<string, unknown> = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: toEmail,
        ...(toName ? { name: toName } : {}),
      },
    ],
    subject,
    htmlContent,
  };

  if (replyToEmail) {
    payload.replyTo = {
      email: replyToEmail,
      ...(replyToName ? { name: replyToName } : {}),
    };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    cache: "no-store",
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error("BREVO_SEND_ERROR", {
      status: response.status,
      response: responseText.slice(0, 500),
    });

    throw new Error(`Brevo send failed: ${response.status}`);
  }

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonResponse(
        {
          success: false,
          error: "Érvénytelen kérés.",
        },
        { status: 415 }
      );
    }

    let body: Record<string, unknown>;

    try {
      const parsed = await req.json();

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid JSON body");
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Érvénytelen kérés.",
        },
        { status: 400 }
      );
    }

    // Honeypot: normál felhasználó ezt a mezőt nem tölti ki.
    // A botot sikeres válasszal csendben eldobjuk, még a rate limit előtt.
    const website = cleanText(body.website, 200);

    if (website) {
      return jsonResponse(
        {
          success: true,
        },
        { status: 200 }
      );
    }

    const ip = getClientIp(req);

    if (isRateLimited(ip)) {
      return jsonResponse(
        {
          success: false,
          error:
            "Túl sok üzenetet küldtél rövid időn belül. Próbáld újra később.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "600",
          },
        }
      );
    }

    const name = cleanText(body.name, 100);
    const phone = cleanText(body.phone, 40);
    const email = cleanText(body.email, 254).toLowerCase();
    const message = cleanText(body.message, 3000);
    const propertyTitle = cleanText(body.propertyTitle, 200);
    const propertyId = cleanText(body.propertyId, 100);

    if (!name || !email || !message) {
      return jsonResponse(
        {
          success: false,
          error: "A név, e-mail cím és üzenet megadása kötelező.",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return jsonResponse(
        {
          success: false,
          error: "Kérjük, adj meg egy érvényes nevet.",
        },
        { status: 400 }
      );
    }

    if (message.length < 5) {
      return jsonResponse(
        {
          success: false,
          error: "Az üzenet túl rövid.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return jsonResponse(
        {
          success: false,
          error: "Érvénytelen e-mail cím.",
        },
        { status: 400 }
      );
    }

    if (!isValidPhone(phone)) {
      return jsonResponse(
        {
          success: false,
          error: "Érvénytelen telefonszám.",
        },
        { status: 400 }
      );
    }

    if (!isValidPropertyId(propertyId)) {
      return jsonResponse(
        {
          success: false,
          error: "Érvénytelen hirdetésazonosító.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_FROM_EMAIL;
    const recipientEmail = process.env.BREVO_TO_EMAIL;

    if (!apiKey || !senderEmail || !recipientEmail) {
      console.error("CONTACT_API_CONFIG_MISSING", {
        requestId,
        hasApiKey: Boolean(apiKey),
        hasSenderEmail: Boolean(senderEmail),
        hasRecipientEmail: Boolean(recipientEmail),
      });

      return jsonResponse(
        {
          success: false,
          error: "Az üzenetküldés átmenetileg nem elérhető.",
        },
        { status: 500 }
      );
    }

    if (!isValidEmail(senderEmail) || !isValidEmail(recipientEmail)) {
      console.error("CONTACT_API_CONFIG_INVALID", {
        requestId,
        validSenderEmail: isValidEmail(senderEmail),
        validRecipientEmail: isValidEmail(recipientEmail),
      });

      return jsonResponse(
        {
          success: false,
          error: "Az üzenetküldés átmenetileg nem elérhető.",
        },
        { status: 500 }
      );
    }

    const propertyUrl = buildPropertyUrl(propertyId);

    const safeName = escapeHtml(name);
    const safePhone = escapeHtml(phone);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br />");
    const safePropertyTitle = escapeHtml(propertyTitle || "Ingatlan");
    const safePropertyId = escapeHtml(propertyId);
    const safePropertyUrl = escapeHtml(propertyUrl);

    // 1. Elsődleges levél: az érdeklődés neked.
    // Ha ez nem sikerül, a beküldést hibásnak tekintjük.
    await sendBrevoEmail({
      apiKey,
      senderEmail,
      senderName: "DebrecenHomes",
      toEmail: recipientEmail,
      replyToEmail: email,
      replyToName: name,
      subject: `Új érdeklődés — ${propertyTitle || "ingatlan"}`,
      htmlContent: `
        <div
          style="
            font-family: Arial, Helvetica, sans-serif;
            padding: 32px;
            color: #172019;
            line-height: 1.7;
          "
        >
          <h2>Új ingatlanérdeklődés</h2>

          <p>
            <strong>Ingatlan:</strong><br />
            ${safePropertyTitle}
          </p>

          ${
            safePropertyId
              ? `
                <p>
                  <strong>Hirdetés azonosító:</strong><br />
                  ${safePropertyId}
                </p>
              `
              : ""
          }

          ${
            safePropertyUrl
              ? `
                <p>
                  <strong>Hirdetés:</strong><br />
                  <a href="${safePropertyUrl}">
                    ${safePropertyUrl}
                  </a>
                </p>
              `
              : ""
          }

          <p>
            <strong>Név:</strong><br />
            ${safeName}
          </p>

          ${
            safePhone
              ? `
                <p>
                  <strong>Telefon:</strong><br />
                  ${safePhone}
                </p>
              `
              : ""
          }

          <p>
            <strong>E-mail:</strong><br />
            ${safeEmail}
          </p>

          <p>
            <strong>Üzenet:</strong><br />
            ${safeMessage}
          </p>
        </div>
      `,
    });

    // 2. Másodlagos levél: automatikus visszaigazolás az érdeklődőnek.
    // Ennek hibája NEM teszi sikertelenné a már beérkezett érdeklődést,
    // így a felhasználó nem küldi el újra ugyanazt csak emiatt.
    try {
      await sendBrevoEmail({
        apiKey,
        senderEmail,
        senderName: "DebrecenHomes",
        toEmail: email,
        toName: name,
        replyToEmail: recipientEmail,
        replyToName: "DebrecenHomes",
        subject: "Megkaptuk az érdeklődésed",
        htmlContent: `
          <div
            style="
              background: #ffffff;
              padding: 40px 24px;
              font-family: Arial, Helvetica, sans-serif;
              color: #172019;
              line-height: 1.8;
              max-width: 640px;
              margin: 0 auto;
            "
          >
            <h1>Köszönjük, ${safeName}!</h1>

            <p>
              Megkaptuk az érdeklődésed a(z)
              <strong>${safePropertyTitle}</strong>
              hirdetéssel kapcsolatban.
            </p>

            <p>
              Hamarosan felvesszük veled a kapcsolatot.
            </p>

            <p>
              — DebrecenHomes
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error("CONTACT_AUTOREPLY_ERROR", {
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return jsonResponse(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CONTACT_API_ERROR", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return jsonResponse(
      {
        success: false,
        error: "Hiba történt az üzenet küldésekor.",
      },
      { status: 500 }
    );
  }
}
