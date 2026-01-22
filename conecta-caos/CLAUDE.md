# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Conecta Caos** (Connect Chaos) - A kids-oriented game with wild mods that create chaotic, unpredictable gameplay! Features a 9x6 board, scoring system (first to 120 points wins), and extensible mods like Bombas, Jackpot, Michi Alien, and Vórtice Reverso.

**Language**: Spanish UI ("Jugador 1", "Conecta Caos", etc.)

## Development

This is a vanilla JavaScript browser game with no build system or dependencies.

```bash
# Start local server (required for proper file:// handling)
python3 -m http.server 8080
# Then open http://localhost:8080 in browser
```

No tests, linting, or build commands - manual browser testing only.

## Architecture

### Core Game Logic (`game.js`)

**Class**: `ConnectChaosGame` - Single class managing all game state and DOM interactions.

**Key State Properties**:
- `board[row][col]` - 2D array (EMPTY=0, PLAYER_1=1, PLAYER_2=2)
- `playerCells[player]` - Array of [row, col] positions per player (for mod effects)
- `activeMods` - Set of active mod IDs
- `isProcessingMove` - Prevents clicks during async animations

**Game Flow**:
1. `showModSelectionModal()` - User selects up to 2 mods
2. `createBoard()` - Initializes board, calls `onBoardCreate` hooks for each mod
3. `handleCellClick()` -> `dropDisc()` - Places disc, calls `onDiscDropped` hooks
4. Win/draw detection after mod effects complete

### Mod System

Mods are defined in `MOD_DEFINITIONS` object with lifecycle hooks:

```javascript
{
    id: 'modName',
    name: 'Display Name',
    emoji: '💣',
    description: 'Spanish description',

    // Hooks
    onCreate(game) { },           // Called when mod is activated
    onBoardCreate(game) { },      // Called after board reset
    async onDiscDropped(game, row, col, player) { },  // Called after disc placement
    getOccupiedPositions(game) { }  // Returns Set of "row,col" strings
}
```

**Current Mods**:
- `bombas` - Hidden bombs that remove player discs on trigger
- `jackpot` - Hidden slot that fills entire column with player's color (empty cells only)
- `michiAlien` - UFO with cat that abducts and relocates 4-5 discs from both players
- `vorticeReverso` - Black hole/white hole that swaps ALL disc colors on the board

### Async/Animation Timing Pattern

Critical pattern for game state consistency:

1. **Update board state synchronously** before any animations
2. **Animate visually** (non-blocking setTimeout)
3. **Re-render board** after animations complete
4. **Check win conditions** only after board state is fully updated

Example: `removePlayerDiscs()` updates `this.board` and `this.playerCells` immediately, then animates, then resolves Promise.

### Board Coordinates

- Grid: 9 columns (0-8) x 6 rows (0-5)
- Row 0 = top, Row 5 = bottom
- Gravity drops discs to lowest empty row in column
- Position tracking uses `"row,col"` strings for mod coordination

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | Game structure, modals (winner, champion, mod selection) |
| `game.js` | All game logic, mod system, audio (Web Audio API) |
| `styles.css` | Animations (drop, explosion, jackpot, UFO/beam, vortex), responsive design |

## Key Implementation Details

**Scoring**: Win faster = more points (10-30 per round based on move count)

**Audio**: Uses Web Audio API oscillators for sound effects (drop, win, champion, explosion, jackpot, alien, vortex)

**Win Detection**: After mod effects complete, `scanBoardForWin()` performs a **full board scan** checking 4 directions (horizontal, vertical, both diagonals) from every occupied cell. This is necessary because mod effects (like Vórtice Reverso) can create wins anywhere on the board, not just where the last disc landed.

**DOM Updates**: Uses `getCellElement(row, col)` to query cells by data attributes. `rerenderBoard()` syncs entire visual board to match `this.board` state.

## Utility Methods

**Shared utilities** available to all mods:
- `shuffleArray(array)` - Fisher-Yates shuffle, mutates array in place
- `selectRandomAvailablePosition(excludeModId)` - Returns random "row,col" string avoiding positions occupied by other mods

**Board state helpers** (critical for mods that remove/relocate discs):
- `applyGravity(col)` - Applies gravity to column with visual drop animation
- `applyGravitySyncBoardOnly(col)` - Updates `board` and `playerCells` state only, no visual changes (use before animations)
- `rerenderBoard()` - Syncs entire visual board to match `this.board` state (call after state changes complete)

## Adding New Mods

1. Add mod definition to `MOD_DEFINITIONS` in `game.js`
2. Add instruction item in `index.html` with class `instruction-{modId}`
3. Add CSS animations in `styles.css` if needed
4. Add sound case in `playSound()` method if needed
5. Update `updateInstructions()` to show/hide the new instruction
