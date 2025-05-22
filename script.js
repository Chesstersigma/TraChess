// Simple Chess Game Script for TraChess
// Mobile-friendly with touch support
// Now with checkmate detection and opening names display

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

// A basic set of opening names with first moves in SAN
const openings = [
    {moves: ["e4", "e5"], name: "Open Game / Double King's Pawn"},
    {moves: ["e4", "c5"], name: "Sicilian Defence"},
    {moves: ["d4", "d5"], name: "Closed Game / Double Queen's Pawn"},
    {moves: ["d4", "Nf6"], name: "Indian Defence"},
    {moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"], name: "Ruy Lopez"},
    {moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"], name: "Italian Game"},
    {moves: ["e4", "c6"], name: "Caro-Kann Defence"},
    {moves: ["e4", "e6"], name: "French Defence"},
    {moves: ["c4"], name: "English Opening"},
    {moves: ["Nf3"], name: "Zukertort Opening"},
    {moves: ["d4", "d5", "c4"], name: "Queen's Gambit"},
    {moves: ["e4", "d6"], name: "Pirc Defence"}
    // More can be added for detail
];

let board = [];
let selected = null;
let whiteTurn = true;
let moveHistory = []; // Each entry: {from: {row, col}, to: {row, col}, piece: "wP", san: "e4"}
let openingName = "";

function setupBoard() {
    board = initialBoard.map(row => row.slice());
    renderBoard();
    whiteTurn = true;
    selected = null;
    moveHistory = [];
    openingName = "";
    updateStatus();
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
            square.addEventListener('click', onSquareClick);
            square.addEventListener('touchend', onSquareClick, {passive: false});
            chessboard.appendChild(square);
        }
    }
}

function onSquareClick(e) {
    if (e.type === 'touchend') e.preventDefault();
    const row = parseInt(this.dataset.row);
    const col = parseInt(this.dataset.col);
    const piece = board[row][col];

    if (selected) {
        // Try to move
        if ((row !== selected.row || col !== selected.col) && isLegalMove(selected, {row, col})) {
            let san = getSAN(selected, {row, col});
            moveHistory.push({from: {...selected}, to: {row, col}, piece: board[selected.row][selected.col], san});
            board[row][col] = board[selected.row][selected.col];
            board[selected.row][selected.col] = null;
            selected = null;
            whiteTurn = !whiteTurn;
            openingName = getOpeningName();
            renderBoard();
            if (isCheckmate(!whiteTurn)) {
                statusDisplay.innerHTML = (whiteTurn ? "Black" : "White") + " wins by checkmate!" +
                    (openingName ? `<br><span class="opening">Opening: ${openingName}</span>` : "");
            } else if (isStalemate(!whiteTurn)) {
                statusDisplay.innerHTML = "Draw by stalemate." +
                    (openingName ? `<br><span class="opening">Opening: ${openingName}</span>` : "");
            } else {
                updateStatus();
            }
            return;
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

function updateStatus() {
    statusDisplay.innerHTML = (whiteTurn ? "White's turn" : "Black's turn") +
        (openingName ? `<br><span class="opening">Opening: ${openingName}</span>` : "");
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
        case 'P': { // Pawn
            const dir = color === 'w' ? -1 : 1;
            // Forward move
            if (dc === 0 && dr === dir && !dest) return !wouldCauseSelfCheck(from, to);
            // Double move from initial
            if (dc === 0 && dr === 2 * dir && from.row === (color === 'w' ? 6 : 1) && !board[from.row + dir][from.col] && !dest) return !wouldCauseSelfCheck(from, to);
            // Capture
            if (Math.abs(dc) === 1 && dr === dir && dest && dest[0] !== color) return !wouldCauseSelfCheck(from, to);
            return false;
        }
        case 'N': // Knight
            if ((Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2)) {
                return !wouldCauseSelfCheck(from, to);
            }
            return false;
        case 'B': // Bishop
            if (Math.abs(dr) !== Math.abs(dc)) return false;
            return isPathClear(from, to) && !wouldCauseSelfCheck(from, to);
        case 'R': // Rook
            if (dr !== 0 && dc !== 0) return false;
            return isPathClear(from, to) && !wouldCauseSelfCheck(from, to);
        case 'Q': // Queen
            if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
                return isPathClear(from, to) && !wouldCauseSelfCheck(from, to);
            }
            return false;
        case 'K': // King
            if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) {
                // Cannot move to a square attacked by opponent
                if (!wouldCauseSelfCheck(from, to) && !squareAttacked(to, color === 'w' ? 'b' : 'w', board)) {
                    return true;
                }
            }
            return false;
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

// Helper: returns true if move would put own king in check
function wouldCauseSelfCheck(from, to) {
    const backup = {
        from: board[from.row][from.col],
        to: board[to.row][to.col]
    };
    board[to.row][to.col] = board[from.row][from.col];
    board[from.row][from.col] = null;
    const kingSafe = !isKingAttacked(board[to.row][to.col][0], board);
    // Undo move
    board[from.row][from.col] = backup.from;
    board[to.row][to.col] = backup.to;
    return !kingSafe;
}

// Check if the king of given color is attacked
function isKingAttacked(color, boardState) {
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (boardState[r][c] === color + 'K') kingPos = {row: r, col: c};
        }
    }
    if (!kingPos) return false;
    return squareAttacked(kingPos, color === 'w' ? 'b' : 'w', boardState);
}

// Returns true if the square is attacked by the given color
function squareAttacked(target, byColor, boardState) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = boardState[r][c];
            if (!piece || piece[0] !== byColor) continue;
            const from = {row: r, col: c};
            // Use isLegalMove but ignore wouldCauseSelfCheck for opponent
            if (attackingMove(piece, from, target, boardState)) return true;
        }
    }
    return false;
}

// For checkmate/stalemate, test if piece could attack square (ignoring checks for their own king)
function attackingMove(piece, from, to, boardState) {
    const color = piece[0];
    const type = piece[1];
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    const dest = boardState[to.row][to.col];
    switch (type) {
        case 'P': {
            const dir = color === 'w' ? -1 : 1;
            // Pawn attacks diagonally
            return Math.abs(dc) === 1 && dr === dir;
        }
        case 'N':
            return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
        case 'B':
            if (Math.abs(dr) !== Math.abs(dc)) return false;
            return isPathClearBoard(from, to, boardState);
        case 'R':
            if (dr !== 0 && dc !== 0) return false;
            return isPathClearBoard(from, to, boardState);
        case 'Q':
            if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
                return isPathClearBoard(from, to, boardState);
            }
            return false;
        case 'K':
            return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
        default:
            return false;
    }
}

// Like isPathClear, but takes a specific board
function isPathClearBoard(from, to, boardState) {
    const dr = Math.sign(to.row - from.row);
    const dc = Math.sign(to.col - from.col);
    let r = from.row + dr;
    let c = from.col + dc;
    while (r !== to.row || c !== to.col) {
        if (boardState[r][c]) return false;
        r += dr;
        c += dc;
    }
    return true;
}

// Checkmate detection: if current color has no legal moves and is in check
function isCheckmate(forWhite) {
    const color = forWhite ? 'w' : 'b';
    if (!isKingAttacked(color, board)) return false;
    // If any legal move exists for this color, not checkmate
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (!board[r][c] || board[r][c][0] !== color) continue;
            const from = {row: r, col: c};
            for (let rr = 0; rr < 8; rr++) {
                for (let cc = 0; cc < 8; cc++) {
                    const to = {row: rr, col: cc};
                    if (isLegalMoveBasic(from, to, color)) {
                        // Try the move
                        if (!wouldCauseSelfCheck(from, to)) {
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
}

// Stalemate: no legal moves but not in check
function isStalemate(forWhite) {
    const color = forWhite ? 'w' : 'b';
    if (isKingAttacked(color, board)) return false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (!board[r][c] || board[r][c][0] !== color) continue;
            const from = {row: r, col: c};
            for (let rr = 0; rr < 8; rr++) {
                for (let cc = 0; cc < 8; cc++) {
                    const to = {row: rr, col: cc};
                    if (isLegalMoveBasic(from, to, color)) {
                        // Try the move
                        if (!wouldCauseSelfCheck(from, to)) {
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
}

// Basic legality for checkmate search (ignores wouldCauseSelfCheck)
function isLegalMoveBasic(from, to, color) {
    const piece = board[from.row][from.col];
    if (!piece) return false;
    if (piece[0] !== color) return false;
    const type = piece[1];
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    const dest = board[to.row][to.col];
    if (dest && dest[0] === color) return false;
    switch (type) {
        case 'P': {
            const dir = color === 'w' ? -1 : 1;
            if (dc === 0 && dr === dir && !dest) return true;
            if (dc === 0 && dr === 2 * dir && from.row === (color === 'w' ? 6 : 1) && !board[from.row + dir][from.col] && !dest) return true;
            if (Math.abs(dc) === 1 && dr === dir && dest && dest[0] !== color) return true;
            return false;
        }
        case 'N':
            return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
        case 'B':
            if (Math.abs(dr) !== Math.abs(dc)) return false;
            return isPathClear(from, to);
        case 'R':
            if (dr !== 0 && dc !== 0) return false;
            return isPathClear(from, to);
        case 'Q':
            if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
                return isPathClear(from, to);
            }
            return false;
        case 'K':
            return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
        default:
            return false;
    }
}

// Get SAN (simple algebraic notation, not full)
function getSAN(from, to) {
    const piece = board[from.row][from.col];
    if (!piece) return "";
    const type = piece[1] === 'P' ? '' : piece[1];
    const file = String.fromCharCode(97 + to.col);
    const rank = (8 - to.row).toString();
    return type + file + rank;
}

// Get moves as SAN strings and match to opening
function getOpeningName() {
    let moves = [];
    for (let i = 0; i < moveHistory.length; ++i) {
        moves.push(moveHistory[i].san);
    }
    for (let i = 0; i < openings.length; ++i) {
        const op = openings[i];
        let ok = true;
        for (let j = 0; j < op.moves.length; ++j) {
            if (moves[j] !== op.moves[j]) {
                ok = false;
                break;
            }
        }
        if (ok) return op.name;
    }
    return "";
}

resetBtn.addEventListener('click', setupBoard);

// Initialize
setupBoard();
