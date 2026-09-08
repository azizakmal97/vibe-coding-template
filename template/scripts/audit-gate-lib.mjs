/**
 * audit-gate-lib.mjs — pure helpers for the dependency-audit gate.
 *
 * Everything here is side-effect free: no fs, no child_process, no network.
 * The CLI shell (audit-gate.mjs) runs `npm audit --json`, reads the accepted
 * list, and calls into these so the classification logic is unit-testable
 * (see scripts/__tests__/audit-gate-lib.test.ts).
 *
 * WHY THIS EXISTS: `npm audit` has no native allowlist, so a backlog of
 * deliberately-deferred advisories (dev-only tooling needing a semver-major
 * bump) kept the blocking gate permanently red — which made a genuinely NEW
 * finding indistinguishable from the standing noise. This gate carves the
 * accepted advisories out EXPLICITLY, by id, with a review date, so the run
 * goes green on the known backlog and red the moment something new appears.
 */

/** Matches a GHSA id anywhere in an advisory URL or string. */
const GHSA_PATTERN = /GHSA-[23456789cfghjmpqrvwx]{4}-[23456789cfghjmpqrvwx]{4}-[23456789cfghjmpqrvwx]{4}/i;

/**
 * Pull the GHSA id out of an advisory url/id field.
 * Returns null when the input carries no recognisable id.
 */
export function extractAdvisoryId(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(GHSA_PATTERN);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Flatten `npm audit --json` output into one row per DISTINCT advisory.
 *
 * npm reports the same advisory once per affected package in the tree, so the
 * raw shape over-counts. Rows carry every package the advisory reaches, which
 * is what a human needs when deciding whether to accept it.
 *
 * @param {object} auditJson parsed `npm audit --json` output
 * @returns {Array<{id:string, severity:string, title:string, url:string, packages:string[]}>}
 */
export function collectAdvisories(auditJson) {
  const vulns = auditJson?.vulnerabilities ?? {};
  /** @type {Map<string, {id:string, severity:string, title:string, url:string, packages:Set<string>}>} */
  const byId = new Map();

  for (const [pkgName, entry] of Object.entries(vulns)) {
    for (const via of entry?.via ?? []) {
      // A string `via` is just a pointer to another vulnerable package in the
      // same tree — the advisory detail lives on the object form.
      if (typeof via !== 'object' || via === null) continue;
      const id = extractAdvisoryId(via.url) ?? extractAdvisoryId(via.source != null ? String(via.source) : '');
      if (!id) continue;

      const existing = byId.get(id);
      if (existing) {
        existing.packages.add(pkgName);
        continue;
      }
      byId.set(id, {
        id,
        severity: via.severity ?? entry.severity ?? 'unknown',
        title: via.title ?? '',
        url: via.url ?? '',
        packages: new Set([pkgName]),
      });
    }
  }

  return [...byId.values()]
    .map((r) => ({ ...r, packages: [...r.packages].sort() }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Required fields on every entry in `.audit-accepted.json`. */
const REQUIRED_ACCEPT_FIELDS = ['id', 'reason', 'reviewBy'];

/**
 * Validate the accepted-advisories document.
 *
 * A malformed entry must FAIL LOUD rather than be skipped — a silently-ignored
 * acceptance would quietly re-arm the gate (or, worse, quietly disarm it).
 *
 * @returns {string[]} human-readable problems; empty means valid
 */
export function validateAcceptedList(doc) {
  const problems = [];
  const accepted = doc?.accepted;
  if (!Array.isArray(accepted)) {
    return ['`.audit-accepted.json` must have an "accepted" array.'];
  }

  const seen = new Set();
  accepted.forEach((entry, i) => {
    const label = `accepted[${i}]`;
    if (typeof entry !== 'object' || entry === null) {
      problems.push(`${label}: must be an object.`);
      return;
    }
    for (const field of REQUIRED_ACCEPT_FIELDS) {
      if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
        problems.push(`${label}: missing required field "${field}".`);
      }
    }
    const id = extractAdvisoryId(entry.id);
    if (!id) {
      problems.push(`${label}: "id" must contain a GHSA id (got ${JSON.stringify(entry.id)}).`);
    } else if (seen.has(id)) {
      problems.push(`${label}: duplicate acceptance for ${id}.`);
    } else {
      seen.add(id);
    }
    if (typeof entry.reviewBy === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(entry.reviewBy)) {
      problems.push(`${label}: "reviewBy" must be YYYY-MM-DD (got ${JSON.stringify(entry.reviewBy)}).`);
    }
  });

  return problems;
}

/**
 * Classify the advisories npm found against the accepted list.
 *
 * Four buckets:
 *  - `blocking`  — not accepted at all. This is the signal the gate exists for.
 *  - `expired`   — accepted, but past its reviewBy date. Also blocks: an
 *                  acceptance that never expires is a permanent blind spot.
 *  - `accepted`  — accepted and still in date.
 *  - `stale`     — accepted but no longer present in the tree, so the entry
 *                  should be deleted. Reported, never blocking (removing a dep
 *                  must not fail the build).
 *
 * @param {ReturnType<typeof collectAdvisories>} found
 * @param {object} acceptedDoc parsed `.audit-accepted.json`
 * @param {string} today ISO date (YYYY-MM-DD) used for expiry comparison
 */
export function classifyAdvisories(found, acceptedDoc, today) {
  const entries = new Map();
  for (const entry of acceptedDoc?.accepted ?? []) {
    const id = extractAdvisoryId(entry?.id);
    if (id) entries.set(id, entry);
  }

  const blocking = [];
  const expired = [];
  const accepted = [];

  for (const advisory of found) {
    const entry = entries.get(advisory.id);
    if (!entry) {
      blocking.push(advisory);
    } else if (entry.reviewBy < today) {
      expired.push({ ...advisory, reviewBy: entry.reviewBy, reason: entry.reason });
    } else {
      accepted.push({ ...advisory, reviewBy: entry.reviewBy, reason: entry.reason });
    }
  }

  const foundIds = new Set(found.map((a) => a.id));
  const stale = [...entries.values()].filter((e) => !foundIds.has(extractAdvisoryId(e.id)));

  return { blocking, expired, accepted, stale };
}

/** True when the run should fail. Stale entries are informational only. */
export function shouldFail(result) {
  return result.blocking.length > 0 || result.expired.length > 0;
}

/** Render the classification as a readable CI log block. */
export function formatReport(result, { today } = {}) {
  const lines = [];
  const pkgs = (a) => a.packages.join(', ');

  if (result.blocking.length > 0) {
    lines.push(`BLOCKING — ${result.blocking.length} advisory(ies) not in .audit-accepted.json:`);
    for (const a of result.blocking) {
      lines.push(`  ✗ ${a.id}  [${a.severity}]  ${pkgs(a)}`);
      if (a.title) lines.push(`      ${a.title}`);
      if (a.url) lines.push(`      ${a.url}`);
    }
    lines.push('');
    lines.push('  Fix it, or add an entry to .audit-accepted.json with a reason and a reviewBy date.');
    lines.push('  Do NOT run a blanket `npm audit fix` (see the note in .audit-accepted.json).');
    lines.push('');
  }

  if (result.expired.length > 0) {
    lines.push(`EXPIRED — ${result.expired.length} acceptance(s) past their review date${today ? ` (today ${today})` : ''}:`);
    for (const a of result.expired) {
      lines.push(`  ✗ ${a.id}  reviewBy ${a.reviewBy}  ${pkgs(a)}`);
    }
    lines.push('');
    lines.push('  Re-review: fix the advisory, or extend reviewBy with fresh justification.');
    lines.push('');
  }

  if (result.accepted.length > 0) {
    lines.push(`Accepted (${result.accepted.length}) — documented, in date:`);
    for (const a of result.accepted) {
      lines.push(`  · ${a.id}  [${a.severity}]  review by ${a.reviewBy}  ${pkgs(a)}`);
    }
    lines.push('');
  }

  if (result.stale.length > 0) {
    lines.push(`Stale (${result.stale.length}) — accepted but no longer in the tree; delete these entries:`);
    for (const e of result.stale) lines.push(`  · ${e.id}`);
    lines.push('');
  }

  lines.push(shouldFail(result) ? 'RESULT: FAIL' : 'RESULT: PASS');
  return lines.join('\n');
}
