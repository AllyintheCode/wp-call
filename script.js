// DOM Elementləri
const incomingScreen = document.getElementById('incoming-screen');
const activeScreen = document.getElementById('active-screen');
const endedScreen = document.getElementById('ended-screen');

const btnAnswer = document.getElementById('btn-answer');
const btnHangup = document.getElementById('btn-hangup');
const btnToggleMic = document.getElementById('btn-toggle-mic');
const btnToggleCam = document.getElementById('btn-toggle-cam');
const btnRestart = document.getElementById('btn-restart');

const userCamera = document.getElementById('user-camera');
const cameraFallback = document.getElementById('camera-fallback');
const callTimer = document.getElementById('call-timer');
const finalDuration = document.getElementById('final-duration');

const micOnIcon = document.getElementById('mic-on-icon');
const micOffIcon = document.getElementById('mic-off-icon');

let currentStream = null;
let timerInterval = null;
let elapsedSeconds = 0;
let isMicMuted = false;
let isCamOff = false;

// WhatsApp Zəng Qoşulma Səsi Effekti (Web Audio API)
function playConnectChime() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (err) {
        console.warn('Audio xətası:', err);
    }
}

// Zəng Sayğacı Funksiyası
function startTimer() {
    elapsedSeconds = 0;
    callTimer.textContent = '00:00';
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        elapsedSeconds++;
        const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
        const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
        callTimer.textContent = `${mins}:${secs}`;
    }, 1000);
}

// Real Telefon Ön Kamerasını İşə Sal
async function startCamera() {
    try {
        // Ön kameranı (facingMode: user) çağırırıq
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        currentStream = stream;
        userCamera.srcObject = stream;
        await userCamera.play();

        // Kamera uğurla açıldısa fallback gizlədilsin
        if (cameraFallback) {
            cameraFallback.style.display = 'none';
        }
    } catch (err) {
        console.warn('Kamera açıla bilmədi (icazə verilmədi və ya kamera yoxdur):', err);
        // İcazə verilməsə və ya cihazda kamera olmasa təbii fallback fon qalır
        if (cameraFallback) {
            cameraFallback.style.display = 'block';
        }
    }
}

// Kameranı və Streami Dayandır
function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    if (userCamera) {
        userCamera.srcObject = null;
    }
}

// ================= HADİSƏLƏR (EVENTS) =================

// 1. YAŞIL DÜYMƏYƏ BASILANDA (ZƏNGİ AÇ)
btnAnswer.addEventListener('click', async () => {
    playConnectChime();

    // 1-ci ekranı gizlət, 2-ci ekranı aç
    incomingScreen.classList.add('hidden');
    activeScreen.classList.remove('hidden');

    // Sayğacı və kameranı başlat
    startTimer();
    await startCamera();
});

// 2. MİKROFONU AÇ/BAĞLA (SƏS İKONU)
btnToggleMic.addEventListener('click', () => {
    isMicMuted = !isMicMuted;
    btnToggleMic.classList.toggle('active-off', isMicMuted);

    if (isMicMuted) {
        micOnIcon.classList.add('hidden');
        micOffIcon.classList.remove('hidden');
    } else {
        micOnIcon.classList.remove('hidden');
        micOffIcon.classList.add('hidden');
    }
});

// 3. KAMERANI AÇ/BAĞLA (KAMERA İKONU)
btnToggleCam.addEventListener('click', () => {
    isCamOff = !isCamOff;
    btnToggleCam.classList.toggle('active-off', isCamOff);

    if (currentStream) {
        const videoTrack = currentStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !isCamOff;
        }
    }

    if (isCamOff) {
        userCamera.style.opacity = '0';
        if (cameraFallback) cameraFallback.style.display = 'block';
    } else {
        userCamera.style.opacity = '1';
        if (cameraFallback) cameraFallback.style.display = 'none';
    }
});

// 4. ADBOY (QIRMIZI DÜYMƏ - ZƏNGİ BİTİR)
btnHangup.addEventListener('click', () => {
    clearInterval(timerInterval);
    stopCamera();

    // Son zəng müddətini qeyd et
    const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
    finalDuration.textContent = `Zəng müddəti: ${mins}:${secs}`;

    // Ekranları dəyiş
    activeScreen.classList.add('hidden');
    endedScreen.classList.remove('hidden');
});

// 5. YENİDƏN ZƏNG ET
btnRestart.addEventListener('click', () => {
    endedScreen.classList.add('hidden');
    incomingScreen.classList.remove('hidden');

    // Reset status
    isMicMuted = false;
    isCamOff = false;
    btnToggleMic.classList.remove('active-off');
    btnToggleCam.classList.remove('active-off');
    micOnIcon.classList.remove('hidden');
    micOffIcon.classList.add('hidden');
    userCamera.style.opacity = '1';
});
