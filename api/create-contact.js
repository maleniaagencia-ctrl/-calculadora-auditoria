/**
 * Vercel Serverless Function
 * Actúa como proxy seguro entre la calculadora y GHL API v2.0
 * POST /api/create-contact
 */

const GHL_API_URL = "https://services.leadconnectorhq.com/contacts/";
const GHL_LOCATION_ID = "i5212YWibYHijuQUVDQL";
const GHL_TOKEN = "pit-032c3b02-5920-4b6e-a59c-d1e61bd4d407";
const GHL_VERSION = "2021-07-28";

export default async function handler(req, res) {
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
      tags: ["lead_magnet"],
      customFields: [
        { id: "clinic", value: data.clinic },
        { id: "city", value: data.city },
        { id: "employees", value: data.employees },
        { id: "role", value: data.role },
        { id: "lostCalls", value: String(data.calculator.lostCalls) },
        { id: "recoverable", value: String(data.calculator.recoverable) },
        { id: "potentialMoney", value: String(data.calculator.money) }
      ]
    };

    // Hacer POST a GHL
    const ghlResponse = await fetch(GHL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": GHL_TOKEN,
        "Version": GHL_VERSION
      },
      body: JSON.stringify(ghlPayload)
    });

    const ghlData = await ghlResponse.json();

    // Si GHL devuelve un error
    if (!ghlResponse.ok) {
      console.error("GHL API Error:", ghlResponse.status, ghlData);
      return res.status(ghlResponse.status).json({
        error: "Failed to create contact in GHL",
        details: ghlData
      });
    }

    // Éxito
    return res.status(200).json({
      success: true,
      contactId: ghlData.id || ghlData.contactId,
      message: "Contact created successfully"
    });

  } catch (error) {
    console.error("Error in create-contact function:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
}
