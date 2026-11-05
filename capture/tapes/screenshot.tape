# The README's screenshot, the page's poster and its link preview
# (readme/screenshot.png; capture/run.mjs derives the other two). The scene
# of the picture the README used to show, an AI's drawing of ranma, done for
# real: nvim on src/layout.rs, the layout tests running beside it, the log
# under them, and a release build finishing on workspace 3, out of sight,
# whose toast the sumi example's command_finished hook raises.

Set Screen 2560x1520
Set Scale 2
Set FontSize 10.5
Set TypingSpeed 15ms

Hide
Wait /❯/
Type "ranma"
Enter
Sleep 2s

# Workspace 3, for the release build started at the end.
Ctrl+B
Type "3"
Type "t"
Sleep 800ms
Type "ranma action 'rename_workspace build' && clear"
Enter
Sleep 500ms

# Workspace 2: a shell.
Ctrl+B
Type "2"
Type "t"
Sleep 800ms
Type "ranma action 'rename_workspace zsh' && clear"
Enter
Sleep 500ms

# Workspace 1: the editor, the tests, the log.
Ctrl+B
Type "1"
Escape
Sleep 500ms
Type "ranma action 'rename_workspace nvim' && clear"
Enter
Sleep 500ms
Type "nvim src/layout.rs"
Enter
Wait /impl Rect/
Type "30Gzt42G"
Sleep 300ms

Ctrl+B
Type "t"
Sleep 800ms
Type "cargo test -q --lib layout::"
Enter
Sleep 1s
Ctrl+B
Type "t"
Sleep 800ms
Type "git log --oneline --graph --decorate -40"
Enter
Sleep 500ms

# Back to the editor, wider than its neighbours.
Ctrl+B
Left
Shift+Right 6
Escape
Wait@900s /test result: ok/

# The release build, on workspace 3 and out of sight once 1 is back. Every
# take stages a fresh clone, so it builds the crate again: a minute or so.
Ctrl+B
Type "3"
Escape
Sleep 300ms
Type "cargo build --release"
Enter
Sleep 1s
Ctrl+B
Type "1"
Escape
Wait@900s /\u2713 cargo build --release/
# A moment for the cpu module to come down from the build.
Sleep 2.5s
Screenshot readme/screenshot.png
