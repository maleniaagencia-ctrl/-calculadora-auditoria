/**
 * Vercel Serverless Function
 * Envía los datos de la calculadora al Inbound Webhook de GHL
 * POST /api/create-contact
 */

const GHL_WEBHOOK_URL = "https://services.leadconnectorhq.com/hooks/i5212YWibYHIjuUQVDQL/webhook-trigger/88faded6-d642-42e4-9fb5-871e2a542664";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body;

    if (!data.name || !data.email || !data.phone || !data.clinic) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [firstName, ...lastNameParts] = data.name.split(" ");
    const lastName = lastNameParts.join(" ") || "";

    const webhookPayload = {
      FirstName: firstName,
      LastName: lastName,
      Email: data.email,
      Phone: data.phone,
      clinic: data.clinic,
      city: data.city || "",
      employees: data.employees || "",
      role: data.role || "",
      source: "calculadora_malenia",
      lostCalls: data.calculator?.lostCalls ?? "",
      recoverable: data.calculator?.recoverable ?? "",
      potentialMoney: data.calculator?.money ?? "",
      date: data.date || new Date().toISOString()
    };

    console.log("📤 Enviando a GHL Webhook:", JSON.stringify(webhookPayload));

    const ghlResponse = await fetch(GHL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(webhookPayload)
    });

    console.log("✅ GHL Webhook Status:", ghlResponse.status);
    const responseText = await ghlResponse.text();
    console.log("📦 GHL Webhook Response:", responseText);

    if (!ghlResponse.ok) {
      return res.status(ghlResponse.status).json({
        error: "Failed to send to GHL webhook",
        response: responseText
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data sent to GHL webhook successfully"
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};
