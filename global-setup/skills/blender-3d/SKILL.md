---
name: blender-3d
description: General Blender 5.2 and AI-3D method - headless scripting, the render review gate (zoom crops, assume flaws, SHIP/NO-SHIP), the AI-3D flaw catalogue, image-to-3D with TRELLIS, rigging and weights, toon shading and outlines, likeness to a drawing, glTF export, third-party blends (Z-Anatomy), and verified Blender gotchas. Use before any Blender, 3D model, character, render or sprite work, and before showing any render to the owner, in any project. The project's own local skill holds its scripts and rules.
---

# Blender and AI-3D: the shared method

Project rules win over this file: the project's own local skill names its scripts, characters, art rules and review tool. 3D video scenes (vessels, valves, surgery staging, render timing) are in `video-studio`.

## Owner rules (all projects)
- **Design, graphics and video editing run on Opus 5.5 only** (owner rule, 2026-10-25): never Sonnet, Haiku or GLM, never handed down to a cheaper subagent. Effort varies: high for a new look, lower for an edit to a settled one.
- **Exact geometry and anatomy come from Blender or code**, never from an image model (owner rule, permanent). Flow drafts the look; Blender draws what must be right.

## 0. Review gate: every render, every time
The owner has had to point out flaws Claude missed three times (2026-10-19 coat smears, 2026-10-21 eye paint, 2026-10-21 cel test). A glance at the whole picture is not a review. Before any render reaches the owner:
1. Make zoom crops, one per part (head, both arms and hands, torso, legs and feet, the subject at its shown size), plus a checklist file. A project may have a tool and a pre-send hook for this (its local skill names them).
2. Read the crops **one part at a time**. For each checklist line, look for that flaw in that crop. Assume flaws exist; the job is to find them, not to confirm the change worked.
3. Compare side by side with the reference (the drawing, the painted cast, the source photo). Match, close or miss.
4. Write the verdict: blockers, majors, minors, then SHIP / SHIP WITH NOTES / NO-SHIP. A blocker or major is fixed first, not shown with an apology.
5. Lead the message to the owner with the flaws that remain.
- **New geometry at full size** (2026-10-25): crop the subject at 1:1 along every edge where two surfaces or materials meet. Contact-sheet tiles hide 2-px seams, and the owner sees them on the phone.
- **Check where the anatomy is mapped** (owner, 2026-10-30: "check properly where u mapped the anatomy"). Before any anatomy render goes out, render a plain orthographic view (lateral or front) with the source model's own structures shown next to yours (e.g. Z-Anatomy's facial vein in grey beside your tube). Check each placed structure's origin, its course on both sides of every landmark, the crossing point and depth order, and that nothing stray shows (the hyoid through a tint). Anything placed by hand must match the model or a cited figure.
- **Labels must land on their structure** (owner, 2026-10-30: "your label must accurate"). Take every leader-line anchor from the labelled object's own geometry (a point sampled on its path or mesh, per frame if it moves, on the part still shown after a cut), never a hand-typed coordinate, and keep it off any crossing with another structure. Check with a zoom crop at each label's first and last frame.
- Method origin: arjun988/blender-skills (MIT, read 2026-10-21): the ship/no-ship verdict with severity levels, side-by-side reference matching, clothes as separate meshes from duplicated body faces with transferred weights, and testing extreme poses before animating (arms up, crouch, neck turn, jaw open). Its other skills are generic PBR/engine advice.

### AI-3D flaw catalogue (seen on TRELLIS character models)
| Part | Seen |
|---|---|
| Skin | Facet lines and pale/dark patches (TRELLIS bakes light per 3 cm plane); dark specks after vertex smoothing |
| Eyes | Black blobs; eye white painted on the upper lid; a black mass above the iris; brown patches in the white |
| Beard, mouth | Goatee smeared onto the collar; lips that tear when the jaw moves |
| Hair | One flat smeared mass; stray strands crossing the forehead; dark smear over an ear |
| Neck | Missing: head sits straight on the collar |
| Arms | Stray black ink strokes along the top or underside of a sleeve (inverted-hull outline on thin shells) |
| Hands | Coat paint on the hand; crumpled or fused fingers; wrong thumb direction; no clean cuff |
| Clothes | Dark lining band smeared down a coat edge; purple or green fringes on painted lines; white streaks; torn armpits under arm lifts |
| Props | Lanyard broken into pieces; badge an unreadable blur |
| Feet | Shoes as dark blobs with no toe or sole; feet sinking or floating |
| Whole | Head a quarter of the height (chibi); outline width uneven; colours off from the painted reference |

## 1. Running Blender
- Default Windows path: `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe`.
- Headless: `blender.exe --background --factory-startup --python scene.py -- <args>`. Add `--disable-autoexec` when opening third-party blends. Scripts that need MPFB must run WITHOUT `--factory-startup`.
- `-b` resolves relative paths against Blender's own folder (one `--out` landed in `C:\`): pass absolute paths.
- Engine id is `BLENDER_EEVEE`. Actions are layered (`action.layers[].strips[].channelbags[].fcurves`) when you set interpolation. `use_nodes` only raises a deprecation warning.
- Live view: the Blender MCP `look` tool shows the open scene from any angle; check each step there (rendered shading) before rendering files. Open .blend files live; **glTF import through the MCP fails** (`'Context' object has no attribute 'object'` in armature_display), so import headless.
- **Long renders** (2026-10-25): run them in the foreground, in chunks of about 175–220 frames at 64 samples (under the 10-minute tool limit). Claude Code kills background jobs when memory runs low while the session is idle (a render died at frame 664, an AE edit mid-render). Close the Blender GUI first. Smoke-test a few frames at 25% before any long run.
- **A 6 GB GPU (RTX 3060)** won't run UniRig and other 8 GB tools.

## 2. Verified gotchas
- **Blank render = stale transforms.** Call `bpy.context.view_layer.update()` after linking objects and before reading `matrix_world` or bounds. Otherwise the camera aims at the origin.
- **Appended children carry a stale `matrix_world`** (`bpy.data.libraries.load`): compose it as `parent_world @ matrix_parent_inverse @ matrix_basis`, and read every world matrix before baking any, or parts land half a metre off.
- **Drivers on custom props** don't update from Python until `rig.update_tag(); view_layer.update()`.
- **Shape-key pieces** (lids, mouth) poke through skin in EEVEE: hide them with a driver when the key is near 0.
- **Moved .blend files** lose their textures (absolute paths from the other PC): relink by file name.
- **Solidify:** keep `use_even_offset` off on swept or noisy meshes. It threw a 28 mm spike that showed as a thin coloured line across shots. To find a stray line, ray-cast from the camera through the pixel (`scene.ray_cast`, stepping past transparent hits) and compare the evaluated mesh's bounds with the raw vertices.
- **Look:** `view_transform='Standard'`. AgX washes brand colours out over light backgrounds, and with strong lights it washed skin pale and navy to light blue. With Standard, area lights at 0.5–0.9 m need only about 10–30 W. Use `film_transparent=True` and put the background on in the edit.
- **EEVEE transparency:** `surface_render_method='DITHERED'`, with the Principled Alpha driven by node math (burn-away wipes, fresnel "glass"). Stacked translucent layers turn milky, so fade layers out fully instead.

### glTF export
- **Flat-shaded bases split every vertex** (13 MB instead of 2.6): `mesh.shade_smooth()` and drop unused UVs before export. Export morphs with `export_try_sparse_sk=True`.
- **Morph weights load switched on** in three.js for this export: zero `morphTargetInfluences` when a body is made.

## 3. Third-party blends (Z-Anatomy and similar)
- Never render inside the big source file (the whole-body Z-Anatomy blend gave a blank image: metres, around Z 1.5 m, hidden collections, an auto-run script). Either bake the needed parts into a small clean blend (`meshes.new_from_object` of the evaluated object plus `matrix_world`, then `bpy.data.libraries.write`; drop helper objects that come along as dependencies), or dump the vertices to JSON and rebuild in an empty scene.
- **Holes in the Z-Anatomy skin** (red muscle at the eyebrow, mouth corner or lids): the skin is many small region patches, some only 12–42 vertices (eyebrow 28, angle of mouth 42). Filter out only the 2-vertex `.j` label anchors (`< 3` vertices), never a bigger cut-off. The seams still leak at the lid margins and the philtrum, so keep muscle, bone and teeth hidden (`hide_render` keys) until a reveal opens the skin, and let any skin ray-cast retry a millimetre to the side when it slips through a seam.
- Credit the licence the asset needs ("Anatomy: Z-Anatomy (CC BY-SA 4.0)"). The project's local skill names where its copy lives.

## 4. Image to 3D (TRELLIS)
1. Draw the character in **A-pose** in Google Flow (arms 45° down, hands empty, wide gaps of plain colour). Fused arms smear when rigged.
2. TRELLIS.2, signed in on huggingface.co (the anonymous quota runs out after one model). Meshy free cannot download.
3. **Weights:** bone heat on an A-posed TRELLIS mesh leaks arm weight across the chest and tears the shirt. Use rule weights (distance to the limb polyline), split along the limb by position. Check the widest point of a zone before cutting it (shoe verts at |x| 0.234 escaped a 0.23 leg zone). Bone heat does work on a clean quad base (Blender Studio bodies).
4. **Head:** TRELLIS people have little or no neck. The head bone must own the lips and everything in front of the face, or a bowed head leaves the mouth behind. Mask anything on the neck by height, not by head weights.
5. **Faceted skin:** fix with smoothed custom normals, never by moving vertices.
6. **Eye paint:** rasterise the eye triangles in UV and repaint the lids there.

## 5. Toon look
- Shader: Diffuse → Shader to RGB → Color Ramp (Constant; steps 0.62 / 0.82 / 1.0) × base colour → Emission.
- Outline: Solidify, flipped normals, offset 1, no rim, a backface-culled ink material, width scaled to the model (~0.0035 × height / 1.75). Thin shells (sleeves, lapels) can throw stray ink strokes: check the arms.
- **No ink hull inside the face** (eye slits, nostrils, mouth corners): weight 0 pushes the shell inside the head (`thickness_vertex_group = -1`). Weight 0 with factor 0 left a zero-thickness shell that flickered through the skin.
- Fixed camera and light matched to the scene's painted light; rotate the character, not the camera, for facings.
- No flicker: fixed samples and seed, no motion blur; render at 2x and downscale.
- Blackout test: the silhouette, filled black at its shown size, must still read.
- Cel shading does not hide texture flaws; it only flattens light. Fix smears in the texture or mesh.

## 6. Likeness to a drawing (owner, 2026-10-21: "who is that?", "compare in detail")
- Never judge likeness by eye side by side. Render from the drawing's angle, align by the two drawn eye centres and read the drawing's lines over the 3D.
- A front drawing still implies the whole head: check sideburns (to the ear lobe), hair behind the ears and down to the nape from the side and back views before showing it (owner: "where is my sideburn?").
- Hair: merged metaball masses, painted with the drawing's strands warped into that camera. Shells grown off the scalp gave sails and bald domes. For separate locks ("piece by piece, not one whole"): tapered flat tubes laid along bezier guides snapped onto the base with a BVH, base sunk 4 mm and dark. Displacing one mass with noise or bands gave lumps or a corrugated pipe, never locks.
- Sideburns: a copy of the skin in front of the ear, lifted 1.2 mm, alpha-faded edges. Metaball sideburns stood off the cheek like tubes.
- Soft film surface: each toon tint's colour into a Principled BSDF (skin subsurface, glossy eyes, cloth weave bump), soft disk area lights, no ink outline, Standard view transform.
- Measure bodies without the toon outline.

## Related skills
- `video-studio`: 3D video scenes, VO, edit, encode.
- `motion-design`: motion grammar for reels.
- `poster-design`: Blender parts composited into image-model posters and slides.
