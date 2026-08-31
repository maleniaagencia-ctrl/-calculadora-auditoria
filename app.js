/*
  MALENIA — CALCULADORA DE PACIENTES PERDIDOS
*/

const CONFIG = {
  RECOVERY_RATE: 0.25,
  CALL_NEW_PATIENT_RATE: 0.35,
  DIGITAL_RECOVERY_RATE: 0.20,
  UNKNOWN_MISSED_CALL_RATE: 0.10,
  UNKNOWN_CONVERSION_RATE: 0.35,
  CALENDAR_URL: "https://calendar.app.google/hgJYdqez5Kvft6Ao8",
  WHATSAPP_URL: "",
  BRAND: "MalenIA"
};

const state = {
  step: 0,
  calls: 0,
  missedRate: 0,
  channels: [],
  leads: 0,
  conversion: 0,
  patientValue: 0
};

const steps = [
  {
    icon:"☎", title:"¿Cuántas llamadas recibe aproximadamente tu clínica cada mes?",
    help:"Elige un rango o introduce una cifra exacta.",
    render(){
      return optionGrid([["<100",75],["100–250",175],["250–500",375],["500–1.000",750],["1.000+",1200]], state.calls, "calls", true);
    }
  },
  {
    icon:"◉", title:"¿Qué porcentaje aproximado de llamadas no podéis atender?",
    help:"Si no lo sabes, usaremos una estimación conservadora.",
    render(){
      return optionGrid([["<5%",0.04],["5–10%",0.075],["10–20%",0.15],["20–30%",0.25],[">30%",0.35],["No lo sabemos",CONFIG.UNKNOWN_MISSED_CALL_RATE]], state.missedRate, "missedRate");
    }
  },
  {
    icon:"✦", title:"¿Por qué canales recibís consultas de nuevos pacientes?",
    help:"Selecciona todos los que correspondan.",
    render(){
      const items = ["WhatsApp","Instagram","Facebook","Email","Web","Llamadas","Otros"];
      return `<div class="channel-grid">${items.map(x=>`<label class="channel ${state.channels.includes(x)?"selected":""}"><input type="checkbox" value="${x}" ${state.channels.includes(x)?"checked":""}> ${x}</label>`).join("")}</div><button class="primary-btn continue" id="continueChannels">CONTINUAR <span>→</span></button>`;
    }
  },
  {
    icon:"◎", title:"¿Cuántas consultas o nuevos contactos recibís aproximadamente al mes?",
    help:"Cuenta los nuevos contactos, no las citas ya confirmadas.",
    render(){
      return optionGrid([["<25",15],["25–50",38],["50–100",75],["100–250",175],["250+",300]], state.leads, "leads");
    }
  },
  {
    icon:"↗", title:"De cada 10 nuevos contactos, ¿cuántos terminan reservando una cita?",
    help:"Si no lo sabes, aplicaremos una hipótesis conservadora.",
    render(){
      return optionGrid([["1–2",0.15],["3–4",0.35],["5–6",0.55],["7–8",0.75],["9–10",0.90],["No lo sabemos",CONFIG.UNKNOWN_CONVERSION_RATE]], state.conversion, "conversion");
    }
  },
  {
    icon:"€", title:"¿Cuál es aproximadamente el valor medio de un nuevo paciente?",
    help:"Usaremos esta cifra solo para calcular un potencial económico orientativo.",
    render(){
      return optionGrid([["<100 €",75],["100–250 €",175],["250–500 €",375],["500–1.000 €",750],[">1.000 €",1250]], state.patientValue, "patientValue", true);
    }
  }
];

function optionGrid(items, current, key, manual=false){
  let html = `<div class="option-grid">`;
  items.forEach(([label,value])=>{
    html += `<button class="option ${current===value?"selected":""}" data-key="${key}" data-value="${value}">${label}</button>`;
  });
  html += `</div>`;
  if(manual) html += `<div class="manual"><input id="manual-${key}" type="number" min="1" placeholder="O introduce una cifra exacta"></div>`;
  html += `<button class="primary-btn continue" id="continueBtn" disabled>CONTINUAR <span>→</span></button>`;
  return html;
}

const $ = id => document.getElementById(id);
$("startBtn").addEventListener("click",()=>{
  $("hero").classList.add("hidden");
  $("calculator").classList.remove("hidden");
  renderStep();
  track("calculator_start");
});

function renderStep(){
  const s = steps[state.step];
  $("questionIcon").textContent=s.icon;
  $("questionTitle").textContent=s.title;
  $("questionHelp").textContent=s.help;
  $("questionBody").innerHTML=s.render();
  $("stepLabel").textContent=`Paso ${state.step+1} de ${steps.length}`;
  $("progressPct").textContent=`${Math.round(((state.step+1)/steps.length)*100)}%`;
  $("progressBar").style.width=`${((state.step+1)/steps.length)*100}%`;
  bindStep();
}

function bindStep(){
  document.querySelectorAll(".option").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const key=btn.dataset.key;
      state[key]=Number(btn.dataset.value);
      document.querySelectorAll(`.option[data-key="${key}"]`).forEach(x=>x.classList.remove("selected"));
      btn.classList.add("selected");
      const continueBtn=$("continueBtn");
      if(continueBtn) continueBtn.disabled=false;
      if(key==="calls" && $("manual-calls")) $("manual-calls").value="";
      if(key==="patientValue" && $("manual-patientValue")) $("manual-patientValue").value="";
    });
  });
  const manualCalls=$("manual-calls");
  if(manualCalls) manualCalls.addEventListener("input",()=>{
    if(manualCalls.value){state.calls=Number(manualCalls.value); document.querySelectorAll('.option[data-key="calls"]').forEach(x=>
