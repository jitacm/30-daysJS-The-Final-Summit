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

// --- GAME CONSTANTS ---
const GRAVITY = 0.8;
const MAX_JUMP_POWER = 22;
const MIN_JUMP_POWER = 6;
const CHARGE_SPEED = 1.5;
const HORIZONTAL_SPEED = 7;
const WALL_BOUNCE_DAMPING = 0.5;
const GROUND_FRICTION = 0.1;
const ICE_FRICTION = 0.01; // Much lower friction
const CHARACTER_WIDTH = 50;
const CHARACTER_HEIGHT = 50;
const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 15;
const TOTAL_BRICKS = 8;
const SCROLL_THRESHOLD_TOP = window.innerHeight / 2.5;
const ICE_PLATFORM_CHANCE = 0.2; // 20% chance
const POWERUP_CHANCE = 0.2; // 20% chance for a brick to be a power-up
const JETPACK_DURATION = 5000; // 5 seconds

// --- GAME STATE ---
let positionX, positionY, velocityX, velocityY;
let isCharging, jumpPower, jumpDirection;
let isJumping;
let chargeTimer;
let score, highestY;
let bricks = [];
let powerUps = [];
let isJetpackActive = false;
let jetpackTimer = null;
let gameState = 'playing'; // 'playing' or 'gameOver'

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

    // Reset power-up state
    if (jetpackTimer) {
        clearTimeout(jetpackTimer);
        jetpackTimer = null;
    }
    isJetpackActive = false;
    character.classList.remove('jetpack-active');
    powerUps.forEach(p => p.element.remove());
    powerUps = [];

    // Reset display
    scoreDisplay.textContent = "Score: 0";
    character.style.left = positionX + "px";
    character.style.top = positionY + "px";
    updateChargeIndicator(0);

    // Hide game over screen
    gameOverScreen.style.display = 'none';

    // Clear existing bricks and create new ones
    bricks.forEach(brick => {
        if (brick.element) {
            brick.element.remove();
        } else {
            brick.remove();
        }
    });
    bricks = [];
    createInitialBricks();

    // Start game
    gameState = 'playing';
    requestAnimationFrame(gameLoop);
}

function createInitialBricks() {
    // Create a starting platform
    createBrick(container.clientWidth / 2 - BRICK_WIDTH / 2, container.clientHeight - 50, 'normal');

    // Create random bricks, some ice, some power-up
    for (let i = 0; i < TOTAL_BRICKS; i++) {
        const x = Math.random() * (container.clientWidth - BRICK_WIDTH);
        const y = container.clientHeight - 150 - (i * 100);

        // Decide if brick is ice
        if (Math.random() < ICE_PLATFORM_CHANCE) {
            createBrick(x, y, 'ice');
        } else if (Math.random() < POWERUP_CHANCE) {
            createPowerUp(x, y);
        } else {
            createBrick(x, y, 'normal');
        }
    }
}

// Brick structure: { element, x, y, width, height, type }
function createBrick(x, y, type = 'normal') {
    const brick = document.createElement("div");
    brick.className = `brick ${type}-platform`;
    brick.style.left = x + "px";
    brick.style.top = y + "px";
    container.appendChild(brick);
    bricks.push({ element: brick, x, y, width: BRICK_WIDTH, height: BRICK_HEIGHT, type });
}

function createPowerUp(x, y) {
    const powerUp = document.createElement("div");
    powerUp.className = "powerup jetpack";
    powerUp.style.left = x + "px";
    powerUp.style.top = y + "px";
    container.appendChild(powerUp);

    powerUps.push({
        x, y,
        width: 40,
        height: 40,
        element: powerUp
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

    // Only set horizontal velocity if there's a jump direction
    if (jumpDirection !== 0) {
        velocityX = (isJetpackActive ? HORIZONTAL_SPEED * 1.5 : HORIZONTAL_SPEED) * jumpDirection;
    } else {
        velocityX = 0; // No horizontal movement for vertical jumps
    }
    
    const effectiveJumpPower = isJetpackActive ? MAX_JUMP_POWER * 1.3 : jumpPower;
    velocityY = -effectiveJumpPower;
    isCharging = false;
    isJumping = true;
    clearInterval(chargeTimer);
    updateChargeIndicator(0);

    // 🎵 Play jump sound if present
    const jumpSound = document.getElementById("jumpSound");
    if (jumpSound) {
        jumpSound.currentTime = 0;
        jumpSound.play().catch(() => {});
    }
}

function updateChargeIndicator(power) {
    const chargeRatio = Math.min((power - MIN_JUMP_POWER) / (MAX_JUMP_POWER - MIN_JUMP_POWER), 1);
    const color = `rgb(${255 * chargeRatio}, ${255 * (1 - chargeRatio)}, 0)`;
    character.style.setProperty('--eye-color', color);
    character.style.background = `
        conic-gradient(from 90deg, var(--eye-color, #292A37), var(--eye-color, #292A37)),
        conic-gradient(from 90deg, var(--eye-color, #292A37), var(--eye-color, #292A37)),
        conic-gradient(ghostwhite, ghostwhite)`;
    character.style.backgroundSize = '7px 15px, 7px 15px, 50px 50px';
    character.style.backgroundPosition = '12px 10px, 31px 10px, 0 0';
    character.style.backgroundRepeat = 'no-repeat';
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
            velocityX = -HORIZONTAL_SPEED * (isJetpackActive ? 1.5 : 1);
            break;
        case 'ArrowRight':
            velocityX = HORIZONTAL_SPEED * (isJetpackActive ? 1.5 : 1);
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

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');

// Touch controls
leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    velocityX = -HORIZONTAL_SPEED * (isJetpackActive ? 1.5 : 1);
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    velocityX = HORIZONTAL_SPEED * (isJetpackActive ? 1.5 : 1);
});

leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (velocityX < 0) velocityX = 0;
});

rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (velocityX > 0) velocityX = 0;
});

// Mouse controls
leftBtn.addEventListener('mousedown', () => {
    velocityX = -HORIZONTAL_SPEED * (isJetpackActive ? 1.5 : 1);
});
rightBtn.addEventListener('mousedown', () => {
    velocityX = HORIZONTAL_SPEED * (isJetpackActive ? 1.5 : 1);
});
jumpBtn.addEventListener('mousedown', () => {
    if (!isCharging) {
        startCharge(0); // Vertical-only jump for the jump button
    }
});
[leftBtn, rightBtn, jumpBtn].forEach(btn => {
    btn.addEventListener('mouseup', releaseJump);
    btn.addEventListener('mouseleave', releaseJump);
});

// --- COLLISION & PHYSICS ---
function checkCollisions() {
    // Check for landing on bricks
    for (const brick of bricks) {
        const brickTop = brick.element.offsetTop;
        const brickLeft = brick.element.offsetLeft;

        if (
            velocityY > 0 && // Moving down
            positionY + CHARACTER_HEIGHT >= brickTop &&
            positionY + CHARACTER_HEIGHT <= brickTop + BRICK_HEIGHT &&
            positionX + CHARACTER_WIDTH > brickLeft &&
            positionX < brickLeft + BRICK_WIDTH
        ) {
            positionY = brickTop - CHARACTER_HEIGHT;
            velocityY = 0;
            isJumping = false;

            // Apply friction based on platform type
            if (brick.type === 'ice') {
                velocityX *= ICE_FRICTION;
            } else {
                velocityX *= GROUND_FRICTION;
            }

            if (Math.abs(velocityX) < 0.1) velocityX = 0;

            // 🎵 Play land sound if present
            const landSound = document.getElementById("landSound");
            if (landSound) {
                landSound.currentTime = 0;
                landSound.play().catch(() => {});
            }

            return;
        }
    }

    // Check for power-up collection
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

    // Check for ground collision
    if (positionY >= container.clientHeight - CHARACTER_HEIGHT) {
        positionY = container.clientHeight - CHARACTER_HEIGHT;
        velocityY = 0;
        isJumping = false;
        velocityX *= GROUND_FRICTION;
        if (Math.abs(velocityX) < 0.1) velocityX = 0;

        // 🎵 Play land sound if present
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

    // Activate jetpack
    isJetpackActive = true;
    character.classList.add('jetpack-active');

    // Visual timer feedback (optional: you could add a UI bar)
    if (jetpackTimer) clearTimeout(jetpackTimer);
    jetpackTimer = setTimeout(() => {
        isJetpackActive = false;
        character.classList.remove('jetpack-active');
        jetpackTimer = null;
        // Respawn power-up somewhere above
        const newX = Math.random() * (container.clientWidth - BRICK_WIDTH);
        const newY = container.clientHeight - 1000 - Math.random() * 500;
        createPowerUp(newX, newY);
    }, JETPACK_DURATION);
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

    // Apply gravity
    velocityY += GRAVITY;

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

    // Vertical scrolling
    if (positionY < SCROLL_THRESHOLD_TOP) {
        const scrollAmount = SCROLL_THRESHOLD_TOP - positionY;
        positionY += scrollAmount;
        
        // Move bricks down
        bricks.forEach(brick => {
            const newTop = brick.element.offsetTop + scrollAmount;
            brick.element.style.top = newTop + "px";
            brick.y = newTop;
        });

        // Move power-ups down
        powerUps.forEach(p => {
            p.y += scrollAmount;
            p.element.style.top = p.y + "px";
        });
        
        highestY -= scrollAmount;
    }

    // Update score based on highest point reached
    const currentHeight = Math.floor((highestY - positionY) / 10);
    if (currentHeight > score) {
        score = currentHeight;
        scoreDisplay.textContent = "Score: " + score;
    }

    // Update character position
    character.style.left = positionX + "px";
    character.style.top = positionY + "px";

    // Recycle bricks
    bricks.forEach(brick => {
        if (brick.element.offsetTop > container.clientHeight) {
            // Move brick to the top, off-screen
            const newX = Math.random() * (container.clientWidth - BRICK_WIDTH);
            const newY = brick.element.offsetTop - container.clientHeight - 200;
            brick.element.style.left = newX + 'px';
            brick.element.style.top = newY + 'px';
            brick.x = newX;
            brick.y = newY;

            // Possibly turn it into a power-up
            if (Math.random() < POWERUP_CHANCE) {
                createPowerUp(newX, newY);
            }
        }
    });

    // Recycle off-screen power-ups
    powerUps.forEach((p, i) => {
        if (p.y > container.clientHeight) {
            p.element.remove();
            powerUps.splice(i, 1);
        }
    });

    // Game Over condition
    if (positionY > container.clientHeight) {
        endGame();
    }

    requestAnimationFrame(gameLoop);
}

// --- INITIALIZATION ---
restartButton.addEventListener('click', resetGame);
resetGame();