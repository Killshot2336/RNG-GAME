# Chronos Canvas Game Client

Approved direction: stop HTML page skins; ship a **canvas game client**.

## Architecture
- Single fullscreen `<canvas>` + tiny boot CSS
- `requestAnimationFrame` game loop with `dt`
- Scene stack: `who` → `hub` → `tower` / `forge` / `tree` / `gate` / `era` / `life` / `story`
- Pointer hit-rects (not DOM buttons) for all interaction
- Assets loaded once (portraits, stage art, medallions, battle CTA, ability icons)
- Existing `chronos-data.js` content + localStorage / room sync preserved

## Feel targets
- Continuous render (parallax, particles, shake) even on menus
- Tower combat drawn as sprites on canvas, not HTML div enemies
- Audio beeps via WebAudio for strike/ult/pick
- Test hooks on `window.VoidlineChronos` for smoke (no DOM selectors)

## Non-goals (this pass)
- Full Pixi/Unity rewrite
- Live multiplayer netcode beyond existing room sync
