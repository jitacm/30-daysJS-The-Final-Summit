const container = document.getElementById("gameContainer");
const character = document.getElementById("character");
const scoreDisplay = document.getElementById("scoreDisplay");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreDisplay = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");
const startScreen = document.getElementById('startScreen');
const howToPlayScreen = document.getElementById('howToPlayScreen');
const startGameBtn = document.getElementById('startGameBtn');
const howToPlayBtn = document.getElementById('howToPlayBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');

// Power-up status displays
const jetpackStatus = document.getElementById('jetpackStatus');
const shieldStatus = document.getElementById('shieldStatus');
const superJumpStatus = document.getElementById('superJumpStatus');

// --- GAME CONSTANTS ---
const GRAVITY = 0.8;
const MAX_JUMP_POWER = 22;
const MIN_JUMP_POWER = 6;
const CHARGE_SPEED = 1.5;
const HORIZONTAL_SPEED = 7;
const WALL_BOUNCE_DAMPING = 0.5;
const GROUND_FRICTION = 0.1;
const CHARACTER_WIDTH = 50;
const CHARACTER_HEIGHT = 50;
const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 15;
const TOTAL_BRICKS = 8;
const SCROLL_THRESHOLD_TOP = window.innerHeight / 2.5;

// Power-up constants
const POWERUP_TYPES = ['jetpack', 'shield', 'superJump'];
const POWERUP_CHANCE = 0.15; // 15% chance
const JETPACK_DURATION = 5000;
const SHIELD_DURATION = 8000;
const SUPERJUMP_DURATION = 6000;

// Obstacle constants
const ENEMY_CHANCE = 0.1; // 10% chance
const SPIKE_CHANCE = 0.08; // 8% chance
const MOVING_PLATFORM_CHANCE = 0.12; // 12% chance
const ENEMY_SPEED = 2;
const PLATFORM_SPEED = 1.5;

// --- GAME STATE ---
let positionX, positionY, velocityX, velocityY;
let isCharging, jumpPower, jumpDirection;
let isJumping;
let chargeTimer;
let score, highestY;
let bricks = [];
let powerUps = [];
let enemies = [];
let spikes = [];
let movingPlatforms = [];
let gameState = 'playing';

// Power-up states
let activeEffects = {
    jetpack: false,
    shield: false,
    superJump: false
};
let effectTimers = {
    jetpack: null,
    shield: null,
    superJump: null
};

// Show start screen initially
startScreen.style.display = 'flex';
gameContainer.style.display = 'none';

// Button event listeners
startGameBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    resetGame();
});

howToPlayBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    howToPlayScreen.style.display = 'flex';
});

backToMenuBtn.addEventListener('click', () => {
    howToPlayScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

function resetGame() {
    // Reset variables
    positionX = container.clientWidth / 2 - CHARACTER_WIDTH / 2;
    positionY = container.clientHeight - CHARACTER_HEIGHT - 50;
    velocityX = 0;
    velocityY = 0;
    isCharging = false;
    isJumping = false;
    jumpPower = MIN_JUMP_POWER;
    jumpDirection = 0;
    score = 0;
    highestY = positionY;

    // Reset power-up states
    Object.keys(effectTimers).forEach(key => {
        if (effectTimers[key]) {
            clearTimeout(effectTimers[key]);
            effectTimers[key] = null;
        }
        activeEffects[key] = false;
    });
    
    // Clear all visual effects
    character.className = '';
    jetpackStatus.classList.add('hidden');
    shieldStatus.classList.add('hidden');
    superJumpStatus.classList.add('hidden');

    // Clear all game objects
    powerUps.forEach(p => p.element.remove());
    powerUps = [];
    enemies.forEach(e => e.element.remove());
    enemies = [];
    spikes.forEach(s => s.element.remove());
    spikes = [];
    movingPlatforms.forEach(mp => mp.element.remove());
    movingPlatforms = [];

    // Reset display
    scoreDisplay.textContent = "Score: 0";
    character.style.left = positionX + "px";
    character.style.top = positionY + "px";
    updateChargeIndicator(0);

    // Hide game over screen
    gameOverScreen.style.display = 'none';

    // Clear existing bricks and create new ones
    bricks.forEach(brick => brick.remove());
    bricks = [];
    createInitialBricks();

    // Start game
    gameState = 'playing';
    requestAnimationFrame(gameLoop);
}

function createInitialBricks() {
    // Create a safe starting platform
    createBrick(container.clientWidth / 2 - BRICK_WIDTH / 2, container.clientHeight - 50);

    // Create platforms with varied content
    for (let i = 0; i < TOTAL_BRICKS; i++) {
        const x = Math.random() * (container.clientWidth - BRICK_WIDTH);
        const y = container.clientHeight - 150 - (i * 100);
        
        // Decide what to create based on random chance
        const rand = Math.random();
        
        if (rand < MOVING_PLATFORM_CHANCE && i > 2) {
            createMovingPlatform(x, y);
        } else {
            createBrick(x, y);
            
            // Add obstacles or power-ups on static platforms
            if (rand < POWERUP_CHANCE + MOVING_PLATFORM_CHANCE) {
                const powerupType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
                createPowerUp(x + BRICK_WIDTH/2 - 20, y - 45, powerupType);
            } else if (rand < POWERUP_CHANCE + MOVING_PLATFORM_CHANCE + ENEMY_CHANCE && i > 1) {
                createEnemy(x + BRICK_WIDTH/2 - 15, y - 35);
            } else if (rand < POWERUP_CHANCE + MOVING_PLATFORM_CHANCE + ENEMY_CHANCE + SPIKE_CHANCE && i > 1) {
                createSpike(x + 10, y - 20);
            }
        }
    }
}

function createBrick(x, y) {
    const brick = document.createElement("div");
    brick.className = "brick";
    brick.style.left = x + "px";
    brick.style.top = y + "px";
    container.appendChild(brick);
    bricks.push(brick);
}

function createMovingPlatform(x, y) {
    const platform = document.createElement("div");
    platform.className = "brick moving-platform";
    platform.style.left = x + "px";
    platform.style.top = y + "px";
    container.appendChild(platform);
    
    movingPlatforms.push({
        element: platform,
        x: x,
        y: y,
        direction: Math.random() > 0.5 ? 1 : -1,
        range: 150,
        startX: x
    });
    
    bricks.push(platform);
}

function createPowerUp(x, y, type) {
    const powerUp = document.createElement("div");
    powerUp.className = `powerup ${type}`;
    powerUp.style.left = x + "px";
    powerUp.style.top = y + "px";
    
    // Add emoji based on type
    const emojis = {
        jetpack: '🚀',
        shield: '🛡️',
        superJump: '⚡'
    };
    powerUp.textContent = emojis[type];
    
    container.appendChild(powerUp);
    powerUps.push({
        x, y,
        width: 40,
        height: 40,
        element: powerUp,
        type: type
    });
}

function createEnemy(x, y) {
    const enemy = document.createElement("div");
    enemy.className = "enemy";
    enemy.style.left = x + "px";
    enemy.style.top = y + "px";
    container.appendChild(enemy);
    
    enemies.push({
        element: enemy,
        x: x,
        y: y,
        width: 30,
        height: 30,
        direction: Math.random() > 0.5 ? 1 : -1,
        range: 60,
        startX: x
    });
}

function createSpike(x, y) {
    const spike = document.createElement("div");
    spike.className = "spike";
    spike.style.left = x + "px";
    spike.style.top = y + "px";
    container.appendChild(spike);
    
    spikes.push({
        element: spike,
        x: x,
        y: y,
        width: 60,
        height: 20
    });
}

// --- JUMP MECHANICS ---
function startCharge(direction) {
    if (isJumping || isCharging) return;
    
    isCharging = true;
    jumpDirection = direction;
    jumpPower = MIN_JUMP_POWER;

    chargeTimer = setInterval(() => {
        if (jumpPower < MAX_JUMP_POWER) {
            jumpPower += CHARGE_SPEED;
        }
        updateChargeIndicator(jumpPower);
    }, 20);
}

function releaseJump() {
    if (!isCharging) return;

    // Apply movement based on active effects
    let speedMultiplier = 1;
    let jumpMultiplier = 1;
    
    if (activeEffects.jetpack) speedMultiplier *= 1.5;
    if (activeEffects.superJump) jumpMultiplier *= 1.8;
    
    if (jumpDirection !== 0) {
        velocityX = HORIZONTAL_SPEED * speedMultiplier * jumpDirection;
    } else {
        velocityX = 0;
    }
    
    const effectiveJumpPower = jumpPower * jumpMultiplier;
    velocityY = -effectiveJumpPower;
    isCharging = false;
    isJumping = true;
    clearInterval(chargeTimer);
    updateChargeIndicator(0);

    // Play jump sound
    const jumpSound = document.getElementById("jumpSound");
    if (jumpSound) {
        jumpSound.currentTime = 0;
        jumpSound.play().catch(() => {});
    }
}

function updateChargeIndicator(power) {
    const chargeRatio = Math.min((power - MIN_JUMP_POWER) / (MAX_JUMP_POWER - MIN_JUMP_POWER), 1);
    const color = `rgb(${255 * chargeRatio}, ${255 * (1 - chargeRatio)}, 0)`;
    character.style.setProperty('--charge-color', color);
}

// --- INPUT HANDLERS ---
container.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const direction = touchX < container.clientWidth / 2 ? -1 : 1;
    startCharge(direction);
}, { passive: false });

container.addEventListener("touchend", (e) => {
    e.preventDefault();
    releaseJump();
});

window.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            velocityX = -HORIZONTAL_SPEED * (activeEffects.jetpack ? 1.5 : 1);
            break;
        case 'ArrowRight':
            velocityX = HORIZONTAL_SPEED * (activeEffects.jetpack ? 1.5 : 1);
            break;
        case 'ArrowUp':
        case ' ':
            if (!isJumping && !isCharging) {
                startCharge(0);
            }
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            if (velocityX < 0) velocityX = 0;
            break;
        case 'ArrowRight':
            if (velocityX > 0) velocityX = 0;
            break;
        case 'ArrowUp':
        case ' ':
            releaseJump();
            break;
    }
});

// Mobile controls
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');

leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    velocityX = -HORIZONTAL_SPEED * (activeEffects.jetpack ? 1.5 : 1);
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    velocityX = HORIZONTAL_SPEED * (activeEffects.jetpack ? 1.5 : 1);
});

leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (velocityX < 0) velocityX = 0;
});

rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (velocityX > 0) velocityX = 0;
});

jumpBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!isCharging) startCharge(0);
});

jumpBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    releaseJump();
});

// Mouse controls
leftBtn.addEventListener('mousedown', () => {
    velocityX = -HORIZONTAL_SPEED * (activeEffects.jetpack ? 1.5 : 1);
});

rightBtn.addEventListener('mousedown', () => {
    velocityX = HORIZONTAL_SPEED * (activeEffects.jetpack ? 1.5 : 1);
});

jumpBtn.addEventListener('mousedown', () => {
    if (!isCharging) startCharge(0);
});

[leftBtn, rightBtn, jumpBtn].forEach(btn => {
    btn.addEventListener('mouseup', releaseJump);
    btn.addEventListener('mouseleave', releaseJump);
});

// --- COLLISION & PHYSICS ---
function checkCollisions() {
    // Check brick collisions
    for (const brick of bricks) {
        const brickTop = brick.offsetTop;
        const brickLeft = brick.offsetLeft;

        if (
            velocityY > 0 &&
            positionY + CHARACTER_HEIGHT >= brickTop &&
            positionY + CHARACTER_HEIGHT <= brickTop + BRICK_HEIGHT &&
            positionX + CHARACTER_WIDTH > brickLeft &&
            positionX < brickLeft + BRICK_WIDTH
        ) {
            positionY = brickTop - CHARACTER_HEIGHT;
            velocityY = 0;
            isJumping = false;
            velocityX *= GROUND_FRICTION;
            if (Math.abs(velocityX) < 0.1) velocityX = 0;

            const landSound = document.getElementById("landSound");
            if (landSound) {
                landSound.currentTime = 0;
                landSound.play().catch(() => {});
            }
            return;
        }
    }

    // Check power-up collection
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        if (
            positionY + CHARACTER_HEIGHT >= p.y &&
            positionY <= p.y + p.height &&
            positionX + CHARACTER_WIDTH >= p.x &&
            positionX <= p.x + p.width
        ) {
            collectPowerUp(p);
            break;
        }
    }

    // Check enemy collisions
    if (!activeEffects.shield) {
        for (const enemy of enemies) {
            if (
                positionY + CHARACTER_HEIGHT >= enemy.y &&
                positionY <= enemy.y + enemy.height &&
                positionX + CHARACTER_WIDTH >= enemy.x &&
                positionX <= enemy.x + enemy.width
            ) {
                handleDamage();
                return;
            }
        }

        // Check spike collisions
        for (const spike of spikes) {
            if (
                positionY + CHARACTER_HEIGHT >= spike.y &&
                positionY <= spike.y + spike.height &&
                positionX + CHARACTER_WIDTH >= spike.x &&
                positionX <= spike.x + spike.width
            ) {
                handleDamage();
                return;
            }
        }
    }

    // Ground collision
    if (positionY >= container.clientHeight - CHARACTER_HEIGHT) {
        positionY = container.clientHeight - CHARACTER_HEIGHT;
        velocityY = 0;
        isJumping = false;
        velocityX *= GROUND_FRICTION;
        if (Math.abs(velocityX) < 0.1) velocityX = 0;

        const landSound = document.getElementById("landSound");
        if (landSound) {
            landSound.currentTime = 0;
            landSound.play().catch(() => {});
        }
    }
}

function collectPowerUp(powerUp) {
    // Remove from DOM and array
    powerUp.element.remove();
    powerUps = powerUps.filter(p => p !== powerUp);

    // Activate effect based on type
    activatePowerUp(powerUp.type);

    // Play power-up sound
    const powerupSound = document.getElementById("powerupSound");
    if (powerupSound) {
        powerupSound.currentTime = 0;
        powerupSound.play().catch(() => {});
    }
}

function activatePowerUp(type) {
    // Clear existing timer if reactivating
    if (effectTimers[type]) {
        clearTimeout(effectTimers[type]);
    }

    activeEffects[type] = true;
    character.classList.add(`${type}-active`);

    // Show status indicator
    const statusElements = {
        jetpack: jetpackStatus,
        shield: shieldStatus,
        superJump: superJumpStatus
    };
    
    const durations = {
        jetpack: JETPACK_DURATION,
        shield: SHIELD_DURATION,
        superJump: SUPERJUMP_DURATION
    };

    const statusEl = statusElements[type];
    statusEl.classList.remove('hidden');
    
    // Update timer display
    let timeLeft = durations[type] / 1000;
    const timerEl = statusEl.querySelector('.timer');
    timerEl.textContent = timeLeft + 's';
    
    const countdownInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft + 's';
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);

    // Set deactivation timer
    effectTimers[type] = setTimeout(() => {
        activeEffects[type] = false;
        character.classList.remove(`${type}-active`);
        statusEl.classList.add('hidden');
        effectTimers[type] = null;
    }, durations[type]);
}

function handleDamage() {
    // Flash effect
    character.classList.add('damaged');
    setTimeout(() => character.classList.remove('damaged'), 500);

    // Play hit sound
    const hitSound = document.getElementById("hitSound");
    if (hitSound) {
        hitSound.currentTime = 0;
        hitSound.play().catch(() => {});
    }

    // Knockback
    velocityY = -10;
    velocityX = (Math.random() - 0.5) * 10;
}

function updateEnemies() {
    enemies.forEach(enemy => {
        // Move enemy back and forth
        enemy.x += ENEMY_SPEED * enemy.direction;
        
        // Reverse direction at range limits
        if (Math.abs(enemy.x - enemy.startX) > enemy.range) {
            enemy.direction *= -1;
        }
        
        enemy.element.style.left = enemy.x + 'px';
    });
}

function updateMovingPlatforms() {
    movingPlatforms.forEach(platform => {
        // Move platform
        platform.x += PLATFORM_SPEED * platform.direction;
        
        // Reverse at limits
        if (Math.abs(platform.x - platform.startX) > platform.range) {
            platform.direction *= -1;
        }
        
        platform.element.style.left = platform.x + 'px';
    });
}

function endGame() {
    gameState = 'gameOver';
    finalScoreDisplay.textContent = `Your Score: ${score}`;
    gameOverScreen.style.display = 'flex';
    
    const bgm = document.getElementById("bgm");
    if (bgm) bgm.pause();
}

// --- MAIN GAME LOOP ---
function gameLoop() {
    if (gameState !== 'playing') return;

    // Apply gravity (reduced if jetpack active)
    const gravityMultiplier = activeEffects.jetpack ? 0.6 : 1;
    velocityY += GRAVITY * gravityMultiplier;

    // Update position
    positionX += velocityX;
    positionY += velocityY;

    // Wall bounces
    if (positionX < 0) {
        positionX = 0;
        velocityX *= -WALL_BOUNCE_DAMPING;
    } else if (positionX > container.clientWidth - CHARACTER_WIDTH) {
        positionX = container.clientWidth - CHARACTER_WIDTH;
        velocityX *= -WALL_BOUNCE_DAMPING;
    }

    checkCollisions();
    updateEnemies();
    updateMovingPlatforms();

    // Vertical scrolling
    if (positionY < SCROLL_THRESHOLD_TOP) {
        const scrollAmount = SCROLL_THRESHOLD_TOP - positionY;
        positionY += scrollAmount;
        
        // Scroll all elements
        bricks.forEach(brick => {
            brick.style.top = (brick.offsetTop + scrollAmount) + "px";
        });

        powerUps.forEach(p => {
            p.y += scrollAmount;
            p.element.style.top = p.y + "px";
        });

        enemies.forEach(e => {
            e.y += scrollAmount;
            e.startX = e.x; // Reset patrol center
            e.element.style.top = e.y + "px";
        });

        spikes.forEach(s => {
            s.y += scrollAmount;
            s.element.style.top = s.y + "px";
        });

        movingPlatforms.forEach(mp => {
            mp.y += scrollAmount;
            mp.startX = mp.x;
            mp.element.style.top = mp.y + "px";
        });
        
        highestY -= scrollAmount;
    }

    // Update score
    const currentHeight = Math.floor((highestY - positionY) / 10);
    if (currentHeight > score) {
        score = currentHeight;
        scoreDisplay.textContent = "Score: " + score;
    }

    // Update character position
    character.style.left = positionX + "px";
    character.style.top = positionY + "px";

    // Recycle off-screen elements
    bricks.forEach(brick => {
        if (brick.offsetTop > container.clientHeight) {
            const newX = Math.random() * (container.clientWidth - BRICK_WIDTH);
            const newY = brick.offsetTop - container.clientHeight - 300;
            brick.style.left = newX + 'px';
            brick.style.top = newY + 'px';

            // Randomly add new obstacles/power-ups
            const rand = Math.random();
            if (rand < 0.1) {
                const powerupType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
                createPowerUp(newX + BRICK_WIDTH/2 - 20, newY - 45, powerupType);
            } else if (rand < 0.2) {
                createEnemy(newX + BRICK_WIDTH/2 - 15, newY - 35);
            } else if (rand < 0.28) {
                createSpike(newX + 10, newY - 20);
            }
        }
    });

    // Clean up off-screen objects
    powerUps = powerUps.filter(p => {
        if (p.y > container.clientHeight) {
            p.element.remove();
            return false;
        }
        return true;
    });

    enemies = enemies.filter(e => {
        if (e.y > container.clientHeight) {
            e.element.remove();
            return false;
        }
        return true;
    });

    spikes = spikes.filter(s => {
        if (s.y > container.clientHeight) {
            s.element.remove();
            return false;
        }
        return true;
    });

    // Game Over condition
    if (positionY > container.clientHeight) {
        endGame();
    }

    requestAnimationFrame(gameLoop);
}

// --- INITIALIZATION ---
restartButton.addEventListener('click', resetGame);
