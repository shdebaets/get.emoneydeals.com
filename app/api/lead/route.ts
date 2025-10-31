import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, zip, name, phone, source } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Get webhook URL from environment variable
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl) {
      console.error("❌ WEBHOOK_URL environment variable is not set");
      // Still return success to the client, but log the error
      return NextResponse.json({ success: true, message: "Lead received (webhook not configured)" });
    }

    // Send webhook with user email
    console.log(`📤 Sending webhook to ${webhookUrl} for email: ${email}`);
    try {
      const webhookPayload = {
        email,
        zip: zip || null,
        name: name || null,
        phone: phone || null,
        source: source || null,
        timestamp: new Date().toISOString(),
      };

      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      if (webhookResponse.ok) {
        console.log(`✅ Webhook sent successfully (status: ${webhookResponse.status})`);
      } else {
        console.error(`❌ Webhook failed with status ${webhookResponse.status}`);
        const errorText = await webhookResponse.text().catch(() => "Could not read error");
        console.error(`Error response: ${errorText}`);
      }
    } catch (webhookError) {
      console.error("❌ Error sending webhook:", webhookError);
      // Still return success to the client, but log the error
    }

    return NextResponse.json({ success: true, message: "Lead received" });
  } catch (error) {
    console.error("Error processing lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

