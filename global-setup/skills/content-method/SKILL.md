---
name: content-method
description: "The one method every brand repo uses to make a post: the same commands, the viral gate, the look rotation, the owner's yes on a reel script, reels built on the engine, and the push to the approval desk. Use before /research, /produce or /revise in any brand repo, and before /brand-reels in the engine. The repo's own command holds only what is that brand's: paths, facts, voice, brand rules."
---

# Content method

A rule that fits every brand lives here, once. A brand's commands hold only its paths, its facts and its voice. Read this file first in every run, by its full path, because unattended jobs do not auto-load skills.

## The commands

Every brand repo has the same five. The engine has the one that builds reels.

| Command | Where | When | Does |
|---|---|---|---|
| `/research` | brand repo | nightly | Plans the day, writes the brief, caption and script. A reel's script goes to the owner |
| `/brand-reels` | the engine repo | nightly, after `/research` | Builds the reels the owner said yes to, and sends each into its post folder |
| `/produce` | brand repo | nightly, after `/brand-reels` | Makes carousels, finishes reels, cover, review, pushes to the desk as `awaiting` |
| `/revise <itemId> <note>` | brand repo | on "Minta ubah" | Applies one note, pushes a new version |
| `/publish [itemId]` | brand repo | on LULUS, and a daily pass | Schedules, then confirms it went live |
| `/insights` | brand repo | weekly | Reads the numbers back into the plan |

## How a post is made

**1. Date.** One post a day. Run `hq dates <project>` before giving a post a date, and again at the end of the run: it must print no CLASH. Look four days ahead, so a reel has time for the owner's yes and a night's build.

**2. Viral gate**. An outlier from the last 30 days named, three hooks from three formulas scored, the winner 70+ with no check under 55, the payoff on screen in the first second. A brief without them is not ready.

**3. Keep-or-send reason**. The brief names who keeps or sends the post and why: Stress, Awe, Surprise, Story, Mistake, Belonging or Useful. Read the last two briefs: never the same reason three posts in a row. Slide 1 or the first frame and the caption's first words carry it. No honest answer means change the angle.

**4. Look**. The brief's front matter carries:

```
look: <name>, <palette hexes>, <treatment>, <motion>
```

Read the `look:` line in the briefs of the account's last 3 posts, and pick one that differs in palette AND treatment AND motion. For a carousel also read the last 3 carousels, and the brand's look list. No `look:` line or a repeat means the brief is not ready. The brand is the logo, handle, voice and fonts, never one palette. A style block marked "locked" in an old post folder describes that post only. Colour meanings (wrong, correct) stay, in the palette of the chosen look.

**5. Brief, caption, script.** All written in `/research`, so `/produce` only makes pictures. Facts follow the brand's source rule. A reel's voice-over is complete and final here.

**6a. A reel: the owner's yes comes first.** Never build a reel on a script the owner has not seen (`/full-visual` step 0). In `/research`, leave the brief at `stage: script` and push one script item, next to the planned post:

- item id `<project>:<post id>-script`, `kind: "script"`, `status: "awaiting"`, no `plannedDate`, so it never shows as a clash on the calendar;
- title `Skrip <date>: <post title>`;
- `body`: `format: "reel"`, `post: "<post id>"`, `hook`, `script` (blocks of `## <m:ss> <beat>` then the spoken words, with the picture on its own line), `sources`, `flags`, `folder`.

LULUS on it is the yes, and starts no job. "Minta ubah" runs `/revise`, and the comments land on the passages the owner highlighted. `/brand-reels` builds it that night.

**6b. A carousel or single** needs no yes on its script: the brief goes straight to `stage: ready` and `/produce` makes it.

**7. Reel on the engine.** Every new reel is built by `/brand-reels` in the engine repo, never in the brand repo: all video code lives there. It writes `reel: <slug>` into the brief and moves it to `stage: ready`, with `out/<slug>-ig.mp4` under 10 MB, voice and music already inside. `/produce` then adds the cover and sends it. A later fix: the engine's `render-reel` script, then its `deliver-reel` script with the post folder. If a check fails nothing is sent.

**A reel with no yes the night before its day:** never swap it for a carousel and never build it anyway. Follow the brand's "No yes in time" line.

**8. Cover.** Every cover is a hook cover on a new Google Flow picture, in the post's look. The hook is the biggest text. Never a video frame or an old picture.

**9. Review, then the desk.** Contact sheet and full-size crops (`poster-design`), the copy check, and the brand's checklist. Then upload the files as they will be posted, in order, and push `awaiting` as the brand's `/produce` says. Never post or schedule here.

## After a change

- `/revise` keeps the post's look, keep-or-send reason and format unless the note changes them.
- A rule the owner gives goes here when it fits every brand. A brand-only rule goes in every command that writes the thing: `/research`, `/produce` and `/revise`.
- Close every Chrome tab you open.
