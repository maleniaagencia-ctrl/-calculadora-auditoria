/**
 * Vercel Serverless Function
 * Actúa como proxy seguro entre la calculadora y GHL API v2.0
 * POST /api/create-contact
 */

const GHL_API_URL = "https://services.leadconnectorhq.com/v1/contacts/";
const GHL_TOKEN = "pit-d2a856b1-013d-4e66-80cf-973084ce6353";
const GHL_VERSION = "2021-07-28";

module.exports = async (req, res) => {
  // Solo permitir POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body;

    // Validar que tenemos los datos mínimos
    if (!data.name || !data.email || !data.phone || !data.clinic) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Parsear nombre y apellido
    const [firstName, ...lastNameParts] = data.name.split(" ");
    const lastName = lastNameParts.join(" ") || "";

    // Construir payload para GHL API v2.0
    const ghlPayload = {
      firstName: firstName,
      lastName: lastName,
      email: data.email,
      phone: data.phone,
      source: "calculadora_malenia",
      tags: ["lead_magnet"]
    };

    console.log("Enviando a GHL:", ghlPayload);

    // Hacer POST a GHL
    const ghlResponse = await fetch(GHL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GHL_TOKEN}`,
        "Version": GHL_VERSION
      },
      body: JSON.stringify(ghlPayload)
    });

    console.log("Status GHL:", ghlResponse.status);
    const responseText = await ghlResponse.text();

    let ghlData;
    try {
      ghlData = JSON.parse(responseText);
    } catch (e) {
      console.error("GHL returned non-JSON:", responseText);
      return res.status(500).json({
        error: "GHL API returned invalid response",
        status: ghlResponse.status
      });
    }

    if (!ghlResponse.ok) {
      console.error("GHL Error:", ghlData);
      return res.status(ghlResponse.status).json({
        error: "Failed to create contact",
        details: ghlData
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact created"
    });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      error: "Server error",
      message: error.message
    });
  }
};
