# MalenIA — Calculadora de Pacientes Perdidos

Lead magnet interactivo para clínicas dentales.

## Archivos

- `index.html` — estructura y copy.
- `styles.css` — interfaz premium responsive.
- `app.js` — lógica, cálculo, eventos y webhook.

## Modelo de cálculo

La herramienta utiliza hipótesis conservadoras y configurables:

1. Llamadas potencialmente perdidas = llamadas mensuales × % no atendidas.
2. Oportunidades procedentes de llamadas perdidas = llamadas perdidas × `CALL_NEW_PATIENT_RATE`.
3. Leads digitales no convertidos = leads × (1 − conversión).
4. Recuperables digitales = leads no convertidos × `DIGITAL_RECOVERY_RATE`.
5. Oportunidades potencialmente recuperables = (oportunidades de llamadas + recuperables digitales) × `RECOVERY_RATE`.
6. Potencial económico = oportunidades recuperables × valor medio del paciente.

Estas hipótesis NO son estadísticas universales. Se usan como un modelo orientativo y están declaradas en el código.

## Configuración

Editar `app.js`:

```js
const CONFIG = {
  RECOVERY_RATE: 0.25,
  CALL_NEW_PATIENT_RATE: 0.35,
  DIGITAL_RECOVERY_RATE: 0.20,
  UNKNOWN_MISSED_CALL_RATE: 0.10,
  UNKNOWN_CONVERSION_RATE: 0.35,
  WEBHOOK_URL: "",
  CALENDAR_URL: "",
  WHATSAPP_URL: ""
};
```

### WEBHOOK

Introduce aquí el endpoint de GoHighLevel, Make, n8n u otro sistema.

El payload incluye:

- Datos de contacto.
- Datos de la clínica.
- Datos introducidos en la calculadora.
- Resultado.
- Fecha.
- Fuente.
- UTM.

## Analítica

La herramienta envía eventos a `dataLayer` y, si están presentes, a `gtag` y `fbq`.

Eventos:

- `calculator_start`
- `question_1_completed` ... `question_5_completed`
- `calculator_completed`
- `result_shown`
- `lead_submit_start`
- `lead_submitted`
- `whatsapp_clicked`
- `calendar_clicked`

## Importante

El modelo está diseñado como estimación comercial orientativa, no como previsión financiera. Antes de publicarlo en campañas, MalenIA debería revisar las hipótesis con datos reales de sus primeras clínicas y ajustar las tasas.
