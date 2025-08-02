const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highScore");
const speedDisplay = document.getElementById("speed");

const gridSize = 20;
const tileCount = canvas.width / gridSize;
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let gameLoop;
let gameStarted = false;
let foodEatenCount = 0;
let baseSpeed = 120; // Initial speed in milliseconds
let currentSpeed = baseSpeed;
let speedIncreaseFactor = 0.85; // Decrease interval by 15% each time

highScoreDisplay.textContent = `High Score: ${highScore}`;
speedDisplay.textContent = `Speed: 100%`;

function drawGame() {
  // Clear canvas
  ctx.fillStyle = "#1F2937";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw snake
  snake.forEach((segment) => {
    ctx.fillStyle = "#10B981";
    ctx.fillRect(
      segment.x * gridSize,
      segment.y * gridSize,
      gridSize - 2,
      gridSize - 2
    );
  });

  // Draw food
  ctx.fillStyle = "#EF4444";
  ctx.fillRect(
    food.x * gridSize,
    food.y * gridSize,
    gridSize - 2,
    gridSize - 2
  );

  // Move snake
  if (gameStarted) {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Check wall collision
    if (
      head.x < 0 ||
      head.x >= tileCount ||
      head.y < 0 ||
      head.y >= tileCount
    ) {
      gameOver();
      return;
    }

    // Check self collision
    if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
      foodEatenCount++;
      // Base score of 10 plus additional points based on current speed
      const speedLevel = Math.floor(foodEatenCount / 15);
      score += 10 + speedLevel * 5;
      scoreDisplay.textContent = `Score: ${score}`;
      generateFood();

      // Increase speed every 15 food eaten
      if (foodEatenCount % 15 === 0) {
        clearInterval(gameLoop);
        currentSpeed = Math.max(30, currentSpeed * speedIncreaseFactor); // Minimum speed cap
        gameLoop = setInterval(drawGame, currentSpeed);
        // Update speed display (show as percentage of base speed)
        const speedPercentage = Math.round((baseSpeed / currentSpeed) * 100);
        speedDisplay.textContent = `Speed: ${speedPercentage}%`;
      }
    } else {
      snake.pop();
    }
  }
}

function generateFood() {
  food.x = Math.floor(Math.random() * tileCount);
  food.y = Math.floor(Math.random() * tileCount);

  // Ensure food doesn't spawn on snake
  while (
    snake.some((segment) => segment.x === food.x && segment.y === food.y)
  ) {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
  }
}

function gameOver() {
  clearInterval(gameLoop);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    highScoreDisplay.textContent = `High Score: ${highScore}`;
  }
  alert(`Game Over! Score: ${score}\nPress OK to restart`);
  resetGame();
}

function resetGame() {
  snake = [{ x: 10, y: 10 }];
  food = { x: 15, y: 15 };
  dx = 0;
  dy = 0;
  score = 0;
  foodEatenCount = 0;
  currentSpeed = baseSpeed;
  scoreDisplay.textContent = `Score: ${score}`;
  speedDisplay.textContent = `Speed: 100%`;
  gameStarted = false;
  clearInterval(gameLoop);
  gameLoop = setInterval(drawGame, currentSpeed);
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
      if (dy !== 1) {
        dx = 0;
        dy = -1;
        gameStarted = true;
      }
      break;
    case "ArrowDown":
      if (dy !== -1) {
        dx = 0;
        dy = 1;
        gameStarted = true;
      }
      break;
    case "ArrowLeft":
      if (dx !== 1) {
        dx = -1;
        dy = 0;
        gameStarted = true;
      }
      break;
    case "ArrowRight":
      if (dx !== -1) {
        dx = 1;
        dy = 0;
        gameStarted = true;
      }
      break;
  }
});

// Start game
gameLoop = setInterval(drawGame, currentSpeed);
