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
    const CHARACTER_WIDTH = 50;
    const CHARACTER_HEIGHT = 50;
    const BRICK_WIDTH = 80;
    const BRICK_HEIGHT = 15;
    const TOTAL_BRICKS = 8;
    const SCROLL_THRESHOLD_TOP = window.innerHeight / 2.5;

    // --- GAME STATE ---
    let positionX, positionY, velocityX, velocityY;
    let isCharging, jumpPower, jumpDirection;
    let isJumping;
    let chargeTimer;
    let score, highestY;
    let bricks = [];
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
        // Create a starting platform
        createBrick(container.clientWidth / 2 - BRICK_WIDTH / 2, container.clientHeight - 50);

        // Create random bricks
        for (let i = 0; i < TOTAL_BRICKS; i++) {
            createBrick(
                Math.random() * (container.clientWidth - BRICK_WIDTH),
                container.clientHeight - 150 - (i * 100)
            );
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
            velocityX = HORIZONTAL_SPEED * jumpDirection;
        } else {
            velocityX = 0; // No horizontal movement for vertical jumps
        }
        
        velocityY = -jumpPower;
        isCharging = false;
        isJumping = true;
        clearInterval(chargeTimer);
        updateChargeIndicator(0);
    }
    
    function updateChargeIndicator(power) {
        const chargeRatio = Math.min((power - MIN_JUMP_POWER) / (MAX_JUMP_POWER - MIN_JUMP_POWER), 1);
        const color = `rgb(${255 * chargeRatio}, ${255 * (1 - chargeRatio)}, 0)`;
        character.style.setProperty('--eye-color', color);
        // A bit of a hack, but direct pseudo-element styling requires CSS variables
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
                velocityX = -HORIZONTAL_SPEED;
                break;
            case 'ArrowRight':
                velocityX = HORIZONTAL_SPEED;
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
        velocityX = -HORIZONTAL_SPEED;
    });

    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        velocityX = HORIZONTAL_SPEED;
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
        velocityX = -HORIZONTAL_SPEED;
    });
    rightBtn.addEventListener('mousedown', () => {
        velocityX = HORIZONTAL_SPEED;
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
            const brickTop = brick.offsetTop;
            const brickLeft = brick.offsetLeft;

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
                velocityX *= GROUND_FRICTION;
                if (Math.abs(velocityX) < 0.1) velocityX = 0;
                return;
            }
        }

        // Check for ground collision
        if (positionY >= container.clientHeight - CHARACTER_HEIGHT) {
            positionY = container.clientHeight - CHARACTER_HEIGHT;
            velocityY = 0;
            isJumping = false;
            velocityX *= GROUND_FRICTION;
            if (Math.abs(velocityX) < 0.1) velocityX = 0;
        }
    }

    function endGame() {
        gameState = 'gameOver';
        finalScoreDisplay.textContent = `Your Score: ${score}`;
        gameOverScreen.style.display = 'flex';
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
                const newTop = brick.offsetTop + scrollAmount;
                brick.style.top = newTop + "px";
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
            if (brick.offsetTop > container.clientHeight) {
                // Move brick to the top, off-screen
                brick.style.left = Math.random() * (container.clientWidth - BRICK_WIDTH) + 'px';
                brick.style.top = (brick.offsetTop - container.clientHeight - 200) + 'px';
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