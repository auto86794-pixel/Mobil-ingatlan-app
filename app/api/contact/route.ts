import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {

  try {

    // =========================
    // RESEND INIT
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

    // Add property owner if valid
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
    // SEND OWNER + ADMIN EMAIL
    // =========================

    const inquiryEmail =
      await resend.emails.send({

        // Production:
        // inquiries@debrecenhomes.hu

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
    // AUTO REPLY
    // =========================

    try {

      const autoReply =
        await resend.emails.send({

          from:
            process.env
              .RESEND_FROM_EMAIL ||

            "onboarding@resend.dev",

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

              <h1 style="
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 32px;
              ">
                Thank you, ${name}
              </h1>

              <p style="
                margin-bottom: 24px;
              ">
                Your inquiry regarding
                <strong>
                  ${
                    propertyTitle ||
                    "this property"
                  }
                </strong>
                has been received.
              </p>

              <p style="
                margin-bottom: 24px;
              ">
                Our concierge team
                will contact you shortly
                with a personalized response.
              </p>

              <p style="
                margin-top: 48px;
              ">
                — Luxury Concierge
              </p>

            </div>
          `,
        });

      console.log(
        "AUTO REPLY:",
        autoReply
      );

    } catch (autoReplyError) {

      console.error(
        "AUTO_REPLY_ERROR:",
        autoReplyError
      );

    }

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
