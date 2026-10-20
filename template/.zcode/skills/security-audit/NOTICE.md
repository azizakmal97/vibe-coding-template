# Third-party notices

## Cloudflare security-audit skill

`SKILL.md` and parts of `CHECKLISTS.md` adapt the audit method and attack classes of
https://github.com/cloudflare/security-audit-skill (commit `c1c8a8c`).

Changes made here: the method is shortened for a solo-owner web app audited by
Claude Code. The OS sandbox and the artifact-promotion procedure are replaced by a
source-only, existing-tests-only policy. The JSON validators are dropped. The report
moves into the repo. Fix planning is wired into `PROGRESS.md`. Stack checklists for
Cloudflare Workers, Supabase, Next.js and React are added.

```
MIT License

Copyright (c) 2025-2026 Cloudflare, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## mukul975/Anthropic-Cybersecurity-Skills

A few checklist ideas in `CHECKLISTS.md` (API access-control probes, JWT checks,
GitHub Actions hardening, AI tool-call boundaries, indirect-injection surfaces) were
inspired by https://github.com/mukul975/Anthropic-Cybersecurity-Skills (Apache-2.0).
They are written here in our own words; no text or code is copied. That repo is not
affiliated with Anthropic and is not installed by this template.
