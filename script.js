const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const statusMessage = document.getElementById('statusMessage');
const resultModal = document.getElementById('resultModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const closeModalBtn = document.getElementById('closeModalBtn');

// Configuration - 4 SEGMENTS SEULEMENT !
const PRIZES = [
    { label: "GAGNÉ !", color: "#00ff88", type: "win" },    // Vert néon
    { label: "PERDU", color: "#ff0066", type: "loss" },     // Rose/Rouge néon
    { label: "GAGNÉ !", color: "#ffd700", type: "win" },    // Or
    { label: "PERDU", color: "#ff0066", type: "loss" }      // Rose/Rouge néon
];

const WIN_PROBABILITY = 0.50; // 50% de chance de gagner
let isSpinning = false;
let currentRotation = 0;

// Setup Canvas
function setupCanvas() {
    const size = 500; // Taille fixe
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.scale(dpr, dpr);
}

// Draw Wheel - SIMPLE ET CLAIR
function drawWheel() {
    const size = 500;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;
    const numSegments = PRIZES.length;
    const arcSize = (2 * Math.PI) / numSegments;

    ctx.clearRect(0, 0, size, size);

    // Dessiner chaque segment
    PRIZES.forEach((prize, i) => {
        const angle = i * arcSize;

        // Segment coloré
        ctx.beginPath();
        ctx.fillStyle = prize.color;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
        ctx.lineTo(centerX, centerY);
        ctx.fill();

        // Bordure blanche entre segments
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Texte
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arcSize / 2);
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 48px 'Fredoka One', sans-serif";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 8;
        ctx.fillText(prize.label, radius * 0.65, 10);
        ctx.restore();
    });

    console.log("✅ Roue dessinée avec 4 segments !");
}

// Animation de particules pendant la rotation
function launchSpinParticles() {
    const colors = ['#00ff88', '#ffd700', '#ff0066', '#33ccff'];

    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            confetti({
                particleCount: 20,
                angle: 90,
                spread: 360,
                origin: { x: 0.5, y: 0.5 },
                colors: colors,
                gravity: 0.3,
                scalar: 0.8,
                drift: 0
            });
        }, i * 300);
    }
}

// Animation de rotation avec ralentissement dramatique
function animateWheelSpin(targetRotation, duration, onComplete) {
    const startRotation = currentRotation;
    const startTime = Date.now();

    function animate() {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing: démarrage rapide, ralentissement dramatique
        const easeOut = 1 - Math.pow(1 - progress, 4);

        currentRotation = startRotation + (targetRotation - startRotation) * easeOut;
        canvas.style.transform = `rotate(${currentRotation}deg)`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            currentRotation = targetRotation;
            onComplete();
        }
    }

    animate();
}

// Game Logic
function spinWheel() {
    if (isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;
    statusMessage.textContent = "🎰 EN COURS...";

    // Particules de départ
    launchSpinParticles();

    // Déterminer le résultat
    const isWin = Math.random() < WIN_PROBABILITY;
    let targetSegment;

    if (isWin) {
        // Choisir un segment "win" (0 ou 2)
        targetSegment = Math.random() < 0.5 ? 0 : 2;
    } else {
        // Choisir un segment "loss" (1 ou 3)
        targetSegment = Math.random() < 0.5 ? 1 : 3;
    }

    // Calculer la rotation
    const segmentAngle = 360 / PRIZES.length; // 90°
    const spins = 8 + Math.floor(Math.random() * 4); // 8 à 12 tours
    const baseRotation = 360 * spins;

    // Centrer sur le segment gagnant
    const segmentCenter = targetSegment * segmentAngle + segmentAngle / 2;
    const targetRotation = currentRotation + baseRotation + (360 - segmentCenter) + 90;

    // Animation de 5 secondes
    animateWheelSpin(targetRotation, 5000, () => {
        isSpinning = false;
        spinBtn.disabled = false;

        if (isWin) {
            // 🎉 VICTOIRE !
            statusMessage.textContent = "🎊 BRAVO !";
            launchWinConfetti();
            showModal("🎉 FÉLICITATIONS !", "Vous avez GAGNÉ un grille-pain ! Présentez cet écran au comptoir.");
        } else {
            // 😢 Perdu
            statusMessage.textContent = "😢 Dommage...";
            launchLossEffect();
            showModal("😢 Dommage !", "Ce n'est pas gagné cette fois... Réessayez votre chance !");
        }
    });
}

// Confetti de victoire - EXPLOSION !
function launchWinConfetti() {
    const duration = 4000;
    const end = Date.now() + duration;

    (function frame() {
        // Confetti doré et vert
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

// Effet de perte - particules qui tombent
function launchLossEffect() {
    confetti({
        particleCount: 50,
        angle: 90,
        spread: 45,
        origin: { y: 0.3 },
        colors: ['#666', '#999', '#444'],
        gravity: 1.5,
        scalar: 0.6
    });
}

function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    resultModal.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => {
    resultModal.classList.add('hidden');
    statusMessage.textContent = "PRÊT À JOUER ?";
});

spinBtn.addEventListener('click', spinWheel);

// Redessiner si fenêtre redimensionnée
window.addEventListener('resize', () => {
    setupCanvas();
    drawWheel();
});

// INITIALISATION
console.log("🎮 Initialisation de la roue...");
setupCanvas();
drawWheel();

// Attendre que les polices soient chargées
document.fonts.ready.then(() => {
    console.log("✅ Polices chargées, redessin...");
    drawWheel();
});
