# Conecta Caos

Connect 4 gone wild. Drop discs, trigger mods, embrace the chaos.

## Play Now

[Play on GitHub Pages](https://aazbeltran.github.io/pocket-thunder/conecta-caos/)

## What is This?

A chaotic twist on Connect 4 where hidden mods turn every game into unpredictable mayhem:

| Mod | What It Does |
|-----|--------------|
| Bombas | Hidden bombs explode and remove your discs |
| Jackpot | Fill an entire column with your color |
| Michi Alien | A UFO with a cat abducts and relocates discs |
| Vortice Reverso | A black hole swaps ALL disc colors on the board |

First to 120 points wins the championship. Win faster = more points per round.

## Quick Start

```bash
# Clone and run locally
git clone https://github.com/aazbeltran/pocket-thunder.git
cd pocket-thunder/conecta-caos
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## How to Play

1. Select up to 2 mods before the game starts
2. Click a column to drop your disc
3. Connect 4 in a row (horizontal, vertical, or diagonal) to win the round
4. Watch out for hidden mod triggers
5. First to 120 points wins

## Tech Stack

- Vanilla JavaScript (no frameworks, no build step)
- CSS animations for all the chaos
- Web Audio API for sound effects

## Project Structure

```
conecta-caos/
├── index.html   # Game structure and modals
├── game.js      # All game logic and mod system
├── styles.css   # Animations and responsive design
└── CLAUDE.md    # AI assistant context
```

## Adding New Mods

1. Add mod definition to `MOD_DEFINITIONS` in `game.js`
2. Add instruction item in `index.html` with class `instruction-{modId}`
3. Add CSS animations in `styles.css` if needed
4. Add sound case in `playSound()` method if needed
5. Update `updateInstructions()` to show/hide the new instruction

See `CLAUDE.md` for detailed architecture documentation.

## Part of PocketThunder

This is a [PocketThunder](../) experiment - playful, messy, learning-first.

## License

MIT
