document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    let draggedPiece = null;

    // Unicode Chess Pieces
    const pieces = {
        'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
        'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
    };

    // Initial board setup (FEN string for starting position, simplified)
    const initialBoard = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];

    // Create the chessboard squares
    for (let i = 0; i < 8; i++) { // Rows
        for (let j = 0; j < 8; j++) { // Columns
            const square = document.createElement('div');
            square.classList.add('square');

            // Determine square color
            if ((i + j) % 2 === 0) {
                square.classList.add('light-square');
            } else {
                square.classList.add('dark-square');
            }

            // Add piece if it exists in the initial board setup
            const pieceChar = initialBoard[i][j];
            if (pieceChar) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece');
                pieceElement.textContent = pieces[pieceChar];
                pieceElement.draggable = true; // Make pieces draggable
                pieceElement.dataset.row = i; // Store original row
                pieceElement.dataset.col = j; // Store original col
                square.appendChild(pieceElement);

                // Add data to the square for potential drops
                square.dataset.row = i;
                square.dataset.col = j;
            }

            chessboard.appendChild(square);
        }
    }

    // Drag and Drop Logic
    chessboard.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('piece')) {
            draggedPiece = e.target;
            setTimeout(() => {
                draggedPiece.classList.add('dragging');
            }, 0); // Add a slight delay to allow CSS to apply
        }
    });

    chessboard.addEventListener('dragend', () => {
        if (draggedPiece) {
            draggedPiece.classList.remove('dragging');
            draggedPiece = null;
        }
    });

    chessboard.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
    });

    chessboard.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedPiece) return;

        const targetSquare = e.target.closest('.square'); // Get the square being dropped on
        if (targetSquare) {
            // If the target square already has a piece, handle it (e.g., capture)
            // For this basic example, we'll just move the piece
            if (targetSquare.querySelector('.piece')) {
                // Simple "capture" by replacing the piece (no actual game logic)
                targetSquare.querySelector('.piece').remove();
            }
            targetSquare.appendChild(draggedPiece);
        }
    });
});
 
