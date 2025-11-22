// ====================
// CONFIGURATION - DESIGN MODERNE COLORÉ
// ====================
const PRIZES = [
    { label: "🎉 GAGNÉ !", color: "#FF1493", gradient: "linear-gradient(135deg, #FF1493, #FF6B9D)", type: "win" },     // Rose vif -> Rose clair
    { label: "😢 PERDU", color: "#9D50BB", gradient: "linear-gradient(135deg, #9D50BB, #6E48AA)", type: "loss" },      // Violet
    { label: "🎊 GAGNÉ !", color: "#00D9FF", gradient: "linear-gradient(135deg, #00D9FF, #7DEDFF)", type: "win" },     // Cyan -> Bleu clair
    { label: "💔 PERDU", color: "#FFA500", gradient: "linear-gradient(135deg, #FFA500, #FFD700)", type: "loss" }       // Orange -> Or
];

const WIN_PROBABILITY = 0.05;
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
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    drawWheel();
    console.log('✅ Canvas initialisé');
}

// ====================
// DESSINER LA ROUE AVEC GRADIENTS
// ====================
function drawWheel() {
    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    const anglePerSegment = (2 * Math.PI) / PRIZES.length;

    ctx.clearRect(0, 0, size, size);

    // Dessiner chaque segment avec gradient
    for (let i = 0; i < PRIZES.length; i++) {
        const startAngle = i * anglePerSegment;
        const endAngle = startAngle + anglePerSegment;
        const prize = PRIZES[i];

        // Créer gradient radial pour chaque segment
        const gradient = ctx.createLinearGradient(
            centerX, centerY,
            centerX + Math.cos(startAngle + anglePerSegment / 2) * radius,
            centerY + Math.sin(startAngle + anglePerSegment / 2) * radius
        );

        // Couleurs du gradient
        if (prize.type === "win") {
            gradient.addColorStop(0, prize.color);
            gradient.addColorStop(1, i === 0 ? '#FF6B9D' : '#7DEDFF');
        } else {
            gradient.addColorStop(0, prize.color);
            gradient.addColorStop(1, i === 1 ? '#6E48AA' : '#FFD700');
        }

        // Segment
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        // Bordure blanche épaisse
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Texte avec ombre portée
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Fredoka One, Arial';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(prize.label, radius * 0.65, 10);
        ctx.restore();
    }

    console.log('✅ Roue dessinée avec gradients !');
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
// PAILLETTES PENDANT LA ROTATION
// ====================
function launchSparkles() {
    const colors = ['#FF1493', '#00D9FF', '#FFD700', '#9D50BB', '#FF6B9D', '#7DEDFF'];

    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            confetti({
                particleCount: 30,
                angle: 90,
                spread: 360,
                origin: { x: 0.5, y: 0.5 },
                colors: colors,
                gravity: 0.5,
                scalar: 1.2,
                drift: 0,
                ticks: 100,
                shapes: ['circle', 'square'],
                startVelocity: 20
            });
        }, i * 200);
    }
}

// ====================
// FAIRE TOURNER LA ROUE
// ====================
function spinWheel() {
    if (isSpinning) return;

    if (!isShopOpen()) {
        showModal("⏰ Fermé", "Le jeu est disponible de 7h à 20h uniquement !");
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    statusMessage.textContent = "🎰 EN COURS...";
    statusMessage.style.animation = 'rainbow-text 2s linear infinite';

    // Paillettes pendant la rotation
    launchSparkles();

    const isWin = Math.random() < WIN_PROBABILITY;
    let targetSegment = isWin
        ? (Math.random() < 0.5 ? 0 : 2)
        : (Math.random() < 0.5 ? 1 : 3);

    const segmentAngle = 360 / PRIZES.length;
    const spins = 8 + Math.floor(Math.random() * 4);
    const baseRotation = 360 * spins;
    const targetAngle = targetSegment * segmentAngle + segmentAngle / 2;
    const finalRotation = currentRotation + baseRotation + (360 - targetAngle) + 90;

    animateRotation(currentRotation, finalRotation, 5000, () => {
        currentRotation = finalRotation % 360;
        isSpinning = false;
        spinBtn.disabled = false;
        statusMessage.style.animation = '';

        if (isWin) {
            statusMessage.textContent = "🎊 BRAVO !";
            launchWinConfetti();
            showModal("🎉 FÉLICITATIONS !", "Vous avez gagné un GRILLE-PAIN ! Montrez cet écran au comptoir.");
        } else {
            statusMessage.textContent = "😢 Dommage...";
            launchLossParticles();
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
// CONFETTI GAGNANT - SPECTACULAIRE !
// ====================
function launchWinConfetti() {
    const duration = 5000;
    const end = Date.now() + duration;
    const colors = ['#FF1493', '#00D9FF', '#FFD700', '#FF6B9D', '#7DEDFF', '#FFA500'];

    (function frame() {
        // Explosion centrale
        confetti({
            particleCount: 15,
            angle: 60,
            spread: 120,
            origin: { x: 0, y: 0.6 },
            colors: colors,
            scalar: 1.5,
            gravity: 1.2,
            shapes: ['star', 'circle']
        });
        confetti({
            particleCount: 15,
            angle: 120,
            spread: 120,
            origin: { x: 1, y: 0.6 },
            colors: colors,
            scalar: 1.5,
            gravity: 1.2,
            shapes: ['star', 'circle']
        });

        // Pluie d'étoiles du haut
        confetti({
            particleCount: 10,
            angle: 90,
            spread: 60,
            origin: { x: 0.5, y: 0 },
            colors: colors,
            gravity: 0.8,
            shapes: ['star'],
            scalar: 1.2
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// ====================
// PARTICULES PERTE
// ====================
function launchLossParticles() {
    confetti({
        particleCount: 50,
        angle: 90,
        spread: 70,
        origin: { y: 0.4 },
        colors: ['#6E48AA', '#4A4A4A', '#8B8B8B'],
        gravity: 1.5,
        scalar: 0.8,
        drift: 0.2
    });
}

// ====================
// MODAL
// ====================
function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    resultModal.classList.remove('hidden');

    // Animation d'entrée du modal
    const modal = document.querySelector('.arcade-modal');
    modal.style.animation = 'pop-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
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
