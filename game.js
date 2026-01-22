/**
 * Connect 4 Game - SUPER FUN KIDS EDITION
 * 9 columns x 6 rows with scoring system
 *
 * Scoring:
 * - Win faster = more points (max 30 per round)
 * - First to 120 points wins the championship!
 */

const COLS = 9;
const ROWS = 6;
const EMPTY = 0;
const PLAYER_1 = 1;
const PLAYER_2 = 2;
const MAX_SCORE = 120;
const MAX_ROUND_POINTS = 30;
const MIN_ROUND_POINTS = 10;
const MIN_MOVES_TO_WIN = 4;

/* ============================================
   MOD SYSTEM - Lightweight mod definitions
   ============================================ */

const MOD_DEFINITIONS = {
    bombas: {
        id: 'bombas',
        name: 'Bombas',
        emoji: '💣',
        description: 'Cuidado! Hay bombas escondidas que quitan fichas!',

        // Constants
        BOMB_PERCENTAGE: 0.15,
        DISCS_TO_REMOVE: 2,

        // Initialize mod state
        onCreate(game) {
            game.bombs = new Set();
        },

        // Place bombs on board creation
        onBoardCreate(game) {
            game.bombs.clear();
            const totalCells = COLS * ROWS;
            const bombCount = Math.floor(totalCells * this.BOMB_PERCENTAGE);

            // Generate all possible positions
            const positions = [];
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    positions.push(`${row},${col}`);
                }
            }

            // Shuffle and pick bombCount positions
            for (let i = positions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [positions[i], positions[j]] = [positions[j], positions[i]];
            }

            for (let i = 0; i < bombCount; i++) {
                game.bombs.add(positions[i]);
            }
        },

        // Check for bomb trigger after disc is dropped
        async onDiscDropped(game, row, col, player) {
            if (game.bombs.has(`${row},${col}`)) {
                game.bombs.delete(`${row},${col}`);
                await game.triggerExplosion(row, col);
            }
        },

        // Get occupied positions (for other mods to avoid)
        getOccupiedPositions(game) {
            return game.bombs || new Set();
        }
    },

    jackpot: {
        id: 'jackpot',
        name: 'Jackpot',
        emoji: '🎰',
        description: 'Encuentra el jackpot y llena toda la columna!',

        // Initialize mod state
        onCreate(game) {
            game.jackpotPosition = null;
        },

        // Place jackpot on board creation
        onBoardCreate(game) {
            game.jackpotPosition = game.selectRandomAvailablePosition('jackpot');
        },

        // Check for jackpot trigger after disc is dropped
        async onDiscDropped(game, row, col, player) {
            if (game.jackpotPosition === `${row},${col}`) {
                game.jackpotPosition = null;
                await game.triggerJackpot(row, col);
            }
        },

        // Get occupied positions
        getOccupiedPositions(game) {
            return game.jackpotPosition ? new Set([game.jackpotPosition]) : new Set();
        }
    },

    michiAlien: {
        id: 'michiAlien',
        name: 'Michi Alien',
        emoji: '👽',
        description: 'Un OVNI con gato secuestra fichas de ambos jugadores!',

        // Constants
        MIN_ABDUCT: 4,
        MAX_ABDUCT: 5,

        // Initialize mod state
        onCreate(game) {
            game.alienSlotPosition = null;
        },

        // Place single hidden slot on board creation
        onBoardCreate(game) {
            game.alienSlotPosition = game.selectRandomAvailablePosition('michiAlien');
        },

        // Check for alien trigger after disc is dropped
        async onDiscDropped(game, row, col, player) {
            if (game.alienSlotPosition === `${row},${col}`) {
                game.alienSlotPosition = null;
                await game.triggerAlienAbduction(row, col);
            }
        },

        // Get occupied positions (for other mods to avoid)
        getOccupiedPositions(game) {
            return game.alienSlotPosition ? new Set([game.alienSlotPosition]) : new Set();
        }
    }
};

class Connect4Game {
    constructor() {
        this.board = [];
        this.currentPlayer = PLAYER_1;
        this.gameOver = false;
        this.winningCells = [];
        this.moveCount = 0;
        this.scores = { 1: 0, 2: 0 };
        this.roundWins = { 1: 0, 2: 0 };

        // Mod system
        this.activeMods = new Set();       // Set of active mod IDs
        this.modsInitialized = false;      // Track if mods have been selected

        // Shared state for mods
        this.playerCells = { 1: [], 2: [] };  // Track each player's disc positions
        this.isProcessingMove = false;     // Prevent clicks during animations

        // DOM Elements
        this.boardElement = document.getElementById('board');
        this.turnBadge = document.getElementById('turn-badge');
        this.turnEmoji = document.getElementById('turn-emoji');
        this.currentPlayerName = document.getElementById('current-player-name');
        this.statusElement = document.getElementById('game-status');
        this.score1Element = document.getElementById('score1');
        this.score2Element = document.getElementById('score2');
        this.stars1Element = document.getElementById('stars1');
        this.stars2Element = document.getElementById('stars2');
        this.resetButton = document.getElementById('reset-btn');
        this.newGameButton = document.getElementById('new-game-btn');

        // Modals
        this.winnerModal = document.getElementById('winner-modal');
        this.winnerTitle = document.getElementById('winner-title');
        this.winnerAvatar = document.getElementById('winner-avatar');
        this.pointsEarned = document.getElementById('points-earned');
        this.continueButton = document.getElementById('continue-btn');

        this.championModal = document.getElementById('champion-modal');
        this.championAvatar = document.getElementById('champion-avatar');
        this.championName = document.getElementById('champion-name');
        this.finalScore = document.getElementById('final-score');
        this.newChampionshipBtn = document.getElementById('new-championship-btn');

        this.confettiContainer = document.getElementById('confetti');
        this.starsContainer = document.getElementById('stars-bg');

        // Mod selection modal elements
        this.modSelectionModal = document.getElementById('mod-selection-modal');
        this.modGrid = document.getElementById('mod-grid');
        this.startGameBtn = document.getElementById('start-game-btn');
        this.activeModsContainer = document.getElementById('active-mods');

        // Audio context for sound effects
        this.audioContext = null;

        this.init();
    }

    /**
     * Initialize the game
     */
    init() {
        this.createStars();
        this.updateScoreboard();

        // Event listeners
        this.resetButton.addEventListener('click', () => this.resetRound());
        this.newGameButton.addEventListener('click', () => this.newGame());
        this.continueButton.addEventListener('click', () => this.continueGame());
        this.newChampionshipBtn.addEventListener('click', () => this.newGame());

        // Mod selection event listeners
        if (this.startGameBtn) {
            this.startGameBtn.addEventListener('click', () => this.confirmModSelection());
        }

        // Initialize audio on first interaction
        document.addEventListener('click', () => this.initAudio(), { once: true });

        // Show mod selection modal on start
        this.showModSelectionModal();
    }

    /* ============================================
       MOD SYSTEM METHODS
       ============================================ */

    /**
     * Show the mod selection modal
     */
    showModSelectionModal() {
        if (!this.modGrid || !this.modSelectionModal) return;

        // Clear existing cards
        while (this.modGrid.firstChild) {
            this.modGrid.removeChild(this.modGrid.firstChild);
        }

        // Create mod cards using safe DOM methods
        Object.values(MOD_DEFINITIONS).forEach(mod => {
            const card = document.createElement('div');
            card.className = 'mod-card';
            card.dataset.modId = mod.id;

            const emoji = document.createElement('span');
            emoji.className = 'mod-emoji';
            emoji.textContent = mod.emoji;

            const name = document.createElement('div');
            name.className = 'mod-name';
            name.textContent = mod.name;

            const description = document.createElement('div');
            description.className = 'mod-description';
            description.textContent = mod.description;

            card.appendChild(emoji);
            card.appendChild(name);
            card.appendChild(description);

            card.addEventListener('click', () => this.toggleModCard(card, mod.id));
            this.modGrid.appendChild(card);
        });

        // Show modal
        this.modSelectionModal.classList.add('show');
    }

    /**
     * Toggle mod card selection
     */
    toggleModCard(card, modId) {
        const selectedCards = this.modGrid.querySelectorAll('.mod-card.selected');

        if (card.classList.contains('selected')) {
            // Deselect
            card.classList.remove('selected');
        } else if (selectedCards.length < 2) {
            // Select (max 2)
            card.classList.add('selected');
        }

        // Update card states (enable/disable)
        this.updateModCardStates();
    }

    /**
     * Update mod card states (disable unselected when max reached)
     */
    updateModCardStates() {
        const selectedCards = this.modGrid.querySelectorAll('.mod-card.selected');
        const allCards = this.modGrid.querySelectorAll('.mod-card');

        if (selectedCards.length >= 2) {
            // Disable unselected cards
            allCards.forEach(card => {
                if (!card.classList.contains('selected')) {
                    card.classList.add('disabled');
                }
            });
        } else {
            // Enable all cards
            allCards.forEach(card => card.classList.remove('disabled'));
        }
    }

    /**
     * Confirm mod selection and start game
     */
    confirmModSelection() {
        const selectedCards = this.modGrid.querySelectorAll('.mod-card.selected');
        const modIds = Array.from(selectedCards).map(card => card.dataset.modId);

        // Activate selected mods
        this.activateMods(modIds);

        // Hide modal
        this.modSelectionModal.classList.remove('show');

        // Update UI
        this.updateActiveModsDisplay();
        this.updateInstructions();

        // Start the game
        this.modsInitialized = true;
        this.createBoard();
        this.renderBoard();
        this.updateTurnIndicator();
    }

    /**
     * Activate selected mods
     */
    activateMods(modIds) {
        this.activeMods.clear();

        modIds.forEach(modId => {
            if (MOD_DEFINITIONS[modId]) {
                this.activeMods.add(modId);
                const mod = MOD_DEFINITIONS[modId];

                // Call mod's onCreate hook
                if (mod.onCreate) {
                    mod.onCreate(this);
                }
            }
        });
    }

    /**
     * Update the active mods display badges
     */
    updateActiveModsDisplay() {
        if (!this.activeModsContainer) return;

        // Clear existing badges
        while (this.activeModsContainer.firstChild) {
            this.activeModsContainer.removeChild(this.activeModsContainer.firstChild);
        }

        if (this.activeMods.size === 0) {
            const badge = document.createElement('div');
            badge.className = 'mod-badge mod-badge-none';
            badge.textContent = 'Sin Mods';
            this.activeModsContainer.appendChild(badge);
            return;
        }

        this.activeMods.forEach(modId => {
            const mod = MOD_DEFINITIONS[modId];
            const badge = document.createElement('div');
            badge.className = 'mod-badge';

            const emoji = document.createElement('span');
            emoji.className = 'mod-badge-emoji';
            emoji.textContent = mod.emoji;

            const name = document.createElement('span');
            name.textContent = mod.name;

            badge.appendChild(emoji);
            badge.appendChild(name);
            this.activeModsContainer.appendChild(badge);
        });
    }

    /**
     * Update instructions to show only active mod rules
     */
    updateInstructions() {
        // Hide all mod-specific instructions
        const bombInstruction = document.querySelector('.instruction-bombs');
        const jackpotInstruction = document.querySelector('.instruction-jackpot');
        const alienInstruction = document.querySelector('.instruction-alien');

        if (bombInstruction) {
            bombInstruction.style.display = this.activeMods.has('bombas') ? 'flex' : 'none';
        }
        if (jackpotInstruction) {
            jackpotInstruction.style.display = this.activeMods.has('jackpot') ? 'flex' : 'none';
        }
        if (alienInstruction) {
            alienInstruction.style.display = this.activeMods.has('michiAlien') ? 'flex' : 'none';
        }
    }

    /**
     * Initialize Web Audio API
     */
    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    /**
     * Play a sound effect
     */
    playSound(type) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        switch (type) {
            case 'drop':
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
            case 'win':
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.15 + 0.3);
                    osc.start(this.audioContext.currentTime + i * 0.15);
                    osc.stop(this.audioContext.currentTime + i * 0.15 + 0.3);
                });
                break;
            case 'champion':
                const champNotes = [523, 659, 784, 880, 1047, 1319, 1568];
                champNotes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.25, this.audioContext.currentTime + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.4);
                    osc.start(this.audioContext.currentTime + i * 0.1);
                    osc.stop(this.audioContext.currentTime + i * 0.1 + 0.4);
                });
                break;
            case 'explosion':
                // Low rumbling explosion sound using sawtooth wave
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;
            case 'jackpot':
                // Ascending celebratory arpeggio (G4 to B5)
                const jackpotNotes = [392, 494, 587, 784, 988];
                jackpotNotes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.type = 'triangle';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.3);
                    osc.start(this.audioContext.currentTime + i * 0.1);
                    osc.stop(this.audioContext.currentTime + i * 0.1 + 0.3);
                });
                break;
            case 'alien':
                // Mysterious alien warble sound (X-Files style)
                const alienNotes = [440, 554, 659, 880, 659, 554];  // A4 -> C#5 -> E5 -> A5 -> back down
                alienNotes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.type = 'sine';  // Smooth, ethereal tone
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.15 + 0.3);
                    osc.start(this.audioContext.currentTime + i * 0.15);
                    osc.stop(this.audioContext.currentTime + i * 0.15 + 0.3);
                });
                break;
        }
    }

    /**
     * Create animated stars background
     */
    createStars() {
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.width = Math.random() * 3 + 1 + 'px';
            star.style.height = star.style.width;
            star.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
            star.style.animationDelay = Math.random() * 5 + 's';
            this.starsContainer.appendChild(star);
        }
    }

    /**
     * Create empty game board
     */
    createBoard() {
        this.board = [];
        for (let row = 0; row < ROWS; row++) {
            this.board[row] = [];
            for (let col = 0; col < COLS; col++) {
                this.board[row][col] = EMPTY;
            }
        }
        this.moveCount = 0;
        this.playerCells = { 1: [], 2: [] };

        // Call onBoardCreate hook for all active mods
        this.activeMods.forEach(modId => {
            const mod = MOD_DEFINITIONS[modId];
            if (mod.onBoardCreate) {
                mod.onBoardCreate(this);
            }
        });
    }

    /**
     * Fill an entire column with the current player's color
     * Overrides opponent discs and fills empty cells
     * @param {number} col - Column to fill
     * @param {number} player - Player number (1 or 2)
     * @returns {Promise} Resolves when cascade animation completes
     */
    fillColumn(col, player) {
        return new Promise((resolve) => {
            const opponent = player === PLAYER_1 ? PLAYER_2 : PLAYER_1;
            const colorClass = player === PLAYER_1 ? 'red' : 'yellow';
            const opponentColorClass = opponent === PLAYER_1 ? 'red' : 'yellow';
            let cellsToFill = [];

            // Collect all cells that need to be filled (from top to bottom for cascade)
            for (let row = 0; row < ROWS; row++) {
                const currentState = this.board[row][col];

                if (currentState === EMPTY) {
                    // Empty cell - add to player
                    cellsToFill.push({ row, col, type: 'empty' });
                } else if (currentState === opponent) {
                    // Opponent's disc - override it
                    cellsToFill.push({ row, col, type: 'override' });
                }
                // Player's own disc - skip (already owned)
            }

            if (cellsToFill.length === 0) {
                resolve();
                return;
            }

            // Apply cascade animation with staggered delays
            cellsToFill.forEach((cellInfo, index) => {
                setTimeout(() => {
                    const cell = this.getCellElement(cellInfo.row, col);

                    // Update board state
                    this.board[cellInfo.row][col] = player;

                    // Handle opponent disc override
                    if (cellInfo.type === 'override') {
                        // Remove from opponent's tracking
                        const opponentIdx = this.playerCells[opponent].findIndex(
                            ([r, c]) => r === cellInfo.row && c === col
                        );
                        if (opponentIdx !== -1) {
                            this.playerCells[opponent].splice(opponentIdx, 1);
                        }
                        cell.classList.remove(opponentColorClass);
                    }

                    // Add to current player's tracking
                    this.playerCells[player].push([cellInfo.row, col]);

                    // Apply visual changes
                    cell.classList.remove('drop-animation');
                    cell.classList.add(colorClass, 'jackpot-fill');

                    // Increment move count for filled cells
                    this.moveCount++;

                    // Resolve after last cell is animated
                    if (index === cellsToFill.length - 1) {
                        setTimeout(() => {
                            // Remove animation class from all filled cells
                            cellsToFill.forEach(({ row }) => {
                                const c = this.getCellElement(row, col);
                                c.classList.remove('jackpot-fill');
                            });
                            resolve();
                        }, 400);
                    }
                }, index * 80); // 80ms stagger for cascade effect
            });
        });
    }

    /**
     * Trigger jackpot effect - fills entire column with player's color
     * @param {number} row - The row where the jackpot was triggered
     * @param {number} col - The column where the jackpot was triggered
     */
    async triggerJackpot(row, col) {
        const cell = this.getCellElement(row, col);

        // Play jackpot sound
        this.playSound('jackpot');

        // Add jackpot trigger animation to the triggering cell
        cell.classList.add('jackpot-trigger');

        // Show jackpot message
        this.statusElement.textContent = '🎰 JACKPOT! 🎰 Columna completa!';
        this.statusElement.classList.add('jackpot-message');

        // Wait a moment before filling column
        await new Promise(resolve => setTimeout(resolve, 400));

        // Fill the entire column
        await this.fillColumn(col, this.currentPlayer);

        // Clear message after delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.statusElement.textContent = '';
        this.statusElement.classList.remove('jackpot-message');
        cell.classList.remove('jackpot-trigger');
    }

    /**
     * Trigger explosion effect when player lands on a bomb
     * Returns a Promise that resolves when explosion animation completes
     * @param {number} row - The row where the bomb was triggered
     * @param {number} col - The column where the bomb was triggered
     */
    async triggerExplosion(row, col) {
        const cell = this.getCellElement(row, col);
        const boardFrame = document.querySelector('.board-frame');

        // Play explosion sound
        this.playSound('explosion');

        // Add explosion animation to cell
        cell.classList.add('explosion');

        // Add screen shake effect
        boardFrame.classList.add('shake');

        // Show bomb message
        this.statusElement.textContent = '💣 BOOM! 💣';
        this.statusElement.classList.add('bomb-message');

        // Wait for initial explosion animation
        await new Promise(resolve => setTimeout(resolve, 600));

        cell.classList.remove('explosion');
        boardFrame.classList.remove('shake');

        // Remove player discs (excluding the one that just triggered the bomb)
        // This now updates board state SYNCHRONOUSLY before returning
        const player = this.currentPlayer;
        const discsToRemove = MOD_DEFINITIONS.bombas.DISCS_TO_REMOVE;
        const removed = await this.removePlayerDiscs(player, discsToRemove, [row, col]);

        // Show appropriate Spanish message
        if (removed === 0) {
            this.statusElement.textContent = '💣 BOOM! 💣 Tuviste suerte, no tenias fichas!';
        } else if (removed === 1) {
            this.statusElement.textContent = '💣 BOOM! 💣 Perdiste 1 ficha!';
        } else {
            this.statusElement.textContent = `💣 BOOM! 💣 Perdiste ${removed} fichas!`;
        }

        // Clear message after delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        this.statusElement.textContent = '';
        this.statusElement.classList.remove('bomb-message');
    }

    /* ============================================
       MICHI ALIEN UFO ABDUCTION METHODS
       ============================================ */

    /**
     * Create UFO DOM element with cat passenger
     * @returns {HTMLElement} UFO element ready to be added to DOM
     */
    createUFOElement() {
        const ufo = document.createElement('div');
        ufo.className = 'alien-ufo';

        const ship = document.createElement('span');
        ship.className = 'alien-ship';
        ship.textContent = '🛸';

        const cat = document.createElement('div');
        cat.className = 'alien-cat';
        cat.textContent = '🐱';

        ufo.appendChild(ship);
        ufo.appendChild(cat);

        return ufo;
    }

    /**
     * Select random discs from BOTH players to abduct
     * @param {Array} excludePosition - [row, col] to exclude (trigger disc)
     * @returns {Array} Array of {row, col, player} objects
     */
    selectAbductionTargets(excludePosition) {
        // Collect all discs from both players with their owner info
        let allDiscs = [];

        this.playerCells[PLAYER_1].forEach(([row, col]) => {
            allDiscs.push({ row, col, player: PLAYER_1 });
        });

        this.playerCells[PLAYER_2].forEach(([row, col]) => {
            allDiscs.push({ row, col, player: PLAYER_2 });
        });

        // Filter out the triggering disc
        if (excludePosition) {
            allDiscs = allDiscs.filter(
                disc => !(disc.row === excludePosition[0] && disc.col === excludePosition[1])
            );
        }

        if (allDiscs.length === 0) return [];

        // Shuffle and pick 4-5 random discs
        this.shuffleArray(allDiscs);
        const { MIN_ABDUCT, MAX_ABDUCT } = MOD_DEFINITIONS.michiAlien;
        const abductCount = Math.min(
            Math.floor(Math.random() * (MAX_ABDUCT - MIN_ABDUCT + 1)) + MIN_ABDUCT,
            allDiscs.length
        );

        return allDiscs.slice(0, abductCount);
    }

    /**
     * Fly UFO across the board to trigger column
     * @param {HTMLElement} ufoElement - UFO DOM element
     * @param {number} triggerCol - Column where slot was activated
     * @returns {Promise<void>} Resolves when UFO reaches position
     */
    async flyUFOAcross(ufoElement, triggerCol) {
        const boardWrapper = document.querySelector('.board-wrapper');
        boardWrapper.appendChild(ufoElement);

        // Position UFO above trigger column
        const triggerCell = this.getCellElement(0, triggerCol);
        const cellRect = triggerCell.getBoundingClientRect();
        const wrapperRect = boardWrapper.getBoundingClientRect();

        // Calculate target X position (center of column relative to wrapper)
        const targetX = cellRect.left - wrapperRect.left + cellRect.width / 2;

        // Start off-screen left
        ufoElement.style.left = '-150px';
        ufoElement.style.top = '-80px';

        // Trigger reflow to ensure initial position is set
        ufoElement.offsetHeight;

        // Animate to target position
        ufoElement.style.transform = `translateX(${targetX + 150}px)`;

        // Wait for fly-in animation
        await new Promise(resolve => setTimeout(resolve, 1200));
    }

    /**
     * Abduct discs with tractor beam animation
     * Updates board state SYNCHRONOUSLY before animations
     * @param {Array} targets - Array of {row, col, player} to abduct
     * @param {HTMLElement} ufoElement - UFO element for beam effect
     * @returns {Promise<Array>} Array of {player, originalCol} for relocation
     */
    async abductDiscs(targets, ufoElement) {
        if (targets.length === 0) return [];

        // Show tractor beam
        ufoElement.classList.add('alien-beam-active');

        const abductedData = [];
        const affectedColumns = new Set();

        // STEP 1: Update board state SYNCHRONOUSLY (before any animations)
        targets.forEach(({ row, col, player }) => {
            // Store data for relocation
            abductedData.push({ player, originalCol: col });

            // Clear board state immediately
            this.board[row][col] = EMPTY;

            // Remove from playerCells tracking
            const idx = this.playerCells[player].findIndex(
                pos => pos[0] === row && pos[1] === col
            );
            if (idx !== -1) {
                this.playerCells[player].splice(idx, 1);
            }

            affectedColumns.add(col);
        });

        // STEP 2: Apply gravity SYNCHRONOUSLY to all affected columns
        affectedColumns.forEach(col => {
            this.applyGravitySyncBoardOnly(col);
        });

        // STEP 3: Animate beam-up effect (staggered, non-blocking)
        targets.forEach(({ row, col }, index) => {
            setTimeout(() => {
                const cell = this.getCellElement(row, col);
                cell.classList.add('alien-beam-target');

                // Remove visual classes after animation
                setTimeout(() => {
                    cell.classList.remove('red', 'yellow', 'alien-beam-target', 'drop-animation');
                }, 600);
            }, index * 150);
        });

        // Wait for all beam-up animations to complete
        const totalAbductTime = (targets.length - 1) * 150 + 600 + 100;
        await new Promise(resolve => setTimeout(resolve, totalAbductTime));

        // Hide tractor beam
        ufoElement.classList.remove('alien-beam-active');

        return abductedData;
    }

    /**
     * Relocate abducted discs to random columns with beam-down animation
     * @param {Array} abductedData - Array of {player, originalCol}
     * @returns {Promise<void>}
     */
    async relocateAbductedDiscs(abductedData) {
        if (abductedData.length === 0) return;

        const relocations = [];

        // STEP 1: Calculate new positions and update state SYNCHRONOUSLY
        abductedData.forEach(({ player }) => {
            // Find a random column with space
            let attempts = 0;
            let targetCol = Math.floor(Math.random() * COLS);
            let targetRow = this.getLowestEmptyRow(targetCol);

            // If chosen column is full, try others
            while (targetRow === -1 && attempts < COLS) {
                targetCol = (targetCol + 1) % COLS;
                targetRow = this.getLowestEmptyRow(targetCol);
                attempts++;
            }

            // If we found a valid position
            if (targetRow !== -1) {
                // Update board state immediately
                this.board[targetRow][targetCol] = player;
                this.playerCells[player].push([targetRow, targetCol]);
                this.moveCount++;

                relocations.push({ row: targetRow, col: targetCol, player });
            }
        });

        // STEP 2: Re-render board to show state changes
        this.rerenderBoard();

        // STEP 3: Apply beam-down animations (staggered)
        relocations.forEach(({ row, col }, index) => {
            setTimeout(() => {
                const cell = this.getCellElement(row, col);
                cell.classList.add('alien-beam-down');

                // Remove animation class after completion
                setTimeout(() => {
                    cell.classList.remove('alien-beam-down');
                }, 600);
            }, index * 200);
        });

        // Wait for all relocations to complete
        const totalRelocateTime = (relocations.length - 1) * 200 + 600 + 100;
        await new Promise(resolve => setTimeout(resolve, totalRelocateTime));
    }

    /**
     * Remove UFO element with exit animation
     * @param {HTMLElement} ufoElement - UFO to remove
     * @returns {Promise<void>}
     */
    async removeUFOElement(ufoElement) {
        // Trigger exit animation
        ufoElement.classList.add('alien-ufo-exit');

        // Wait for animation and remove
        await new Promise(resolve => setTimeout(resolve, 800));

        if (ufoElement.parentNode) {
            ufoElement.parentNode.removeChild(ufoElement);
        }
    }

    /**
     * Main orchestrator: Trigger alien abduction effect
     * Coordinates UFO arrival, disc abduction, and relocation
     * @param {number} row - Trigger position row
     * @param {number} col - Trigger position column
     */
    async triggerAlienAbduction(row, col) {
        // Play alien sound
        this.playSound('alien');

        // Show initial message
        this.statusElement.textContent = '👽 OVNI DETECTADO! 🛸🐱';
        this.statusElement.classList.add('alien-message');

        // Phase 1: UFO arrival
        const ufo = this.createUFOElement();
        await this.flyUFOAcross(ufo, col);

        // Phase 2: Select targets from BOTH players
        const targets = this.selectAbductionTargets([row, col]);

        if (targets.length === 0) {
            this.statusElement.textContent = '👽 No hay fichas para abducir! 🐱';
            await new Promise(resolve => setTimeout(resolve, 1500));
            await this.removeUFOElement(ufo);
            this.statusElement.textContent = '';
            this.statusElement.classList.remove('alien-message');
            return;
        }

        // Phase 3: Abduct discs with beam animation
        this.statusElement.textContent = `👽 Abduciendo ${targets.length} fichas! 🛸`;
        const abductedData = await this.abductDiscs(targets, ufo);

        await new Promise(resolve => setTimeout(resolve, 400));

        // Phase 4: Relocate discs to random positions
        this.statusElement.textContent = '👽 Caos espacial! 🐱✨';
        await this.relocateAbductedDiscs(abductedData);

        // Phase 5: UFO exit
        await this.removeUFOElement(ufo);

        // Clear message after delay
        await new Promise(resolve => setTimeout(resolve, 800));
        this.statusElement.textContent = '';
        this.statusElement.classList.remove('alien-message');
    }

    /**
     * Remove random discs from a player's placed pieces
     * IMPORTANT: Updates board state SYNCHRONOUSLY first, then animates visually
     * Returns a Promise that resolves with the number of discs removed after animations complete
     * @param {number} player - The player whose discs to remove
     * @param {number} count - Maximum number of discs to remove
     * @param {Array} excludePosition - [row, col] position to exclude (the bomb trigger disc)
     */
    removePlayerDiscs(player, count, excludePosition = null) {
        return new Promise((resolve) => {
            // Filter out the excluded position (the disc that triggered the bomb)
            let eligiblePositions = this.playerCells[player];
            if (excludePosition) {
                eligiblePositions = eligiblePositions.filter(
                    ([r, c]) => !(r === excludePosition[0] && c === excludePosition[1])
                );
            }

            if (eligiblePositions.length === 0) {
                resolve(0);
                return;
            }

            // Shuffle and select random discs to remove
            const shuffled = [...eligiblePositions];
            this.shuffleArray(shuffled);
            const toRemove = shuffled.slice(0, Math.min(count, shuffled.length));
            const removedCount = toRemove.length;

            // Track affected columns for gravity
            const affectedColumns = new Set();

            // STEP 1: Update board state SYNCHRONOUSLY (before any animations)
            toRemove.forEach(([row, col]) => {
                // Clear board state immediately
                this.board[row][col] = EMPTY;

                // Remove from playerCells tracking
                const idx = this.playerCells[player].findIndex(
                    pos => pos[0] === row && pos[1] === col
                );
                if (idx !== -1) {
                    this.playerCells[player].splice(idx, 1);
                }

                affectedColumns.add(col);
            });

            // STEP 2: Apply gravity SYNCHRONOUSLY to all affected columns
            affectedColumns.forEach(col => {
                this.applyGravitySyncBoardOnly(col);
            });

            // STEP 3: Now animate the visual changes (non-blocking)
            toRemove.forEach(([row, col], index) => {
                const cell = this.getCellElement(row, col);

                // Stagger the removal animations
                setTimeout(() => {
                    cell.classList.add('disc-removed');

                    // After animation, clear visual classes
                    setTimeout(() => {
                        cell.classList.remove('red', 'yellow', 'disc-removed', 'drop-animation');
                    }, 500);
                }, index * 200);
            });

            // STEP 4: Re-render the board to reflect gravity changes after animations
            const totalAnimationTime = (toRemove.length - 1) * 200 + 500 + 100;
            setTimeout(() => {
                this.rerenderBoard();
                resolve(removedCount);
            }, totalAnimationTime);
        });
    }

    /**
     * Apply gravity to board state ONLY (no visual updates)
     * Used for synchronous board state updates before win checks
     */
    applyGravitySyncBoardOnly(col) {
        // Work from bottom to top, filling empty spaces
        for (let targetRow = ROWS - 1; targetRow >= 0; targetRow--) {
            if (this.board[targetRow][col] === EMPTY) {
                // Find the first non-empty cell above
                for (let sourceRow = targetRow - 1; sourceRow >= 0; sourceRow--) {
                    if (this.board[sourceRow][col] !== EMPTY) {
                        const player = this.board[sourceRow][col];

                        // Move the disc in board state only
                        this.board[targetRow][col] = player;
                        this.board[sourceRow][col] = EMPTY;

                        // Update player cells tracking
                        const idx = this.playerCells[player].findIndex(
                            pos => pos[0] === sourceRow && pos[1] === col
                        );
                        if (idx !== -1) {
                            this.playerCells[player][idx] = [targetRow, col];
                        }

                        break;
                    }
                }
            }
        }
    }

    /**
     * Re-render the board to match current board state
     * Used after synchronous board updates to sync visuals
     */
    rerenderBoard() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = this.getCellElement(row, col);
                cell.classList.remove('red', 'yellow', 'drop-animation', 'disc-removed');

                if (this.board[row][col] === PLAYER_1) {
                    cell.classList.add('red');
                } else if (this.board[row][col] === PLAYER_2) {
                    cell.classList.add('yellow');
                }
            }
        }
    }

    /* ============================================
       UTILITY METHODS
       ============================================ */

    /**
     * Shuffle array in place using Fisher-Yates algorithm
     * @param {Array} array - Array to shuffle (mutated in place)
     * @returns {Array} The shuffled array (same reference)
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Select a random available position on the board
     * Excludes positions occupied by other mods
     * @param {string} excludeModId - Mod ID to exclude from position check
     * @returns {string|null} Position string "row,col" or null if no positions available
     */
    selectRandomAvailablePosition(excludeModId) {
        // Get positions occupied by other mods
        const occupiedPositions = new Set();
        this.activeMods.forEach(modId => {
            const mod = MOD_DEFINITIONS[modId];
            if (mod.getOccupiedPositions && modId !== excludeModId) {
                mod.getOccupiedPositions(this).forEach(pos => occupiedPositions.add(pos));
            }
        });

        // Generate available positions
        const availablePositions = [];
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const pos = `${row},${col}`;
                if (!occupiedPositions.has(pos)) {
                    availablePositions.push(pos);
                }
            }
        }

        // Pick one random position
        if (availablePositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * availablePositions.length);
            return availablePositions[randomIndex];
        }
        return null;
    }

    /**
     * Apply gravity to a column after disc removal
     * Discs above empty spaces should fall down
     */
    applyGravity(col) {
        // Work from bottom to top, filling empty spaces
        for (let targetRow = ROWS - 1; targetRow >= 0; targetRow--) {
            if (this.board[targetRow][col] === EMPTY) {
                // Find the first non-empty cell above
                for (let sourceRow = targetRow - 1; sourceRow >= 0; sourceRow--) {
                    if (this.board[sourceRow][col] !== EMPTY) {
                        const player = this.board[sourceRow][col];

                        // Move the disc in board state
                        this.board[targetRow][col] = player;
                        this.board[sourceRow][col] = EMPTY;

                        // Update player cells tracking
                        const idx = this.playerCells[player].findIndex(
                            pos => pos[0] === sourceRow && pos[1] === col
                        );
                        if (idx !== -1) {
                            this.playerCells[player][idx] = [targetRow, col];
                        }

                        // Update visual representation
                        const sourceCell = this.getCellElement(sourceRow, col);
                        const targetCell = this.getCellElement(targetRow, col);
                        const colorClass = player === PLAYER_1 ? 'red' : 'yellow';

                        sourceCell.classList.remove('red', 'yellow', 'drop-animation');
                        targetCell.classList.add(colorClass, 'drop-animation');

                        break;
                    }
                }
            }
        }
    }

    /**
     * Render the game board
     */
    renderBoard() {
        while (this.boardElement.firstChild) {
            this.boardElement.removeChild(this.boardElement.firstChild);
        }

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => this.handleCellClick(col));
                this.boardElement.appendChild(cell);
            }
        }
    }

    /**
     * Handle cell click
     */
    async handleCellClick(col) {
        if (this.gameOver || this.isProcessingMove) return;

        const row = this.getLowestEmptyRow(col);
        if (row === -1) return;

        this.isProcessingMove = true;
        await this.dropDisc(row, col);
        this.isProcessingMove = false;
    }

    /**
     * Find lowest empty row in column
     */
    getLowestEmptyRow(col) {
        for (let row = ROWS - 1; row >= 0; row--) {
            if (this.board[row][col] === EMPTY) {
                return row;
            }
        }
        return -1;
    }

    /**
     * Drop a disc
     * Handles mod effects via lifecycle hooks
     */
    async dropDisc(row, col) {
        const player = this.currentPlayer;

        // Place the disc
        this.board[row][col] = player;
        this.moveCount++;

        // Track position for potential mod effects
        this.playerCells[player].push([row, col]);

        const cell = this.getCellElement(row, col);
        const colorClass = player === PLAYER_1 ? 'red' : 'yellow';
        cell.classList.add(colorClass, 'drop-animation');

        this.playSound('drop');

        // Call onDiscDropped hook for all active mods
        for (const modId of this.activeMods) {
            const mod = MOD_DEFINITIONS[modId];
            if (mod.onDiscDropped) {
                await mod.onDiscDropped(this, row, col, player);
            }
        }

        // After mod effects (alien abduction, bombs, jackpots), wins can occur ANYWHERE
        // on the board for ANY player. Do a full board scan.
        const winResult = this.scanBoardForWin();
        if (winResult) {
            // Set the winning player (may differ from current player due to mod effects!)
            this.winningCells = winResult.cells;
            // If the winner is different from current player, switch to them for handleWin
            if (winResult.winner !== this.currentPlayer) {
                this.currentPlayer = winResult.winner;
            }
            this.handleWin();
            return;
        }

        if (this.checkDraw()) {
            this.handleDraw();
            return;
        }

        this.switchPlayer();
    }

    /**
     * Get cell DOM element
     */
    getCellElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    /**
     * Check for win from a specific position
     */
    checkWin(row, col) {
        const player = this.board[row][col];
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [dRow, dCol] of directions) {
            const cells = this.countInDirection(row, col, dRow, dCol, player);
            if (cells.length >= 4) {
                this.winningCells = cells;
                return true;
            }
        }
        return false;
    }

    /**
     * Scan entire board for any winning condition
     * Returns { winner: player, cells: winningCells } or null if no winner
     * Used after mod effects that can create wins anywhere on the board
     */
    scanBoardForWin() {
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const player = this.board[row][col];
                if (player === EMPTY) continue;

                for (const [dRow, dCol] of directions) {
                    const cells = this.countInDirection(row, col, dRow, dCol, player);
                    if (cells.length >= 4) {
                        return { winner: player, cells };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Count consecutive discs in direction
     */
    countInDirection(row, col, dRow, dCol, player) {
        const cells = [[row, col]];

        let r = row + dRow;
        let c = col + dCol;
        while (this.isValidCell(r, c) && this.board[r][c] === player) {
            cells.push([r, c]);
            r += dRow;
            c += dCol;
        }

        r = row - dRow;
        c = col - dCol;
        while (this.isValidCell(r, c) && this.board[r][c] === player) {
            cells.push([r, c]);
            r -= dRow;
            c -= dCol;
        }

        return cells;
    }

    /**
     * Check if cell is valid
     */
    isValidCell(row, col) {
        return row >= 0 && row < ROWS && col >= 0 && col < COLS;
    }

    /**
     * Check for draw
     */
    checkDraw() {
        for (let col = 0; col < COLS; col++) {
            if (this.board[0][col] === EMPTY) return false;
        }
        return true;
    }

    /**
     * Calculate points for winning
     */
    calculatePoints() {
        const playerMoves = Math.ceil(this.moveCount / 2);
        const bonus = Math.max(0, (20 - playerMoves) * 2);
        return Math.min(MAX_ROUND_POINTS, Math.max(MIN_ROUND_POINTS, MIN_ROUND_POINTS + bonus));
    }

    /**
     * Handle win
     */
    handleWin() {
        this.gameOver = true;
        const points = this.calculatePoints();
        this.scores[this.currentPlayer] += points;
        this.roundWins[this.currentPlayer]++;

        // Highlight winning cells
        for (const [row, col] of this.winningCells) {
            const cell = this.getCellElement(row, col);
            cell.classList.add('winning');
        }

        this.updateScoreboard();
        this.playSound('win');
        this.launchConfetti();

        // Check for champion
        if (this.scores[this.currentPlayer] >= MAX_SCORE) {
            setTimeout(() => this.showChampionModal(), 1500);
        } else {
            setTimeout(() => this.showWinnerModal(points), 1000);
        }
    }

    /**
     * Handle draw
     */
    handleDraw() {
        this.gameOver = true;
        this.statusElement.textContent = 'Empate! Nadie gana puntos';
        this.statusElement.classList.add('draw');
    }

    /**
     * Show round winner modal
     */
    showWinnerModal(points) {
        const playerName = this.currentPlayer === PLAYER_1 ? 'Jugador 1' : 'Jugador 2';
        const avatar = this.currentPlayer === PLAYER_1 ? '🔴' : '🟡';

        this.winnerTitle.textContent = playerName + ' gana!';
        this.winnerAvatar.textContent = avatar;
        this.pointsEarned.textContent = '+' + points;
        this.winnerModal.classList.add('show');
    }

    /**
     * Show champion modal
     */
    showChampionModal() {
        const playerName = this.currentPlayer === PLAYER_1 ? 'Jugador 1' : 'Jugador 2';
        const avatar = this.currentPlayer === PLAYER_1 ? '🔴' : '🟡';

        this.championAvatar.textContent = avatar;
        this.championName.textContent = playerName;
        this.finalScore.textContent = this.scores[this.currentPlayer];
        this.championModal.classList.add('show');
        this.playSound('champion');
        this.launchMegaConfetti();
    }

    /**
     * Continue game after round win
     */
    continueGame() {
        this.winnerModal.classList.remove('show');
        this.resetRound();
    }

    /**
     * Switch player
     */
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === PLAYER_1 ? PLAYER_2 : PLAYER_1;
        this.updateTurnIndicator();
    }

    /**
     * Update turn indicator
     */
    updateTurnIndicator() {
        const playerName = this.currentPlayer === PLAYER_1 ? 'Jugador 1' : 'Jugador 2';
        const emoji = this.currentPlayer === PLAYER_1 ? '🔴' : '🟡';

        this.currentPlayerName.textContent = playerName;
        this.turnEmoji.textContent = emoji;

        this.turnBadge.classList.remove('player1', 'player2');
        this.turnBadge.classList.add(this.currentPlayer === PLAYER_1 ? 'player1' : 'player2');
    }

    /**
     * Update scoreboard
     */
    updateScoreboard() {
        this.score1Element.textContent = this.scores[1];
        this.score2Element.textContent = this.scores[2];

        // Update stars (one star per round win)
        this.updateStars(this.stars1Element, this.roundWins[1]);
        this.updateStars(this.stars2Element, this.roundWins[2]);
    }

    /**
     * Update stars display
     */
    updateStars(container, count) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        for (let i = 0; i < Math.min(count, 5); i++) {
            const star = document.createElement('span');
            star.textContent = '⭐';
            container.appendChild(star);
        }
        if (count > 5) {
            const more = document.createElement('span');
            more.textContent = '+' + (count - 5);
            more.style.fontSize = '0.8rem';
            more.style.color = '#ffd700';
            container.appendChild(more);
        }
    }

    /**
     * Reset round (keep scores)
     */
    resetRound() {
        this.gameOver = false;
        this.winningCells = [];
        this.isProcessingMove = false;
        this.statusElement.textContent = '';
        this.statusElement.classList.remove('winner', 'draw', 'bomb-message');

        this.createBoard();
        this.renderBoard();
        this.updateTurnIndicator();
    }

    /**
     * Start new game (reset everything and show mod selection)
     */
    newGame() {
        this.scores = { 1: 0, 2: 0 };
        this.roundWins = { 1: 0, 2: 0 };
        this.currentPlayer = PLAYER_1;
        this.modsInitialized = false;

        this.winnerModal.classList.remove('show');
        this.championModal.classList.remove('show');

        this.updateScoreboard();

        // Show mod selection modal for new game
        this.showModSelectionModal();
    }

    /**
     * Launch confetti
     */
    launchConfetti() {
        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c44dff', '#ff8a8a', '#ffe066'];

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.classList.add('confetti');
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.setProperty('--fall-duration', (Math.random() * 2 + 2) + 's');

                const shapes = ['circle', 'square', 'triangle'];
                const shape = shapes[Math.floor(Math.random() * shapes.length)];
                if (shape === 'circle') {
                    confetti.style.borderRadius = '50%';
                } else if (shape === 'triangle') {
                    confetti.style.width = '0';
                    confetti.style.height = '0';
                    confetti.style.backgroundColor = 'transparent';
                    confetti.style.borderLeft = '5px solid transparent';
                    confetti.style.borderRight = '5px solid transparent';
                    confetti.style.borderBottom = '10px solid ' + colors[Math.floor(Math.random() * colors.length)];
                }

                this.confettiContainer.appendChild(confetti);

                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 4000);
            }, i * 30);
        }
    }

    /**
     * Launch mega confetti for champion
     */
    launchMegaConfetti() {
        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c44dff', '#ff8a8a', '#ffe066', '#ffd700'];

        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                for (let i = 0; i < 100; i++) {
                    setTimeout(() => {
                        const confetti = document.createElement('div');
                        confetti.classList.add('confetti');
                        confetti.style.left = Math.random() * 100 + '%';
                        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                        confetti.style.setProperty('--fall-duration', (Math.random() * 3 + 2) + 's');
                        confetti.style.width = Math.random() * 10 + 5 + 'px';
                        confetti.style.height = confetti.style.width;

                        if (Math.random() > 0.5) {
                            confetti.style.borderRadius = '50%';
                        }

                        this.confettiContainer.appendChild(confetti);

                        setTimeout(() => {
                            if (confetti.parentNode) {
                                confetti.parentNode.removeChild(confetti);
                            }
                        }, 5000);
                    }, i * 20);
                }
            }, wave * 1000);
        }
    }
}

// Start the game
document.addEventListener('DOMContentLoaded', () => {
    new Connect4Game();
});
