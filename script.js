// Simple Chess Game Script for TraChess
// Mobile-friendly with touch support

const chessboard = document.getElementById('chessboard');
const statusDisplay = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');

// Piece Unicode
const pieces = {
    wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
    bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
};

// Initial positions (FEN-like 2D array)
const initialBoard = [
    ['bR','bN','bB','bQ','bK','bB','bN','bR'],
    ['bP','bP','bP','bP','bP','bP','bP','bP'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['wP','wP','wP','wP','wP','wP','wP','wP'],
    ['wR','wN','wB','wQ','wK','wB','wN','wR']
];

let board = [];
let selected = null;
let whiteTurn = true;

function setupBoard() {
    board = initialBoard.map(row => row.slice());
    renderBoard();
    whiteTurn = true;
    selected = null;
    statusDisplay.textContent = "White's turn";
}

function renderBoard() {
    chessboard.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = r;
            square.dataset.col = c;
            if (selected && selected.row === r && selected.col === c) {
                square.classList.add('selected');
            }
            if (board[r][c]) {
                square.textContent = pieces[board[r][c]];
            }
            // Add both click and touch support
            square.addEventListener('click', onSquareClick);
            square.addEventListener('touchend', onSquareClick, {passive: false});
            chessboard.appendChild(square);
        }
    }
}

function onSquareClick(e) {
    // Prevent double firing on mobile
    if (e.type === 'touchend') e.preventDefault();
    const row = parseInt(this.dataset.row);
    const col = parseInt(this.dataset.col);
    const piece = board[row][col];

    if (selected) {
        // Try to move
        if ((row !== selected.row || col !== selected.col) && isLegalMove(selected, {row, col})) {
            board[row][col] = board[selected.row][selected.col];
            board[selected.row][selected.col] = null;
            selected = null;
            whiteTurn = !whiteTurn;
            statusDisplay.textContent = whiteTurn ? "White's turn" : "Black's turn";
        } else {
            // Deselect if invalid
            selected = null;
        }
    } else if (piece && ((whiteTurn && piece[0] === 'w') || (!whiteTurn && piece[0] === 'b'))) {
        // Select piece if it's your turn
        selected = {row, col};
    }
    renderBoard();
}

// Only allows basic piece movement (no check/checkmate, castling, etc.)
function isLegalMove(from, to) {
    const piece = board[from.row][from.col];
    if (!piece) return false;
    const color = piece[0];
    const type = piece[1];
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    const dest = board[to.row][to.col];

    // Block own piece
    if (dest && dest[0] === color) return false;

    switch (type) {
        case 'P': // Pawn
            const dir = color === 'w' ? -1 : 1;
            // Forward move
            if (dc === 0 && dr === dir && !dest) return true;
            // Double move from initial
            if (dc === 0 && dr === 2 * dir && from.row === (color === 'w' ? 6 : 1) && !board[from.row + dir][from.col] && !dest) return true;
            // Capture
            if (Math.abs(dc) === 1 && dr === dir && dest && dest[0] !== color) return true;
            return false;
        case 'N': // Knight
            return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
        case 'B': // Bishop
            if (Math.abs(dr) !== Math.abs(dc)) return false;
            return isPathClear(from, to);
        case 'R': // Rook
            if (dr !== 0 && dc !== 0) return false;
            return isPathClear(from, to);
        case 'Q': // Queen
            if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
                return isPathClear(from, to);
            }
            return false;
        case 'K': // King
            return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
        default:
            return false;
    }
}

function isPathClear(from, to) {
    const dr = Math.sign(to.row - from.row);
    const dc = Math.sign(to.col - from.col);
    let r = from.row + dr;
    let c = from.col + dc;
    while (r !== to.row || c !== to.col) {
        if (board[r][c]) return false;
        r += dr;
        c += dc;
    }
    return true;
}

resetBtn.addEventListener('click', setupBoard);

// Initialize
setupBoard();
