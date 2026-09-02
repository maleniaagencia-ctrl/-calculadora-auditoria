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
      "First Name": firstName,
      "Last Name": lastName,
      "Email": data.email,
      "Phone": data.phone,
      "clinic": data.clinic,
      "city": data.city || "",
      "employees": data.employees || "",
      "role": data.role || "",
      "source": "calculadora_malenia",
      "lostCalls": data.calculator?.lostCalls ?? "",
      "recoverable": data.calculator?.recoverable ?? "",
      "potentialMoney":
