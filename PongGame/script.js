const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const startPauseBtn = document.getElementById('startPause');
const resetBtn = document.getElementById('reset');
const difficultySelect = document.getElementById('difficulty');
const statusText = document.getElementById('status');

// Game objects
const paddleWidth = 12, paddleHeight = 80;
const ballRadius = 10;
const leftPaddle = { x: 20, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 8 };
const rightPaddle = { x: canvas.width - 20 - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 5 };
const ball = { x: canvas.width / 2, y: canvas.height / 2, vx: 5, vy: 3 };

// Score and game state
let leftScore = 0, rightScore = 0;
let isPlaying = false;
let animationFrameId;
let difficulty = 1;

// FPS calculation
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

// Sound effects
const paddleHitSound = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
const scoreSound = new Audio('https://www.soundjay.com/buttons/beep-02.mp3');
const wallHitSound = new Audio('https://www.soundjay.com/buttons/beep-03.mp3');

// Mouse control for left paddle
canvas.addEventListener('mousemove', (e) => {
    if (isPlaying) {
        const rect = canvas.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        leftPaddle.y = mouseY - paddleHeight / 2;
        if (leftPaddle.y < 0) leftPaddle.y = 0;
        if (leftPaddle.y + paddleHeight > canvas.height) leftPaddle.y = canvas.height - paddleHeight;
    }
});

// Touch control for left paddle
canvas.addEventListener('touchmove', (e) => {
    if (isPlaying) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchY = e.touches[0].clientY - rect.top;
        leftPaddle.y = touchY - paddleHeight / 2;
        if (leftPaddle.y < 0) leftPaddle.y = 0;
        if (leftPaddle.y + paddleHeight > canvas.height) leftPaddle.y = canvas.height - paddleHeight;
    }
});

// Control buttons
startPauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    startPauseBtn.textContent = isPlaying ? 'Pause' : 'Start';
    statusText.textContent = isPlaying ? 'Playing' : 'Paused';
    if (isPlaying) gameLoop();
    else cancelAnimationFrame(animationFrameId);
});

resetBtn.addEventListener('click', () => {
    leftScore = 0;
    rightScore = 0;
    resetBall();
    draw();
});

difficultySelect.addEventListener('change', () => {
    difficulty = parseFloat(difficultySelect.value);
    rightPaddle.speed = 5 * difficulty;
});

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

function drawText(text, x, y, color, fontSize = "40px") {
    ctx.fillStyle = color;
    ctx.font = `${fontSize} Arial`;
    ctx.fillText(text, x, y);
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 2) * difficulty;
    ball.vy = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3) * difficulty;
}

function update() {
    if (!isPlaying) return;

    // Ball movement
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top/bottom wall collision
    if (ball.y - ballRadius < 0) {
        ball.y = ballRadius;
        ball.vy *= -1;
        wallHitSound.play();
    }
    if (ball.y + ballRadius > canvas.height) {
        ball.y = canvas.height - ballRadius;
        ball.vy *= -1;
        wallHitSound.play();
    }

    // Left paddle collision
    if (
        ball.x - ballRadius < leftPaddle.x + leftPaddle.width &&
        ball.y > leftPaddle.y &&
        ball.y < leftPaddle.y + leftPaddle.height
    ) {
        ball.x = leftPaddle.x + leftPaddle.width + ballRadius;
        ball.vx *= -1.05;
        let impact = ((ball.y - leftPaddle.y) - paddleHeight / 2) / (paddleHeight / 2);
        ball.vy += impact * 2;
        paddleHitSound.play();
    }

    // Right paddle collision
    if (
        ball.x + ballRadius > rightPaddle.x &&
        ball.y > rightPaddle.y &&
        ball.y < rightPaddle.y + rightPaddle.height
    ) {
        ball.x = rightPaddle.x - ballRadius;
        ball.vx *= -1.05;
        let impact = ((ball.y - rightPaddle.y) - paddleHeight / 2) / (paddleHeight / 2);
        ball.vy += impact * 2;
        paddleHitSound.play();
    }

    // Score logic
    if (ball.x < 0) {
        rightScore++;
        scoreSound.play();
        resetBall();
    }
    if (ball.x > canvas.width) {
        leftScore++;
        scoreSound.play();
        resetBall();
    }

    // AI paddle movement
    let target = ball.y - paddleHeight / 2;
    if (rightPaddle.y + paddleHeight / 2 < ball.y - 8) {
        rightPaddle.y += rightPaddle.speed;
    } else if (rightPaddle.y + paddleHeight / 2 > ball.y + 8) {
        rightPaddle.y -= rightPaddle.speed;
    }
    if (rightPaddle.y < 0) rightPaddle.y = 0;
    if (rightPaddle.y + paddleHeight > canvas.height) rightPaddle.y = canvas.height - paddleHeight;
}

function draw() {
    // Clear
    drawRect(0, 0, canvas.width, canvas.height, "#222");
    // Middle line
    for (let i = 10; i < canvas.height; i += 30) {
        drawRect(canvas.width / 2 - 2, i, 4, 15, "#00ff99");
    }
    // Paddles
    drawRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, "#fff");
    drawRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, "#fff");
    // Ball
    drawCircle(ball.x, ball.y, ballRadius, "#fff");
    // Scores
    drawText(leftScore, canvas.width / 2 - 70, 60, "#00ff99");
    drawText(rightScore, canvas.width / 2 + 40, 60, "#00ff99");
    // FPS
    drawText(`FPS: ${fps}`, 10, 30, "#00ff99", "20px");
}

function gameLoop(currentTime) {
    // Calculate FPS
    frameCount++;
    const deltaTime = currentTime - lastTime;
    if (deltaTime >= 1000) {
        fps = Math.round((frameCount * 1000) / deltaTime);
        frameCount = 0;
        lastTime = currentTime;
    }

    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Initialize
resetBall();
draw();