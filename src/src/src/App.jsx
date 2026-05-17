import { useState, useRef, useEffect } from "react";

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#f6f5f0", white: "#ffffff", navy: "#0d1b2a", navyMid: "#1b2e45",
  slate: "#2d4159", muted: "#6b7f96", border: "#e0e7ef", borderHover: "#b0c4de",
  gold: "#c9a84c", goldLight: "#fdf6e3", goldBorder: "#f0d080",
  blue: "#1a56db", blueLight: "#ebf3ff", blueMid: "#2563eb",
  green: "#0a7c5c", greenLight: "#e6f9f3", greenBorder: "#6ee7c7",
  amber: "#b45309", amberLight: "#fffbeb", amberBorder: "#fcd34d",
  red: "#c0392b", redLight: "#fff0ee",
  purple: "#6d28d9", purpleLight: "#ede9fe",
  teal: "#0d9488", tealLight: "#ccfbf1",
  orange: "#c2410c", orangeLight: "#fff7ed",
  pink: "#be185d", pinkLight: "#fdf2f8",
  indigo: "#3730a3", indigoLight: "#eef2ff",
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const AIDES = [
  // Revenus
  { id:"rsa", nom:"RSA", cat:"Revenus", icon:"💶", color:C.blue, colorLight:C.blueLight, fullName:"Revenu de Solidarité Active", desc:"Revenu minimum garanti pour les personnes sans ressources ou à faibles revenus.", organisme:"CAF / MSA", lien:"https://www.caf.fr", delai:"1 à 2 mois", conditions:["Avoir plus de 25 ans (ou parent isolé)","Résider en France","Ressources insuffisantes"], docs:["Pièce d'identité","Justificatif de domicile","Relevés de compte 3 mois","Justificatifs de revenus"],
    calcul:(d)=>{ const r=+d.revenus||0,p=+d.personnes||1,base=p===1?635:p===2?952:p===3?1143:1270; if(d.travaille!=="non"&&d.travaille!=="chomage")return{ok:false}; if(r>=base)return{ok:false}; return{ok:true,m:Math.round(base-r*0.62),t:"mensuel"}; }},
  { id:"prime", nom:"Prime d'Activité", cat:"Revenus", icon:"💵", color:C.green, colorLight:C.greenLight, fullName:"Prime d'Activité", desc:"Complément de revenus pour les travailleurs à faibles salaires.", organisme:"CAF / MSA", lien:"https://www.caf.fr", delai:"1 mois", conditions:["Travailler","Avoir plus de 18 ans","Revenus inférieurs au plafond"], docs:["Bulletins de salaire 3 mois","RIB","Pièce d'identité"],
    calcul:(d)=>{ const r=+d.revenus||0,p=+d.personnes||1; if(d.travaille!=="oui")return{ok:false}; if(r>1900)return{ok:false}; const base=p===1?635:p===2?952:1143,m=Math.round(base+r*0.61-r); return m>30?{ok:true,m,t:"mensuel"}:{ok:false}; }},
  { id:"aah", nom:"AAH", cat:"Handicap", icon:"♿", color:C.amber, colorLight:C.amberLight, fullName:"Allocation Adulte Handicapé", desc:"Aide financière pour les personnes en situation de handicap reconnue.", organisme:"CAF + MDPH", lien:"https://www.caf.fr", delai:"4 à 6 mois", conditions:["Taux d'incapacité ≥ 80%","Ou 50-79% avec restriction emploi","Résider en France"], docs:["Notification MDPH","Ressources du foyer","RIB"],
    calcul:(d)=>{ if(d.handicap!=="oui")return{ok:false}; const r=+d.revenus||0; if(r>=1016)return{ok:false}; return{ok:true,m:Math.round(1016-r),t:"mensuel"}; }},
  { id:"apl", nom:"APL", cat:"Logement", icon:"🏠", color:C.purple, colorLight:C.purpleLight, fullName:"Aide Personnalisée au Logement", desc:"Aide au paiement du loyer pour les locataires en logement conventionné.", organisme:"CAF / MSA", lien:"https://www.caf.fr", delai:"1 à 2 mois", conditions:["Être locataire d'un logement conventionné","Résidence principale"], docs:["Bail de location","Justificatifs de revenus","RIB"],
    calcul:(d)=>{ if(d.logement!=="locataire")return{ok:false}; const r=+d.revenus||0,l=+d.loyer||0,p=+d.personnes||1; if(r>2200||l===0)return{ok:false}; const plaf=p===1?295:p===2?385:440,m=Math.max(0,Math.round(Math.min(l*0.66,plaf)-r*0.08)); return m>15?{ok:true,m,t:"mensuel"}:{ok:false}; }},
  { id:"alf", nom:"ALF", cat:"Logement", icon:"🏡", color:C.purple, colorLight:C.purpleLight, fullName:"Allocation de Logement Familiale", desc:"Aide au logement pour les familles avec enfants en logement non conventionné.", organisme:"CAF / MSA", lien:"https://www.caf.fr", delai:"1 à 2 mois", conditions:["Avoir des personnes à charge","Logement non conventionné","Ressources insuffisantes"], docs:["Bail","Justificatifs familiaux","Avis d'imposition"],
    calcul:(d)=>{ if(d.logement!=="locataire")return{ok:false}; const p=+d.personnes||1,r=+d.revenus||0,l=+d.loyer||0; if(p<2||r>1800||l===0)return{ok:false}; const m=Math.round(Math.min(l*0.55,250)); return m>15?{ok:true,m,t:"mensuel"}:{ok:false}; }},
  { id:"energie", nom:"Chèque Énergie", cat:"Logement", icon:"⚡", color:C.orange, colorLight:C.orangeLight, fullName:"Chèque Énergie", desc:"Aide annuelle automatique pour payer vos factures d'énergie.", organisme:"DGEC / Anah", lien:"https://chequeenergie.gouv.fr", delai:"Automatique (avril)", conditions:["Revenus fiscaux inférieurs au plafond","Attribution automatique sans démarche"], docs:["Aucun document — envoi automatique par courrier"],
    calcul:(d)=>{ const rfr=(+d.revenus||0)*12,p=+d.personnes||1,plaf=p===1?11399:p===2?14484:p===3?17399:20399; if(rfr>=plaf)return{ok:false}; const m=rfr<plaf*0.6?277:rfr<plaf*0.8?191:143; return{ok:true,m,t:"annuel"}; }},
  { id:"css", nom:"C2S", cat:"Santé", icon:"⚕️", color:C.teal, colorLight:C.tealLight, fullName:"Complémentaire Santé Solidaire", desc:"Mutuelle gratuite ou à 1€/mois selon les revenus.", organisme:"Ameli / CPAM", lien:"https://www.ameli.fr", delai:"2 à 4 semaines", conditions:["Revenus annuels inférieurs au plafond","Être assuré social"], docs:["Avis d'imposition","Justificatifs de revenus 3 mois"],
    calcul:(d)=>{ const rfr=(+d.revenus||0)*12,p=+d.personnes||1,gratuit=p===1?9261:p===2?13892:18523,payant=gratuit*1.35; if(rfr<gratuit)return{ok:true,m:0,t:"gratuit",label:"Gratuite"}; if(rfr<payant)return{ok:true,m:1,t:"mensuel",label:"1€/mois"}; return{ok:false}; }},
  { id:"apa", nom:"APA", cat:"Santé", icon:"🧓", color:C.pink, colorLight:C.pinkLight, fullName:"Allocation Personnalisée d'Autonomie", desc:"Aide pour les personnes âgées de 60+ ans en perte d'autonomie.", organisme:"Conseil Départemental", lien:"https://www.service-public.fr", delai:"2 à 3 mois", conditions:["Avoir 60 ans ou plus","Perte d'autonomie GIR 1-4","Résider en France"], docs:["Pièce d'identité","Justificatif de domicile","Évaluation GIR"],
    calcul:(d)=>{ const age=+d.age||0; if(age<60||d.autonomie!=="oui")return{ok:false}; const r=+d.revenus||0,m=r<800?1800:r<1500?1200:r<2500?600:200; return{ok:true,m,t:"mensuel"}; }},
  { id:"af", nom:"Allocations Familiales", cat:"Famille", icon:"👶", color:C.orange, colorLight:C.orangeLight, fullName:"Allocations Familiales", desc:"Aide mensuelle pour les familles avec au moins 2 enfants à charge.", organisme:"CAF / MSA", lien:"https://www.caf.fr", delai:"1 mois", conditions:["Au moins 2 enfants de moins de 20 ans","Résider en France"], docs:["Actes de naissance des enfants","Justificatif de domicile"],
    calcul:(d)=>{ const e=+d.enfants||0,r=+d.revenus||0; if(e<2)return{ok:false}; const base=e===2?140:e===3?320:500,m=r<3000?base:r<5000?Math.round(base*0.5):Math.round(base*0.25); return{ok:true,m,t:"mensuel"}; }},
  { id:"cf", nom:"Complément Familial", cat:"Famille", icon:"👨‍👩‍👧", color:C.orange, colorLight:C.orangeLight, fullName:"Complément Familial", desc:"Aide pour les familles de 3 enfants ou plus avec revenus modestes.", organisme:"CAF / MSA", lien:"https://www.caf.fr", delai:"1 à 2 mois", conditions:["3 enfants ou plus de 3 à 21 ans","Revenus inférieurs au plafond"], docs:["Actes de naissance","Justificatifs de revenus"],
    calcul:(d)=>{ const e=+d.enfants||0,r=+d.revenus||0; if(e<3||r>3500)return{ok:false}; return{ok:true,m:r<2000?280:178,t:"mensuel"}; }},
  { id:"are", nom:"ARE", cat:"Emploi", icon:"💼", color:C.indigo, colorLight:C.indigoLight, fullName:"Allocation chômage (ARE)", desc:"Indemnisation chômage versée par France Travail après perte d'emploi.", organisme:"France Travail", lien:"https://www.francetravail.fr", delai:"7 jours + instruction", conditions:["Avoir travaillé 6 mois sur 24 derniers mois","Être inscrit à France Travail","Rechercher activement un emploi"], docs:["Attestation employeur","Pièce d'identité","RIB"],
    calcul:(d)=>{ if(d.travaille!=="chomage")return{ok:false}; const r=+d.revenus||0,m=Math.max(32,Math.round(r*0.57)); return{ok:true,m,t:"mensuel"}; }},
  { id:"ass", nom:"ASS", cat:"Emploi", icon:"📋", color:C.indigo, colorLight:C.indigoLight, fullName:"Allocation de Solidarité Spécifique", desc:"Aide pour les chômeurs en fin de droits avec ressources insuffisantes.", organisme:"France Travail", lien:"https://www.francetravail.fr", delai:"1 mois", conditions:["Avoir épuisé les droits ARE","Avoir travaillé 5 ans dans les 10 ans","Ressources insuffisantes"], docs:["Fin de droits ARE","Justificatifs ressources","RIB"],
    calcul:(d)=>{ if(d.fin_are!=="oui")return{ok:false}; const r=+d.revenus||0,p=+d.personnes||1,plaf=p===1?1166:1832; if(r>=plaf)return{ok:false}; return{ok:true,m:545,t:"mensuel"}; }},
  { id:"aspa", nom:"ASPA", cat:"Retraite", icon:"🧡", color:C.pink, colorLight:C.pinkLight, fullName:"Minimum Vieillesse (ASPA)", desc:"Minimum vieillesse pour les personnes retraitées aux faibles revenus.", organisme:"Caisse de retraite", lien:"https://www.service-public.fr", delai:"2 à 4 mois", conditions:["Avoir 65 ans ou plus","Résider en France","Revenus inférieurs au plafond"], docs:["Justificatif d'âge","Relevé de retraite","Justificatif de domicile"],
    calcul:(d)=>{ const age=+d.age||0; if(age<65)return{ok:false}; const r=+d.revenus||0,p=+d.personnes||1,plaf=p===1?1012:1572; if(r>=plaf)return{ok:false}; return{ok:true,m:Math.round(plaf-r),t:"mensuel"}; }},
  { id:"fsl", nom:"FSL", cat:"Logement", icon:"🔑", color:C.purple, colorLight:C.purpleLight, fullName:"Fonds de Solidarité Logement", desc:"Aide départementale pour accéder à un logement ou maintenir votre bail.", organisme:"Conseil Départemental", lien:"https://www.service-public.fr", delai:"2 à 6 semaines", conditions:["Difficultés financières avérées","Résider dans le département"], docs:["Justificatif situation","Relevés bancaires","Quittances de loyer"],
    calcul:(d)=>{ const r=+d.revenus||0,l=+d.loyer||0; if(d.logement!=="locataire"||r>1500||l===0)return{ok:false}; return{ok:true,label:"Jusqu'à 1 200€",t:"variable"}; }},
  { id:"cpf", nom:"CPF", cat:"Emploi", icon:"🎓", color:C.indigo, colorLight:C.indigoLight, fullName:"Compte Personnel de Formation", desc:"Crédit formation financé par vos cotisations pour financer une formation pro.", organisme:"Caisse des Dépôts", lien:"https://www.moncompteformation.gouv.fr", delai:"Variable", conditions:["Être salarié ou demandeur d'emploi","Avoir un projet de formation éligible"], docs:["Compte sur moncompteformation.gouv.fr"],
    calcul:()=>({ok:true,label:"Jusqu'à 5 000€ de crédit",t:"variable"})},
];

const STEPS = [
  {id:"travaille",q:"Quelle est votre situation professionnelle ?",icon:"💼",opts:[
    {v:"oui",l:"Salarié(e) / Indépendant(e)",i:"👔",d:"CDI, CDD, intérim, auto-entrepreneur..."},
    {v:"chomage",l:"Demandeur d'emploi",i:"📋",d:"Inscrit à France Travail"},
    {v:"non",l:"Sans activité",i:"🏠",d:"Parent au foyer, inactif..."},
    {v:"retraite",l:"Retraité(e)",i:"🧓",d:"Pensionné ou préretraité"},
  ]},
  {id:"age",q:"Quel est votre âge ?",icon:"📅",type:"number",ph:"Ex: 38",suf:"ans"},
  {id:"revenus",q:"Revenus nets mensuels du foyer (€)",icon:"💶",type:"number",ph:"Ex: 1 200",suf:"€/mois"},
  {id:"personnes",q:"Combien de personnes dans votre foyer ?",icon:"👨‍👩‍👧",opts:[
    {v:"1",l:"1 personne",i:"🧑",d:"Vous seul(e)"},
    {v:"2",l:"2 personnes",i:"👫",d:"Couple ou colocataire"},
    {v:"3",l:"3 personnes",i:"👨‍👩‍👦",d:"Avec 1 enfant"},
    {v:"4",l:"4 personnes ou +",i:"👨‍👩‍👧‍👦",d:"Grande famille"},
  ]},
  {id:"enfants",q:"Combien d'enfants avez-vous à charge ?",icon:"👶",opts:[
    {v:"0",l:"Aucun",i:"🚫",d:"Pas d'enfant à charge"},
    {v:"1",l:"1 enfant",i:"👶",d:"Un enfant"},
    {v:"2",l:"2 enfants",i:"👶👶",d:"Deux enfants"},
    {v:"3",l:"3 enfants ou +",i:"👨‍👩‍👧‍👦",d:"Trois enfants ou plus"},
  ]},
  {id:"logement",q:"Votre situation de logement",icon:"🏠",opts:[
    {v:"locataire",l:"Locataire",i:"🔑",d:"Appartement ou maison en location"},
    {v:"proprietaire",l:"Propriétaire",i:"🏡",d:"Avec ou sans crédit"},
    {v:"heberge",l:"Hébergé(e) gratuitement",i:"🛋️",d:"Chez un proche"},
  ]},
  {id:"loyer",q:"Montant de votre loyer mensuel",icon:"🏢",type:"number",ph:"Ex: 650",suf:"€/mois",cond:(d)=>d.logement==="locataire"},
  {id:"handicap",q:"Avez-vous une reconnaissance de handicap ?",icon:"♿",opts:[
    {v:"oui",l:"Oui",i:"✅",d:"RQTH, MDPH, carte invalidité..."},
    {v:"non",l:"Non",i:"❌",d:"Pas de reconnaissance officielle"},
  ]},
  {id:"autonomie",q:"Avez-vous une perte d'autonomie ?",icon:"🦽",opts:[
    {v:"oui",l:"Oui",i:"✅",d:"Difficultés dans les actes du quotidien"},
    {v:"non",l:"Non",i:"❌",d:"Autonomie préservée"},
  ]},
  {id:"fin_are",q:"Êtes-vous en fin de droits chômage ?",icon:"⏳",opts:[
    {v:"oui",l:"Oui, droits épuisés",i:"⚠️",d:"L'ARE est terminée"},
    {v:"non",l:"Non",i:"❌",d:"Encore des droits ARE"},
  ],cond:(d)=>d.travaille==="chomage"},
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function calcAll(data) {
  return AIDES.map(a => ({ ...a, result: a.calcul(data) }));
}
function totalM(eligible) {
  return eligible.reduce((s,a)=>s+(a.result.m||0),0);
}
function fmtMontant(r) {
  if(r.label) return r.label;
  if(r.t==="gratuit") return "Gratuit";
  if(r.t==="annuel") return `${r.m}€/an`;
  if(r.m!=null) return `~${r.m}€/mois`;
  return "Variable";
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function Tab({label,active,onClick,badge}) {
  return (
    <button onClick={onClick} style={{
      padding:"10px 20px",borderRadius:10,border:"none",cursor:"pointer",
      fontFamily:"'Crimson Pro',Georgia,serif",fontSize:15,fontWeight:700,
      background:active?C.navy:C.white,color:active?"white":C.muted,
      borderBottom:active?`3px solid ${C.gold}`:"3px solid transparent",
      transition:"all 0.18s",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",
    }}>
      {label}
      {badge!=null&&<span style={{background:active?C.gold:C.border,color:active?C.navy:C.muted,fontSize:11,padding:"1px 8px",borderRadius:20,fontWeight:800}}>{badge}</span>}
    </button>
  );
}

function Card({children,style={}}) {
  return <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:20,padding:"28px 32px",boxShadow:"0 2px 16px rgba(13,27,42,0.06)",...style}}>{children}</div>;
}

function Pill({children,color=C.blue,bg=C.blueLight}) {
  return <span style={{background:bg,color,fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20,letterSpacing:0.3}}>{children}</span>;
}

function Section({title,subtitle,children,id}) {
  return (
    <div id={id} style={{marginBottom:64}}>
      <div style={{marginBottom:32,paddingBottom:16,borderBottom:`2px solid ${C.border}`}}>
        <h2 style={{fontFamily:"'Crimson Pro',Georgia,serif",fontSize:30,fontWeight:800,color:C.navy,margin:0,marginBottom:6}}>{title}</h2>
        {subtitle&&<p style={{color:C.muted,fontSize:15,margin:0,fontFamily:"'Source Sans 3',sans-serif"}}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── SIMULATOR ────────────────────────────────────────────────────────────────
function Simulator({onResult}) {
  const [idx,setIdx]=useState(0);
  const [data,setData]=useState({});
  const [fade,setFade]=useState(true);
  const visible=STEPS.filter(s=>!s.cond||s.cond(data));
  const step=visible[idx];
  const isLast=idx===visible.length-1;

  function next(){
    if(isLast){onResult(data);return;}
    setFade(false);setTimeout(()=>{setIdx(i=>i+1);setFade(true);},150);
  }
  function back(){
    if(idx===0)return;
    setFade(false);setTimeout(()=>{setIdx(i=>i-1);setFade(true);},150);
  }

  return (
    <div>
      {/* Progress */}
      <div style={{marginBottom:28}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <span style={{fontSize:13,color:C.muted,fontFamily:"'Source Sans 3',sans-serif"}}>Étape <strong style={{color:C.navy}}>{idx+1}</strong> / {visible.length}</span>
          <Pill color={C.blue} bg={C.blueLight}>{Math.round(((idx+1)/visible.length)*100)}% complété</Pill>
        </div>
        <div style={{display:"flex",gap:4}}>
          {visible.map((_,i)=>(
            <div key={i} style={{flex:1,height:5,borderRadius:99,background:i<=idx?C.navy:C.border,transition:"background 0.3s"}}/>
          ))}
        </div>
      </div>

      {/* Step card */}
      <div style={{opacity:fade?1:0,transform:fade?"translateY(0)":"translateY(10px)",transition:"all 0.15s ease"}}>
        <div style={{fontSize:36,marginBottom:10}}>{step.icon}</div>
        <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:2,color:C.muted,marginBottom:8,fontFamily:"'Source Sans 3',sans-serif"}}>Question {idx+1}</div>
        <h3 style={{fontFamily:"'Crimson Pro',Georgia,serif",fontSize:22,fontWeight:700,color:C.navy,marginBottom:24,lineHeight:1.3}}>{step.q}</h3>

        {step.opts ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {step.opts.map(opt=>{
              const sel=data[step.id]===opt.v;
              return (
                <button key={opt.v} onClick={()=>setData(d=>({...d,[step.id]:opt.v}))} style={{
                  display:"flex",alignItems:"center",gap:14,padding:"14px 18px",
                  border:`2px solid ${sel?C.navy:C.border}`,borderRadius:14,
                  background:sel?"#0d1b2a08":C.white,cursor:"pointer",textAlign:"left",
                  transition:"all 0.15s",width:"100%",
                }}>
                  <span style={{fontSize:22,flexShrink:0}}>{opt.i}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:C.navy,fontSize:14,fontFamily:"'Source Sans 3',sans-serif"}}>{opt.l}</div>
                    <div style={{fontSize:12,color:C.muted,fontFamily:"'Source Sans 3',sans-serif"}}>{opt.d}</div>
                  </div>
                  {sel&&<div style={{width:22,height:22,borderRadius:"50%",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:13,flexShrink:0}}>✓</div>}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{position:"relative"}}>
            <input type="number" value={data[step.id]||""} onChange={e=>setData(d=>({...d,[step.id]:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&data[step.id]&&next()}
              placeholder={step.ph}
              style={{width:"100%",padding:"16px 80px 16px 20px",border:`2px solid ${data[step.id]?C.navy:C.border}`,borderRadius:14,fontSize:22,fontFamily:"'Crimson Pro',serif",fontWeight:700,color:C.navy,outline:"none",background:C.white,transition:"border-color 0.2s",boxSizing:"border-box"}}
            />
            <span style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:14,fontWeight:700,fontFamily:"'Source Sans 3',sans-serif"}}>{step.suf}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{display:"flex",gap:12,marginTop:28}}>
        {idx>0&&<button onClick={back} style={{padding:"13px 22px",borderRadius:12,border:`1.5px solid ${C.border}`,background:C.white,color:C.muted,cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif",fontSize:14}}>← Retour</button>}
        <button onClick={next} disabled={!data[step.id]} style={{
          flex:1,padding:"14px",borderRadius:12,border:"none",
          background:data[step.id]?C.navy:C.border,color:data[step.id]?"white":C.muted,
          cursor:data[step.id]?"pointer":"not-allowed",fontFamily:"'Source Sans 3',sans-serif",
          fontWeight:800,fontSize:15,transition:"all 0.2s",
          boxShadow:data[step.id]?"0 4px 16px rgba(13,27,42,0.25)":"none",
        }}>
          {isLast?"🔍 Calculer mes droits →":"Continuer →"}
        </button>
      </div>
      <p style={{textAlign:"center",color:C.muted,fontSize:12,marginTop:16,fontFamily:"'Source Sans 3',sans-serif"}}>🔒 Données anonymes — aucun stockage</p>
    </div>
  );
}

// ─── RESULTS ──────────────────────────────────────────────────────────────────
function Results({resultats,data,onReset}) {
  const [open,setOpen]=useState(null);
  const eligible=resultats.filter(a=>a.result.ok);
  const total=totalM(eligible);
  const cats=[...new Set(eligible.map(a=>a.cat))];
  const [tab,setTab]=useState("Toutes");

  const displayed=tab==="Toutes"?eligible:eligible.filter(a=>a.cat===tab);

  return (
    <div>
      {/* Banner */}
      <div style={{background:`linear-gradient(135deg, ${C.navy} 0%, #1b3a5c 100%)`,borderRadius:20,padding:"32px 36px",marginBottom:24,display:"flex",gap:32,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:180}}>
          <div style={{color:"rgba(255,255,255,0.55)",fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:2,marginBottom:8,fontFamily:"'Source Sans 3',sans-serif"}}>Estimation mensuelle</div>
          <div style={{fontFamily:"'Crimson Pro',Georgia,serif",fontSize:58,fontWeight:800,color:"white",lineHeight:1,marginBottom:4}}>{total}€</div>
          <div style={{color:"rgba(255,255,255,0.45)",fontSize:13,fontFamily:"'Source Sans 3',sans-serif"}}>soit ~{(total*12).toLocaleString("fr-FR")}€/an</div>
        </div>
        <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
          {[{n:eligible.length,l:"aides éligibles",c:"#86efac"},{n:cats.length,l:"catégories",c:"#93c5fd"},{n:resultats.filter(a=>!a.result.ok).length,l:"non éligibles",c:"rgba(255,255,255,0.3)"}].map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Crimson Pro',serif",fontSize:36,fontWeight:800,color:s.c}}>{s.n}</div>
              <div style={{color:"rgba(255,255,255,0.45)",fontSize:12,fontFamily:"'Source Sans 3',sans-serif"}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{background:C.amberLight,border:`1px solid ${C.amberBorder}`,borderRadius:12,padding:"12px 18px",marginBottom:24,display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
        <p style={{fontSize:12,color:C.amber,margin:0,lineHeight:1.6,fontFamily:"'Source Sans 3',sans-serif"}}><strong>Estimation indicative.</strong> Les montants réels sont calculés par les organismes compétents (CAF, France Travail, MDPH…) après dépôt de votre dossier.</p>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:20,paddingBottom:4,flexWrap:"wrap"}}>
        {["Toutes",...cats].map(c=>(
          <button key={c} onClick={()=>setTab(c)} style={{
            padding:"7px 16px",borderRadius:20,border:`1.5px solid ${tab===c?C.navy:C.border}`,
            background:tab===c?C.navy:C.white,color:tab===c?"white":C.muted,
            fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif",whiteSpace:"nowrap",
          }}>{c} ({c==="Toutes"?eligible.length:eligible.filter(a=>a.cat===c).length})</button>
        ))}
      </div>

      {/* Cards */}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
        {displayed.map(aide=>{
          const isOpen=open===aide.id;
          return (
            <div key={aide.id} style={{border:`1.5px solid ${isOpen?aide.color:C.border}`,borderRadius:16,overflow:"hidden",background:C.white,boxShadow:isOpen?`0 4px 20px ${aide.color}22`:"none",transition:"all 0.2s"}}>
              <div onClick={()=>setOpen(isOpen?null:aide.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",cursor:"pointer"}}>
                <div style={{width:42,height:42,borderRadius:12,background:aide.colorLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{aide.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'Crimson Pro',serif",fontWeight:700,fontSize:16,color:C.navy}}>{aide.nom}</span>
                    <Pill color={aide.color} bg={aide.colorLight}>{aide.cat}</Pill>
                  </div>
                  <div style={{fontSize:12,color:C.muted,fontFamily:"'Source Sans 3',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{aide.desc}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:"'Crimson Pro',serif",fontWeight:800,fontSize:17,color:aide.color}}>{fmtMontant(aide.result)}</div>
                </div>
                <span style={{color:C.muted,fontSize:18,transform:isOpen?"rotate(90deg)":"none",transition:"transform 0.2s",marginLeft:4}}>›</span>
              </div>
              {isOpen&&(
                <div style={{borderTop:`1px solid ${C.border}`,padding:20,background:"#fafaf8"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:16}}>
                    <div>
                      <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:1,color:C.muted,marginBottom:8,fontFamily:"'Source Sans 3',sans-serif"}}>Conditions</div>
                      {aide.conditions.map((c,i)=>(
                        <div key={i} style={{display:"flex",gap:6,marginBottom:5}}>
                          <span style={{color:C.green,fontSize:13,flexShrink:0}}>✓</span>
                          <span style={{fontSize:13,color:C.slate,fontFamily:"'Source Sans 3',sans-serif"}}>{c}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:1,color:C.muted,marginBottom:8,fontFamily:"'Source Sans 3',sans-serif"}}>Documents nécessaires</div>
                      {aide.docs.map((d,i)=>(
                        <div key={i} style={{display:"flex",gap:6,marginBottom:5}}>
                          <span style={{color:C.blue,fontSize:13,flexShrink:0}}>📄</span>
                          <span style={{fontSize:13,color:C.slate,fontFamily:"'Source Sans 3',sans-serif"}}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                    <span style={{fontSize:13,color:C.muted,fontFamily:"'Source Sans 3',sans-serif"}}>🕒 Délai : <strong style={{color:C.navy}}>{aide.delai}</strong></span>
                    <span style={{fontSize:13,color:C.muted,fontFamily:"'Source Sans 3',sans-serif"}}>🏛️ <strong style={{color:C.navy}}>{aide.organisme}</strong></span>
                    <a href={aide.lien} target="_blank" rel="noopener noreferrer" style={{marginLeft:"auto",display:"inline-flex",alignItems:"center",gap:6,background:aide.color,color:"white",padding:"9px 18px",borderRadius:8,fontSize:13,fontWeight:800,textDecoration:"none",fontFamily:"'Source Sans 3',sans-serif"}}>
                      Faire ma demande →
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Non-eligibles */}
      <details style={{marginBottom:20}}>
        <summary style={{cursor:"pointer",color:C.muted,fontSize:14,fontFamily:"'Source Sans 3',sans-serif",fontWeight:700,padding:"10px 0"}}>
          Voir les aides non éligibles ({resultats.filter(a=>!a.result.ok).length})
        </summary>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8,marginTop:12}}>
          {resultats.filter(a=>!a.result.ok).map(aide=>(
            <div key={aide.id} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",opacity:0.5,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>{aide.icon}</span>
              <div>
                <div style={{fontWeight:700,fontSize:12,color:C.navy,fontFamily:"'Source Sans 3',sans-serif"}}>{aide.nom}</div>
                <div style={{fontSize:11,color:C.muted,fontFamily:"'Source Sans 3',sans-serif"}}>Non éligible</div>
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Next steps */}
      <Card style={{marginBottom:20}}>
        <h3 style={{fontFamily:"'Crimson Pro',serif",fontSize:20,fontWeight:800,color:C.navy,marginBottom:20}}>🗺️ Vos prochaines étapes</h3>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[
            {n:"1",t:"Créez un compte CAF.fr",d:"Pour déposer vos demandes APL, RSA, allocations familiales…",href:"https://www.caf.fr",c:C.blue},
            {n:"2",t:"Inscrivez-vous sur France Travail",d:"Pour l'ARE, l'ASS et les aides à la mobilité",href:"https://www.francetravail.fr",c:C.indigo},
            {n:"3",t:"Contactez la MDPH de votre département",d:"Pour AAH, PCH, RQTH et carte mobilité",href:"https://www.mdph.fr",c:C.amber},
            {n:"4",t:"Portail officiel MesDroitsSociaux.gouv.fr",d:"Centralisez toutes vos démarches en un seul endroit",href:"https://www.mesdroitssociaux.gouv.fr",c:C.teal},
          ].map(s=>(
            <a key={s.n} href={s.href} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:C.bg,borderRadius:12,textDecoration:"none",border:`1px solid ${C.border}`}}>
              <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,background:s.c,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Crimson Pro',serif",fontWeight:800,fontSize:16}}>{s.n}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:C.navy,fontSize:14,fontFamily:"'Source Sans 3',sans-serif"}}>{s.t}</div>
                <div style={{fontSize:12,color:C.muted,fontFamily:"'Source Sans 3',sans-serif"}}>{s.d}</div>
              </div>
              <span style={{color:s.c,fontSize:18}}>→</span>
            </a>
          ))}
        </div>
      </Card>

      <button onClick={onReset} style={{width:"100%",padding:13,background:C.white,border:`1.5px solid ${C.border}`,borderRadius:12,color:C.muted,fontSize:14,cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif",fontWeight:700}}>
        ↩ Nouvelle simulation
      </button>
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────
function AIAssistant({data,resultats}) {
  const [msgs,setMsgs]=useState([{r:"a",t:"Bonjour ! Je suis votre conseiller DroisNet. J'ai analysé votre dossier. Posez-moi toutes vos questions : démarches, cumul d'aides, documents, délais…"}]);
  const [inp,setInp]=useState("");
  const [loading,setLoading]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const elig=resultats?.filter(a=>a.result.ok)||[];
  const tot=totalM(elig);
  const system=`Tu es un expert bienveillant en droits sociaux français nommé Conseiller DroisNet.
Réponds en français, clairement, max 4 phrases concises.
Situation : travaille=${data?.travaille}, revenus=${data?.revenus}€/mois, ${data?.personnes} personne(s), logement=${data?.logement}, loyer=${data?.loyer||"N/A"}€, handicap=${data?.handicap}, âge=${data?.age}ans, enfants=${data?.enfants||0}
Aides éligibles : ${elig.map(a=>`${a.nom}(~${a.result.m||"variable"}€)`).join(", ")||"aucune"}
Total estimé : ${tot}€/mois`;

  async function send(){
    if(!inp.trim()||loading)return;
    const msg={r:"u",t:inp};setMsgs(p=>[...p,msg]);setInp("");setLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system,messages:[...msgs,msg].map(m=>({role:m.r==="u"?"user":"assistant",content:m.t}))})});
      const json=await res.json();
      setMsgs(p=>[...p,{r:"a",t:json.content?.[0]?.text||"Erreur."}]);
    }catch{setMsgs(p=>[...p,{r:"a",t:"Une erreur est survenue."}]);}
    setLoading(false);
  }

  const suggestions=["Comment cumuler plusieurs aides ?","Quelles démarches faire en premier ?","Mes aides sont-elles imposables ?","Puis-je travailler et toucher le RSA ?","Comment accélérer ma demande ?"];

  return (
    <div style={{border:`1.5px solid ${C.border}`,borderRadius:20,overflow:"hidden",background:C.white}}>
      <div style={{background:`linear-gradient(135deg,${C.navy},#1b3a5c)`,padding:"20px 24px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🤖</div>
        <div>
          <div style={{color:"white",fontFamily:"'Crimson Pro',serif",fontWeight:700,fontSize:17}}>Conseiller IA DroisNet</div>
          <div style={{color:"#86efac",fontSize:12,fontFamily:"'Source Sans 3',sans-serif"}}>● En ligne · Expert droits sociaux français</div>
        </div>
      </div>
      <div style={{padding:20}}>
        <div style={{height:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.r==="u"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"82%",padding:"11px 16px",borderRadius:m.r==="u"?"18px 18px 4px 18px":"4px 18px 18px 18px",background:m.r==="u"?C.navy:"#f1f5f9",color:m.r==="u"?"white":C.slate,fontSize:14,lineHeight:1.65,fontFamily:"'Source Sans 3',sans-serif"}}>{m.t}</div>
            </div>
          ))}
          {loading&&<div style={{display:"flex"}}><div style={{padding:"12px 20px",borderRadius:"4px 18px 18px 18px",background:"#f1f5f9",color:C.muted,fontSize:18,letterSpacing:4}}>•••</div></div>}
          <div ref={ref}/>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
          {suggestions.map(s=><button key={s} onClick={()=>setInp(s)} style={{background:C.blueLight,border:"none",borderRadius:20,padding:"5px 12px",fontSize:12,color:C.blue,cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif",fontWeight:700}}>{s}</button>)}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Posez votre question..." style={{flex:1,padding:"11px 16px",border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:14,fontFamily:"'Source Sans 3',sans-serif",color:C.navy,outline:"none",background:C.bg}}/>
          <button onClick={send} disabled={loading||!inp.trim()} style={{padding:"11px 20px",borderRadius:10,border:"none",background:inp.trim()?C.navy:C.border,color:"white",fontSize:14,cursor:inp.trim()?"pointer":"not-allowed",fontWeight:800,fontFamily:"'Source Sans 3',sans-serif"}}>→</button>
        </div>
      </div>
    </div>
  );
}

// ─── BUSINESS GUIDE ───────────────────────────────────────────────────────────
function BusinessGuide() {
  const [activeModel,setActiveModel]=useState(0);

  const models=[
    {
      icon:"🆓",title:"Freemium",badge:"Recommandé pour démarrer",color:C.blue,
      desc:"Version gratuite + abonnement premium pour les fonctions avancées.",
      plans:[
        {name:"Gratuit",price:"0€",features:["Simulation 5 aides","Résultats basiques","Sans IA"]},
        {name:"Premium",price:"4,99€/mois",features:["Toutes les aides","Assistant IA illimité","Alertes & rappels","Export PDF"]},
        {name:"Famille",price:"9,99€/mois",features:["3 profils","Conseiller dédié","Historique 12 mois","Priorité support"]},
      ],
      revenu:"1 000 abonnés premium = 4 990€/mois",
    },
    {
      icon:"🏢",title:"B2B",badge:"Le plus rentable",color:C.green,
      desc:"Vendre l'outil aux professionnels du travail social et aux collectivités.",
      clients:[
        {type:"Mairies & CCAS",price:"200–500€/mois",use:"Outil pour agents sociaux"},
        {type:"Associations",price:"100–300€/mois",use:"Croix-Rouge, Restos du Cœur..."},
        {type:"Mutuelles",price:"500–2 000€/mois",use:"Portail client intégré"},
        {type:"Employeurs (RH)",price:"300–1 000€/mois",use:"Aide aux salariés en difficulté"},
        {type:"Travailleurs sociaux",price:"50€/mois/utilisateur",use:"Licences individuelles"},
      ],
      revenu:"20 mairies × 300€ = 6 000€/mois",
    },
    {
      icon:"🤝",title:"Affiliation",badge:"Revenus passifs",color:C.purple,
      desc:"Commissions sur les souscriptions générées via la plateforme.",
      partenaires:[
        {type:"Mutuelles santé",commission:"50–150€ par lead qualifié"},
        {type:"Avocats / conseillers",commission:"Mise en relation 20–80€"},
        {type:"Banques sociales",commission:"Partenariat sponsorisé"},
        {type:"Formations en ligne",commission:"10–20% du montant"},
      ],
      revenu:"500 leads/mois × 80€ = 40 000€/mois",
    },
    {
      icon:"🏅",title:"Subventions",badge:"Financement public",color:C.amber,
      desc:"L'État finance les projets d'inclusion numérique — sans dilution de capital.",
      subventions:[
        {org:"French Tech",montant:"Jusqu'à 30 000€",cond:"Startup tech à impact social"},
        {org:"BPI France",montant:"Prêts taux 0",cond:"Projets innovants"},
        {org:"CAF / CNAF",montant:"Appels à projets",cond:"Inclusion numérique"},
        {org:"Label ESS",montant:"Avantages fiscaux",cond:"Économie sociale et solidaire"},
        {org:"Région / Département",montant:"5 000–50 000€",cond:"Projet d'intérêt local"},
      ],
      revenu:"Combinable avec tous les autres modèles",
    },
  ];

  const plan90=[
    {mois:"Mois 1",titre:"Lancement",color:C.blue,actions:["Mettre le site en ligne sur Vercel (gratuit)","Acheter le domaine droitsnet.fr (~10€/an)","Créer page LinkedIn + compte TikTok","Contacter 5 associations locales pour test gratuit","Publier 3 posts sur le non-recours aux droits"]},
    {mois:"Mois 2",titre:"Croissance",color:C.green,actions:["Référencement SEO sur 'simulateur RSA', 'droits sociaux 2026'","Articles de blog : '10 aides que vous ignorez'","Partenariat avec 2 mairies pilotes (gratuit)","Lancer la version premium (4,99€/mois)","Première campagne de contenu viral"]},
    {mois:"Mois 3",titre:"Monétisation",color:C.gold,actions:["Convertir mairies pilotes en clients payants","Démarcher 3 mutuelles pour partenariat","Déposer dossier BPI France ou French Tech","Recruter un commercial si croissance rapide","Objectif : 50 abonnés premium + 2 clients B2B"]},
  ];

  const techStack=[
    {cat:"Frontend",items:["React / Vite","Vercel (hébergement gratuit)","Nom de domaine OVH ~10€/an"]},
    {cat:"Backend / IA",items:["API Anthropic (Claude)","Node.js ou Next.js","Base de données : Supabase (gratuit)"]},
    {cat:"Paiement",items:["Stripe (commissions 1,4% + 0,25€)","Pas de frais fixes"]},
    {cat:"Marketing",items:["Google Search Console (gratuit)","Brevo pour emails (gratuit jusqu'à 300/j)","Buffer pour réseaux sociaux"]},
  ];

  const legal=[
    {icon:"🏢",t:"Statut juridique",d:"Créer une micro-entreprise ou SAS dès les premiers revenus. Micro-entreprise : zéro frais fixes, idéale pour démarrer."},
    {icon:"🔒",t:"RGPD",d:"Ne pas stocker les données personnelles. Ajouter une politique de confidentialité et des mentions légales obligatoires."},
    {icon:"⚖️",t:"Disclaimer légal",d:"Toujours préciser que les résultats sont des estimations. Ne jamais garantir les montants (déjà en place dans l'app ✅)."},
    {icon:"💳",t:"TVA",d:"En dessous de 37 500€/an en micro-entreprise : pas de TVA à facturer. Au-delà : SAS + comptable recommandé."},
  ];

  const m=models[activeModel];

  return (
    <div>
      {/* Models */}
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {models.map((mo,i)=>(
          <button key={i} onClick={()=>setActiveModel(i)} style={{
            padding:"10px 18px",borderRadius:12,border:`2px solid ${activeModel===i?mo.color:C.border}`,
            background:activeModel===i?mo.color:C.white,color:activeModel===i?"white":C.muted,
            cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif",fontWeight:800,fontSize:14,
            transition:"all 0.2s",display:"flex",alignItems:"center",gap:8,
          }}>{mo.icon} {mo.title}</button>
        ))}
      </div>

      <Card style={{marginBottom:24,borderLeft:`4px solid ${m.color}`}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <span style={{fontSize:32}}>{m.icon}</span>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <h3 style={{fontFamily:"'Crimson Pro',serif",fontSize:22,fontWeight:800,color:C.navy,margin:0}}>{m.title}</h3>
              <Pill color={m.color} bg={m.color+"22"}>{m.badge}</Pill>
            </div>
            <p style={{color:C.muted,fontSize:14,margin:0,fontFamily:"'Source Sans 3',sans-serif"}}>{m.desc}</p>
          </div>
        </div>

        {m.plans&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginTop:16}}>
            {m.plans.map((p,i)=>(
              <div key={i} style={{border:`1.5px solid ${i===1?m.color:C.border}`,borderRadius:14,padding:18,background:i===1?m.color+"11":C.white}}>
                <div style={{fontFamily:"'Crimson Pro',serif",fontSize:20,fontWeight:800,color:C.navy,marginBottom:2}}>{p.name}</div>
                <div style={{fontFamily:"'Crimson Pro',serif",fontSize:24,fontWeight:800,color:m.color,marginBottom:12}}>{p.price}</div>
                {p.features.map((f,j)=><div key={j} style={{display:"flex",gap:6,marginBottom:4}}><span style={{color:m.color,fontSize:12}}>✓</span><span style={{fontSize:13,color:C.slate,fontFamily:"'Source Sans 3',sans-serif"}}>{f}</span></div>)}
              </div>
            ))}
          </div>
        )}

        {m.clients&&(
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
            {m.clients.map((c,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:C.bg,borderRadius:10,flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontWeight:700,color:C.navy,fontSize:14,fontFamily:"'Source Sans 3',sans-serif"}}>{c.type}</div>
                  <div style={{fontSize:12,color:C.muted,fontFamily:"'Source Sans 3',sans-serif"}}>{c.use}</div>
                </div>
                <div style={{fontFamily:"'Crimson Pro',serif",fontWeight:800,fontSize:16,color:m.color}}>{c.price}</div>
              </div>
            ))}
          </div>
        )}

        {m.partenaires&&(
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
            {m.partenaires.map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:C.bg,borderRadius:10,flexWrap:"wrap",gap:8}}>
                <div style={{fontWeight:700,color:C.navy,fontSize:14,fontFamily:"'Source Sans 3',sans-serif"}}>{p.type}</div>
                <Pill color={m.color} bg={m.color+"22"}>{p.commission}</Pill>
              </div>
            ))}
          </div>
        )}

        {m.subventions&&(
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
            {m.subventions.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:C.bg,borderRadius:10,flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontWeight:700,color:C.navy,fontSize:14,fontFamily:"'Source Sans 3',sans-serif"}}>{s.org}</div>
                  <div style={{fontSize:12,color:C.muted,fontFamily:"'Source Sans 3',sans-serif"}}>{s.cond}</div>
                </div>
                <div style={{fontFamily:"'Crimson Pro',serif",fontWeight:800,fontSize:15,color:m.color}}>{s.montant}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{marginTop:20,padding:"14px 18px",background:m.color+"18",borderRadius:12,border:`1px solid ${m.color}44`,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>📈</span>
          <span style={{fontFamily:"'Crimson Pro',serif",fontWeight:700,fontSize:16,color:m.color}}>Potentiel : {m.revenu}</span>
        </div>
      </Card>

      {/* Plan 90 jours */}
      <h3 style={{fontFamily:"'Crimson Pro',serif",fontSize:22,fontWeight:800,color:C.navy,marginBottom:16}}>🗓️ Plan de lancement en 90 jours</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16,marginBottom:32}}>
        {plan90.map((p,i)=>(
          <Card key={i} style={{borderTop:`4px solid ${p.color}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <Pill color={p.color} bg={p.color+"22"}>{p.mois}</Pill>
              <h4 style={{fontFamily:"'Crimson Pro',serif",fontSize:17,fontWeight:800,color:C.navy,margin:0}}>{p.titre}</h4>
            </div>
            {p.actions.map((a,j)=>(
              <div key={j} style={{display:"flex",gap:8,marginBottom:8}}>
                <span style={{color:p.color,fontSize:13,flexShrink:0,fontWeight:800}}>→</span>
                <span style={{fontSize:13,color:C.slate,fontFamily:"'Source Sans 3',sans-serif",lineHeight:1.5}}>{a}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Stack tech */}
      <h3 style={{fontFamily:"'Crimson Pro',serif",fontSize:22,fontWeight:800,color:C.navy,marginBottom:16}}>⚙️ Stack technique recommandée</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:32}}>
        {techStack.map((s,i)=>(
          <Card key={i}>
            <div style={{fontWeight:800,color:C.navy,fontSize:14,marginBottom:10,fontFamily:"'Source Sans 3',sans-serif"}}>{s.cat}</div>
            {s.items.map((it,j)=>(
              <div key={j} style={{display:"flex",gap:6,marginBottom:6}}>
                <span style={{color:C.green,fontSize:12,flexShrink:0}}>✓</span>
                <span style={{fontSize:13,color:C.slate,fontFamily:"'Source Sans 3',sans-serif"}}>{it}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Légal */}
      <h3 style={{fontFamily:"'Crimson Pro',serif",fontSize:22,fontWeight:800,color:C.navy,marginBottom:16}}>⚖️ Points légaux importants</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
        {legal.map((l,i)=>(
          <Card key={i} style={{display:"flex",gap:14,alignItems:"flex-start"}}>
            <span style={{fontSize:28,flexShrink:0}}>{l.icon}</span>
            <div>
              <div style={{fontWeight:800,color:C.navy,fontSize:14,marginBottom:6,fontFamily:"'Source Sans 3',sans-serif"}}>{l.t}</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.6,fontFamily:"'Source Sans 3',sans-serif"}}>{l.d}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("accueil");
  const [simDone,setSimDone]=useState(false);
  const [simData,setSimData]=useState({});
  const [resultats,setResultats]=useState([]);
  const [mobileMenu,setMobileMenu]=useState(false);

  function handleSimResult(data){
    setSimData(data);
    setResultats(calcAll(data));
    setSimDone(true);
    setTab("resultats");
  }
  function resetSim(){setSimDone(false);setSimData({});setResultats([]);setTab("simulateur");}

  const navItems=[
    {id:"accueil",label:"Accueil"},
    {id:"simulateur",label:"Simulateur"},
    {id:"resultats",label:"Mes droits",badge:simDone?resultats.filter(a=>a.result.ok).length:null},
    {id:"assistant",label:"Conseiller IA"},
    {id:"business",label:"Lancer l'app"},
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Source Sans 3',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@700;800&family=Source+Sans+3:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} a{transition:opacity 0.15s;} button{transition:all 0.15s;} input:focus{border-color:${C.navy}!important;} details summary::-webkit-details-marker{display:none;} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* NAV */}
      <nav style={{background:C.white,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:200,boxShadow:"0 1px 8px rgba(13,27,42,0.07)"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",gap:0,height:64}}>
          {/* Logo */}
          <div onClick={()=>setTab("accueil")} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginRight:40,flexShrink:0}}>
            <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${C.navy},#1b3a5c)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(13,27,42,0.25)"}}>
              <span style={{fontFamily:"'Crimson Pro',serif",fontSize:18,fontWeight:800,color:C.gold}}>D</span>
            </div>
            <span style={{fontFamily:"'Crimson Pro',serif",fontSize:21,fontWeight:800,color:C.navy,letterSpacing:-0.5}}>DroisNet</span>
          </div>
          {/* Desktop nav */}
          <div style={{display:"flex",gap:2,flex:1,overflowX:"auto"}}>
            {navItems.map(n=>(
              <button key={n.id} onClick={()=>setTab(n.id)} style={{
                padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",
                background:tab===n.id?"#0d1b2a11":"transparent",
                color:tab===n.id?C.navy:C.muted,fontWeight:tab===n.id?800:600,
                fontSize:14,fontFamily:"'Source Sans 3',sans-serif",
                display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",
              }}>
                {n.label}
                {n.badge!=null&&<span style={{background:C.green,color:"white",fontSize:11,padding:"1px 7px",borderRadius:20,fontWeight:800}}>{n.badge}</span>}
              </button>
            ))}
          </div>
          <button onClick={()=>{setTab("simulateur");resetSim();}} style={{
            marginLeft:16,padding:"9px 20px",borderRadius:10,border:"none",
            background:C.navy,color:"white",fontWeight:800,fontSize:14,cursor:"pointer",
            fontFamily:"'Source Sans 3',sans-serif",flexShrink:0,
            boxShadow:"0 2px 8px rgba(13,27,42,0.2)",
          }}>Simuler mes droits</button>
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{maxWidth:900,margin:"0 auto",padding:"48px 20px 80px",animation:"fadeIn 0.3s ease"}}>

        {/* ── ACCUEIL ── */}
        {tab==="accueil"&&(
          <div>
            {/* Hero */}
            <div style={{textAlign:"center",marginBottom:72,paddingTop:24}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,background:C.goldLight,border:`1px solid ${C.goldBorder}`,color:C.gold,padding:"6px 18px",borderRadius:20,fontSize:13,fontWeight:800,marginBottom:28,fontFamily:"'Source Sans 3',sans-serif"}}>
                🇫🇷 Droits sociaux français · Édition 2026
              </div>
              <h1 style={{fontFamily:"'Crimson Pro',Georgia,serif",fontSize:"clamp(38px,6vw,64px)",fontWeight:800,color:C.navy,lineHeight:1.1,marginBottom:20}}>
                Découvrez toutes les aides<br/>
                <span style={{color:C.gold}}>auxquelles vous avez droit</span>
              </h1>
              <p style={{fontSize:18,color:C.muted,lineHeight:1.7,maxWidth:560,margin:"0 auto 40px",fontFamily:"'Source Sans 3',sans-serif"}}>
                En <strong style={{color:C.navy}}>moins de 3 minutes</strong>, simulez vos droits parmi <strong style={{color:C.navy}}>+25 aides et services</strong> — RSA, APL, AAH, allocations familiales, chèque énergie et bien plus encore.
              </p>
              <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={()=>setTab("simulateur")} style={{padding:"16px 36px",borderRadius:12,border:"none",background:C.navy,color:"white",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif",boxShadow:"0 6px 24px rgba(13,27,42,0.25)"}}>
                  Commencer la simulation →
                </button>
                <button onClick={()=>setTab("business")} style={{padding:"16px 36px",borderRadius:12,border:`2px solid ${C.navy}`,background:"transparent",color:C.navy,fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif"}}>
                  Lancer son business
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:20,marginBottom:56}}>
              {[
                {n:"3 Mds€",d:"perdus chaque année par non-recours au RSA seul",i:"😱"},
                {n:"+25",d:"aides et services simulés gratuitement",i:"🛡️"},
                {n:"< 3 min",d:"pour connaître tous vos droits potentiels",i:"⚡"},
                {n:"100%",d:"gratuit, anonyme, aucun compte requis",i:"🔒"},
              ].map((s,i)=>(
                <Card key={i} style={{textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:8}}>{s.i}</div>
                  <div style={{fontFamily:"'Crimson Pro',serif",fontSize:38,fontWeight:800,color:C.navy,marginBottom:6}}>{s.n}</div>
                  <div style={{fontSize:13,color:C.muted,lineHeight:1.5,fontFamily:"'Source Sans 3',sans-serif"}}>{s.d}</div>
                </Card>
              ))}
            </div>

            {/* Aides overview */}
            <h2 style={{fontFamily:"'Crimson Pro',serif",fontSize:28,fontWeight:800,color:C.navy,marginBottom:6,textAlign:"center"}}>Les aides couvertes</h2>
            <p style={{color:C.muted,textAlign:"center",marginBottom:28,fontSize:15,fontFamily:"'Source Sans 3',sans-serif"}}>Un panorama complet de la protection sociale française</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:56}}>
              {[
                {icon:"💶",label:"Revenus & Minima sociaux",n:4,c:C.blue},
                {icon:"🏠",label:"Logement & Énergie",n:4,c:C.purple},
                {icon:"⚕️",label:"Santé & Autonomie",n:3,c:C.teal},
                {icon:"👶",label:"Famille & Enfants",n:3,c:C.orange},
                {icon:"💼",label:"Emploi & Formation",n:3,c:C.indigo},
                {icon:"🧓",label:"Retraite & Seniors",n:1,c:C.pink},
              ].map((cat,i)=>(
                <div key={i} onClick={()=>setTab("simulateur")} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"box-shadow 0.2s",boxShadow:"0 1px 4px rgba(13,27,42,0.05)"}}>
                  <div style={{width:44,height:44,borderRadius:12,background:cat.c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cat.icon}</div>
                  <div>
                    <div style={{fontWeight:800,color:C.navy,fontSize:13,fontFamily:"'Source Sans 3',sans-serif",lineHeight:1.3}}>{cat.label}</div>
                    <div style={{fontSize:12,color:cat.c,fontWeight:700}}>{cat.n} aide{cat.n>1?"s":""}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA business */}
            <div style={{background:`linear-gradient(135deg,${C.navy} 0%,#1b3a5c 100%)`,borderRadius:24,padding:"36px 40px",display:"flex",alignItems:"center",gap:32,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontFamily:"'Crimson Pro',serif",fontSize:26,fontWeight:800,color:"white",marginBottom:8}}>Vous voulez lancer ce business ?</div>
                <p style={{color:"rgba(255,255,255,0.6)",fontSize:15,margin:0,fontFamily:"'Source Sans 3',sans-serif"}}>Guide complet : mise en ligne, modèles de revenus, plan 90 jours, légal.</p>
              </div>
              <button onClick={()=>setTab("business")} style={{padding:"14px 30px",borderRadius:12,border:`2px solid ${C.gold}`,background:"transparent",color:C.gold,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif",flexShrink:0}}>
                Voir le guide →
              </button>
            </div>
          </div>
        )}

        {/* ── SIMULATEUR ── */}
        {tab==="simulateur"&&(
          <Section title="🔍 Simulateur de droits" subtitle="Répondez à quelques questions pour découvrir toutes les aides auxquelles vous êtes éligible.">
            <Card style={{maxWidth:600,margin:"0 auto"}}>
              {simDone
                ? <div style={{textAlign:"center",padding:20}}>
                    <div style={{fontSize:48,marginBottom:12}}>✅</div>
                    <h3 style={{fontFamily:"'Crimson Pro',serif",fontSize:22,fontWeight:800,color:C.navy,marginBottom:8}}>Simulation déjà effectuée</h3>
                    <p style={{color:C.muted,marginBottom:20,fontFamily:"'Source Sans 3',sans-serif"}}>Vos résultats vous attendent dans l'onglet "Mes droits".</p>
                    <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                      <button onClick={()=>setTab("resultats")} style={{padding:"12px 24px",borderRadius:10,border:"none",background:C.navy,color:"white",fontWeight:800,cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif",fontSize:14}}>Voir mes droits →</button>
                      <button onClick={resetSim} style={{padding:"12px 24px",borderRadius:10,border:`1.5px solid ${C.border}`,background:C.white,color:C.muted,fontWeight:700,cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif",fontSize:14}}>Recommencer</button>
                    </div>
                  </div>
                : <Simulator onResult={handleSimResult}/>
              }
            </Card>
          </Section>
        )}

        {/* ── RESULTATS ── */}
        {tab==="resultats"&&(
          <Section title="📊 Vos droits estimés" subtitle="Basé sur vos réponses — cliquez sur chaque aide pour voir les détails et comment faire votre demande.">
            {simDone
              ? <Results resultats={resultats} data={simData} onReset={resetSim}/>
              : <Card style={{textAlign:"center",padding:40}}>
                  <div style={{fontSize:48,marginBottom:12}}>🔍</div>
                  <h3 style={{fontFamily:"'Crimson Pro',serif",fontSize:22,fontWeight:800,color:C.navy,marginBottom:8}}>Lancez d'abord la simulation</h3>
                  <p style={{color:C.muted,marginBottom:20,fontFamily:"'Source Sans 3',sans-serif"}}>Répondez à quelques questions pour découvrir vos droits.</p>
                  <button onClick={()=>setTab("simulateur")} style={{padding:"13px 28px",borderRadius:10,border:"none",background:C.navy,color:"white",fontWeight:800,cursor:"pointer",fontFamily:"'Source Sans 3',sans-serif",fontSize:15}}>Commencer →</button>
                </Card>
            }
          </Section>
        )}

        {/* ── ASSISTANT ── */}
        {tab==="assistant"&&(
          <Section title="🤖 Conseiller IA" subtitle="Posez toutes vos questions sur vos droits sociaux — l'IA vous répond en tenant compte de votre situation personnelle.">
            {simDone
              ? <AIAssistant data={simData} resultats={resultats}/>
              : <div>
                  <div style={{background:C.amberLight,border:`1px solid ${C.amberBorder}`,borderRadius:12,padding:"16px 20px",marginBottom:20,display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:20}}>💡</span>
                    <span style={{fontSize:14,color:C.amber,fontFamily:"'Source Sans 3',sans-serif"}}>Pour des réponses personnalisées, <strong>effectuez d'abord la simulation</strong>. L'IA utilisera vos données pour vous conseiller précisément.</span>
                  </div>
                  <AIAssistant data={{}} resultats={[]}/>
                </div>
            }
          </Section>
        )}

        {/* ── BUSINESS ── */}
        {tab==="business"&&(
          <Section title="🚀 Lancer DroisNet — Guide complet" subtitle="Tout ce qu'il faut savoir pour mettre l'application en ligne et créer un business rentable autour de l'inclusion numérique.">
            {/* Mise en ligne */}
            <Card style={{marginBottom:32,borderLeft:`4px solid ${C.blue}`}}>
              <h3 style={{fontFamily:"'Crimson Pro',serif",fontSize:22,fontWeight:800,color:C.navy,marginBottom:16}}>💻 Mettre l'application en ligne</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16}}>
                {[
                  {n:"1",t:"Créer un projet React",code:"npm create vite@latest droitsnet -- --template react\nnpm install\nnpm run dev",c:C.blue},
                  {n:"2",t:"Déployer sur Vercel (gratuit)",code:"# Pousser sur GitHub, puis\nvercel --prod\n# URL: droitsnet.vercel.app",c:C.green},
                  {n:"3",t:"Ajouter votre domaine",code:"# OVH ou Ionos\ndroitsnet.fr → ~10€/an\n# Pointer vers Vercel",c:C.purple},
                  {n:"4",t:"Clé API Anthropic",code:"# console.anthropic.com\n# Créer une clé API\n# Intégrer côté serveur",c:C.amber},
                ].map((s,i)=>(
                  <div key={i} style={{border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
                    <div style={{background:s.c,padding:"10px 16px",display:"flex",alignItems:"center",gap:8}}>
                      <span style={{background:"rgba(255,255,255,0.2)",color:"white",width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0}}>{s.n}</span>
                      <span style={{color:"white",fontWeight:800,fontSize:14,fontFamily:"'Source Sans 3',sans-serif"}}>{s.t}</span>
                    </div>
                    <pre style={{padding:"12px 16px",fontSize:12,color:C.slate,lineHeight:1.7,background:"#f8f9fb",margin:0,overflowX:"auto",fontFamily:"monospace"}}>{s.code}</pre>
                  </div>
                ))}
              </div>
            </Card>

            <BusinessGuide/>
          </Section>
        )}

      </div>

      {/* FOOTER */}
      <footer style={{background:C.navy,padding:"32px 24px",textAlign:"center"}}>
        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:20,fontWeight:800,color:C.gold,marginBottom:8}}>DroisNet</div>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,fontFamily:"'Source Sans 3',sans-serif",margin:0}}>
          Simulateur indicatif · Données anonymes non stockées · {new Date().getFullYear()} — Outil à usage pédagogique
        </p>
      </footer>
    </div>
  );
}
