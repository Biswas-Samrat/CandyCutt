# Candy Snip Saga — Audio Assets Manifest

Please place the following audio files inside this folder (`public/assets/audio/`) before deploying or launching the game:

| Filename | Description | Formats | Target Duration |
|---|---|---|---|
| `music-menu.mp3` | Upbeat candy-themed menu loop | MP3, 128kbps | ~30s-1m (loop) |
| `music-gameplay.mp3` | Focused gameplay| MP3, 128kbps | ~1m-2m (loop) |       (Complit)
| `music-victory.mp3` | Short victory fanfare jingle | MP3, 128kbps | ~3s-5s |     (Complit)
| `music-tension.mp3` | Tense 5-second countdown loop | MP3, 128kbps | ~5s (loop) |     (Complit)


| `sfx-cut.mp3` | Satisfying pin-through-candy slice | MP3 | < 1s |   (Complit)
| `sfx-crack.mp3` | Candy breaking/cracking | MP3 | < 1s |   (Complit)
| `sfx-success.mp3` | Candy cleared successfully | MP3 | ~1s |   (Complit)
| `sfx-fail.mp3` | Boundary violation failure | MP3 | ~1s |   (Complit)
| `sfx-button.mp3` | UI button click | MP3 | < 0.5s |  (Complit)
| `sfx-countdown.mp3` | Per-second countdown tick | MP3 | < 0.5s |  (Complit)
| `sfx-confetti.mp3` | Level complete celebration | MP3 | ~2s | (Complit)
| `sfx-achievement.mp3` | Achievement unlock chime | MP3 | ~1.5s | (Complit)

## Graceful Degradation
The `AudioManager` class automatically checks if assets are loaded into the Phaser Cache before attempting playback. If any or all audio files are missing, the game will operate normally without throwing any errors or warnings.
