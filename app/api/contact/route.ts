import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

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
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error("BREVO_SEND_ERROR", {
      status: response.status,
      response: responseText,
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
  try {
    const origin = req.headers.get("origin");
    const allowedOrigins = new Set(["https://debrecenhomes.hu", "https://www.debrecenhomes.hu"]);
    if (process.env.NODE_ENV === "development") {
      allowedOrigins.add("http://localhost:3000");
    }
    if (origin && !allowedOrigins.has(origin)) {
      return NextResponse.json({ success: false, error: "Érvénytelen kérés." }, { status: 403 });
    }

    const contentLength = Number(req.headers.get("content-length") || "0");
    if (contentLength > 20_000) {
      return NextResponse.json({ success: false, error: "A kérés túl nagy." }, { status: 413 });
    }

    const ip = getClientIp(req);

    if (isRateLimited(ip)) {
      return NextResponse.json(
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

    const body = await req.json();

    // Honeypot: normál felhasználó ezt a mezőt nem tölti ki.
    const website = cleanText(body.website, 200);

    if (website) {
      return NextResponse.json(
        {
          success: true,
        },
        {
          status: 200,
        }
      );
    }

    const name = cleanText(body.name, 100);
    const phone = cleanText(body.phone, 80);
    const email = cleanText(body.email, 254).toLowerCase();
    const message = cleanText(body.message, 3000);

    const propertyTitle = cleanText(body.propertyTitle, 200);
    const propertyId = cleanText(body.propertyId, 100);
    const propertyUrl = cleanText(body.propertyUrl, 500);

    if (!name || !email || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "A név, e-mail cím és üzenet megadása kötelező.",
        },
        {
          status: 400,
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Érvénytelen e-mail cím.",
        },
        {
          status: 400,
        }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_FROM_EMAIL;
    const recipientEmail = process.env.BREVO_TO_EMAIL;

    if (!apiKey || !senderEmail || !recipientEmail) {
      console.error("CONTACT_API_CONFIG_MISSING", {
        hasApiKey: Boolean(apiKey),
        hasSenderEmail: Boolean(senderEmail),
        hasRecipientEmail: Boolean(recipientEmail),
      });

      return NextResponse.json(
        {
          success: false,
          error: "Az üzenetküldés átmenetileg nem elérhető.",
        },
        {
          status: 500,
        }
      );
    }

    const safeName = escapeHtml(name);
    const safePhone = escapeHtml(phone);
    const safeEmail = escapeHtml(email);

    const safeMessage = escapeHtml(message).replace(
      /\r?\n/g,
      "<br />"
    );

    const safePropertyTitle = escapeHtml(
      propertyTitle || "Ingatlan"
    );

    const safePropertyId = escapeHtml(propertyId);
    const safePropertyUrl = escapeHtml(propertyUrl);

    //
    // 1. Érdeklődés elküldése neked
    //
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

    //
    // 2. Automatikus visszaigazolás az érdeklődőnek
    //
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
    } catch (autoReplyError) {
      // A fő érdeklődés ekkor már célba ért. Az automatikus válasz hibája miatt
      // ne kérjük a felhasználót újraküldésre, mert az dupla érdeklődést okozna.
      console.error("BREVO_AUTO_REPLY_ERROR", autoReplyError);
    }

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("CONTACT_API_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        error: "Hiba történt az üzenet küldésekor.",
      },
      {
        status: 500,
      }
    );
  }
}
