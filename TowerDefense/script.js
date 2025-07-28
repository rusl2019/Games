document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Setup ukuran canvas dan grid
  const TILE_SIZE = 50;
  canvas.width = 16 * TILE_SIZE; // 800px
  canvas.height = 12 * TILE_SIZE; // 600px

  // Variabel Status Game
  let lives = 20;
  let money = 300;
  let wave = 0;
  let enemies = [];
  let towers = [];
  let projectiles = [];
  let selectedTowerType = null;
  let waveInProgress = false;
  let gameOver = false;

  // Elemen UI
  const livesDisplay = document.getElementById("lives-display");
  const moneyDisplay = document.getElementById("money-display");
  const waveDisplay = document.getElementById("wave-display");
  const startWaveButton = document.getElementById("start-wave-button");
  const buyTurret1Button = document.getElementById("buy-turret-1");
  const buyTurret2Button = document.getElementById("buy-turret-2");
  const gameMessageOverlay = document.getElementById("game-message-overlay");
  const gameMessageText = document.getElementById("game-message-text");
  const restartButton = document.getElementById("restart-button");

  // Peta dan Jalur Musuh (1 = jalur, 0 = bisa dibangun)
  const map = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  // Titik-titik jalur yang harus diikuti musuh
  const path = [
    { x: 0, y: 2 },
    { x: 7, y: 2 },
    { x: 7, y: 4 },
    { x: 5, y: 4 },
    { x: 5, y: 5 },
    { x: 2, y: 5 },
    { x: 2, y: 8 },
    { x: 10, y: 8 },
    { x: 10, y: 4 },
    { x: 15, y: 4 },
  ];

  // --- KELAS-KELAS GAME ---
  class Tower {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.cooldown = 0;

      // Properti berdasarkan tipe menara
      if (type === "turret") {
        this.cost = 50;
        this.range = 150;
        this.damage = 10;
        this.fireRate = 30; // 2 tembakan per detik (60/30)
        this.color = "#34D399"; // Hijau
        this.projectileColor = "#6EE7B7";
      } else if (type === "cannon") {
        this.cost = 100;
        this.range = 200;
        this.damage = 35;
        this.fireRate = 90; // 1 tembakan per 1.5 detik (60/90)
        this.color = "#A78BFA"; // Ungu
        this.projectileColor = "#C4B5FD";
      }
    }

    draw() {
      // Gambar dasar menara
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, TILE_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();

      // Gambar laras
      ctx.fillStyle = "white";
      ctx.fillRect(this.x - 5, this.y - 5, 10, 10);
    }

    update() {
      if (this.cooldown > 0) {
        this.cooldown--;
      } else {
        this.findTargetAndShoot();
      }
      this.draw();
    }

    findTargetAndShoot() {
      let target = null;
      let minDistance = this.range;

      for (const enemy of enemies) {
        const dx = this.x - enemy.x;
        const dy = this.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          target = enemy;
        }
      }

      if (target) {
        projectiles.push(
          new Projectile(
            this.x,
            this.y,
            target,
            this.damage,
            this.projectileColor
          )
        );
        this.cooldown = this.fireRate;
      }
    }
  }

  class Enemy {
    constructor(health, speed) {
      this.pathIndex = 0;
      const startNode = path[0];
      this.x = startNode.x * TILE_SIZE + TILE_SIZE / 2;
      this.y = startNode.y * TILE_SIZE + TILE_SIZE / 2;
      this.maxHealth = health;
      this.health = health;
      this.speed = speed;
      this.size = 15;
    }

    draw() {
      // Gambar musuh
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();

      // Gambar health bar
      const healthPercentage = this.health / this.maxHealth;
      ctx.fillStyle = "black";
      ctx.fillRect(
        this.x - this.size,
        this.y - this.size - 10,
        this.size * 2,
        5
      );
      ctx.fillStyle = "lime";
      ctx.fillRect(
        this.x - this.size,
        this.y - this.size - 10,
        this.size * 2 * healthPercentage,
        5
      );
    }

    update() {
      if (this.pathIndex < path.length - 1) {
        const targetNode = path[this.pathIndex + 1];
        const targetX = targetNode.x * TILE_SIZE + TILE_SIZE / 2;
        const targetY = targetNode.y * TILE_SIZE + TILE_SIZE / 2;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
          this.pathIndex++;
          this.x = targetX;
          this.y = targetY;
        } else {
          this.x += (dx / distance) * this.speed;
          this.y += (dy / distance) * this.speed;
        }
      } else {
        // Musuh mencapai akhir
        lives--;
        updateUI();
        return false; // Tandai untuk dihapus
      }
      this.draw();
      return true; // Tetap dalam game
    }

    takeDamage(amount) {
      this.health -= amount;
      if (this.health <= 0) {
        money += 5; // Dapatkan uang
        updateUI();
        return false; // Mati
      }
      return true; // Masih hidup
    }
  }

  class Projectile {
    constructor(x, y, target, damage, color) {
      this.x = x;
      this.y = y;
      this.target = target;
      this.damage = damage;
      this.speed = 8;
      this.color = color;
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    update() {
      if (!enemies.includes(this.target)) {
        return false; // Hapus proyektil jika target tidak ada
      }
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.speed) {
        const isAlive = this.target.takeDamage(this.damage);
        if (!isAlive) {
          enemies = enemies.filter((enemy) => enemy !== this.target);
        }
        return false; // Hapus proyektil
      }

      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
      this.draw();
      return true;
    }
  }

  // --- FUNGSI-FUNGSI GAME ---
  function drawMap() {
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (map[y][x] === 1) {
          ctx.fillStyle = "#4A5568"; // gray-600
        } else {
          ctx.fillStyle = "#2D3748"; // gray-800
        }
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  function drawGrid() {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    for (let i = 0; i <= canvas.width; i += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
  }

  let spawnTimeouts = [];

  function startNewWave() {
    if (waveInProgress) return;
    wave++;
    waveInProgress = true;
    startWaveButton.disabled = true;
    startWaveButton.classList.add("opacity-50", "cursor-not-allowed");
    updateUI();

    const enemyCount = wave * 5;
    const enemyHealth = 80 + wave * 20;
    const enemySpeed = 1 + wave * 0.1;

    for (let i = 0; i < enemyCount; i++) {
      const timeoutId = setTimeout(() => {
        enemies.push(new Enemy(enemyHealth, enemySpeed));
      }, i * 500);
      spawnTimeouts.push(timeoutId);
    }
  }

  function updateUI() {
    livesDisplay.textContent = lives;
    moneyDisplay.textContent = money;
    waveDisplay.textContent = wave;
  }

  function handleTowerPlacement(e) {
    if (!selectedTowerType) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gridX = Math.floor(x / TILE_SIZE);
    const gridY = Math.floor(y / TILE_SIZE);

    const towerCost = selectedTowerType === "turret" ? 50 : 100;
    const isOccupied = towers.some(
      (t) =>
        t.x === gridX * TILE_SIZE + TILE_SIZE / 2 &&
        t.y === gridY * TILE_SIZE + TILE_SIZE / 2
    );

    if (
      money >= towerCost &&
      gridX >= 0 &&
      gridX < map[0].length &&
      gridY >= 0 &&
      gridY < map.length &&
      map[gridY][gridX] === 0 &&
      !isOccupied
    ) {
      money -= towerCost;
      towers.push(
        new Tower(
          gridX * TILE_SIZE + TILE_SIZE / 2,
          gridY * TILE_SIZE + TILE_SIZE / 2,
          selectedTowerType
        )
      );
      updateUI();
    }

    selectedTowerType = null;
    canvas.classList.remove("building-cursor");
  }

  function selectTower(type) {
    const cost = type === "turret" ? 50 : 100;
    if (money >= cost) {
      selectedTowerType = type;
      canvas.classList.add("building-cursor");
    } else {
      alert("Uang tidak cukup!");
    }
  }

  function showGameOver(message) {
    gameOver = true;
    gameMessageText.textContent = message;
    gameMessageOverlay.classList.remove("hidden");
    gameMessageOverlay.classList.add("flex");
  }

  function resetGame() {
    cancelAnimationFrame(animationFrameId);
    spawnTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    spawnTimeouts = [];
    lives = 20;
    money = 150;
    wave = 0;
    enemies = [];
    towers = [];
    projectiles = [];
    waveInProgress = false;
    gameOver = false;

    updateUI();
    startWaveButton.disabled = false;
    startWaveButton.classList.remove("opacity-50", "cursor-not-allowed");
    gameMessageOverlay.classList.add("hidden");
    gameMessageOverlay.classList.remove("flex");

    gameLoop();
  }

  // --- GAME LOOP ---
  let animationFrameId;

  function gameLoop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    drawGrid();

    towers.forEach((tower) => tower.update());
    enemies = enemies.filter((enemy) => enemy.health > 0 && enemy.update());
    projectiles = projectiles.filter((p) => p.update());

    if (waveInProgress && enemies.length === 0) {
      waveInProgress = false;
      startWaveButton.disabled = false;
      startWaveButton.classList.remove("opacity-50", "cursor-not-allowed");
      money += 100 + wave * 10;
      updateUI();
    }

    if (lives <= 0) {
      showGameOver("KALAH!");
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // --- EVENT LISTENERS ---
  startWaveButton.addEventListener("click", startNewWave);
  buyTurret1Button.addEventListener("click", () => selectTower("turret"));
  buyTurret2Button.addEventListener("click", () => selectTower("cannon"));
  canvas.addEventListener("click", handleTowerPlacement);
  restartButton.addEventListener("click", resetGame);

  // --- INISIALISASI ---
  updateUI();
  gameLoop();
});
