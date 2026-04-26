let flicky = document.querySelector(".flicky");
let babies = document.querySelectorAll(".b1, .b2, .b3, .b4, .b5, .b6, .b7, .b8, .b9");
let pillars = document.querySelectorAll("[class^='pil']");
let gate = document.querySelector(".gate");
let cats = document.querySelectorAll(".cat1, .cat2, .cat3");


const jumpSound = new Audio("sound/jump.wav");
const collectSound = new Audio("sound/collect.wav");
const hitSound = new Audio("sound/hit.wav");





let x = 0;
let y = 0;
let velocityY = 0;
let isJumping = false;

let collected = [];
const totalBabies = babies.length;
let collectedBabies = 0;
let levelWon = false;
let gameStarted = false;
let hasLeftGate = false; 
let currentPlatform = null;
let canJumpFromEdge = false;
let edgeJumpDirection = null;
let lives = 3;
let catData = [];
let catHitCooldown = false;



function getScale() {
  const w = window.innerWidth;

  if (w < 600) return 0.3;
  if (w < 1024) return 0.6;
  if (w < 1500) return 0.7;
  return 0.8; 
}

function updateLivesDisplay() {
  document.getElementById('lives-display').textContent = 'Lives: ' + lives;
}



const scale = getScale();

const moveSpeed = 17 * scale;
const jumpPower = -35 * scale;


const gravity = 1;
const edgeTolerance = 18;

let keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if (e.key === "ArrowUp" && !isJumping && currentPlatform) {
    velocityY = jumpPower;
    isJumping = true;

jumpSound.currentTime = 0;
    jumpSound.play().catch(() => { });



    if (edgeJumpDirection === "right") {
       x += 5 * getScale();
    } else if (edgeJumpDirection === "left") {
      x -= 5 * getScale();
    }

    currentPlatform = null;
    canJumpFromEdge = false;
    edgeJumpDirection = null;
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function isColliding(elA, elB) {
  let rectA = elA.getBoundingClientRect();
  let rectB = elB.getBoundingClientRect();

  return (
    rectA.right > rectB.left &&
    rectA.left < rectB.right &&
    rectA.bottom > rectB.top &&
    rectA.top < rectB.bottom
  );
}

function setFlickyAtGate() {
  if (!gate || !flicky) return;
  const gateRect = gate.getBoundingClientRect();
  const containerRect = flicky.parentElement.getBoundingClientRect();
  const containerHeight = flicky.parentElement.clientHeight;

  x = gateRect.right - containerRect.left + 20; // 20px to the right of gate
  y = containerHeight - flicky.offsetHeight ; // On the ground

  flicky.style.left = x + "px";
  flicky.style.top = y + "px";
  velocityY = 0;
  isJumping = false;
  currentPlatform = "ground"; 
}

function getCatStairBounds(cat) {
  const catCenterX = cat.offsetLeft + cat.offsetWidth / 2;
  const catCenterY = cat.offsetTop + cat.offsetHeight / 2;
  let bestPlatform = null;
  let bestDistance = Infinity;

  pillars.forEach((pil) => {
    const pilCenterX = pil.offsetLeft + pil.offsetWidth / 2;
    const pilCenterY = pil.offsetTop + pil.offsetHeight / 2;
    const dx = pilCenterX - catCenterX;
    const dy = pilCenterY - catCenterY;
    const distance = Math.hypot(dx, dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestPlatform = pil;
    }
  });

  if (!bestPlatform) return null;

const container = cat.parentElement;
const containerRect = container.getBoundingClientRect();

const minX = bestPlatform.getBoundingClientRect().left - containerRect.left + 10;
const maxX = bestPlatform.getBoundingClientRect().right - containerRect.left - cat.offsetWidth - 10;
  return {
    minX: Math.max(0, minX),
    maxX: Math.max(minX, maxX),
  };
}
window.addEventListener("resize", () => {
  clearTimeout(window.resizeTimer);
  window.resizeTimer = setTimeout(() => {
    initializeCats();
  }, 200);
});
function initializeCats() {
  catData = Array.from(cats).map((cat) => {
    const startX = cat.offsetLeft;
    const speed = (3.9 + Math.random()) * getScale();
 
    const bounds = getCatStairBounds(cat);
    const minX = bounds ? bounds.minX : 0;
    const maxX = bounds ? bounds.maxX : cat.parentElement.clientWidth - cat.offsetWidth;
    const clampedX = Math.max(minX, Math.min(startX, maxX));
    const direction = clampedX >= maxX ? -1 : 1;

    cat.style.left = clampedX + "px";

    return {
      el: cat,
      x: clampedX,
      y: cat.offsetTop,
      speed,
      direction,
      minX,
      maxX,
    };
  });
}

function loseLife() {
  if (catHitCooldown) return;
  catHitCooldown = true;

  lives -= 1;

  hitSound.currentTime = 0;
  hitSound.play().catch(() => {});

  updateLivesDisplay();

  if (lives > 0) {

   
    document.getElementById("life-popup").style.display = "flex";

   
    gameStarted = false;

  } else {

  
    gameStarted = false;

    let gameOver = document.getElementById("gameOverText");
    gameOver.style.display = "flex";

    setTimeout(() => {
    }, 2000);
  }
}

function collectBaby(baby) {
  if (baby.classList.contains("collected")) return;

  baby.classList.add("collected");
  baby.style.pointerEvents = "none";

  collectedBabies += 1;

collectSound.currentTime = 0;
collectSound.play().catch(() => {});


  collected.push(baby);

  updateScoreDisplay();



  if (collectedBabies === totalBabies) {
    console.log("All babies collected. Now go to the gate.");
  }
}

function updateScoreDisplay() {
  document.getElementById("score-display").textContent =
    `🐥 ${collectedBabies}/${totalBabies}`
}



function winLevel() {
  if (levelWon) return;
  levelWon = true;

 let progress = parseInt(sessionStorage.getItem("userProgress")) || 1;

if (progress < 2) {
  sessionStorage.setItem("userProgress", 2);
}
  document.getElementById("win-popup").style.display = "flex";
}

function gameLoop() {
  if (!gameStarted || levelWon) return;

  if (keys["ArrowRight"]) x += moveSpeed;
  if (keys["ArrowLeft"]) x -= moveSpeed;

  const container = flicky.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const containerRect = container.getBoundingClientRect();

  if (x < 0) x = 0;
  if (x > containerWidth - flicky.offsetWidth) x = containerWidth - flicky.offsetWidth;

  const prevY = y;
  velocityY += gravity;
  y += velocityY;

  let onPlatform = false;
  currentPlatform = null;
  canJumpFromEdge = false;
  edgeJumpDirection = null;

  pillars.forEach((pil) => {
    let pRect = pil.getBoundingClientRect();
    let pilLeft = pRect.left - containerRect.left;
    let pilRight = pRect.right - containerRect.left;
    let pilTop = pRect.top - containerRect.top;

    let flickyLeft = x;
    let flickyRight = x + flicky.offsetWidth;
    let prevBottom = prevY + flicky.offsetHeight;
    let currentBottom = y + flicky.offsetHeight;

    if (
      velocityY >= 0 &&
      flickyRight > pilLeft &&
      flickyLeft < pilRight &&
      (
        (prevBottom <= pilTop && currentBottom >= pilTop) ||
        currentBottom === pilTop
      )
    ) {
      y = pilTop - flicky.offsetHeight;
      velocityY = 0;
      isJumping = false;
      onPlatform = true;
      currentPlatform = pil;
    }
  });

  if (gate) {
    let gRect = gate.getBoundingClientRect();
    let gateLeft = gRect.left - containerRect.left;
    let gateRight = gRect.right - containerRect.left;
    let gateTop = gRect.top - containerRect.top;

    let flickyLeft = x;
    let flickyRight = x + flicky.offsetWidth;
    let prevBottom = prevY + flicky.offsetHeight;
    let currentBottom = y + flicky.offsetHeight;

    if (
      velocityY >= 0 &&
      flickyRight > gateLeft &&
      flickyLeft < gateRight &&
      (
        (prevBottom <= gateTop && currentBottom >= gateTop) ||
        currentBottom === gateTop
      )
    ) {
      y = gateTop - flicky.offsetHeight;
      velocityY = 0;
      isJumping = false;
      onPlatform = true;
      currentPlatform = gate;
    }
  }

  if (currentPlatform && currentPlatform !== "ground") {
    let pRect = currentPlatform.getBoundingClientRect();
    let pilLeft = pRect.left - containerRect.left;
    let pilRight = pRect.right - containerRect.left;
    let flickyLeft = x;
    let flickyRight = x + flicky.offsetWidth;

    if (Math.abs(flickyLeft - pilLeft) <= edgeTolerance) {
      canJumpFromEdge = true;
      edgeJumpDirection = "right";
    } else if (Math.abs(flickyRight - pilRight) <= edgeTolerance) {
      canJumpFromEdge = true;
      edgeJumpDirection = "left";
    }
  }

  if (!onPlatform && y > containerHeight - flicky.offsetHeight) {
    y = containerHeight - flicky.offsetHeight;
    velocityY = 0;
    isJumping = false;
    onPlatform = true;
    currentPlatform = "ground";
  }

  if (y < 0) {
    y = 0;
    velocityY = 0;
  }

  flicky.style.left = x + "px";
  flicky.style.top = y + "px";

  if (gate && !hasLeftGate) {
    let gateRect = gate.getBoundingClientRect();
    let flickyRect = flicky.getBoundingClientRect();
    let distance = Math.hypot(
      flickyRect.left - gateRect.left,
      flickyRect.top - gateRect.top
    );
    if (distance > 100) {
      hasLeftGate = true;
    }
  }

  catData.forEach((catObj) => {
    catObj.x += catObj.speed * catObj.direction;
    if (catObj.x <= catObj.minX || catObj.x >= catObj.maxX) {
      catObj.direction *= -1;
      catObj.x = Math.max(catObj.minX, Math.min(catObj.x, catObj.maxX));
    }
    catObj.el.style.left = catObj.x + "px";

    if (!catHitCooldown && isColliding(flicky, catObj.el)) {
      loseLife();
    }
  });

  babies.forEach((baby) => {
    if (!baby.classList.contains("collected") && isColliding(flicky, baby)) {
      collectBaby(baby);
    }
  });

  if (!levelWon && hasLeftGate && collectedBabies === totalBabies && gate && isColliding(flicky, gate)) {
    winLevel();
  }

  let prevX = x;
  let prevBabyY = y;

  collected.forEach((baby) => {
    let bx = parseInt(baby.style.left || baby.offsetLeft, 10);
    let by = parseInt(baby.style.top || baby.offsetTop, 10);

    bx += (prevX - bx) * 0.1;
    by += (prevBabyY - by) * 0.1;

    baby.style.left = bx + "px";
    baby.style.top = by + "px";

    prevX = bx;
    prevBabyY = by;
  });

  requestAnimationFrame(gameLoop);
}

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  gameLoop();
}

function startSequence() {
  setFlickyAtGate();
  startGame();
}





document.getElementById("next-level-btn").addEventListener("click", () => {
  window.location.href = "levels.html";
});

document.getElementById("home-btn").addEventListener("click", () => {
  window.location.href = "index.html";
});

document.getElementById("life-ok-btn").addEventListener("click", () => {

  document.getElementById("life-popup").style.display = "none";

  setFlickyAtGate();
  hasLeftGate = false;

  gameStarted = true;
  gameLoop();

  setTimeout(() => {
    catHitCooldown = false;
  }, 800);
});

window.addEventListener("load", () => {
  setFlickyAtGate();
  initializeCats();
  updateLivesDisplay();
  startSequence();
  updateScoreDisplay();
});