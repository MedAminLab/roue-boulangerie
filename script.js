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
    { label: "Grille-pain", color: "#E63946", type: "win" },
    { label: "Perdu", color: "#FAEDCD", type: "loss" },
    { label: "Baguette", color: "#D4A373", type: "loss" },
    { label: "Perdu", color: "#FAEDCD", type: "loss" },
    { label: "Croissant", color: "#D4A373", type: "loss" },
    { label: "Perdu", color: "#FAEDCD", type: "loss" },
    { label: "-5%", color: "#D4A373", type: "loss" },
    { label: "Perdu", color: "#FAEDCD", type: "loss" }
];

const WIN_PROBABILITY = 0.05; // 5% chance
const START_HOUR = 7;
const END_HOUR = 20;

let currentRotation = 0;
let isSpinning = false;

// Draw Wheel
function drawWheel() {
    const numSegments = PRIZES.length;
    const arcSize = (2 * Math.PI) / numSegments;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
        ctx.fillStyle = prize.color === "#FAEDCD" ? "#333" : "#FFF";
        ctx.font = "bold 20px Outfit";
        ctx.fillText(prize.label, radius - 20, 10);
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
    statusMessage.textContent = "La roue tourne...";

    // Determine result beforehand
    const isWin = Math.random() < WIN_PROBABILITY;
    let targetIndex;

    if (isWin) {
        // Find index of "Grille-pain"
        targetIndex = PRIZES.findIndex(p => p.type === "win");
    } else {
        // Find random index of "loss"
        const lossIndices = PRIZES.map((p, i) => p.type === "loss" ? i : -1).filter(i => i !== -1);
        targetIndex = lossIndices[Math.floor(Math.random() * lossIndices.length)];
    }

    // Calculate rotation
    // We need to land on targetIndex.
    // The pointer is at the top (270 degrees or -90 degrees in canvas arc).
    // But our drawing starts at 0 (3 o'clock).
    // Let's simplify: we rotate the canvas/wheel.

    const segmentAngle = 360 / PRIZES.length;
    // To land on index i, we need to rotate such that segment i is at the top.
    // Top is 270deg. 
    // If segment 0 is at 0deg, to get it to 270deg, we rotate -90 (or +270).

    // Let's just add a lot of spins + specific offset.
    const spins = 5 + Math.floor(Math.random() * 5); // 5 to 10 spins
    const baseRotation = 360 * spins;

    // Target angle calculation is tricky with canvas rotation.
    // Let's use a simpler visual hack:
    // Rotate to a random angle, then calculate what segment is at the top.
    // Wait, we need to force the result.

    // The pointer is at -90deg (Top).
    // If we rotate the wheel by R degrees.
    // The segment at -90deg will be determined by (R - 90) % 360... roughly.

    // Let's reverse it:
    // We want segment `targetIndex` to be at -90deg.
    // Segment `targetIndex` starts at `targetIndex * segmentAngle`.
    // We want this angle to align with -90deg.
    // So Rotation + (targetIndex * segmentAngle) + (segmentAngle/2) = -90 (mod 360)
    // Rotation = -90 - (targetIndex * segmentAngle) - (segmentAngle/2)

    // Let's add some randomness within the segment so it doesn't always land in the center
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.8);

    const targetRotation = (270 - (targetIndex * segmentAngle) - (segmentAngle / 2) + randomOffset);
    const totalRotation = baseRotation + targetRotation;

    // Animate
    canvas.style.transform = `rotate(${totalRotation}deg)`;

    // Wait for animation to finish (4s as defined in CSS)
    setTimeout(() => {
        isSpinning = false;
        spinBtn.disabled = false;
        statusMessage.textContent = "";

        localStorage.setItem('lastPlayed', today);

        if (isWin) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            showModal("Félicitations !", "Vous avez gagné un grille-pain ! Présentez cet écran au comptoir.");
        } else {
            showModal("Dommage...", `Vous êtes tombé sur : ${PRIZES[targetIndex].label}. Réessayez demain !`);
        }
    }, 4000);
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

// Init
drawWheel();
