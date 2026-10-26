---
name: social-growth
description: Growth method for Instagram and TikTok posts that reach the For You page - 26 hook formulas and how to score a hook, outlier research (posts that beat their own account's median) with a swipe file, the caption line that shows before "more", carousel copy, comment replies on our own posts, and reading insights. Use when planning a reel, TikTok, carousel or caption, writing a hook, researching what works in a niche, reviewing post insights, or drafting replies to comments. Load video-studio, motion-design and poster-design for the build, and the project's local media skill for the brand.
---

# Social growth: hooks, research, captions, replies

Adapted from [Jakeschincariol/instagram-agent-skill](https://github.com/Jakeschincariol/instagram-agent-skill) (MIT, Copyright (c) 2026 Jake Schincariol). Rewritten for our setup: no Python tools, research in Claude in Chrome, Instagram and TikTok both.

This skill decides **what to say and how to find it**. How it looks is in `motion-design` (reel structure, captions, safe zones) and `poster-design` (covers, carousel slides). How it is made is in `video-studio` (pipeline, FYP sound). Brand, language, sources and the approval desk are in the project's local media skill, which wins over this file.

## Owner rules (all projects)
- **Design, graphics and video editing run on Opus 5.5 only** (owner rule, 2026-10-25): never Sonnet, Haiku or GLM, never handed down to a cheaper subagent. Writing a hook, caption or reply is copy, not design, but brand or clinical copy still goes to Opus.
- Nothing is posted, liked, followed or messaged by an agent without the owner's yes on the approval desk.
- Never invent a number, a case, a result or a quote. If a hook needs a number nobody gave you, leave `{{number}}` and flag it.
- The project's source and accuracy rules beat every growth rule here.

## 1. Hooks
A post has two hooks that fire together: the **spoken line** (about 2 s) and the **on-screen line** (about 1 s, read before it is heard). Write them separately. On screen: 6 words or fewer.

Rules for every formula:
- No setup. Start at the sentence you would normally reach at second six. No greeting, no "in this video".
- Say the number. "A lot" is not a number.
- If the hook would work for anyone else in the niche, it is not yours. Put in the thing only this account can say.
- Deliver what the hook promised before the halfway mark.
- The formulas are shapes, not English sentences. Write them in the post's own language.

| # | Name | Shape | Example |
|---|---|---|---|
| 1 | Cost Confession | {amount} is what {one mistake} cost me | "One missing clause cost me 18,000." |
| 2 | Negative Command | Stop {common habit}. Do {X} instead | "Stop posting three times a day." |
| 3 | Nobody Tells You | Nobody tells you {uncomfortable truth} | "Nobody tells you the first 30 will flop." |
| 4 | The Replacement | {cheap thing} replaced {expensive thing} | "A 12 tool replaced a 2,000 editor." |
| 5 | Time Collapse | This took {long}. Now it takes {short} | "Five hours. Now twenty minutes." |
| 6 | The Receipt | I did {X} for {N days}. Real numbers | "60 days, one post a day. The numbers." |
| 7 | Wrong Way, Right Way | You do {X} wrong, not your fault. {fix} | "Your captions get cut. Not your fault." |
| 8 | Insider Leak | {N years} inside {field}. What we never say | "Six years inside. What we never said." |
| 9 | The Steal | Steal this {artifact}. It took {time} | "Steal this four-line follow-up." |
| 10 | If This, Then Watch | If you {specific situation}, this fixes it | "Views but no followers? 40 seconds." |
| 11 | Numbered With A Favourite | {N} {things}. Number {k} is the one nobody uses | "Five edits. Number four nobody does." |
| 12 | The Objection | "{objection, verbatim}." Fine. Here is how anyway | "'I hate the camera.' Fine." |
| 13 | Before And After | {old}. {new}. {the one lever} | "March. Now. One field changed." |
| 14 | The Callout | {specific group}, this is the one you ignore | "First-time pilgrims over 60: this one." |
| 15 | The Flop Record | My first {N} did nothing. {N+1} changed | "47 flops. Number 48 did 400k." |
| 16 | Verbatim Question | "{question as asked}" I get this every week | "'Can I do it twice?' Asked weekly." |
| 17 | Head To Head | {A} versus {B}. One was not close | "Carousels vs reels. Not close." |
| 18 | Cold Open Demo | {already mid-action} Watch what this does | "Watch what happens when I press here." |
| 19 | The Deadline | {thing} changes on {date}. Do {X} first | "Before the season opens, do this." |
| 20 | Permission | You do not need {thing everyone says} | "You don't need a niche." |
| 21 | Mid-Sentence Start | ...and that is when {the turn} | "...and that's when he asked for a refund." |
| 22 | Contrarian Flip | {well-known saying, inverted} | "Nice guys finish first." |
| 23 | The Statistic | {N}% of {group} {surprising fact} | "33% never read another book." |
| 24 | The Reveal | This is the new {thing} | "This is the new one, and it fixes X." |
| 25 | Someone Else's Result | There was one {person} who {outcome} in {time} | "One student passed in six weeks." |
| 26 | The Superlative | The {fastest/only} {thing} is {answer} | "The fastest way is evidence." |

Traps worth remembering: #8 and #3 die when the "secret" is common knowledge; #23 needs a source said in the post; #19 with fake urgency discounts every later deadline; #26 with a soft answer ("consistency") says nothing; #12 and #16 lose their power when the words are tidied up.

### Scoring a hook (the source's five checks, by hand)
Write **three hooks from three different formulas**, then score each spoken line 0–100 on:

| Check | Full marks | Low marks |
|---|---|---|
| Length | 5–12 words (under ~3 s spoken), on screen ≤ 60 characters | Over 12 words: −11 per extra word |
| Specificity | A number, a name, a place, a price | Nothing checkable |
| Stakes | Cost, loss, negation, "wrong", "only", "instead", a price | A plain statement |
| Front-load | The payload word in the first 4 words | Weak opener ("so", "hey", "today", "in this video"); payload after word 7 |
| Address | Speaks to the viewer ("you"), or opens on an imperative | Third person, nobody in the room |

Overall = 0.6 × mean + 0.4 × lowest, minus 15 per dealbreaker. Dealbreakers: "stop scrolling", a video preamble, a greeting, a hashtag or an emoji in the hook. **Strong** = 70+ with no check under 55. **Under 50: you do not have the hook yet**; editing will not fix it.

The source tested this on 74 real hooks: it separates real hooks from bad ones well (AUC 0.83) but barely separates one creator's hits from their misses (0.56). Use it as a floor that catches greetings, preambles and vague hooks, never as a view predictor. The retention graph decides.

## 2. Outlier research and the swipe file
**Raw views are not evidence.** Rank every post by its **outlier multiple**: views ÷ that account's own median views. Above 3x is a signal. Under 1.5x is a normal day, however big the number.

1. **Pick 6–12 accounts** within about 10x of our own size: 4 in the same niche, 4 adjacent (same audience, different topic: formats arrive here first), 2–4 much bigger ones for format only. Get the owner's OK on the list.
2. **Read them in Claude in Chrome**, in the owner's own logged-in browser. No paid API, no scraping service, no crawler, nothing looping in the background. Ten accounts at human speed is reading; volume collection breaks both platforms' terms. Never log in for the owner or ask for a password.
   - Instagram: the profile's Reels tab shows each reel's play count. Topic searches on the search page find accounts.
   - TikTok: the profile grid shows each video's views. Use TikTok search for the topic, and its filters (most liked, date posted) where the page shows them; open the top results and check each against its own profile median.
3. **Per post, capture:** account, followers, median of its last 12 posts (eyeball the middle value), this post's views, the hook verbatim (spoken or on screen, bad grammar included), the first on-screen text, length, the ask at the end, and the sound if it is a trending one.
4. **Name the formula** from the table. A hook that fits none is either noise or a new formula: read those by hand; they are the most valuable rows.
5. **Report three things only:** which formulas over-index in the top third (with counts), what the top third share structurally (hook length, first frame moves, visual payoff, where the ask is), and the unclassified rows. State the sample size. 40 posts across 6 accounts supports a claim; 12 does not.
6. **Turn it into our version:** for the top three formulas, a hook line this account could say tomorrow, from its own material. Copy the formula, never the script, voice or edit. Attribute every swipe row to its account.

Keep the swipe file in the project (its local media skill names where). Re-run monthly; formulas last a season. Our own past posts get the same treatment (section 6).

## 3. Captions
**Decide the job first.**
- **Job A, the video already hooked them.** The caption is not a second hook. It carries the context, the one ask and the words people search for.
- **Job B, the caption is the content** (a photo post or carousel). Line one is the hook and follows section 1.

**Instagram:** about 125 characters show before "... more". Limit 2,200; 600 that earn the tap beat 1,800. At most 5 hashtags (Instagram's cap since December 2025), specific, at the bottom, as labels: they are not a reach lever. Cut `#fyp`, `#viral`, `#explorepage`.

**TikTok:** only the first line or two shows over the video before "more", and the UI covers the rest; check it in the phone preview. Video descriptions and photo-post descriptions run up to 4,000 characters. Photo posts also have a **title of up to 90 characters**, shown bold above the description: treat it as line one. **Every photo post needs a sound** (pick it as `video-studio` → "FYP music" says: the sound picker's Favorites tab for a sound proven on the topic, else its For You list).

**First-line rules (both):**
- Never a greeting, a hashtag, a link, or an emoji as the first character.
- Job A: the ask, plainly. Job B: the hook, cut at a cliff, not mid-clause.
- The search phrase goes in the text as a phrase a person would type ("umrah for first-timers"), not only as a hashtag. Both platforms' search reads the caption.
- **One ask**: comment a keyword, save, or follow. Two asks is none. A keyword ask is one typeable word with no spaces, said in the video too.
- No link in the caption (it is not clickable). Bio, or a pinned first comment.
- Write alt text for photos and carousels.
- Run the caption through the project's antislop check before the desk.

## 4. Carousel and photo-post copy
Slides, sizes and the picture-led rule are in `poster-design`. The copy:
- 6–10 slides. Under 5 the swipe never starts; 20 is a book nobody finishes.
- Slide 1: the hook, 6 words or fewer. Slide 2 states the stake and must stand alone: Instagram can resurface a carousel from a later slide.
- One idea per slide: a 3–7 word headline, 25 words at most under it. Number the slides (3/8).
- A recap slide before the CTA, readable with no context: it is the one people screenshot and send. The last slide is the one ask.
- Use a carousel when the idea has sequence or needs re-reading; a reel when it has motion, a face or a payoff that must be seen. One claim is a reel.

## 5. Replies to comments on our own posts
Replies in the first hour do the most work. **Read every post's comments on the post itself**: TikTok Studio's comment list can miss comments, so never treat an inbox or a list as complete.

Sort first, and report the counts:

| Bucket | What it gets |
|---|---|
| Keyword (the word the post asked for) | The promised thing, by hand or through the platform's own approved automation |
| Question many people share | A real answer, and flag it as a **video reply** (both apps can reply to a comment with a video; that becomes formula #16) |
| Substance (adds data, disagrees, extends) | The longest reply on the thread |
| Lead (describes the problem we solve) | A full answer in public, then one sentence offering help |
| Support ("🔥", a tag) | A like and 3–8 words at most |
| Noise, spam, bait, abuse | Nothing. Hide abusive comments; a reply is reach for the troll |

Reply rules:
- 1–3 sentences. Match their length.
- Specific to what they said. If the reply could sit under any post, rewrite it.
- No generic openers ("Great question!", "Thanks for sharing!", "Love this").
- No emoji as the first character, no emoji-only replies.
- No pitching: no offer, no link, no "check my page".
- To a critic: concede the true part in their words, then hold the line. Never delete a fair critic, never reply twice on one thread.
- Clinical or religious questions follow the project's source rules; when unsure, say so and point to a proper source, never guess.

**Drafts go to the owner for approval before anything is posted.** Never automate bulk liking, following, commenting or DMs, on our posts or anyone else's: it breaks Instagram's and TikTok's terms and gets the account restricted. Outreach comments on other people's posts are written for the owner to post by hand.

## 6. Reading our own insights
Raw views mostly measure follower count. Rank our posts by:

| Metric | How | Tells you |
|---|---|---|
| Outlier multiple | views ÷ our median views | a real hit or a normal day |
| Non-follower reach | % of reach from non-followers | whether it travelled (the For You signal) |
| Hold at 3 s | viewers at 3 s ÷ viewers who started | the hook's grade |
| Average watch time | from insights | whether the middle worked |
| Sends per reach | shares ÷ reach | the strongest signal a post can earn |
| Follows per reach | follows ÷ reach | whether the profile converted |

- **Views and no follows is a profile problem; no views is a hook problem.** Separate them before changing anything. For the profile: the Instagram name field (30 characters) is searchable, so put the searched words there; pin the three best posts; give grid covers a short readable title (`poster-design`).
- Compare the top five and bottom five on hold at 3 s, formula, format, length, theme and whether comments got replies in the first hour. Check day and hour **last**: it is almost never the cause.
- Say how sure you are. 30 posts show a pattern; 6 do not.
- Feed the findings into the plan: more of the formulas and themes that over-index, a mix of proof, teaching, opinion and story posts, never two of one type back to back.

## Related skills
- `video-studio`: the pipeline, the FYP sound, upload order.
- `motion-design`: retention structure, kinetic captions, safe zones.
- `poster-design`: covers, carousel slides, the cover safe area.
- `antislop` + `antislop-copywriting`: every caption and reply before the desk.
