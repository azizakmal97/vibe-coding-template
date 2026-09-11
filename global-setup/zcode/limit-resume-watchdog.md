# Limit-Resume Watchdog — recipe for any machine

Automatically resumes work that was interrupted by a GLM Coding Plan quota
limit. There is no fixed reset time to schedule around: the plan refreshes on
a **rolling 5-hour window** (credits return 5h after the requests that spent
them) plus a **7-day weekly cycle** — see Usage Stats in ZCode for actual
remaining quota, and Reset Cards for instant restores. So the watchdog simply
ticks every 2 hours; while quota is exhausted the tick itself cannot run (the
model cannot execute), which makes it a free no-op. The first tick after quota
returns is the resume.

To install on a machine: create a recurring automation (in ZCode: ask the
agent to create one, every 2 hours) with this prompt:

---

Quota-limit auto-resume watchdog. Model: GLM-5.3, task effort low for the
check; resumed work uses the effort its phase's Model/Effort line declares.

Check whether work was abandoned because the quota limit was hit, and resume
it if safe. Follow these gates IN ORDER; exit at the first failure with a
one-line reason:

1. PEAK SKIP — if local time is Mon–Fri 14:00–18:00, exit (peak costs 2×;
   resuming can wait for the next off-peak tick).
2. PLAN STATUS — read `~/.zcode/v2/coding-plan-cache.json`; if
   `entryStatus.items["builtin:zai-coding-plan"].status` is not `available`,
   exit (plan not connected).
3. TARGET — read `~/.zcode/v2/setting.json`, take the first path in
   `recentProjects`, cd there. No paths → exit.
4. TEMPLATE CHECK — no `PROGRESS.md` → exit (not a template project).
5. ACTIVE-AGENT GUARD — `git status --porcelain` outputs anything → another
   session may be mid-edit RIGHT NOW; do not touch the repo; exit.
6. STALENESS — `git log -1 --format=%ct` less than 45 minutes ago → possibly
   still active; exit.
7. IN-PROGRESS CHECK — `PROGRESS.md` has no 🟡 in-progress phase → exit
   (nothing was interrupted).
8. RESUME — clean tree + `wip()` commit + 🟡 phase is the limit-hit
   signature. Execute the /resume protocol from the project's
   `.claude/commands/resume.md` (or `.zcode/commands/resume.md`): continue the
   in-progress phase ONE plan bullet at a time, checkpoint after each edit,
   following the /autonomous hard safety rules exactly — never bypass hooks,
   never start a blocked or new phase, bail at 70% context with a `pause()`
   commit, CI red → stop and report.
9. REPORT — what was resumed, bullets completed, current state, next action.
   If you resumed nothing, one line saying why.

---

Keep the 45-minute staleness gate: two agents editing one repo concurrently
is the main hazard this recipe guards against.
