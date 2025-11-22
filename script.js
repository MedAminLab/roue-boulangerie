// ====================
// CONFIGURATION
// ====================
const PRIZES = [
    { label: "GAGNÉ !", color: "#00ff88", type: "win" },
    { label: "PERDU", color: "#ff0066", type: "loss" },
    { label: "GAGNÉ !", color: "#ffd700", type: "win" },
    { label: "PERDU", color: "#ff0066", type: "loss" }
];

const WIN_PROBABILITY = 0.05; // 5% (10 sur 200)
const START_HOUR = 7;
const END_HOUR = 20;

// ====================
// VARIABLES
// ====================
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const statusMessage = document.getElementById('statusMessage');
const resultModal = document.getElementById('resultModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const closeModalBtn = document.getElementById('closeModalBtn');

let isSpinning = false;
let currentRotation = 0;

// ====================
// INITIALISATION CANVAS
// ====================
function initCanvas() {
    // Taille fixe
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    drawWheel();
    console.log('✅ Canvas initialisé');
}

// ====================
// DESSINER LA ROUE
// ====================
function drawWheel() {
    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    const anglePerSegment = (2 * Math.PI) / PRIZES.length;

    // Fond
    ctx.clearRect(0, 0, size, size);

    // Dessiner chaque segment
    for (let i = 0; i < PRIZES.length; i++) {
        const startAngle = i * anglePerSegment;
        const prize = PRIZES[i];

        // Segment
        ctx.beginPath();
        ctx.fillStyle = prize.color;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + anglePerSegment);
        ctx.closePath();
        ctx.fill();

        // Bordure
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Texte
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Fredoka One, Arial';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 5;
        ctx.fillText(prize.label, radius * 0.7, 10);
        ctx.restore();
    }

    console.log('✅ Roue dessinée !');
}

// ====================
// VÉRIFIER HORAIRES
// ====================
function isShopOpen() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= START_HOUR && hour < END_HOUR;
}

// ====================
// FAIRE TOURNER LA ROUE
// ====================
function spinWheel() {
    if (isSpinning) return;

    // Vérifier horaires
    if (!isShopOpen()) {
        showModal("⏰ Fermé", "Le jeu est disponible de 7h à 20h uniquement !");
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    statusMessage.textContent = "🎰 EN COURS...";

    // Déterminer le résultat
    const isWin = Math.random() < WIN_PROBABILITY;
    let targetSegment = isWin
        ? (Math.random() < 0.5 ? 0 : 2)  // Segment 0 ou 2 (GAGNÉ)
        : (Math.random() < 0.5 ? 1 : 3); // Segment 1 ou 3 (PERDU)

    // Calcul rotation
    const segmentAngle = 360 / PRIZES.length;
    const spins = 8 + Math.floor(Math.random() * 4);
    const baseRotation = 360 * spins;
    const targetAngle = targetSegment * segmentAngle + segmentAngle / 2;
    const finalRotation = currentRotation + baseRotation + (360 - targetAngle) + 90;

    // Animation
    animateRotation(currentRotation, finalRotation, 5000, () => {
        currentRotation = finalRotation % 360;
        isSpinning = false;
        spinBtn.disabled = false;

        // Afficher résultat
        if (isWin) {
            statusMessage.textContent = "🎊 BRAVO !";
            launchConfetti();
            showModal("🎉 FÉLICITATIONS !", "Vous avez gagné un GRILLE-PAIN ! Montrez cet écran au comptoir.");
        } else {
            statusMessage.textContent = "😢 Dommage...";
            showModal("Pas cette fois !", "Réessayez votre chance ! Vous aurez peut-être plus de succès.");
        }
    });
}

// ====================
// ANIMATION ROTATION
// ====================
function animateRotation(start, end, duration, callback) {
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing: ralentissement progressif
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const rotation = start + (end - start) * easeOut;

        canvas.style.transform = `rotate(${rotation}deg)`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            callback();
        }
    }

    animate();
}

// ====================
// CONFETTI
// ====================
function launchConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 10,
            angle: 60,
            spread: 100,
            origin: { x: 0 },
            colors: ['#ffd700', '#00ff88', '#ffff00']
        });
        confetti({
            particleCount: 10,
            angle: 120,
            spread: 100,
            origin: { x: 1 },
            colors: ['#ffd700', '#00ff88', '#ffff00']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// ====================
// MODAL
// ====================
function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    resultModal.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => {
    resultModal.classList.add('hidden');
    statusMessage.textContent = "PRÊT À JOUER ?";
});

// ====================
// EVENT LISTENERS
// ====================
spinBtn.addEventListener('click', spinWheel);

// ====================
// DÉMARRAGE
// ====================
window.addEventListener('load', () => {
    console.log('🎮 Démarrage...');
    initCanvas();
});

document.fonts.ready.then(() => {
    console.log('✅ Polices chargées');
    drawWheel();
});
