document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    let draggedPiece = null;
    let originalSquare = null; // To keep track of where the piece started
    let isDragging = false;
    let activeTouchId = null; // To track the specific touch for dragging

    // Unicode Chess Pieces
    const pieces = {
        'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
        'R': '♖', 'N', '♘', 'B', '♗', 'Q', '♕', 'K', '♔', 'P', '♙'
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

    // Helper function to get row/col from an element
    function getSquareCoords(element) {
        const row = parseInt(element.dataset.row);
        const col = parseInt(element.dataset.col);
        return { row, col };
    }

    // Function to remove all legal move circles
    function clearLegalMoveCircles() {
        document.querySelectorAll('.legal-move-circle').forEach(circle => circle.remove());
    }

    // Function to highlight "legal" moves (simplified: empty adjacent squares)
    function showLegalMoves(pieceElement) {
        clearLegalMoveCircles(); // Clear any existing circles first

        const { row, col } = getSquareCoords(pieceElement.parentNode); // Get piece's current square coords

        // In a real game, you'd calculate actual legal moves based on piece type.
        // For this example, we'll just highlight all empty squares.
        document.querySelectorAll('.square').forEach(square => {
            if (!square.querySelector('.piece')) { // If the square is empty
                const circle = document.createElement('div');
                circle.classList.add('legal-move-circle');
                square.appendChild(circle);
            }
        });
    }


    // Create the chessboard squares
    for (let i = 0; i < 8; i++) { // Rows
        for (let j = 0; j < 8; j++) { // Columns
            const square = document.createElement('div');
            square.classList.add('square');
            square.dataset.row = i; // Store row
            square.dataset.col = j; // Store col

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
                pieceElement.dataset.row = i; // Store original row
                pieceElement.dataset.col = j; // Store original col (though parent square is source of truth now)
                square.appendChild(pieceElement);
            }
            chessboard.appendChild(square);
        }
    }

    // --- Drag and Drop Logic (Mouse Events) ---
    chessboard.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('piece')) {
            draggedPiece = e.target;
            originalSquare = e.target.parentNode;
            isDragging = true;
            setTimeout(() => {
                draggedPiece.classList.add('dragging');
            }, 0);
            showLegalMoves(draggedPiece);
        }
    });

    chessboard.addEventListener('mousemove', (e) => {
        if (!isDragging || !draggedPiece) return;
        // Update piece position if needed (less common for grid-based drag)
        // For grid-based drag, we mainly rely on 'mouseup' for the drop
    });

    chessboard.addEventListener('mouseup', (e) => {
        if (!isDragging || !draggedPiece) return;

        isDragging = false;
        draggedPiece.classList.remove('dragging');
        clearLegalMoveCircles(); // Remove circles after drop attempt

        const targetSquare = e.target.closest('.square'); // Get the square being dropped on or its child

        if (targetSquare && targetSquare !== originalSquare) {
            // Simple "capture" by replacing the piece (no actual game logic)
            if (targetSquare.querySelector('.piece')) {
                targetSquare.querySelector('.piece').remove();
            }
            targetSquare.appendChild(draggedPiece);
        } else {
            // If dropped outside a valid square or on the same square, return to original position
            originalSquare.appendChild(draggedPiece);
        }
        draggedPiece = null;
        originalSquare = null;
    });

    // --- Touch Event Logic (for Mobile Drag) ---
    chessboard.addEventListener('touchstart', (e) => {
        // Prevent default touch behavior (scrolling) if a piece is touched
        if (e.target.classList.contains('piece') && e.touches.length === 1) {
            e.preventDefault(); // This is crucial for preventing scrolling
            draggedPiece = e.target;
            originalSquare = e.target.parentNode;
            isDragging = true;
            activeTouchId = e.touches[0].identifier; // Track this specific touch
            setTimeout(() => {
                draggedPiece.classList.add('dragging');
            }, 0);
            showLegalMoves(draggedPiece);

            // Set initial position for visual drag (optional, but good for feedback)
            const touch = e.touches[0];
            draggedPiece.style.position = 'absolute';
            draggedPiece.style.zIndex = '1000'; // Bring to front
            draggedPiece.style.left = touch.clientX - draggedPiece.offsetWidth / 2 + 'px';
            draggedPiece.style.top = touch.clientY - draggedPiece.offsetHeight / 2 + 'px';
        }
    }, { passive: false }); // { passive: false } is important for preventDefault


    chessboard.addEventListener('touchmove', (e) => {
        if (!isDragging || !draggedPiece) return;

        let touch = null;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === activeTouchId) {
                touch = e.touches[i];
                break;
            }
        }

        if (touch) {
            e.preventDefault(); // Prevent scrolling while dragging
            // Update piece position to follow touch
            draggedPiece.style.left = touch.clientX - draggedPiece.offsetWidth / 2 + 'px';
            draggedPiece.style.top = touch.clientY - draggedPiece.offsetHeight / 2 + 'px';
        }
    }, { passive: false });


    chessboard.addEventListener('touchend', (e) => {
        if (!isDragging || !draggedPiece || e.touches.length > 0) return; // Only process if no active touches left

        isDragging = false;
        draggedPiece.classList.remove('dragging');
        clearLegalMoveCircles(); // Remove circles after drop attempt

        // Determine drop target based on the last touch position
        const lastTouch = e.changedTouches[0]; // Get the touch that just ended
        const targetElement = document.elementFromPoint(lastTouch.clientX, lastTouch.clientY);
        const targetSquare = targetElement ? targetElement.closest('.square') : null;

        // Reset piece styling
        draggedPiece.style.position = '';
        draggedPiece.style.zIndex = '';
        draggedPiece.style.left = '';
        draggedPiece.style.top = '';

        if (targetSquare && targetSquare !== originalSquare) {
            // Simple "capture" by replacing the piece (no actual game logic)
            if (targetSquare.querySelector('.piece')) {
                targetSquare.querySelector('.piece').remove();
            }
            targetSquare.appendChild(draggedPiece);
        } else {
            // If dropped outside a valid square or on the same square, return to original position
            originalSquare.appendChild(draggedPiece);
        }
        draggedPiece = null;
        originalSquare = null;
        activeTouchId = null;
    });

    chessboard.addEventListener('touchcancel', () => {
        // If touch dragging is interrupted (e.g., call, notification)
        if (draggedPiece) {
            draggedPiece.classList.remove('dragging');
            originalSquare.appendChild(draggedPiece); // Return to original spot
            clearLegalMoveCircles();
            draggedPiece.style.position = '';
            draggedPiece.style.zIndex = '';
            draggedPiece.style.left = '';
            draggedPiece.style.top = '';
        }
        draggedPiece = null;
        originalSquare = null;
        isDragging = false;
        activeTouchId = null;
    });
});
 
