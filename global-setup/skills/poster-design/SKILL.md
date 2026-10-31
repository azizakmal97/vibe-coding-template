---
name: poster-design
description: Covers, thumbnails, carousels and single posters - the designed reel cover (never a frame grab), one cover safe area for every brand, text set by PIL or HTML instead of the image model, Google Flow / Nano Banana Pro prompting and its failure modes, Blender or code for exact geometry, licensed photos, and the contact-sheet and full-size-crop review before anything goes to the approval desk. Use for any cover, thumbnail, carousel slide, poster or Story image in any project. The project's own local media skill holds the brand.
---

# Poster design: covers, thumbnails, carousels, posters

Brand rules win over this file. The project's own local media skill or CLAUDE.md names its locked style block, palette, fonts, brand mark and handle, cover script, carousel helpers, Chrome profile and approval desk.

## Owner rules (all projects)
- **Work efficiently, always** (owner, 2026-10-29: "make sure to work efficiently forever"; one cartoon took ~600 tool steps and 600k tokens). Start from approved masters and earlier assets, never redraw or regenerate what the owner already approved. Measure instead of guessing (colour hex, size, timing) and correct in code instead of re-rolling Flow. Show the owner one small preview of the risky part (face, look, cover) before building the whole thing. Judge results in Chrome, and download and render only the final pick. Batch browser actions. Render once after the checks pass, not after every tweak. One worker per task, with a brief that already holds every owner rule.
- **Design, graphics and video editing run on Opus 5.5 only** (owner rule, 2026-10-25): never Sonnet, Haiku or GLM, never handed down to a cheaper subagent. Effort varies: high for a new look, lower for an edit to a settled one.
- **Every video gets a designed cover, never a random frame** (owner, 2026-10-22/23: "thumbnail video mesti menarik", for good): the strongest image (Flow illustration, a hero render or a licensed photo) plus a short bold title (2–5 words), readable at grid size.
- **Picture-led, never text-majority** (owner, 2026-10-26): every slide, poster and cover is led by a big picture (photo, render, illustration) or an infographic (diagram, chart, map, timeline). Text is a short line or two set on it. A slide whose text panel covers more of it than the picture does gets redone, e.g. a paragraph in a box with a small photo beside it. Long explanations go in the caption.
- **No black-outline text.** Clean type on panels or pills with soft shadows.
- **The key line is the brightest thing on the slide** (owner, 2026-10-29: "why u always using dim colours for important things"). The line the post exists for (the name, the number, the answer) gets the highest contrast: white or a saturated accent on a dark panel, or near-black on a light one, at the largest size. Never a muted gold on dark. Check it at phone size before the desk.
- **A different look for every post** (owner, 2026-10-29: "WHY u always using the same theme/colour palette/video creation style for each content"). The brand is the logo, handle, voice and fonts, not one palette. Before designing, read the `look:` line in the briefs of the account's last 3 posts and pick a look that differs in palette AND treatment AND motion; write `look: <name>, <palette hexes>, <treatment>, <motion>` in this brief. Directions to rotate (extend them, never the same twice in a row): bright daylight photo-led with white type; night or lamp-lit with one saturated accent; flat illustration (Flow) in a bold two-colour palette; map or diagram infographic (drawn-by-code line or paper-cutout); textured editorial (paper, ink, collage); clean minimal (one big photo, one line). A project file that fixes a single palette is a starting point, not the rule.
- **The bar is amazing, beautiful, mind-blowing, interesting and eye-catching** (owner, 2026-10-29, "this is rules for all contents"). A tidy template layout is not enough: each post needs a hero visual that stops the scroll (a striking photo crop, a bold Flow illustration, a dramatic diagram or a 3D render), a confident palette and real depth (layering, light, texture). Compare it against the best posts in the niche before the desk; if it wouldn't stop your own thumb, redo it. The owner rejected emerald and cream (Fraunces on a green panel) and dark ink-blue with coral on 2026-10-29: don't reuse them.
- **Never reuse a picture an earlier post used** (owner, 2026-10-29: "the door picture is already been used before"). Before picking a photo, grep the account's earlier briefs, captions and credits for its file name or author, and pick another. A fresh crop of the same photo counts as reuse.
- **Google Flow FIRST** for hero pictures on every post and cover; rebuild only the inaccurate parts in code or Blender (owner, repeated 2026-10-22/23/25/29; full order and the owner's toolbox in `video-studio` → Owner rules). Free open-source tools may generate any other material. Keep the licence credits the assets need.
- The owner approves every post on the project's approval desk. The cover goes there as its own media item, after the video.

## 1. Sizes and safe areas
**One cover rule for every brand (owner, 2026-10-26: "i want one rule"):** on a 1080x1920 cover, the title and all text stay inside the **centre 1080x1350 (4:5)**. That box sits inside both the IG grid's 3:4 crop and the 4:5 feed crop.

| Item | Size | Keep text inside |
|---|---|---|
| Reel cover | 1080x1920 | the centre 1080x1350 (rule above) |
| Carousel slide / single post | 1080x1350 (4:5) | generous margins; nothing overflows a card edge |
| Square poster | 1080x1080 | — |
| Story | 1080x1920 | out of the top 270 px, bottom 420 px and right 120 px (the one safe-zone set, 2026-10-26, `motion-design`) |

**TikTok photo posts cover the slide** (owner, 2026-10-31: "qr placement is bad. it's covered with this people like"). On a 1080x1350 slide shown on TikTok, keep anything people must read or scan out of: the **bottom-left 300x420** (the stack of liker avatars), the **right 150 px** (like, comment, save, share buttons) and the **bottom 220 px** (caption). Put a QR code or CTA in the **upper-middle** of the slide: QR centred horizontally, between y 420 and y 900. Credits and fine print may sit low; they are allowed to be covered.

- Flow offers portrait 3:4 only for images (Download → 2K = 1792x2400). Ask for "the paper/scene fills the canvas edge to edge" and crop to the target size in code (3:4 → 1080x1350) rather than asking for empty bands.

## 2. Text goes on in code, not in the image model
- Flow invents labels and gets anatomy wrong. For art, prompt "The image contains no text" and set titles, labels and credits in PIL or HTML.
- **Flow cannot follow a described anatomic path** (2026-10-30): asked twice for a nerve passing over two vessels, Nano Banana Pro drew it under them and ran the vessels along the border. Generate the hero WITHOUT those structures (an edit "remove every vessel, nerve and line, keep everything else" works), read the landmarks off a grid overlay, and draw the structures in code with rounded shading and tapered ends.
- **Uploading an image to Flow** raises a "Rights to use this image" dialog that the agent may not accept. Use text-only prompts, or ask the owner to accept it once.
- HTML route: a page at the exact pixel size, fonts from Google Fonts, the image as a data URI, screenshotted with headless Chromium (Playwright). A good cover page: background photo with `object-position`, a darkening gradient you can override per cover when the photo is busy behind the title, a vignette, an optional tilted card image, kicker pill, top line, big title, sub line, logo + handle.
- Video titles and overlays: PIL or HTML at 2–3x (`video-studio`).
- When a whole poster must be made in the image model (a sketchnote slide, a Nano Banana Pro poster):
  - write "The ONLY words on the page are: …" and list every line, or Flow adds labels nobody asked for (2026-10-22);
  - give all text "spelled exactly as written", in one language;
  - keep image text short; long paragraphs go in the caption;
  - spelling on the image must match the brief exactly.
- Nano Banana Pro may still change a QR code or text. For a QR that must scan, paste the real QR in code, and scan it.

## 3. Prompting Flow / Nano Banana Pro
- Paste the project's **locked style block** into every prompt (style, palette with colour roles, watermark, aspect, NEGATIVE list). Keep the colour grammar consistent across slides.
- Attached images: say what each one is and how to use it ("IMAGE 1 = the book cover, shown intact and unaltered; do NOT redraw it"). References strongly steer output; say exactly what to copy and what not to. Don't invent things about reference images.
- Describe shapes literally. Diffusion models cannot hold "rotated 180°" or "mirror" ("arrowhead pointing down", "mountain with flat base on the line"). Spell arrow directions out ("arrow points INTO the cavernous sinus").
- Curved shapes in cross-section fail repeatedly; straight 45° tips with a dashed guide line worked.
- Edits in Flow regenerate the whole image, so protected areas can drift. Compare against the approved reference after every edit. When the owner says a part is correct, keep ONLY that part fixed.
- **Max 3 attempts per failure.** After 3, stop on that item, keep the best, and fix it another way: draw the part in Blender or code and composite it in (a full-slide-size transparent render in slide pixels, then paste it over a clean background patch; take the clean band from rows with no text, since descenders sneak in), or Canva. Only when that still fails, flag exactly what's off for the owner.
- Never mark clinical or technical geometry done on your own judgement alone; present it to the owner.

### Flow in Chrome (flow.google.com, 2026-10-23)
- Use only the Chrome browser the project names (its CLAUDE.md or local skill gives the device id).
- Type into the chat panel: "Create 3 versions of one image, portrait 3:4 …". Wait about 60–90 s. Open each image to review, then Download → 2K.
- Uploading a reference: there is no file input until "Upload media" is clicked, and that opens a native picker. Patch `HTMLInputElement.prototype.click`/`showPicker` in the page to keep the input, click Upload media, then `file_upload`. Flow then asks you to confirm "Rights to use this image": that is agreeing to terms, so get the owner's OK per project (the local skill records any standing OK).
- Don't press Flow's back arrow or navigate while a generation runs: it cancels it. Return to the project by its URL.
- If Chrome screenshots time out on Flow, click an empty area of the page first.
- "We noticed some unusual activity" after pressing generate is Flow's usage cap, not bot detection (owner, 2026-10-30: it happens to them by hand too). Wait a minute and try again; the earlier attempt often finished anyway, so check the image's history panel first.
- Widening a picture (outpaint): paste the original on a bigger white canvas, upload it, prompt "Outpaint only: fill the plain white margins … keep everything already drawn exactly identical". Flow returns its own size: resize back, then paste the original pixels over it with a feathered edge. If Flow redrew a limb the original cut off, keep the original only above that limb, or he gets two hands (2026-10-30).
- Log the tool and prompt in the brief. Turn on the IG AI label where the project says so.

## 4. Photos
- Only own, the project's, or licensed photos (Wikimedia Commons: check each file; Unsplash; Pexels). Never swap in a different photo from the one the brief lists; if one fails to download, flag it.
- Credit author and licence on the slide and in the caption ("Photo: <author>, Wikimedia Commons, CC BY 4.0").
- Never upscale a low-res image.

## 5. Carousels
- Slide 1 is the hook and says the one message plainly; the last slide is the CTA (save / follow / comment keyword, per project).
- Pictures first, few words. Every slide carries a real photo, a designed graphic or diagram, or 3D (owner, 2026-10-23: no plain text card), and that picture or infographic is the biggest thing on the slide (owner rule above, 2026-10-26).
- Every slide carries the project's brand mark and handle where its CLAUDE.md says.

## 6. Review before the approval desk
- At grid size, the picture or infographic reads first and the text second. Text-majority slide: redo it before it goes to the desk.
1. A **contact sheet** of all slides (or cover + video frames) at phone size: message on slide 1, hierarchy readable, nothing in a UI zone.
2. **Full-size crops** of every number, label and card edge: nothing overflows, no garbled letters, the watermark is there.
3. Check against the brief's pass checklist; log pass/fail per item in the post's `log.md`.
4. Copy on the image (titles, labels) passes the project's antislop check like the caption.
5. Say plainly what you did not check (for example: not viewed on a phone).

## Related skills
- `video-studio`: video pipeline, Flow covers for reels, encode, upload order.
- `motion-design`: reel structure, captions, safe zones.
- `blender-3d`: exact geometry renders to composite into slides.
