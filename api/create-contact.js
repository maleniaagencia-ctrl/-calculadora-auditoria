/**
 * Vercel Serverless Function
 * Envía los datos de la calculadora al Inbound Webhook de GHL
 * POST /api/create-contact
 * 
 * ACTUALIZACIÓN: Ahora calcula automáticamente annualMoney (potentialMoney × 12)
 * para usarlo en el email #4 del funnel
 */

const GHL_WEBHOOK_URL = "https://services.leadconnectorhq.com/hooks/i5212YWibYHIjuUQVDQL/webhook-trigger/573d65d4-a9cd-43f8-9516-0bb1da295293";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body;

    // Validar campos requeridos
    if (!data.name || !data.email || !data.phone || !data.clinic) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Separar nombre y apellido
    const [firstName, ...lastNameParts] = data.name.split(" ");
    const lastName = lastNameParts.join(" ") || "";

    // NUEVO: Calcular annualMoney automáticamente
    const potentialMoney = data.calculator?.money ?? 0;
    const annualMoney = potentialMoney * 12;

    // Construir payload para GHL
    const webhookPayload = {
      "firstName": firstName,
      "lastName": lastName,
      "email": data.email,
      "phone": data.phone,
      "clinic": data.clinic,
      "city": data.city || "",
      "employees": data.employees || "",
      "role": data.role || "",
      "source": "calculadora_malenia",
      "etiquetas": "lead_magnet",
      "lostCalls": data.calculator?.lostCalls ?? "",
      "recoverable": data.calculator?.recoverable ?? "",
      "potentialMoney": potentialMoney,
      "annualMoney": annualMoney,
      "date": data.date || new Date().toISOString()
    };

    console.log("📤 Enviando a GHL Webhook:", JSON.stringify(webhookPayload));

    // Enviar a GHL
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
        status: ghlResponse.status,
        response: responseText
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data sent to GHL webhook successfully",
      response: responseText
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};
