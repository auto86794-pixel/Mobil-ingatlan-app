import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {

  try {

    // =========================
    // RESEND
    // =========================

    const resend = new Resend(
      process.env.RESEND_API_KEY
    );

    // =========================
    // BODY
    // =========================

    const body = await req.json();

    const name =
      body.name?.trim();

    const email =
      body.email?.trim();

    const message =
      body.message?.trim();

    const propertyTitle =
      body.propertyTitle?.trim();

    // =========================
    // VALIDATION
    // =========================

    if (
      !name ||
      !email ||
      !message
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields",
        },
        {
          status: 400,
        }
      );

    }

    // =========================
    // EMAIL VALIDATION
    // =========================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(email)
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid email address",
        },
        {
          status: 400,
        }
      );

    }

    // =========================
    // RECIPIENT
    // =========================

    const recipientEmail =
      process.env.CONTACT_TO_EMAIL;

    console.log(
      "CONTACT_TO_EMAIL:",
      recipientEmail
    );

    console.log(
      "RESEND_API_KEY_EXISTS:",
      !!process.env.RESEND_API_KEY
    );

    if (!recipientEmail) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Missing CONTACT_TO_EMAIL",
        },
        {
          status: 500,
        }
      );

    }

    // =========================
    // SEND ADMIN EMAIL
    // =========================

    const inquiryEmail =
      await resend.emails.send({

        // VERIFIED DOMAIN SENDER
        from:
          "inquiries@debrecenhomes.hu",

        to: recipientEmail,

        replyTo: email,

        subject:
          `New Inquiry — ${
            propertyTitle ||
            "Luxury Property"
          }`,

        html: `
          <div style="
            font-family: Arial, Helvetica, sans-serif;
            padding: 32px;
            color: #111111;
            line-height: 1.7;
          ">

            <h2>
              New Property Inquiry
            </h2>

            <p>
              <strong>Property:</strong><br/>
              ${
                propertyTitle ||
                "Luxury Property"
              }
            </p>

            <p>
              <strong>Name:</strong><br/>
              ${name}
            </p>

            <p>
              <strong>Email:</strong><br/>
              ${email}
            </p>

            <p>
              <strong>Message:</strong><br/>
              ${message}
            </p>

          </div>
        `,
      });

    console.log(
      "INQUIRY EMAIL:",
      inquiryEmail
    );

    // =========================
    // AUTO REPLY
    // =========================

    const autoReply =
      await resend.emails.send({

        // VERIFIED DOMAIN SENDER
        from:
          "inquiries@debrecenhomes.hu",

        to: email,

        subject:
          "We received your inquiry",

        html: `
          <div style="
            background-color: #ffffff;
            padding: 48px 24px;
            font-family: Arial, Helvetica, sans-serif;
            color: #111111;
            line-height: 1.8;
            max-width: 640px;
            margin: 0 auto;
          ">

            <h1>
              Thank you, ${name}
            </h1>

            <p>
              Your inquiry regarding
              <strong>
                ${
                  propertyTitle ||
                  "this property"
                }
              </strong>
              has been received.
            </p>

            <p>
              Our concierge team
              will contact you shortly.
            </p>

            <p>
              — DebHome
            </p>

          </div>
        `,
      });

    console.log(
      "AUTO REPLY:",
      autoReply
    );

    // =========================
    // SUCCESS
    // =========================

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.error(
      "CONTACT_API_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Internal server error",
      },
      {
        status: 500,
      }
    );

  }

}