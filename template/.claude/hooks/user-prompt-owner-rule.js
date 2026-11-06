#!/usr/bin/env node
/**
 * UserPromptSubmit hook. Stdout is added to the agent's context with the message.
 *
 * Runs on every message, not once at session start: a real test showed an agent
 * reading this rule at session start and still going straight to code.
 */

process.stdout.write(`Owner rule: the owner is not a coder and never types commands.
If this message asks for something new that people will see or use, or touches
money, logins or personal data, and specs/ has no spec for it, your FIRST action
is /spec (.claude/commands/spec.md), before reading code or editing anything.
Small fixes, bugs, questions and answers to your own questions skip it.
Before saying a feature with a spec is finished, run /done-check
(.claude/commands/done-check.md) yourself.
`);
process.exit(0);
