#!/usr/bin/env node
/**
 * antislop mechanical checker.
 *
 * Usage:
 *   node scripts/antislop-check.mjs [--gate] [--user-facing-only] <file> [file...]
 *   node scripts/antislop-check.mjs --since <git-ref>      # CI: changed user-facing files
 *
 * Catches the antislop rules a script can decide: em/en dashes, buzzwords, generic CTAs,
 * removed focus outlines, infinite animation, tap targets under 44px, theme-token
 * contrast, and CSS classes used but never defined. Judgment rules (template layouts,
 * purpose, mobile parity) cannot be scripted, so --gate also requires a written Delivery
 * Gate report at anti-slop/gates/<file name>.md, newer than the file, with no FAIL line.
 *
 * Purpose-Gate rules (R-09, R-19) accept a written reason on the same line:
 *   animation: spin 14s linear infinite; /* antislop-allow R-19: owner spec, brand motif *\/
 *
 * Project-specific bans (a name, a word the owner refuses) go in anti-slop/rules.json:
 *   { "banned": [{ "pattern": "regex", "flags": "i", "message": "why", "exceptFiles": "regex" }],
 *     "allowedPhrases": ["a phrase the owner wrote and keeps"] }
 *
 * Exit 0 = clean, 2 = findings (hooks surface stderr to the agent; CI fails).
 * Why this exists: the antislop skills load once and fade over a long session, so the
 * rules are enforced here instead of remembered.
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const GATE_DIR = join(ROOT, 'anti-slop', 'gates');
const RULES_FILE = join(ROOT, 'anti-slop', 'rules.json');
const GATE_SECTIONS = ['Hard Gate', 'Purpose-Gate', 'Liveliness', 'Craftsmanship'];
const MIN_TAP_PX = 44;
const MIN_TEXT_CONTRAST = 4.5;

// Purpose-Gate rules allow a technique when its reason is written down (antislop R-31).
// A line carrying `antislop-allow R-19: <reason>` waives that rule on that line only.
// Hard Gate rules (dashes, contrast, tap targets, project bans) can never be waived.
const WAIVABLE = new Set(['R-09', 'R-19']);
const MIN_REASON_CHARS = 12;

const BUZZWORDS = [
  'seamless', 'seamlessly', 'cutting-edge', 'cutting edge', 'revolutionary', 'next-generation',
  'next generation', 'game-changer', 'game changer', 'world-class', 'industry-leading',
  'best-in-class', 'ai-powered', 'ai powered', 'unlock', 'elevate', 'empower', 'delve',
];
const GENERIC_CTAS = ['Get Started', 'Learn More', 'Try Now', 'Explore', 'Discover'];

// Files people read: pages, components, styles, copy dictionaries, CMS content, app UI.
const USER_FACING = [
  /\.html?$/i,
  /(^|[\\/])(src|app|pages|components|lib)[\\/].+\.(tsx|jsx|vue|svelte|astro|css|scss|dart)$/i,
  /(^|[\\/])(i18n|locales|lang)[\\/].+\.(ts|js|json)$/i,
  /(^|[\\/])content[\\/].+\.(json|md|mdx)$/i,
];
const NOT_USER_FACING = /\.(test|spec)\.|(^|[\\/])(node_modules|dist|build|graphify-out|\.git)[\\/]/i;

// Whole class names only: `.feat` is a button, `.feat-n` is a badge inside it.
const TAP_SELECTOR = /(\.(btn|pin|step|doc|toggle|menu-btn|link|feat)|(^|[\s,>])button)(?![\w-])/i;
const TEXT_TOKENS = ['--ink', '--ink2', '--muted', '--accent', '--text', '--text-muted', '--fg'];
const SURFACE_TOKENS = ['--bg', '--surface', '--surface2', '--background'];

function isUserFacing(file) {
  return USER_FACING.some((re) => re.test(file)) && !NOT_USER_FACING.test(file);
}

function loadProjectRules() {
  if (!existsSync(RULES_FILE)) return { banned: [], allowedPhrases: [] };
  const raw = JSON.parse(readFileSync(RULES_FILE, 'utf8'));
  return {
    banned: (raw.banned || []).map((b) => ({
      re: new RegExp(b.pattern, b.flags || 'i'),
      message: b.message || `banned pattern ${b.pattern}`,
      except: b.exceptFiles ? new RegExp(b.exceptFiles, 'i') : null,
    })),
    allowedPhrases: (raw.allowedPhrases || []).map((p) => new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')),
  };
}

function parseArgs(argv) {
  const opts = { gate: false, userFacingOnly: false, since: null, files: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--gate') opts.gate = true;
    else if (a === '--user-facing-only') opts.userFacingOnly = true;
    else if (a === '--since') opts.since = argv[++i] || null;
    else opts.files.push(a);
  }
  return opts;
}

function changedFiles(ref) {
  const valid = ref && !/^0+$/.test(ref) && spawnSync('git', ['cat-file', '-e', `${ref}^{commit}`]).status === 0;
  const base = valid ? ref : 'HEAD~1';
  const res = spawnSync('git', ['diff', '--name-only', '--diff-filter=ACMR', base, 'HEAD'], { encoding: 'utf8' });
  if (res.status !== 0) {
    process.stderr.write(`antislop: could not diff against ${base}; nothing checked.\n`);
    return [];
  }
  return res.stdout.split('\n').map((f) => f.trim()).filter(Boolean);
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function blankOut(text, patterns) {
  return patterns.reduce((acc, re) => acc.replace(re, (m) => ' '.repeat(m.length)), text);
}

function checkDashes(text, add) {
  for (const m of text.matchAll(/[—–]/g)) {
    add('R-02', lineOf(text, m.index), `${m[0] === '—' ? 'em' : 'en'} dash in text`);
  }
}

function checkBuzzwords(text, allowed, add) {
  const clean = blankOut(text, allowed);
  for (const word of BUZZWORDS) {
    const re = new RegExp(`\\b${word.replace(/[-\s]/g, '[-\\s]')}\\b`, 'gi');
    for (const m of clean.matchAll(re)) add('R-16', lineOf(text, m.index), `buzzword "${m[0]}"`);
  }
}

function checkGenericCtas(text, add) {
  for (const cta of GENERIC_CTAS) {
    const re = new RegExp(`>\\s*${cta}\\s*(<|\\{)`, 'g');
    for (const m of text.matchAll(re)) add('R-15', lineOf(text, m.index), `generic CTA "${cta}"`);
  }
}

function checkProjectBans(text, file, rules, add) {
  const clean = blankOut(text, rules.allowedPhrases);
  for (const ban of rules.banned) {
    if (ban.except && ban.except.test(file)) continue;
    const m = clean.match(ban.re);
    if (m) add('PROJECT', lineOf(text, m.index), `${ban.message} ("${m[0]}")`);
  }
}

function checkFocusOutline(text, add) {
  const m = text.match(/outline\s*:\s*(none|0)\b/i);
  if (m && !/:focus-visible/.test(text)) add('R-32', lineOf(text, m.index), 'outline removed with no :focus-visible replacement');
}

function checkInfiniteAnimation(text, add) {
  for (const m of text.matchAll(/animation[^;{}"]*\binfinite\b/gi)) {
    add('R-19', lineOf(text, m.index), 'infinite animation (endless loops are slop)');
  }
}

function cssRules(css) {
  const rules = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) rules.push({ selector: m[1].trim(), body: m[2], index: m.index });
  return rules;
}

function px(body, prop) {
  const m = body.match(new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`));
  return m ? Number(m[1]) : null;
}

function checkTapTargets(css, cssOffset, text, add) {
  for (const rule of cssRules(css)) {
    const selector = rule.selector.split('\n').pop().trim();
    if (!TAP_SELECTOR.test(selector)) continue;
    for (const prop of ['height', 'min-height', 'width']) {
      const value = px(rule.body, prop);
      if (value !== null && value < MIN_TAP_PX) {
        add('R-03', lineOf(text, cssOffset + rule.index), `${selector} ${prop} ${value}px < ${MIN_TAP_PX}px tap target`);
      }
    }
  }
}

function luminance(hex) {
  const v = hex.replace('#', '');
  const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Every text token against every surface token declared in the same rule
// (one rule = one theme block such as :root, .dark or [data-theme="dark"]).
function checkTokenContrast(css, cssOffset, text, add) {
  for (const rule of cssRules(css)) {
    const tokens = {};
    for (const m of rule.body.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-f]{6}|#[0-9a-f]{3})\b/gi)) tokens[m[1]] = m[2];
    for (const fg of TEXT_TOKENS) {
      for (const bg of SURFACE_TOKENS) {
        if (!tokens[fg] || !tokens[bg]) continue;
        const ratio = contrast(tokens[fg], tokens[bg]);
        if (ratio < MIN_TEXT_CONTRAST) {
          add('R-25', lineOf(text, cssOffset + rule.index), `${rule.selector.split('\n').pop().trim()}: ${fg} ${tokens[fg]} on ${bg} ${tokens[bg]} = ${ratio.toFixed(2)}:1`);
        }
      }
    }
  }
}

// Single-file pages only: a class with no CSS rule renders unstyled. A visually-hidden
// screen-reader paragraph once shipped visible this way after a rewrite dropped its CSS.
function checkUndefinedClasses(html, css, add) {
  const defined = new Set([...css.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map((m) => m[1]));
  const markup = html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');
  const reported = new Set();
  for (const m of markup.matchAll(/\sclass="([^"]*)"/g)) {
    for (const name of m[1].split(/\s+/)) {
      if (!name || name.includes('{{') || defined.has(name) || reported.has(name)) continue;
      reported.add(name);
      add('CSS', lineOf(html, m.index), `class "${name}" is used but has no CSS rule`);
    }
  }
}

function checkEyebrowAboveH1(html, add) {
  const m = html.match(/<(div|span|p)[^>]*font-size:\s*1[0-4]px[^>]*>[^<]{2,120}<\/\1>\s*<h1/i);
  if (m) add('R-09', lineOf(html, m.index), 'small label directly above the H1; cut it unless it says something the H1 does not');
}

function checkGateReport(file, add) {
  const report = join(GATE_DIR, `${basename(file)}.md`);
  if (!existsSync(report)) {
    add('GATE', 0, `no Delivery Gate report at anti-slop/gates/${basename(file)}.md`);
    return;
  }
  if (statSync(report).mtimeMs < statSync(file).mtimeMs) {
    add('GATE', 0, `gate report is older than ${basename(file)}; re-run the Delivery Gate after the last edit`);
  }
  const body = readFileSync(report, 'utf8');
  for (const section of GATE_SECTIONS) {
    if (!body.includes(section)) add('GATE', 0, `gate report is missing the "${section}" block`);
  }
  const fail = body.split('\n').find((l) => /\bFAIL\b/.test(l));
  if (fail) add('GATE', 0, `gate report still has a FAIL: ${fail.trim()}`);
}

function isWaived(lines, rule, line) {
  if (!WAIVABLE.has(rule) || line < 1) return false;
  const m = (lines[line - 1] || '').match(new RegExp(`antislop-allow ${rule}:\\s*(.+)`));
  return Boolean(m && m[1].replace(/\*\/|-->|\/\/.*$/g, '').trim().length >= MIN_REASON_CHARS);
}

function checkFile(file, gate, rules) {
  const findings = [];
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const add = (rule, line, message) => {
    if (!isWaived(lines, rule, line)) findings.push({ rule, line, message });
  };
  const isHtml = /\.html?$/i.test(file);
  const isCss = /\.(css|scss)$/i.test(file);

  checkDashes(text, add);
  checkBuzzwords(text, rules.allowedPhrases, add);
  checkGenericCtas(text, add);
  checkProjectBans(text, file, rules, add);
  checkFocusOutline(text, add);
  checkInfiniteAnimation(text, add);

  if (isHtml || isCss) {
    const blocks = isCss
      ? [{ css: text, offset: 0 }]
      : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => ({ css: m[1], offset: m.index + m[0].indexOf(m[1]) }));
    for (const { css, offset } of blocks) {
      checkTapTargets(css, offset, text, add);
      checkTokenContrast(css, offset, text, add);
    }
    if (isHtml) {
      checkUndefinedClasses(text, blocks.map((b) => b.css).join('\n'), add);
      checkEyebrowAboveH1(text, add);
      if (gate) checkGateReport(file, add);
    }
  }
  return findings;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const rules = loadProjectRules();
  let files = opts.since !== null ? changedFiles(opts.since).filter(isUserFacing) : opts.files;
  if (opts.userFacingOnly) files = files.filter(isUserFacing);

  let total = 0;
  for (const file of files) {
    if (!existsSync(file)) continue;
    const findings = checkFile(file, opts.gate, rules);
    total += findings.length;
    for (const f of findings) process.stderr.write(`[antislop ${f.rule}] ${file}:${f.line} ${f.message}\n`);
  }
  if (total > 0) {
    process.stderr.write(`\nantislop: ${total} finding(s). Fix them (or write the gate report) before continuing.\n`);
    process.exit(2);
  }
  process.exit(0);
}

main();
