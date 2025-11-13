// التعامل مع الشموع والمايكروفون

const candles = document.querySelectorAll('.candle');
let flames = [];
let audioContext = null; // لحفظ سياق الصوت

// تجهيز الشموع للنقر
candles.forEach(candle => {
  const flame = candle.querySelector('.flame');
  if (flame) {
    flames.push(flame);
    // النقر لإطفاء الشمعة الفردية
    candle.addEventListener('click', () => blowOut(flame));
  }
});

// دالة إطفاء الشعلة
function blowOut(flame) {
  if (!flame) return;
  // إضافة كلاس لتقليل الشفافية وإيقاف الانيميشن
  flame.style.opacity = '0';
  flame.style.transform = 'scale(0)';
  
  // إزالة العنصر بعد لحظة
  setTimeout(() => {
     flame.style.display = 'none'; 
  }, 500);
}

// === إعداد الميكروفون وتحسين التفعيل ===
async function initMic() {
  // إذا كان السياق موجوداً لكنه في حالة تعليق، قم باستئنافه (وهذا هو الإصلاح الرئيسي)
  if (audioContext && audioContext.state === 'suspended') {
    await audioContext.resume();
    return;
  }
  
  // إذا لم يكن السياق موجوداً، ابدأه
  if (!audioContext) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // *** إصلاح المشكلة هنا: يجب استئناف السياق عند التفاعل ***
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 512;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);

      let lastBlowTime = 0;

      function detectBlow() {
        analyser.getByteFrequencyData(dataArray);
        // حساب متوسط حجم الصوت
        let sum = 0;
        for(let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        // تم تعديل الحساسية إلى 60 لتكون أسهل في النفخ
        const volume = sum / dataArray.length; 

        const now = Date.now();
        
        // Blow detection: حجم صوت عالٍ (نفخ) ولم يتم النفخ مؤخراً
        if (volume > 60 && now - lastBlowTime > 1000) {
          flames.forEach(flame => blowOut(flame));
          lastBlowTime = now;
        }
        
        // استمرار المراقبة طالما هناك شموع مشتعلة
        if(flames.some(f => f.style.opacity !== '0')) {
           requestAnimationFrame(detectBlow);
        }
      }

      detectBlow();
      console.log("Mic Listening...");

    } catch (err) {
      console.warn("Mic access denied or error:", err);
    }
  }
}

// تفعيل المايك عند النقر على أي مكان في الصفحة لأول مرة
document.body.addEventListener('click', () => {
    initMic();
}, { once: true });
