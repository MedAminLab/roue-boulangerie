const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const statusMessage = document.getElementById('statusMessage');
const resultModal = document.getElementById('resultModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const closeModalBtn = document.getElementById('closeModalBtn');

// Configuration
const PRIZES = [
    { label: "Grille-pain", color: "#E63946", type: "win" }, // Rouge brique
    { label: "Perdu", color: "#FAEDCD", type: "loss" },      // Crème
    { label: "Baguette", color: "#D4A373", type: "loss" },   // Pain doré
    { label: "Perdu", color: "#FAEDCD", type: "loss" },
    { label: "Croissant", color: "#D4A373", type: "loss" },
    { label: "Perdu", color: "#FAEDCD", type: "loss" },
    { label: "-5%", color: "#D4A373", type: "loss" },
    { label: "Perdu", color: "#FAEDCD", type: "loss" }
];

const WIN_PROBABILITY = 0.05; // 5% chance
const START_HOUR = 7;
const END_HOUR = 20;

let isSpinning = false;

// Setup Canvas for HiDPI
function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    // Add transition for smooth spinning
    canvas.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
}

// Draw Wheel
function drawWheel() {
    const numSegments = PRIZES.length;
    const arcSize = (2 * Math.PI) / numSegments;
    // Use logical size for drawing calculations
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 10;

    ctx.clearRect(0, 0, width, height);

    PRIZES.forEach((prize, i) => {
        const angle = i * arcSize;

        // Segment
        ctx.beginPath();
        ctx.fillStyle = prize.color;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arcSize / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = prize.color === "#FAEDCD" ? "#bc6c25" : "#FFF";
        ctx.font = "bold 18px Outfit";
        ctx.fillText(prize.label, radius - 30, 6);
        ctx.restore();
    });
}

// Check Time
function isShopOpen() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= START_HOUR && hour < END_HOUR;
}

// Game Logic
function spinWheel() {
    if (isSpinning) return;

    if (!isShopOpen()) {
        showModal("Désolé", "Le jeu est disponible uniquement entre 7h et 20h.");
        return;
    }

    // Check if already played today
    const lastPlayed = localStorage.getItem('lastPlayed');
    const today = new Date().toDateString();
    if (lastPlayed === today) {
        showModal("Déjà joué", "Vous avez déjà tenté votre chance aujourd'hui ! Revenez demain.");
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    statusMessage.textContent = "Bonne chance !";

    // Determine result beforehand
    const isWin = Math.random() < WIN_PROBABILITY;
    let targetIndex;

    if (isWin) {
        targetIndex = PRIZES.findIndex(p => p.type === "win");
    } else {
        const lossIndices = PRIZES.map((p, i) => p.type === "loss" ? i : -1).filter(i => i !== -1);
        targetIndex = lossIndices[Math.floor(Math.random() * lossIndices.length)];
    }

    // Calculate rotation
    const segmentAngle = 360 / PRIZES.length;
    const spins = 5 + Math.floor(Math.random() * 5); // 5 to 10 spins
    const baseRotation = 360 * spins;

    // Target calculation:
    // Pointer is at Top (-90deg).
    // We want segment `targetIndex` to be at Top.
    // Segment `targetIndex` starts at `targetIndex * segmentAngle`.
    // Center of segment is `targetIndex * segmentAngle + segmentAngle/2`.
    // To bring Center to -90, we rotate by: -90 - Center.
    const segmentCenter = (targetIndex * segmentAngle) + (segmentAngle / 2);
    const targetRotation = (270 - segmentCenter); // 270 is equivalent to -90 mod 360

    // Add random offset within the segment (avoid edges)
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.6);

    const totalRotation = baseRotation + targetRotation + randomOffset;

    // Animate
    canvas.style.transform = `rotate(${totalRotation}deg)`;

    // Wait for animation to finish (4s)
    setTimeout(() => {
        isSpinning = false;
        spinBtn.disabled = false;
        statusMessage.textContent = isWin ? "Gagné !" : "Perdu...";

        localStorage.setItem('lastPlayed', today);

        if (isWin) {
            launchConfetti();
            showModal("Félicitations !", "Vous avez gagné un grille-pain ! Présentez cet écran au comptoir.");
        } else {
            showModal("Dommage...", `Vous êtes tombé sur : ${PRIZES[targetIndex].label}. Réessayez demain !`);
        }

        // Reset rotation (optional, but keeps numbers small if we played multiple times without reload)
        // Actually, with CSS transform, resetting snaps it back. Better to keep adding rotation or reset silently.
        // For simplicity, we leave it as is.
    }, 4000);
}

function launchConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#E63946', '#D4A373', '#FAEDCD']
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#E63946', '#D4A373', '#FAEDCD']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    resultModal.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => {
    resultModal.classList.add('hidden');
});

spinBtn.addEventListener('click', spinWheel);

// Handle Resize
window.addEventListener('resize', () => {
    setupCanvas();
    drawWheel();
});

// Init
setupCanvas();
drawWheel();
