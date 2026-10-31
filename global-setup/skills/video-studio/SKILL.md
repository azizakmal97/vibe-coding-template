---
name: video-studio
description: Make social videos end to end on a studio PC - 3D scenes rendered in Blender, voice-over (Kokoro), music and SFX from code, editing in ffmpeg or After Effects 2023 by script (AE optional), covers and art from Google Flow, H.264 encode, hand-off to the project's approval desk. Use for any reel, Short, TikTok, YouTube video, animated explainer, thumbnail or video cover in any project. Load the project's own local media skill too (brand, voice, sources, reference build).
---

# Video studio (owner's pipeline, built 2026-10-22/23)

Start from the project's reference build when it has one (its local media skill names the path: scene.py, timeline.py, voiceover.py, soundtrack.py, ae/build_edit.jsx, ae/export_data.py, ae/render.py, cover_art.py). Copy and adapt it; don't start from zero.

## Related skills (load the ones the job needs)
- `motion-design`: what the motion looks like: retention structure, transitions, captions, safe zones, banned effects, sound cues.
- `blender-3d`: Blender running, gotchas, third-party blends (Z-Anatomy), the render review gate, AI-3D and characters.
- `poster-design`: the cover, thumbnails, Flow prompting, text in code, carousels.
- The project's own local media skill: brand, palette, fonts, voice, sources rule, reference build, Chrome profile, approval desk.

## Owner rules (all projects)
- **Work efficiently, always** (owner, 2026-10-29: "make sure to work efficiently forever"; one cartoon took ~600 tool steps and 600k tokens). Start from approved masters and earlier assets, never redraw or regenerate what the owner already approved. Measure instead of guessing (colour hex, size, timing) and correct in code instead of re-rolling Flow. Show the owner one small preview of the risky part (face, look, cover) before building the whole thing. Judge results in Chrome, and download and render only the final pick. Batch browser actions. Render once after the checks pass, not after every tweak. One worker per task, with a brief that already holds every owner rule.
- **Design, graphics and video editing run on Opus 5.5 only** (owner rule, 2026-10-25): never Sonnet, Haiku or GLM, never handed down to a cheaper subagent. Effort varies: high for a new look, the first video of a kind or the storyboard; lower for edits, covers and re-renders of a locked design.
- **"3D animation" means a real lit 3D scene**: solid models, layered reveals, a moving camera, close-ups, things moving. Lines sliding over a picture get rejected.
- **No black-outline text.** That looks like a beginner's design. Use clean type on panels or pills with soft shadows, animated in (see After Effects below).
- **Every video gets a designed cover/thumbnail**, never a random frame. On a 1080x1920 cover the title and all text stay inside the centre 1080x1350 (owner, 2026-10-26: one rule for every brand; `poster-design`).
- **Voice-over is wanted**, along with music and SFX. Retime the video to the voice; never rush the voice to fit the video.
- **The owner reviews on the project's approval desk** before anything is scheduled. Push the item the way the project's render/produce command says, and read the owner's change notes on every pass.
- **Google Flow FIRST for pictures AND video, then build it yourself where Flow is wrong** (owner, 2026-10-22/23/25, repeated 2026-10-29 because it kept getting lost: "we can use flow to generate images and videos, if video not good or not accurate, u can make yourself using codes, blender and all the repos i gave u"). The order is:
  1. Generate the hero images and clips in Flow (Chrome, the project's profile). If several posts need Flow, queue them on the one browser; never drop Flow to save time.
  2. Wherever Flow is inaccurate (anatomy, geometry, text, holy-site details) or the clip looks weak, rebuild that part in code (PIL, SVG, HyperFrames, drawn-by-code), in Blender, or with a tool from the toolbox below, and composite it.
  3. Licensed photos and pure code drawing are for what Flow can't do truthfully, such as a real place in a factual claim, or charts.
- **Toolbox the owner gave** (use it; don't fall back to a plain template): HyperFrames (reels), drawn-by-code (line drawing, GPU render), Blender 5.2 with Z-Anatomy and TRELLIS image-to-3D (`blender-3d`), awesome-seedance `timeline-shot-script` (beat sheets), cloveric drawing styles, golden-temple QA checks, Rhubarb Lip Sync (talking cartoon mouths), ElevenLabs (Malay VO), Kokoro (free VO), After Effects 2023 by script. Keep the licence credits the assets need (for example "Anatomy: Z-Anatomy (CC BY-SA 4.0)") in the caption or description.
- **Talking cartoon reels of a real person** (owner, 2026-10-29). The person's exact look (approved master, skin hex, clothes, eyes) lives in the project's local media skill, never here. Method:
  1. Never redraw the face. Flow-edit the person's approved cartoon for clothes, pose and gestures only, paste the original face back in code, and change only the mouth (talking states) or eyelids (blink).
  2. Take the skin colour from a real photo of the person: measure it, set it in code on every frame, and show the person a phone-size preview next to their photo before the build.
  3. Add hands and body movement (explain, point and count gestures on key words, a gentle sway), and check the fingers at full size.
  4. No self-introduction and no greeting: the first words are the hook.
  5. If a note about looks could mean two things ("eyeliner", "hair out of the cap"), ask in one line before changing anything.

## Prompt method (owner's prompt pack, 2026-10-23)
- **Storyboard blocks:** write every storyboard as fixed blocks: BRAND (HERO, SET, RESULT), FORMAT, BEATS, CAMERA, LOOK, CHECKS. BRAND is the only block you swap for the next video.
- **Beats:** every beat changes something on screen. Cut any beat that doesn't. Narrated parts follow the VO word times; a BPM grid only where there is no voice (`motion-design`).
- **One timeline:** `timeline.py` holds every event in seconds and the layout in pixels. Blender, the overlays and the sound all read it.
- **Text and panels:** make them in HTML (screenshot in a headless browser at 2–3x) or in PIL, not in the 3D scene or the editor.
- **Editor:** After Effects is optional. ffmpeg, Premiere, CapCut or OpenCut are fine.
- **Checks before GPU time:**
  1. an overlay contact sheet;
  2. 12–18 half-res stills;
  3. the full render, then re-render only the frame ranges that fail;
  4. loudness per half second.
- **Follow-ups:** short and numeric, recorded in `log.md`.
- **Glossy panels:** they mirror area lights. Hide the lights from glossy rays, and set specular ~0.1 and roughness ~0.3.
- **Review also:** full-size crops of eyes, lids, hands and skin seams; frame-to-frame pop-ins; highlighted regions covering the whole structure.

## Pipeline
1. **Storyboard** (Opus): shots with story times, the on-screen line per shot, and the VO line per shot. Facts follow the project's source rules, and the FYP sound per platform (Music and SFX → FYP music).
2. **3D** (Blender 5.2, `blender-3d`): build the scene by script, render transparent PNG frames.
3. **Timeline**: one `timeline.py` maps story time to reel time (piecewise per shot). Every script reads it.
4. **Voice-over**: Kokoro, one clip per shot. Check that each clip fits its shot; if not, lengthen the shot.
5. **Soundtrack**: music bed + SFX synthesised in numpy, ducked about 8 dB under the voice, loudnorm to -14 LUFS.
6. **Edit** (ffmpeg + PIL overlays, or After Effects by script; any editor is fine): the frames over a background, captions, labels, tags, the end card.
7. **Encode**: ffmpeg, H.264 about 3 Mbps + AAC 160k, faststart. Keep it under the approval desk's asset limit (the project names it). For Meta Business Suite upload through Claude in Chrome the file must be under 10 MB: make a second two-pass encode (~1.9 Mbps for 36 s) from the editor's master, not from the 3 Mbps file.
8. **Cover**: Google Flow illustration (or a hero render) plus a title via PIL (`poster-design`).
9. **Review gate**: an 8-frame contact sheet across all shots, then a full-size crop of every label, valve or critical detail, plus `ffprobe` and loudness. Fix before sending to the desk. Say plainly that you didn't watch it on a phone.

**Reel cut of a carousel** (2026-10-30): on Instagram, carousels reach mostly followers and reels reach non-followers (two accounts: carousels 5 to 101 reach, reels 40 to 1,847). `python scripts/slideshow_reel.py out/reel-cut.mp4 <slides in order> --seconds 18 [--audio <licensed track>]` puts each approved slide, untouched, over a blurred copy of itself (never flat borders, which Instagram suppresses), about 2 s a slide (`--seconds` = 3 × slides for dense slides), and fades back to slide 1 so it loops. Without `--audio` the track is silent, so add the platform's trending sound in the app. Skip the cut when most slides are mostly text, since majority-text reels are suppressed. Check frames at 0.5 s, the middle and the end.

**The reel cut comes out silent: never post it as it is** (owner, 2026-10-31: "why u post without sound in Instagram?"). Mux a licensed track under it: `ffmpeg -i reel-cut.mp4 -i <track>.mp3 -filter_complex "[1:a]atrim=0:18,asetpts=PTS-STARTPTS,loudnorm=I=-20:TP=-3,afade=t=in:d=1,afade=t=out:st=16:d=2[m]" -map 0:v -map "[m]" -c:v copy -c:a aac -b:a 160k -shortest reel-cut-ig.mp4`. Rotate tracks between posts. Check `-af volumedetect`: max_volume must be above -20 dB.

## Blender for video scenes
Running Blender, the stale-transform blank render, Standard view transform, EEVEE transparency, solidify spikes, chunked long renders and Z-Anatomy baking are in `blender-3d`. Video-only notes:
- Run: `blender.exe --background --factory-startup --python scene.py -- --frames 0-787 --scale 100 --samples 48`.
- Things moving along vessels: keyframe the location per sample with LINEAR interpolation. Grow a fill along a path with `bevel_factor_end`. Valves are shape keys (closed→open).
- Close-ups read best side-on from 2–3 cm, lens 50, with no DOF and clutter hidden (`hide_render` keyframes).
- Timing: about 1.4 s per 1080x1920 frame at 48 samples on an RTX 3060, so 788 frames take about 19 min. Smoke-test 6 frames at 25% first.

## Reference study and surgery scenes (2026-10-25)
- **Study references before a new procedure video.** Search YouTube in Chrome, then sample each video into a contact sheet inside the page: seek the `<video>` to set times, `drawImage` each frame onto a canvas grid, show the canvas full-window, take one screenshot. Note what the most-watched ones share (camera, materials, step order, pacing). Use them for staging only; copy nothing.
- **Surgery reads best in the surgeon's view**: one close fixed camera on the site; everything opaque, one plain material each (pink gum, matte beige bone, white tooth, steel); the flap opens at its incision line; a trough in the bone; cut lines; pieces out one at a time; a dark socket; stitches. Avoid stacked see-through layers (glass bone with ghosted teeth), which read as "weird".
- **When the real anatomy mesh blocks that view, build an idealised site model** for that section and swap it in while the camera moves. Holes (trough, socket) are alpha holes in a closed block whose back faces are painted darker; side walls are painted gum. The project's local skill names its reference script.
- A round inset (a cutaway still cropped to a circle with a white ring, popped in over the question) shows what's hidden under the gum. Small "satisfying" details (bone dust off the bur, pieces flying up the screen) are what make these clips spread.
- New geometry gets the full-size seam review in `blender-3d` → Review gate.

## Voice-over: Kokoro (Apache 2.0, local)
- `uv run --no-project --python 3.11 --with "kokoro>=0.9.4" --with soundfile --with "misaki[en]" python -I -X utf8 voiceover.py`. The `-X utf8` matters: the Windows console crashes on phoneme output.
- Voices: `af_heart` (best, female, US), `bf_emma`, `bm_george` (UK). Print the phonemes to check medical words.
- Kokoro has **no Malay**. For Malay VO use the project's own voice, or check a TTS licence for commercial use before using it.

## Music and SFX
Synthesise them in numpy (pads, plucks, bells, whooshes, thumps, bubbles); there is no licence to track. Duck under the voice with a smoothed speech mask. Mux with `-af loudnorm=I=-14:TP=-1.5:LRA=11`. Projects with licensed music keep their own levels (the local skill names them).

### FYP music: a trending sound, added in the app (owner, 2026-10-26)
Every reel or TikTok gets a sound that suits the For You page, but **only from the platform's own licensed library, added inside the app**. Never download a trending song and mix it into the file: it gets muted or blocked, and a business account is not licensed for it.
- **Pick it at the storyboard**, not after the render: a sound trending now on that platform that fits the mood and pace (the beats can sit on its BPM where there is no voice). Instrumental, or lyrics that never fight the VO.
- **Research a viral sound for every post; never reuse the default** (owner, 2026-10-30: "why u always put same soundtrack? … i have told u before to search for viral sounds/music"; the jobs had picked the same saved Favorite for every post). On tiktok.com (or Instagram) search the post's topic in the Photo and Video tabs, collect the sounds used by the most-viewed recent posts, then open each candidate's sound page and read its use count ("N videos"): pick one used by tens of thousands of videos or more that fits the mood (a nasheed, vocals-only or instrumental track for religious posts). On TikTok web the hook trick: patch `XMLHttpRequest`/`fetch` on the search page to keep the `search`/`item_list` JSON, scroll, and read `music.title`, `music.id` and `stats.playCount` per post (sound pages are `/music/x-<id>`). Never use a sound the account used in its last 5 posts. Write `sound: <title> — <artist>, <N> videos, <link>, seen <date>` in `brief.md` at production, and at posting search the picker by that exact title and match the cover art.
- **The For You list is only a fallback** when research finds nothing that fits; it never replaces the research step. TikTok web has no Favorite button for sounds, so don't rely on Favorites either: search the picker by the sound's name.
- **Only sounds cleared for business use.** TikTok: the Commercial Music Library (the TikTok Creative Center's trending songs, filtered to "approved for business use"). Instagram: the audio the account's own Reels audio picker offers, which for a business account is the licensed set; prefer the ones marked trending. Check the account type once and write it in the local skill.
- **Write it down** in `brief.md`: the sound's name, artist, platform, its link, and the date seen trending (trends last days, so re-check on posting day).
- **Two audio mixes:** the master keeps VO + SFX + the code-made bed (the fallback); a second mix keeps VO + SFX only, for when the app sound goes on top. In the app, set the added sound low (about 10–20 %) so the voice stays on top.
- **Where it gets added:** the post is scheduled through the project's scheduler. Before relying on it, check once whether that scheduler can add the platform's sound to a reel, and record the answer in the local skill. If it can't, post with the master mix and flag in the approval desk "add <sound> in the app".
- Different sound per platform is fine: TikTok and Instagram trend separately.
- The project's own rules come first (for example a brand that avoids music for some topics).

## After Effects 2023 by script
- Run: `"C:/Program Files/Adobe/Adobe After Effects 2023/Support Files/AfterFX.com" -noui -r build_edit.jsx`. About 2 min for a 36 s 1080x1920 comp.
- One AE at a time: `-r` hands the script to an AE that is already running, and two jobs exporting at once fail with error 9988 (seen 2026-10-25). Before the AE step run `tasklist | grep -i afterfx`, and wait until it has exited.
- `app.newProject()` silently kills the script under -noui. Use the open `app.project`, call `app.beginSuppressDialogs()`, wrap everything in try/catch, and log to a file (no console).
- ExtendScript has no JSON: write the data as a JS literal (`var EDIT = {...};`) and `#include` it.
- Output template `"H.264 - Match Render Settings - 40 Mbps"` exists, then re-encode with ffmpeg and add the audio.
- Fonts by PostScript name (the local skill names the house fonts). Point text doesn't wrap, so break lines in Python with the same font metrics and join with `\r`.
- Centre text with an anchor expression `sourceRectAtTime`. Auto-size panels and pills with a rect-size expression from the text layer.
- A shape layer whose path uses comp coordinates (leader lines with `createPath`) must sit at position and anchor [0,0].
- Per-word reveal: Text Animator with Position [0,26,0] + Opacity 0 and a Range Selector (Based On = words, Shape = ramp up), animating Start 0→100.
- Moving labels: per-frame `setValuesAtTimes` from the Blender camera's projected anchors (`world_to_camera_view`, exported to JSON).
- Caption panels: type on a white ~90% rounded panel with a soft drop shadow and a small accent bar, popping in at 92→100% scale; labels and tags as pills. The house fonts, sizes and colours are in the project's local skill.

## Google Flow (flow.google.com)
Reuse your Flow tab for every generation, and close every tab you opened when you finish (`social-posting` → Chrome). Parallel workers may each have their own tab.
Download only the results that match the request (owner, 2026-10-29: "only download picture that match your request only"). Judge each variant inside Chrome (screenshot, the zoom action, or open it large in Flow; owner: "why u have to download all to see? just see in chrome"), download only the one you use, never every variant, and delete rejected downloads before you report.
Chrome use, the chat-panel prompt, Download → 2K, the reference-upload patch and the "Rights to use this image" consent are in `poster-design` → Flow in Chrome. Flow invents labels and gets anatomy wrong: put titles on with PIL and keep exact anatomy in Blender.

## Project bindings
Each project keeps its own local media skill that points here: brand palette and fonts, caption language, sources rule, anatomy source and where its copy lives, the voice, music levels, reference build, Chrome device, and the approval-desk hand-off. That skill wins over this one.
