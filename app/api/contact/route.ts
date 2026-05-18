import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {

  try {

    // =========================
    // ENV VALIDATION
    // =========================

    if (!process.env.RESEND_API_KEY) {

      console.error(
        "Missing RESEND_API_KEY"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Server configuration error",
        },
        {
          status: 500,
        }
      );

    }

    if (!process.env.CONTACT_TO_EMAIL) {

      console.error(
        "Missing CONTACT_TO_EMAIL"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Server configuration error",
        },
        {
          status: 500,
        }
      );

    }

    // =========================
    // RESEND INIT
    // =========================

    const resend = new Resend(
      process.env.RESEND_API_KEY
    );

    // =========================
    // REQUEST BODY
    // =========================

    const body =
      await req.json();

    const name =
      body.name?.trim();

    const email =
      body.email?.trim();

    const message =
      body.message?.trim();

    const propertyEmail =
      body.propertyEmail?.trim();

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
    // RECIPIENTS
    // =========================

    const recipients = [
      process.env.CONTACT_TO_EMAIL!,
    ];

    // Add property owner email
    if (
      propertyEmail &&
      emailRegex.test(
        propertyEmail
      )
    ) {

      recipients.push(
        propertyEmail
      );

    }

    console.log(
      "EMAIL RECIPIENTS:",
      recipients
    );

    // =========================
    // SEND INQUIRY EMAIL
    // =========================

    const inquiryEmail =
      await resend.emails.send({

        from:
          process.env
            .RESEND_FROM_EMAIL ||

          "onboarding@resend.dev",

        to: recipients,

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

            <h2 style="
              margin-bottom: 24px;
            ">
              New Property Inquiry
            </h2>

            <p>
              <strong>Property:</strong><br/>
              ${
                propertyTitle ||
                "Luxury Property"
              }
            </p>

            <br/>

            <p>
              <strong>Name:</strong><br/>
              ${name}
            </p>

            <br/>

            <p>
              <strong>Email:</strong><br/>
              ${email}
            </p>

            <br/>

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
    // SUCCESS
    // =========================

    return NextResponse.json(
      {
        success: true,
        message:
          "Email sent successfully",
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

