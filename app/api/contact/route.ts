import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const name = body.name?.trim()
    const email = body.email?.trim()
    const message = body.message?.trim()

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        {
          status: 400,
        }
      )
    }

    // Send admin email
    await resend.emails.send({
      from: "Luxury Concierge <onboarding@resend.dev>",
      to: process.env.CONTACT_TO_EMAIL as string,
      replyTo: email,
      subject: `New Contact Inquiry — ${name}`,

      html: `
        <div style="font-family:Arial;padding:24px;">
          <h2>New Contact Request</h2>

          <p><strong>Name:</strong> ${name}</p>

          <p><strong>Email:</strong> ${email}</p>

          <p><strong>Message:</strong></p>

          <p>${message}</p>
        </div>
      `,
    })

    // Send auto reply
    await resend.emails.send({
      from: "Luxury Concierge <onboarding@resend.dev>",
      to: email,
      subject: "We received your inquiry",

      html: `
        <div style="
          font-family:Arial;
          padding:32px;
          line-height:1.8;
        ">
          <h1>Thank you, ${name}</h1>

          <p>
            Your message has been received by our concierge team.
          </p>

          <p>
            We will contact you shortly with a personalized response.
          </p>

          <br/>

          <p>
            — Luxury Concierge
          </p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      {
        status: 500,
      }
    )
  }
}