---
name: motion-design
description: The general motion-graphics playbook for short vertical videos - retention structure, VO-timed beats, a small transition grammar (GSAP recipes and HyperFrames registry items), kinetic captions, safe zones, banned cheap effects, sound cues and the still-by-still review. Use whenever you design, build or fix a reel, Short, TikTok or animated explainer in any project. Load it with video-studio (the pipeline and tools) and the project's own local media skill (the brand rules).
---

# Motion design: making a reel look premium, not a slideshow

This skill decides **what the motion looks like**. The tools and the pipeline (Blender, VO, SFX, After Effects, encode) are in `video-studio`. Brand rules (palette, fonts, voice, hook examples, house mask shape, sound levels, the project's pinned tool versions) live in the project's own local media skill or CLAUDE.md and win over this file.

Research behind it (2026-10-22): heygen-com/hyperframes skills `motion-doctrine` + `cut-the-curve` (Apache-2.0), the yihui-dev/awesome-opus5-5-videos prompt collection (ideas paraphrased, prompts belong to their creators), and motion-design write-ups (GSAP eases, Ken Burns, Vox/Johnny Harris map work, short-form retention).

## Owner rules (all projects)
- **Design, graphics and video editing run on Opus 5.5 only** (owner rule, 2026-10-25): never Sonnet, Haiku or GLM, never handed down to a cheaper subagent. Effort varies: high for a new look, lower for an edit to a settled one.
- **No black-outline text.** Clean type on panels or pills with soft shadows (owner rejected outlined text, 2026-10-22: "looks like noobs design").
- **"3D" means a real lit scene** with a moving camera. Lines sliding over a picture get rejected (owner, 2026-10-22/23).
- **Every beat changes something on screen.** Cut a beat that changes nothing.

## 1. Structure (retention)
| Time | Beat | Notes |
|---|---|---|
| 0–2 s | **Hook** | Strongest line + strongest image on frame 1. Readable with sound off. No greeting or "today we…" opener |
| 2–8 s | Where / context | Map or location push toward the spot, or the set-up of the problem |
| 8–35 s | Story | 4–6 beats, one idea per shot |
| 35–42 s | **Evidence** | The source on screen: page push + highlight sweep, or a reference card |
| 42–47 s | Payoff | One line, held still ~0.4 s before it lands |
| 47–52 s | CTA | 3–5 s end card, no long sign-off |

- **The VO is the clock.** Time every visual change to faster-whisper word timestamps, not to a fixed grid. Start moves ~0.05–0.1 s before the word so they land on it. A BPM grid (120 BPM = 0.5 s) is only for parts with no voice (opening sting, end card).
- Change the visual when the idea changes: shots 1.5–4 s; a shot may hold 6–8 s only if something keeps developing inside it (push toward a detail, a label drawing on).
- Hook formulas: paradox, location ("you may have walked past this"), number, question answered later (open loop).
- Something meaningful must be mid-flight at any paused second. No dead holds > 0.5 s except the deliberate pre-payoff stillness.
- **Retention numbers (insights, 2026-10-25: a 36 s reel averaged 7 s watched):** the answer starts by 3 s, something changes on screen every 1–1.5 s, 20–35 s unless the topic needs more, and the last frame leads back into the first.

## 2. Visual grammar (pick a small set and repeat it)
Use **at most 3 transition types per reel**, chosen up front, and one travel direction for the whole film (never ping-pong).

| Technique | Recipe (GSAP) | HyperFrames registry item (`npx hyperframes@<pinned> add <name>`) |
|---|---|---|
| Camera never stops | every photo scene: scale 1.03→1.10 over the shot, xPercent drift ±2–4, `sine.inOut`; vary direction per shot; motivated (push toward what the VO names) | `push-in` |
| 2.5D parallax | cut 2–3 layers (bg / mid / fg PNG, feather 1 px); bg 1.05→1.10 x −10, mid 1.0→1.08 x −25, fg 1.0→1.15 x −50, 3–6 s `sine.inOut` | `camera-rig-depth-stack`, `parallax-zoom` |
| Main scene change: cut-the-curve | out: x 0→−130 px `power4.in` ~0.3 s; hard cut at peak velocity; in: x +130→0 `power4.out` ~0.3 s | `cut-the-curve` |
| Sub-point: zoom-through | out: scale 1→1.2 + blur 0→18 px `power3.in` 0.2 s; in: scale 0.75→1 + blur 18→0 `expo.out` 0.5 s. Blur the wrapper, never children | `zoom-through-transition` |
| Location / time jump: whip | ~0.3 s centred on the cut, directional SVG blur | `whip-pan-cut` |
| Payoff: inverse zoom | out 1→0.8, in 1.25→1 | — |
| Mask reveal | `clip-path: inset(0 100% 0 0)`→`inset(0)` 0.6–0.9 s `expo.inOut`; give the brand one house mask shape | `svg-mask-reveal`, `iris-reveal` |
| Kinetic captions | 2–5 words per burst, word y 40–80→0 `power4.out` 0.15–0.3 s, opacity set (no fade); ≤1 emphasised word per line (accent colour + scale punch 1→1.12→1 `back.out(1.7)`) | `per-word-rise`, `kinetic-center-build` |
| Evidence page | page on paper texture, rotate ±1.5°, soft shadow; push to the line; rest of page dims to 40% or blur 4 px; highlight bar scaleX 0→1 `power2.inOut` 0.5 s, `mix-blend-mode: multiply` | `marker-highlight`, `focus-rack` |
| Map route | SVG path draw (stroke-dashoffset → 0) 1.5–3 s `power2.inOut`; pin drop `back.out(1.7)` + pulse ring; camera scales/translates the map group | `svg-stroke-trace` |
| Number | tween value with snap 1–1.5 s `expo.out`, land with small scale punch | `count-up` |
| Calligraphy / line art | outline draws, then fill fades in | `svg-stroke-trace` |
| Unifying texture (always) | film grain 6–10% `overlay`, vignette, one slow warm light sweep on key reveals | `grain-overlay`, `vignette`, `light-sweep-pass`, block `light-leak` |
| Living photo (water, sky) | one feathered moving region in a still | block `cinemagraph` |

Eases: `.out` for entries, `.in` for exits, `.inOut` for camera. Allowed: power2–4, expo, sine, `back.out(1.4–1.7)`. **Banned**: `bounce`, `elastic`, linear camera moves.

## 3. Banned (looks cheap)
Particles, lens flares, glow, bloom, RGB split, glitch, white flashes, crossfades between every shot, camera shake (except one ≤8 px hit on the single biggest impact), spinning 3D cards, glassmorphism, paragraphs on screen, every word animated, idle breathe/float loops, the same zoom on every photo, upscaled low-res images, `will-change` on anything the camera scales (blurry text), opacity/filter on `preserve-3d` elements.

## 4. Captions and layout
- **Safe zones (one set for every brand, 2026-10-26, the strictest of all earlier notes):** no text in the top 270 px, bottom 420 px or right 120 px of a 1080x1920 frame. Never let a line run off screen.
- **Never cover a face.** Put the caption above the head, or below the chin in close-ups.
- Story reels with characters: 1–4 words per group on the voice, each group pops in (small → slightly bigger → normal), the spoken word highlighted, one accent colour per character, the punchline bigger.
- Make text, panels and labels outside the 3D scene: HTML screenshotted at 2–3x, or PIL. Changing a word is then a 30 s re-composite, not a re-render.
- Keep one palette with fixed roles across a reel (for example one neutral colour, one for "wrong", one for "correct"); the project's local skill names the colours.

## 5. Sound cues
- Whoosh peak exactly on the cut (place by the sound's peak, not its file start).
- Riser 1–2 s → 0.3 s silence → key line / reveal.
- Low hit on the evidence reveal and pin drop; soft tick on word pops; nothing on every graphic.
- Music always under the voice, ducked; check on a phone speaker at half volume. Levels: `video-studio` → Music and SFX, or the project's own rule.

## 6. Process
1. **Brief** (`brief.md`): beat table with VO timestamp, shot, image file + licence, transition, sound cue. Choose the 3 transitions up front. Name every part and the state it is in ("sinus glowing red at 8 s").
2. **Images:** aim for 6–10 distinct visuals per 50 s. Prepare parallax layers for 1–2 hero photos.
3. **Build** (HyperFrames: `hf/index.html`); set every from-state at t = 0 so any seek is safe.
4. **Stills before the render:** `hyperframes check`, then `snapshot --at` one still per beat (8–12), read as one contact sheet: cramped, overlapping, unreadable or in a UI zone → fix first.
5. **Render**, then pull 6 frames from the MP4 (`ffmpeg -ss <t> -frames:v 1`) to confirm motion blur and text sharpness. When a fix touches only some shots, re-render only those frame ranges.
6. **Colour and contrast check** (owner, 2026-10-25: "looks pale"): on 8 frames at 540 px wide, luminance stdev ≥ 30 and mean HSV saturation ≥ 32. Pale subject on pale paper fails: deepen the background behind it, add a key light with shadows and a rim, keep one saturated element on screen.
7. **Cover:** a designed cover, never a grabbed frame (`poster-design`).
8. Write each round in the post's `log.md` as short numeric fixes ("hook text 96 → 120 px"). Expect about three rounds. Say plainly if nobody watched it on a phone.

## 7. HyperFrames gotchas (verified 2026-10-22)
- Env for every call: `HYPERFRAMES_SKIP_SKILLS=1 DO_NOT_TRACK=1`. Pin the version the project uses.
- Render with `-w 2`: the auto worker count got the render killed for low memory; 2 workers took 3 min for 62 s.
- Film grain bloats CRF encodes (crf 20 gave 31 MB for 62 s): encode two-pass at a fixed bitrate instead (the project's numbers).

## Related skills
- `video-studio`: pipeline, Blender video scenes, Kokoro, SFX, After Effects, Flow, encode, hand-off to the approval desk.
- `poster-design`: covers, thumbnails, carousels, single posters.
- `blender-3d`: modelling, AI-3D meshes, Blender gotchas, the render review gate.
