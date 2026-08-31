/**
 * Vercel Serverless Function
 * Actúa como proxy seguro entre la calculadora y GHL API
 * POST /api/create-contact
 * Según especificación de soporte GHL (2023-02-21)
 */

const GHL_API_URL = "https://services.leadconnectorhq.com/contacts/";
const GHL_LOCATION_ID = "i5212YWibYHijuQUVDQL";
const GHL_TOKEN = "pit-d2a856b1-013d-4e66-80cf-973084ce6353";
const GHL_VERSION = "2023-02-21";

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

    const ghlPayload = {
      firstName: firstName,
      lastName: lastName,
      email: data.email,
      phone: data.phone,
      locationId: GHL_LOCATION_ID,
      source: "calculadora_malenia",
      tags: ["lead_magnet"]
    };

    console.log("📤 Enviando a GHL:", JSON.stringify(ghlPayload));

    const ghlResponse = await fetch(GHL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GHL_TOKEN}`,
        "Version": GHL_VERSION
      },
      body: JSON.stringify(ghlPayload)
    });

    console.log("✅ GHL Status:", ghlResponse.status);
    const responseText = await ghlResponse.text();
    console.log("📦 GHL Response:", responseText);

    let ghlData;
    try {
      ghlData = JSON.parse(responseText);
    } catch (e) {
      console.error("❌ GHL no devolvió JSON válido:", responseText);
      return res.status(ghlResponse.status || 500).json({
        error: "GHL returned invalid response",
        response: responseText,
        status: ghlResponse.status
      });
    }

    if (!ghlResponse.ok) {
      console.error("❌ GHL API Error:", ghlResponse.status, ghlData);
      return res.status(ghlResponse.status).json({
        error: "Failed to create contact in GHL",
        details: ghlData
      });
    }

    return res.status(200).json({
      success: true,
      contactId: ghlData.id || ghlData.contactId,
      message: "Contact created successfully"
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};
