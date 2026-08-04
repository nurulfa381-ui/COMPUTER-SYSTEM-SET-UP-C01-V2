const C01TeacherStorage=(()=>{
const PIN_KEY="c01_teacher_pin_v1",SESSION_KEY="c01_teacher_session_v1";
const MODULES=[
 {missionId:13,label:"KT13",storageKey:"c01_student_profile"},
 {missionId:14,label:"KT14",storageKey:"c01_kp14_profile_v1"},
 {missionId:15,label:"KT15",storageKey:"c01_kp15_profile_v1"}
];
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch(e){return null}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function getPin(){return localStorage.getItem(PIN_KEY)||"1515"}
function setPin(p){localStorage.setItem(PIN_KEY,String(p))}
function verifyPin(p){return String(p)===getPin()}
function setSession(name){sessionStorage.setItem(SESSION_KEY,JSON.stringify({name,loginAt:new Date().toISOString()}))}
function getSession(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null")}catch(e){return null}}
function requireSession(){const s=getSession();if(!s){location.href="login.html";throw new Error("Sesi guru diperlukan.")}return s}
function clearSession(){sessionStorage.removeItem(SESSION_KEY)}
function status(p,m){const o=p?.officialMarks?.[m],q=p?.pendingAssessments?.[m],s=p?.scores?.[m];if(o?.locked)return"TERAMPIL";if(q)return"MENUNGGU PENGESAHAN";if(s!==undefined)return Number(s)>=60?"MENUNGGU PENGESAHAN":"BELUM TERAMPIL";return"BELUM DINILAI"}
function collectAllRecords(){return MODULES.map(x=>{const p=read(x.storageKey);if(!p?.name||!p?.id)return null;const o=p.officialMarks?.[x.missionId],q=p.pendingAssessments?.[x.missionId],s=p.scores?.[x.missionId];return{storageKey:x.storageKey,missionId:x.missionId,module:x.label,name:p.name,id:p.id,avatar:p.avatar||"🧑‍💻",attempts:Number(p.attempts?.[x.missionId]||0),temporaryScore:q?.score??s??"-",officialScore:o?.score??"-",status:status(p,x.missionId)}}).filter(Boolean)}
function getRecord(k,m){const p=read(k);return p?{profile:p,score:p.pendingAssessments?.[m]?.score??p.scores?.[m]??0}:null}
function approveMark(k,m,{score,assessor}){const p=read(k);if(!p)throw new Error("Profil tidak dijumpai.");p.officialMarks=p.officialMarks||{};p.pendingAssessments=p.pendingAssessments||{};p.scores=p.scores||{};p.officialMarks[m]={score:Number(score),status:Number(score)>=60?"TERAMPIL":"BELUM TERAMPIL",assessor,verifiedAt:new Date().toISOString(),locked:true};p.scores[m]=Number(score);delete p.pendingAssessments[m];write(k,p)}
function reopenMark(k,m){const p=read(k);if(!p)return;p.officialMarks=p.officialMarks||{};if(p.officialMarks[m])p.officialMarks[m].locked=false;write(k,p)}
function exportCsv(){const r=collectAllRecords(),rows=[["Modul","Nama","ID","Percubaan","Sementara","Rasmi","Status"],...r.map(x=>[x.module,x.name,x.id,x.attempts,x.temporaryScore,x.officialScore,x.status])];const csv=rows.map(a=>a.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");const b=new Blob([csv],{type:"text/csv"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="Laporan-Penilaian-C01.csv";a.click();URL.revokeObjectURL(u)}
function downloadBackup(){const d={};MODULES.forEach(m=>d[m.storageKey]=read(m.storageKey));const b=new Blob([JSON.stringify(d,null,2)],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="Backup-C01-Teacher.json";a.click();URL.revokeObjectURL(u)}
function resetLocalRecords(){MODULES.forEach(m=>localStorage.removeItem(m.storageKey))}
return{getPin,setPin,verifyPin,setSession,getSession,requireSession,clearSession,collectAllRecords,getRecord,approveMark,reopenMark,exportCsv,downloadBackup,resetLocalRecords};
})();