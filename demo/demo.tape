# demo.tape — reproducible terminal GIF for the README.
#
# Render (from the repo root):
#   vhs demo/demo.tape          # writes demo/vibe-coding-demo.gif
#
# Install VHS: https://github.com/charmbracelet/vhs
#   brew install vhs     (macOS)
#   go install github.com/charmbracelet/vhs@latest
#   winget install charmbracelet.vhs   (Windows)
#
# The story: your AI agent physically cannot run destructive or
# secret-leaking commands — the hook blocks them before they execute.

Output demo/vibe-coding-demo.gif

Set FontSize 20
Set Width 1120
Set Height 600
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20

Type "cd template   # the guardrails your AI agent runs into:"
Enter
Sleep 1.2s

Type `echo '{"command":"rm -rf /"}' | node .claude/hooks/validate-command.js`
Enter
Sleep 2s

Type `echo '{"command":"DROP TABLE users"}' | node .claude/hooks/validate-command.js`
Enter
Sleep 2s

Type `echo '{"command":"cat .env"}' | node .claude/hooks/validate-command.js`
Enter
Sleep 2.3s

Type "# Destructive + secret-leaking commands: blocked. Automatically."
Enter
Sleep 2.8s
