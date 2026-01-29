// State Game
const ROWS = 8;
const COLS = 8;
let board = [];
let currentPlayer = 1; // 1 = Hitam, 2 = Putih
let player1Name = "Pemain 1";
let player2Name = "Pemain 2";
let gameOver = false;
let gameMode = 'pvp'; // pvp, pvc

// Statistics State
let gameStats = {
    pvp: { black: 0, white: 0, draw: 0 },
    pvc: { win: 0, loss: 0, draw: 0 },
    online: { win: 0, loss: 0, draw: 0 }
};

// Online State
let peer = null;
let conn = null;
let myPeerId = null;
let isOnlineGame = false;
let onlineSide = 0; // 1 = Black (Host), 2 = White (Joiner)


// Timer State
let useTimer = false;
let timePerTurn = 30;
let timeLeft = 30;
let timerInterval = null;

// Game Settings
let showValidMoves = true;

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

// Mode Selection Elements
const modeBtns = document.querySelectorAll('.mode-btn');
const p2InputWrapper = document.getElementById('p2-input-wrapper');
const player2Input = document.getElementById('player2');
const localInputs = document.getElementById('local-inputs');
const onlineSetup = document.getElementById('online-setup');
const onlinePlayerName = document.getElementById('online-player-name');

// Online Elements
const tabHost = document.getElementById('tab-host');
const tabJoin = document.getElementById('tab-join');
const hostPanel = document.getElementById('host-panel');
const joinPanel = document.getElementById('join-panel');
const myPeerIdInput = document.getElementById('my-peer-id');
const opponentIdInput = document.getElementById('opponent-id');
const copyBtn = document.getElementById('copy-btn');
const connectBtn = document.getElementById('connect-btn');


// History Elements
const historyBtn = document.getElementById('history-btn');
const historyModal = document.getElementById('history-modal');
const closeHistoryBtn = document.getElementById('close-history-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// Timer Elements
const timerToggle = document.getElementById('timer-toggle');
const validMovesToggle = document.getElementById('valid-moves-toggle');
const timerSettings = document.getElementById('timer-settings');
const timeInput = document.getElementById('time-per-turn');
const timerBlackEl = document.getElementById('timer-black');
const timerWhiteEl = document.getElementById('timer-white');

// --- Initialization ---
loadStats();

// --- Event Listeners ---

// Mode Selection
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        modeBtns.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');
        // Set mode
        gameMode = btn.dataset.mode;

        // Update UI based on mode
        const timerWrapper = document.getElementById('timer-toggle').closest('.toggle-wrapper');

        if (gameMode === 'pvc') {
            localInputs.classList.remove('hidden');
            onlineSetup.classList.add('hidden');
            p2InputWrapper.classList.add('hidden');
            player2Input.value = "Komputer";
            timerWrapper.classList.remove('hidden');
        } else if (gameMode === 'online') {
            localInputs.classList.add('hidden');
            onlineSetup.classList.remove('hidden');
            if (!peer) initPeer(); // Init peer when online mode selected
            timerWrapper.classList.add('hidden');
        } else {
            // PVP
            localInputs.classList.remove('hidden');
            onlineSetup.classList.add('hidden');
            p2InputWrapper.classList.remove('hidden');
            if (player2Input.value === "Komputer") player2Input.value = "Pemain 2";
            timerWrapper.classList.remove('hidden');
        }
    });
});

// Toggle Timer Settings
timerToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        timerSettings.classList.remove('hidden');
    } else {
        timerSettings.classList.add('hidden');
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    if (gameMode === 'online') {
        alert("Menunggu koneksi lawan... Game akan mulai otomatis.");
        return;
    }
    startGameSession();
});

function startGameSession() {
    if (gameMode === 'online') {
        isOnlineGame = true;
        useTimer = false;
    } else {
        player1Name = document.getElementById('player1').value || "Hitam";
        player2Name = document.getElementById('player2').value || "Putih";
        isOnlineGame = false;
    }

    if (gameMode === 'pvc') player2Name = "Komputer";

    useTimer = timerToggle.checked;
    showValidMoves = validMovesToggle.checked;

    // Force disable timer for online (double check)
    if (isOnlineGame) useTimer = false;

    timePerTurn = parseInt(timeInput.value) || 30;

    p1NameDisplay.textContent = player1Name;
    p2NameDisplay.textContent = player2Name;

    // Setup UI Visibility
    if (useTimer) {
        timerBlackEl.classList.remove('hidden');
        timerWhiteEl.classList.remove('hidden');
    } else {
        timerBlackEl.classList.add('hidden');
        timerWhiteEl.classList.add('hidden');
        useTimer = false;
    }

    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    // Animasi masuk layar game
    setTimeout(() => {
        gameScreen.style.opacity = 1;
        gameScreen.style.transform = 'translateY(0)';
    }, 100);

    initGame();
}

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
    isOnlineGame = false;
});

// Undo Button

// History Logic
historyBtn.addEventListener('click', () => {
    updateHistoryUI();
    historyModal.classList.remove('hidden');
});

closeHistoryBtn.addEventListener('click', () => {
    historyModal.classList.add('hidden');
});

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat pertandingan?')) {
        resetStats();
    }
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === historyModal) {
        historyModal.classList.add('hidden');
    }
});

// --- Online Logic ---

tabHost.addEventListener('click', () => {
    tabHost.classList.add('active');
    tabJoin.classList.remove('active');
    hostPanel.classList.remove('hidden');
    joinPanel.classList.add('hidden');
});

tabJoin.addEventListener('click', () => {
    tabJoin.classList.add('active');
    tabHost.classList.remove('active');
    joinPanel.classList.remove('hidden');
    hostPanel.classList.add('hidden');
});

copyBtn.addEventListener('click', () => {
    myPeerIdInput.select();
    document.execCommand('copy');
    alert("ID disalin ke clipboard!");
});

connectBtn.addEventListener('click', () => {
    const peerId = opponentIdInput.value;
    if (!peerId) return alert("Masukkan ID teman!");
    connectToPeer(peerId);
});

function initPeer() {
    peer = new Peer();

    peer.on('open', (id) => {
        myPeerId = id;
        myPeerIdInput.value = id;
    });

    peer.on('connection', (connection) => {
        // Someone connected to us (We are Host)
        setupConnection(connection);
        onlineSide = 1; // Host is Black
        alert("Teman terhubung! Anda bermain sebagai Hitam.");
    });

    peer.on('error', (err) => {
        console.error(err);
        alert("Terjadi kesalahan koneksi: " + err.type);
    });
}

function connectToPeer(peerId) {
    const connection = peer.connect(peerId);
    setupConnection(connection);
    onlineSide = 2; // Joiner is White
}

function setupConnection(connection) {
    conn = connection;

    conn.on('open', () => {
        // Connection established
        // Connection established
        if (onlineSide === 2) {
            alert("Terhubung ke Host! Game akan segera mulai...");
            // Send join request with name
            conn.send({ type: 'join', name: onlinePlayerName.value });
        }

        // Update UI to show connected state
        document.querySelector('.status-indicator').innerHTML = "✅ Terhubung!";
    });

    conn.on('data', (data) => {
        handleData(data);
    });

    conn.on('close', () => {
        alert("Koneksi terputus!");
        // Handle disconnection
    });
}

function handleData(data) {
    console.log("Received:", data);

    switch (data.type) {
        case 'move':
            makeMove(data.row, data.col, true); // true = remote move
            break;
        case 'join':
            // Host receives join request
            if (onlineSide === 1) {
                player2Name = data.name;
                player1Name = onlinePlayerName.value; // Ensure my name is set
                // Send welcome back with Host name
                conn.send({ type: 'welcome', name: player1Name });
                // Start Game for Host
                startGameSession();
            }
            break;
        case 'welcome':
            // Joiner receives welcome
            if (onlineSide === 2) {
                player1Name = data.name;
                player2Name = onlinePlayerName.value; // Ensure my name is set
                // Start Game for Joiner
                startGameSession();
            }
            break;
        case 'name':
            // Fallback / Update name mid-game
            if (onlineSide === 1) player2Name = data.name;
            else player1Name = data.name;
            // Update DOM immediately if game is running
            p1NameDisplay.textContent = player1Name;
            p2NameDisplay.textContent = player2Name;
            updateActivePlayer(); // Refresh turn message
            break;
        case 'restart':
            initGame(true);
            break;
    }
}


// --- Game Logic ---

function initGame(isRemoteRestart = false) {
    if (isOnlineGame && !isRemoteRestart && conn) {
        conn.send({ type: 'restart' });
    }

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
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
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
                moves.push({ r, c });
            }
        }
    }
    return moves;
}

function makeMove(row, col, isRemote = false) {
    if (gameOver) return;
    // Prevent player from moving during computer's turn
    if (gameMode === 'pvc' && currentPlayer === 2) return;

    // Prevent moving if not your turn in Online mode
    if (isOnlineGame && !isRemote) {
        if (onlineSide !== currentPlayer) return;
    }

    if (!isValidMove(row, col, currentPlayer)) return;

    // Stop timer sementara animasi jalan (opsional, tapi lebih adil)
    if (useTimer) clearInterval(timerInterval);

    executeMove(row, col);

    if (isOnlineGame && !isRemote) {
        conn.send({
            type: 'move',
            row: row,
            col: col
        });
    }
}

function executeMove(row, col) {
    board[row][col] = currentPlayer;
    const opponent = currentPlayer === 1 ? 2 : 1;

    // Balik kepingan lawan
    for (let [dr, dc] of DIRECTIONS) {
        let r = row + dr;
        let c = col + dc;
        let piecesToFlip = [];

        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === opponent) {
            piecesToFlip.push({ r, c });
            r += dr;
            c += dc;
        }

        if (piecesToFlip.length > 0 && r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === currentPlayer) {
            for (let p of piecesToFlip) {
                board[p.r][p.c] = currentPlayer;
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
                const playerName = nextPlayer === 1 ? player1Name : player2Name;
                const activeName = currentPlayer === 1 ? player1Name : player2Name;

                // Better UI for skip turn
                const msg = document.createElement('div');
                msg.textContent = `${playerName} tidak ada langkah! Giliran ${activeName} lagi.`;
                msg.style.cssText = `
                    position: fixed; top: 20%; left: 50%; transform: translate(-50%, -50%);
                    background: rgba(108, 92, 231, 0.9); color: white; padding: 15px 30px;
                    border-radius: 50px; z-index: 1000; font-weight: bold; animation: fadeOut 2.5s forwards;
                `;
                document.body.appendChild(msg);
                setTimeout(() => { if (msg) msg.remove(); }, 2500);
            }
        }
    }

    updateUI();
    if (useTimer && !gameOver) startTimer();

    // Check for Computer Turn
    if (!gameOver && gameMode === 'pvc' && currentPlayer === 2) {
        // Delay computer move slightly for better UX
        setTimeout(computerMove, 1000);
    }
}

// AI Implementation
function computerMove() {
    if (gameOver || currentPlayer !== 2) return;

    const validMoves = getValidMoves(2);
    if (validMoves.length === 0) return; // Should be handled by switchTurn but just in case

    let bestMove = null;
    let maxScore = -Infinity;

    // Simple Heuristic: Corners > Edges > Mobility
    // Weighted board positions
    const weights = [
        [100, -10, 10, 5, 5, 10, -10, 100],
        [-10, -20, 1, 1, 1, 1, -20, -10],
        [10, 1, 5, 2, 2, 5, 1, 10],
        [5, 1, 2, 1, 1, 2, 1, 5],
        [5, 1, 2, 1, 1, 2, 1, 5],
        [10, 1, 5, 2, 2, 5, 1, 10],
        [-10, -20, 1, 1, 1, 1, -20, -10],
        [100, -10, 10, 5, 5, 10, -10, 100]
    ];

    // Evaluate each move
    for (let move of validMoves) {
        let score = weights[move.r][move.c];

        // Add random factor to make it less predictable/perfect
        score += Math.random() * 5;

        if (score > maxScore) {
            maxScore = score;
            bestMove = move;
        }
    }

    if (bestMove) {
        executeMove(bestMove.r, bestMove.c);
    }
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

        if (isOnlineGame) {
            messageArea.textContent = onlineSide === 1 ? "Giliran Anda (Hitam)" : `Giliran Lawan (${player1Name})`;
        } else {
            messageArea.textContent = `Giliran: ${player1Name}`;
        }
    } else {
        cardWhite.classList.add('active');
        cardBlack.classList.remove('active');

        if (isOnlineGame) {
            messageArea.textContent = onlineSide === 2 ? "Giliran Anda (Putih)" : `Giliran Lawan (${player2Name})`;
        } else {
            messageArea.textContent = `Giliran: ${player2Name}`;
        }
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
                if (showValidMoves) {
                    cell.classList.add('valid-move');
                }
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

    // Update Stats
    updateStats(scores);

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

// --- History & Stats Logic ---

function loadStats() {
    const savedStats = localStorage.getItem('othelloStats');
    if (savedStats) {
        gameStats = JSON.parse(savedStats);
    }
}

function saveStats() {
    localStorage.setItem('othelloStats', JSON.stringify(gameStats));
}

function updateStats(scores) {
    if (gameMode === 'pvp') {
        if (scores.black > scores.white) gameStats.pvp.black++;
        else if (scores.white > scores.black) gameStats.pvp.white++;
        else gameStats.pvp.draw++;
    } else if (gameMode === 'pvc') {
        if (scores.black > scores.white) gameStats.pvc.win++; // Player (Black) wins
        else if (scores.white > scores.black) gameStats.pvc.loss++; // Computer (White) wins
        else gameStats.pvc.draw++;
    } else if (gameMode === 'online') {
        if (onlineSide === 1) { // I am Black
            if (scores.black > scores.white) gameStats.online.win++;
            else if (scores.white > scores.black) gameStats.online.loss++;
            else gameStats.online.draw++;
        } else { // I am White
            if (scores.white > scores.black) gameStats.online.win++;
            else if (scores.black > scores.white) gameStats.online.loss++;
            else gameStats.online.draw++;
        }
    }

    saveStats();
}

function updateHistoryUI() {
    document.getElementById('stats-pvp-black').textContent = gameStats.pvp.black;
    document.getElementById('stats-pvp-white').textContent = gameStats.pvp.white;
    document.getElementById('stats-pvp-draw').textContent = gameStats.pvp.draw;

    document.getElementById('stats-pvc-win').textContent = gameStats.pvc.win;
    document.getElementById('stats-pvc-loss').textContent = gameStats.pvc.loss;
    document.getElementById('stats-pvc-draw').textContent = gameStats.pvc.draw;

    document.getElementById('stats-online-win').textContent = gameStats.online.win;
    document.getElementById('stats-online-loss').textContent = gameStats.online.loss;
    document.getElementById('stats-online-draw').textContent = gameStats.online.draw;
}

function resetStats() {
    gameStats = {
        pvp: { black: 0, white: 0, draw: 0 },
        pvc: { win: 0, loss: 0, draw: 0 },
        online: { win: 0, loss: 0, draw: 0 }
    };
    saveStats();
    updateHistoryUI();
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
            ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
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
