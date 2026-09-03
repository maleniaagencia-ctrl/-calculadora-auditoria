const CONFIG = {
  RECOVERY_RATE: 0.25,
  CALL_NEW_PATIENT_RATE: 0.35,
  DIGITAL_RECOVERY_RATE: 0.20,
  UNKNOWN_MISSED_CALL_RATE: 0.10,
  UNKNOWN_CONVERSION_RATE: 0.35,
  CALENDAR_URL: "https://calendar.app.google/hgJYdqez5Kvft6Ao8",
  WHATSAPP_PHONE: "34674433522",
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

// ========== HISTORIAL: Cargar y mostrar al inicio ==========
function loadHistory(){
  const leads = getAllLeads();
  const historyPanel = $("historyPanel");
  const historyTableBody = $("historyTableBody");
  const historyEmpty = $("historyEmpty");
  
  if(leads.length === 0){
    historyPanel.style.display = "none";
    return;
  }
  
  historyPanel.style.display = "block";
  historyTableBody.innerHTML = "";
  
  leads.forEach(lead => {
    const row = document.createElement("tr");
    const date = new Date(lead.date);
    const dateStr = date.toLocaleDateString("es-ES") + " " + date.toLocaleTimeString("es-ES", {hour: "2-digit", minute: "2-digit"});
    const money = lead.calculator?.money || 0;
    const recoverable = lead.calculator?.recoverable || 0;
    
    row.innerHTML = `
      <td><strong>${lead.clinic}</strong></td>
      <td>${lead.email}</td>
      <td class="history-money">${money.toLocaleString("es-ES")} €</td>
      <td>${recoverable}</td>
      <td class="history-date">${dateStr}</td>
    `;
    historyTableBody.appendChild(row);
  });
}

function getAllLeads(){
  const leads = [];
  for(let key in localStorage){
    if(key.startsWith("lead_")){
      try {
        leads.push(JSON.parse(localStorage[key]));
      } catch(e) {
        console.warn("Error parsing lead:", key, e);
      }
    }
  }
  return leads.sort((a, b) => new Date(b.date) - new Date(a.date));
}

$("startBtn").addEventListener("click",()=>{
  $("hero").classList.add("hidden");
  $("calculator").classList.remove("hidden");
  renderStep();
  track("calculator_start");
});

$("clearHistoryBtn")?.addEventListener("click", () => {
  if(confirm("¿Estás seguro de que quieres borrar el historial de auditorías?")){
    for(let key in localStorage){
      if(key.startsWith("lead_")){
        localStorage.removeItem(key);
      }
    }
    loadHistory();
    alert("Historial borrado.");
  }
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
    if(manualCalls.value){state.calls=Number(manualCalls.value); document.querySelectorAll('.option[data-key="calls"]').forEach(x=>x.classList.remove("selected"));}
    $("continueBtn").disabled=!(state.calls>0);
  });
  const manualValue=$("manual-patientValue");
  if(manualValue) manualValue.addEventListener("input",()=>{
    if(manualValue.value){state.patientValue=Number(manualValue.value); document.querySelectorAll('.option[data-key="patientValue"]').forEach(x=>x.classList.remove("selected"));}
    $("continueBtn").disabled=!(state.patientValue>0);
  });
  const continueBtn=$("continueBtn");
  if(continueBtn) continueBtn.addEventListener("click",next);
  const continueChannels=$("continueChannels");
  if(continueChannels) continueChannels.addEventListener("click",()=>{
    state.channels=[...document.querySelectorAll('.channel input:checked')].map(x=>x.value);
    next();
  });
}

function next(){
  if(state.step < steps.length-1){
    state.step++;
    renderStep();
    track(`question_${state.step}_completed`);
  } else {
    calculate();
  }
}

function calculate(){
  const lostCalls=Math.round(state.calls*state.missedRate);
  const callOpportunities=Math.round(lostCalls*CONFIG.CALL_NEW_PATIENT_RATE);
  const unconvertedDigital=Math.round(state.leads*(1-state.conversion));
  const digitalRecoverable=Math.round(unconvertedDigital*CONFIG.DIGITAL_RECOVERY_RATE);
  const recoverable=Math.max(0,Math.round((callOpportunities+digitalRecoverable)*CONFIG.RECOVERY_RATE));
  const money=Math.round(recoverable*state.patientValue);
  const attended=Math.max(0,state.leads-unconvertedDigital);
  state.result={lostCalls,callOpportunities,digitalRecoverable,recoverable,money,attended};
  $("calculator").classList.add("hidden");
  $("results").classList.remove("hidden");
  renderResults();
  track("calculator_completed");
  track("result_shown");
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderResults(){
  const r=state.result;
  animateNumber($("lostCalls"),r.lostCalls);
  animateNumber($("recoverable"),r.recoverable);
  animateNumber($("potentialMoney"),r.money, " €");
  $("barLeadsVal").textContent=r.attended + (r.recoverable||0);
  $("barAttendedVal").textContent=r.attended;
  $("barRecoverableVal").textContent=r.recoverable;
  const max=Math.max(1,r.attended,r.recoverable,r.attended+r.recoverable);
  setTimeout(()=>{
    $("barLeads").style.width=`${Math.min(100,((r.attended+r.recoverable)/max)*100)}%`;
    $("barAttended").style.width=`${Math.min(100,(r.attended/max)*100)}%`;
    $("barRecoverable").style.width=`${Math.min(100,(r.recoverable/max)*100)}%`;
  },100);
  let msg;
  if(r.money>5000) msg=`Tu estimación muestra un <strong>potencial económico relevante</strong>.`;
  else if(r.money>=1000) msg=`Hay un <strong>margen claro de mejora</strong> en la gestión de oportunidades.`;
  else msg=`El impacto económico directo parece más contenido, pero todavía puede existir <strong>un ahorro importante de tiempo</strong>.`;
  $("insightText").innerHTML=`<p>${msg}</p><p>La oportunidad no está en sustituir a tu equipo, sino en permitir que un empleado digital se encargue de tareas repetitivas.</p>`;
}

function animateNumber(el,target,suffix=""){
  const start=Number(el.textContent.replace(/[^\d]/g,""))||0;
  const duration=750; const t0=performance.now();
  function tick(t){
    const p=Math.min(1,(t-t0)/duration);
    const eased=1-Math.pow(1-p,3);
    el.textContent=Math.round(start+(target-start)*eased).toLocaleString("es-ES")+suffix;
    if(p<1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

$("leadForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const form=e.currentTarget;
  const status=$("formStatus");
  if(!form.checkValidity()){form.reportValidity();return;}
  const data=Object.fromEntries(new FormData(form).entries());
  data.consent=Boolean(form.consent.checked);
  data.calculator={...state.result, calls:state.calls, missedRate:state.missedRate, channels:state.channels, leads:state.leads, conversion:state.conversion, patientValue:state.patientValue};
  data.source="calculadora_malenia";
  data.date=new Date().toISOString();
  data.utm=Object.fromEntries(new URLSearchParams(location.search));
  
  // ========== GUARDAR EN localStorage CON KEY ÚNICA ==========
  const storageKey = `lead_${data.email}_${Date.now()}`;
  localStorage.setItem(storageKey, JSON.stringify(data));
  console.log("✅ Datos guardados en localStorage:", storageKey);

  // ========== ENVIAR A GHL CON ETIQUETA CORRECTA ==========
  try {
    const response = await fetch("/api/create-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    console.log(response.ok ? "✅ Enviado a GHL:" : "⚠️ GHL no respondió OK:", result);
  } catch (err) {
    console.warn("⚠️ No se pudo enviar a GHL (dato ya guardado localmente):", err);
  }

  status.textContent="";
  $("results").classList.add("hidden");
  $("success").classList.remove("hidden");
  configureFinalLinks(data);
  track("lead_submitted");
  
  // ========== RECARGAR HISTORIAL ==========
  loadHistory();
  
  window.scrollTo({top:0,behavior:"smooth"});
});

function configureFinalLinks(data){
  const msg=encodeURIComponent(`Hola, soy ${data.name} de ${data.clinic}. He realizado la calculadora de MalenIA y me gustaría analizar cómo reducir las oportunidades que estoy perdiendo. Estimación de pérdidas: ${state.result.money}€/mes`);
  const whatsappUrl = `https://wa.me/34674433522?text=${msg}`;
  const calendarUrl = CONFIG.CALENDAR_URL;
  $("whatsappBtn").href=whatsappUrl;
  $("calendarBtn").href=calendarUrl;
  $("whatsappBtn").addEventListener("click",()=>track("whatsapp_clicked"),{once:true});
  $("calendarBtn").addEventListener("click",()=>track("calendar_clicked"),{once:true});
}

function track(eventName){
  window.dataLayer=window.dataLayer||[];
  window.dataLayer.push({event:eventName,brand:"MalenIA",tool:"calculadora_pacientes_perdidos"});
  if(typeof window.gtag==="function") window.gtag("event",eventName);
  if(typeof window.fbq==="function") window.fbq("trackCustom",eventName);
}

// ========== CARGAR HISTORIAL AL ABRIR LA PÁGINA ==========
document.addEventListener("DOMContentLoaded", () => {
  loadHistory();
});
