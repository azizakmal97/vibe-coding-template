#!/usr/bin/env node
/**
 * Config Protection Hook — PreToolUse (Edit|Write|MultiEdit)
 *
 * Blocks modifications to linter/formatter config files.
 * Agents frequently modify these to make checks pass instead of fixing
 * the actual code. This steers the agent back to fixing the source.
 *
 * Exit codes:
 *   0 = allow (not a config file, or first-time creation)
 *   2 = block  (existing config file modification attempted)
 *
 * Adapted from ECC (github.com/affaan-m/ECC) — Apache 2.0
 */

'use strict';

const fs = require('fs');
const path = require('path');

const MAX_STDIN = 1024 * 1024;

const PROTECTED = new Set([
  // ESLint (legacy + flat config)
  '.eslintrc', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json',
  '.eslintrc.yml', '.eslintrc.yaml',
  'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs',
  'eslint.config.ts', 'eslint.config.mts', 'eslint.config.cts',
  // Prettier
  '.prettierrc', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.json',
  '.prettierrc.yml', '.prettierrc.yaml',
  'prettier.config.js', 'prettier.config.cjs', 'prettier.config.mjs',
  // Biome
  'biome.json', 'biome.jsonc',
  // Ruff (Python)
  '.ruff.toml', 'ruff.toml',
  // Shell / Style / Markdown
  '.shellcheckrc',
  '.stylelintrc', '.stylelintrc.json', '.stylelintrc.yml',
  '.markdownlint.json', '.markdownlint.yaml', '.markdownlintrc'
]);

function main() {
  // Parse stdin JSON from Claude Code pre-tool hook
  let raw = '';
  let truncated = false;

  return new Promise((resolve) => {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      if (raw.length < MAX_STDIN) {
        const r = MAX_STDIN - raw.length;
        raw += chunk.substring(0, r);
        if (chunk.length > r) truncated = true;
      } else {
        truncated = true;
      }
    });
    process.stdin.on('end', () => {
      if (truncated) {
        process.stderr.write(
          `BLOCKED: Hook input exceeded ${MAX_STDIN} bytes. ` +
          'Refusing to bypass config-protection on truncated payload.\n'
        );
        process.exit(2);
      }

      let data;
      try { data = JSON.parse(raw || '{}'); } catch { process.exit(0); }

      const filePath = data?.tool_input?.file_path || data?.tool_input?.file || '';
      if (!filePath) process.exit(0);

      const basename = path.basename(filePath);
      if (!PROTECTED.has(basename)) process.exit(0);

      // Allow first-time creation — no existing config to weaken.
      let exists = true;
      try {
        fs.lstatSync(filePath);
      } catch (err) {
        if (err && err.code === 'ENOENT') exists = false;
        // EACCES, EPERM, etc → keep exists=true (fail closed)
      }

      if (!exists) process.exit(0);

      process.stderr.write(
        `BLOCKED: Modifying ${basename} is not allowed.\n` +
        'Fix the source code to satisfy linter/formatter rules instead of ' +
        'weakening the config.\n' +
        'If this is a legitimate config change, disable config-protection hook temporarily.\n'
      );
      process.exit(2);
    });
  });
}

main();
