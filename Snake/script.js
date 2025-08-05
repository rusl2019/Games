const game = {
  // --- CONSTANTS & DOM PROPERTIES ---
  GRID_SIZE: 20,
  BASE_SPEED: 120, // Initial speed in milliseconds
  SPEED_INCREASE_FACTOR: 0.9, // Speed multiplier for each level up

  // Colors
  CANVAS_COLOR: "#1F2937",
  SNAKE_COLOR: "#10B981",
  FOOD_COLOR: "#EF4444",

  // Keyboard Keys
  KEY: {
    UP: "ArrowUp",
    DOWN: "ArrowDown",
    LEFT: "ArrowLeft",
    RIGHT: "ArrowRight",
  },

  // DOM Elements
  canvas: document.getElementById("gameCanvas"),
  ctx: null,
  scoreDisplay: document.getElementById("score"),
  highScoreDisplay: document.getElementById("highScore"),
  speedDisplay: document.getElementById("speed"),
  gameOverModal: document.getElementById("gameOverModal"),
  finalScoreDisplay: document.getElementById("finalScore"),
  restartButton: document.getElementById("restartButton"),

  // --- GAME STATE ---
  snake: [],
  food: {},
  dx: 0,
  dy: 0,
  score: 0,
  highScore: 0,
  foodEatenCount: 0,
  currentSpeed: 0,
  gameStarted: false,
  lastUpdateTime: 0,
  tileCount: 0,

  /**
   * Initializes the game
   */
  init() {
    this.ctx = this.canvas.getContext("2d");
    this.tileCount = this.canvas.width / this.GRID_SIZE;
    this.highScore = localStorage.getItem("highScore") || 0;
    
    this.setupEventListeners();
    this.resetGame();
    
    // Start the main game loop
    requestAnimationFrame(this.gameLoop.bind(this));
  },

  /**
   * Sets up all event listeners
   */
  setupEventListeners() {
    document.addEventListener("keydown", this.handleKeyPress.bind(this));
    this.restartButton.addEventListener("click", this.resetGame.bind(this));
  },

  /**
   * Main game loop, using requestAnimationFrame
   * @param {number} currentTime The current time from the browser
   */
  gameLoop(currentTime) {
    // Always request the next frame
    requestAnimationFrame(this.gameLoop.bind(this));

    // Control game speed based on time, not frame rate
    const timeSinceLastUpdate = currentTime - this.lastUpdateTime;
    if (timeSinceLastUpdate < this.currentSpeed) {
      return; // Skip the update if it's not time yet
    }
    
    this.lastUpdateTime = currentTime;

    // Perform logic updates and drawing
    this.update();
    this.draw();
  },
  
  /**
   * Updates the game state (snake position, collision, score)
   */
  update() {
    if (!this.gameStarted) return;

    const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

    // Check for wall collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver();
      return;
    }

    // Check for self collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.gameOver();
      return;
    }

    this.snake.unshift(head);

    // Check for food consumption
    if (head.x === this.food.x && head.y === this.food.y) {
      this.foodEatenCount++;
      const speedLevel = Math.floor(this.foodEatenCount / 15);
      this.score += 10 + speedLevel * 5;
      this.generateFood();

      // Increase speed every 15 food items eaten
      if (this.foodEatenCount > 0 && this.foodEatenCount % 15 === 0) {
        this.currentSpeed = Math.max(30, this.currentSpeed * this.SPEED_INCREASE_FACTOR);
      }
    } else {
      this.snake.pop(); // Remove tail if not eating
    }
  },

  /**
   * Draws all elements to the canvas
   */
  draw() {
    // Canvas background
    this.ctx.fillStyle = this.CANVAS_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Snake
    this.ctx.fillStyle = this.SNAKE_COLOR;
    this.snake.forEach(segment => {
      this.ctx.fillRect(
        segment.x * this.GRID_SIZE,
        segment.y * this.GRID_SIZE,
        this.GRID_SIZE - 2,
        this.GRID_SIZE - 2
      );
    });

    // Food
    this.ctx.fillStyle = this.FOOD_COLOR;
    this.ctx.fillRect(
      this.food.x * this.GRID_SIZE,
      this.food.y * this.GRID_SIZE,
      this.GRID_SIZE - 2,
      this.GRID_SIZE - 2
    );
    
    // Update UI Text
    this.updateUIDisplay();
  },

  /**
   * Generates a new food position
   */
  generateFood() {
    this.food.x = Math.floor(Math.random() * this.tileCount);
    this.food.y = Math.floor(Math.random() * this.tileCount);

    // Ensure food doesn't spawn on the snake
    while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y)) {
      this.food.x = Math.floor(Math.random() * this.tileCount);
      this.food.y = Math.floor(Math.random() * this.tileCount);
    }
  },
  
  /**
   * Handles input from the keyboard
   * @param {KeyboardEvent} e The keyboard event
   */
  handleKeyPress(e) {
    if (!this.gameStarted && Object.values(this.KEY).includes(e.key)) {
        this.gameStarted = true;
    }
    
    switch (e.key) {
      case this.KEY.UP:
        if (this.dy !== 1) { this.dx = 0; this.dy = -1; }
        break;
      case this.KEY.DOWN:
        if (this.dy !== -1) { this.dx = 0; this.dy = 1; }
        break;
      case this.KEY.LEFT:
        if (this.dx !== 1) { this.dx = -1; this.dy = 0; }
        break;
      case this.KEY.RIGHT:
        if (this.dx !== -1) { this.dx = 1; this.dy = 0; }
        break;
    }
  },

  /**
   * Logic for when the game ends
   */
  gameOver() {
    this.gameStarted = false;
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("highScore", this.highScore);
    }
    
    this.finalScoreDisplay.textContent = `Your Score: ${this.score}`;
    this.gameOverModal.classList.remove("hidden");
  },

  /**
   * Resets the game state to initial conditions
   */
  resetGame() {
    this.snake = [{ x: 10, y: 10 }];
    this.dx = 0;
    this.dy = 0;
    this.score = 0;
    this.foodEatenCount = 0;
    this.currentSpeed = this.BASE_SPEED;
    this.gameStarted = false;
    
    this.generateFood();
    this.updateUIDisplay();
    this.draw(); // Draw the initial state
    
    this.gameOverModal.classList.add("hidden");
  },
  
  /**
   * Updates all text in the UI (score, speed, etc.)
   */
  updateUIDisplay() {
    this.scoreDisplay.textContent = `Score: ${this.score}`;
    this.highScoreDisplay.textContent = `High Score: ${this.highScore}`;
    const speedPercentage = Math.round((this.BASE_SPEED / this.currentSpeed) * 100);
    this.speedDisplay.textContent = `Speed: ${speedPercentage}%`;
  }
};

// --- START THE GAME ---
game.init();