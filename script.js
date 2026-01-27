// State Game
const ROWS = 8;
const COLS = 8;
let board = [];
let currentPlayer = 1; // 1 = Hitam, 2 = Putih
let player1Name = "Pemain 1";
let player2Name = "Pemain 2";
let gameOver = false;

// Timer State
let useTimer = false;
let timePerTurn = 30;
let timeLeft = 30;
let timerInterval = null;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const boardElement = document.getElementById('board');
const scoreBlackEl = document.getElementById('score-black');
const scoreWhiteEl = document.getElementById('score-white');
const messageArea = document.getElementById('message-area');
const winnerModal = document.getElementById('winner-modal');
const winnerText = document.getElementById('winner-text');
const winnerTitle = document.getElementById('winner-title');
const finalScoreBlack = document.getElementById('final-score-black');
const finalScoreWhite = document.getElementById('final-score-white');
const p1NameDisplay = document.getElementById('p1-name');
const p2NameDisplay = document.getElementById('p2-name');

// Timer Elements
const timerToggle = document.getElementById('timer-toggle');
const timerSettings = document.getElementById('timer-settings');
const timeInput = document.getElementById('time-per-turn');
const timerBlackEl = document.getElementById('timer-black');
const timerWhiteEl = document.getElementById('timer-white');

// --- Event Listeners ---

// Toggle Timer Settings
timerToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        timerSettings.classList.remove('hidden');
    } else {
        timerSettings.classList.add('hidden');
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    player1Name = document.getElementById('player1').value || "Hitam";
    player2Name = document.getElementById('player2').value || "Putih";
    
    useTimer = timerToggle.checked;
    timePerTurn = parseInt(timeInput.value) || 30;

    p1NameDisplay.textContent = player1Name;
    p2NameDisplay.textContent = player2Name;
    
    // Setup Timer UI Visibility
    if (useTimer) {
        timerBlackEl.classList.remove('hidden');
        timerWhiteEl.classList.remove('hidden');
    } else {
        timerBlackEl.classList.add('hidden');
        timerWhiteEl.classList.add('hidden');
    }

    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // Animasi masuk layar game
    setTimeout(() => {
        gameScreen.style.opacity = 1;
        gameScreen.style.transform = 'translateY(0)';
    }, 100);

    initGame();
});

document.getElementById('restart-btn').addEventListener('click', initGame);
document.getElementById('modal-restart-btn').addEventListener('click', () => {
    winnerModal.classList.add('hidden');
    removeConfetti();
    initGame();
});

document.getElementById('menu-btn').addEventListener('click', () => {
    clearInterval(timerInterval);
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    winnerModal.classList.add('hidden');
    removeConfetti();
});

// --- Game Logic ---

function initGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    currentPlayer = 1; // Hitam jalan duluan
    gameOver = false;
    
    // Setup awal Othello
    board[3][3] = 2;
    board[3][4] = 1;
    board[4][3] = 1;
    board[4][4] = 2;
    
    updateUI();
    if (useTimer) startTimer();
}

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

function isValidMove(row, col, player) {
    if (board[row][col] !== 0) return false;
    
    const opponent = player === 1 ? 2 : 1;
    
    for (let [dr, dc] of DIRECTIONS) {
        let r = row + dr;
        let c = col + dc;
        let hasOpponent = false;
        
        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === opponent) {
            r += dr;
            c += dc;
            hasOpponent = true;
        }
        
        if (hasOpponent && r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
            return true;
        }
    }
    return false;
}

function getValidMoves(player) {
    const moves = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (isValidMove(r, c, player)) {
                moves.push({r, c});
            }
        }
    }
    return moves;
}

function makeMove(row, col) {
    if (gameOver) return;
    if (!isValidMove(row, col, currentPlayer)) return;
    
    // Stop timer sementara animasi jalan (opsional, tapi lebih adil)
    if (useTimer) clearInterval(timerInterval);

    board[row][col] = currentPlayer;
    const opponent = currentPlayer === 1 ? 2 : 1;
    
    // Balik kepingan lawan
    for (let [dr, dc] of DIRECTIONS) {
        let r = row + dr;
        let c = col + dc;
        let piecesToFlip = [];
        
        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === opponent) {
            piecesToFlip.push({r, c});
            r += dr;
            c += dc;
        }
        
        if (piecesToFlip.length > 0 && r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === currentPlayer) {
            for (let p of piecesToFlip) {
                board[p.r][p.c] = currentPlayer;
                
                // Trigger animasi flip di DOM jika perlu
                // (Saat renderBoard dipanggil ulang, class baru akan handle animasi)
            }
        }
    }
    
    switchTurn();
}

// function switchTurn() di-override di bawah (agar tidak duplikat, saya hapus yang lama)
// function switchTurn() { ... } 
// Logic switchTurn yang baru ada di bawah handleTimeOut

// --- Timer Logic ---

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = timePerTurn;
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeOut();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const activeTimerEl = currentPlayer === 1 ? timerBlackEl : timerWhiteEl;
    const inactiveTimerEl = currentPlayer === 1 ? timerWhiteEl : timerBlackEl;
    
    activeTimerEl.textContent = `${timeLeft}s`;
    inactiveTimerEl.textContent = `${timePerTurn}s`; // Reset tampilan lawan
    
    // Visual warning
    if (timeLeft <= 10) {
        activeTimerEl.classList.add('low-time');
    } else {
        activeTimerEl.classList.remove('low-time');
    }
    inactiveTimerEl.classList.remove('low-time');
}

function handleTimeOut() {
    // Jangan game over, tapi skip giliran
    if (gameOver) return;

    // Tampilkan notifikasi
    const skippedPlayer = currentPlayer === 1 ? player1Name : player2Name;
    const msg = document.createElement('div');
    msg.textContent = `Waktu Habis! Giliran ${skippedPlayer} dilewatkan.`;
    msg.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(214, 48, 49, 0.9);
        color: white;
        padding: 15px 30px;
        border-radius: 50px;
        z-index: 1000;
        font-weight: bold;
        animation: fadeOut 2.5s forwards;
    `;
    document.body.appendChild(msg);
    
    setTimeout(() => {
        if (msg) msg.remove();
    }, 2500);

    // Ganti giliran
    switchTurn(true); // true menandakan force switch karena timeout
}

// Update switchTurn untuk menangani logika skip
function switchTurn(isTimeout = false) {
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    const validMovesNext = getValidMoves(nextPlayer);
    
    // Logika normal: Cek apakah pemain berikutnya punya langkah
    if (validMovesNext.length > 0) {
        currentPlayer = nextPlayer;
    } else {
        // Jika pemain berikutnya tidak punya langkah
        const validMovesCurrent = getValidMoves(currentPlayer);
        
        if (validMovesCurrent.length === 0) {
            // Keduanya tidak punya langkah -> Game Over
            endGame();
            return;
        } else {
            // Pemain berikutnya pass, giliran balik lagi
            if (!isTimeout) {
                alert(`${nextPlayer === 1 ? player1Name : player2Name} tidak memiliki langkah valid! Giliran tetap pada ${currentPlayer === 1 ? player1Name : player2Name}.`);
            } else {
                // Jika timeout dan next player juga ga bisa jalan, ya balik lagi (tapi jarang terjadi bersamaan)
                // Biarkan logika UI update menangani
            }
            // currentPlayer tidak berubah
        }
    }
    
    updateUI();
    if (useTimer && !gameOver) startTimer();
}


function updateScores() {
    let blackCount = 0;
    let whiteCount = 0;
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === 1) blackCount++;
            else if (board[r][c] === 2) whiteCount++;
        }
    }
    
    scoreBlackEl.textContent = blackCount;
    scoreWhiteEl.textContent = whiteCount;
    
    return { black: blackCount, white: whiteCount };
}

// --- Rendering UI ---

function updateUI() {
    renderBoard();
    updateScores();
    updateActivePlayer();
}

function updateActivePlayer() {
    const cardBlack = document.getElementById('card-black');
    const cardWhite = document.getElementById('card-white');
    
    if (currentPlayer === 1) {
        cardBlack.classList.add('active');
        cardWhite.classList.remove('active');
        messageArea.textContent = `Giliran: ${player1Name}`;
    } else {
        cardWhite.classList.add('active');
        cardBlack.classList.remove('active');
        messageArea.textContent = `Giliran: ${player2Name}`;
    }
}

function renderBoard() {
    boardElement.innerHTML = '';
    const validMoves = getValidMoves(currentPlayer);
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            const isValid = validMoves.some(m => m.r === r && m.c === c);
            if (isValid && !gameOver) {
                cell.classList.add('valid-move');
                cell.addEventListener('click', () => makeMove(r, c));
            }
            
            if (board[r][c] !== 0) {
                const piece = document.createElement('div');
                piece.classList.add('piece');
                piece.classList.add(board[r][c] === 1 ? 'black' : 'white');
                cell.appendChild(piece);
            }
            
            boardElement.appendChild(cell);
        }
    }
}

function endGame() {
    gameOver = true;
    clearInterval(timerInterval);
    
    const scores = updateScores();
    let winner = "";
    
    if (scores.black > scores.white) {
        winner = `${player1Name} Menang!`;
        startConfetti();
    } else if (scores.white > scores.black) {
        winner = `${player2Name} Menang!`;
        startConfetti();
    } else {
        winner = "Seri!";
    }
    
    winnerTitle.textContent = "Permainan Selesai!";
    winnerText.textContent = winner;
    finalScoreBlack.textContent = scores.black;
    finalScoreWhite.textContent = scores.white;
    
    winnerModal.classList.remove('hidden');
}

// --- Confetti Effect ---
let confettiInterval;

function startConfetti() {
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        document.body.appendChild(canvas);
    }
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const colors = ['#6c5ce7', '#a29bfe', '#fdcb6e', '#00b894', '#ff7675'];
    
    for (let i = 0; i < 300; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 10 + 5,
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 2 - 1,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5
        });
    }
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            ctx.save();
            ctx.translate(p.x + p.size/2, p.y + p.size/2);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            ctx.restore();
            
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;
            
            if (p.y > canvas.height) {
                p.y = -p.size;
                p.x = Math.random() * canvas.width;
            }
        });
    }
    
    confettiInterval = setInterval(() => requestAnimationFrame(draw), 20);
    setTimeout(removeConfetti, 6000);
}

function removeConfetti() {
    clearInterval(confettiInterval);
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
        canvas.remove();
    }
}
