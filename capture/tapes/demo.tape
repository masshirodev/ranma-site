# The site's demo video (static/media/demo.*, its chapters in demo.vtt) and
# the README's gif (readme/demo.gif), one recording. The `# chapter:` lines
# are the chapters, timed as the tape plays.

Output demo
Set Screen 2560x1440
Set Scale 2
Set FontSize 11
Set TypingSpeed 60ms

Hide
Wait /❯/
Type@10ms "ranma"
Enter
Sleep 1.5s
Type@10ms "ranma action 'rename_workspace code' && clear"
Enter
Sleep 500ms
Show
# chapter: dwindle tiles nvim, btop, git log

Sleep 600ms
# A pane is a PTY: an editor in the first.
Type "nvim src/main.rs"
Enter
Sleep 2s

# The leader (ctrl+b) enters WM mode. A key that opens a pane ends it; the
# rest (layouts, focus, float, workspaces) keep it until esc.
Ctrl+B
Sleep 500ms
Type "t"
Sleep 600ms
Type "btop"
Enter
Sleep 2.5s

Ctrl+B
Sleep 300ms
Type "t"
Sleep 600ms
Type "git log --oneline --graph -30"
Enter
Sleep 2.5s
# What the page shows before it plays: the three panes tiled.
Poster

# chapter: leader space · layouts
Ctrl+B
Sleep 500ms
Space
Sleep 1.8s
Space
Sleep 1.8s
Space
Sleep 1.8s
Left
Sleep 800ms
Escape
Sleep 500ms

# chapter: leader w · a float
Ctrl+B
Sleep 300ms
Type "t"
Sleep 600ms
Ctrl+B
Sleep 300ms
Type "w"
Sleep 600ms
Escape
Sleep 500ms
Type "ls src"
Enter
Sleep 2s

# chapter: leader 2 · another workspace
# A second workspace, a test run left going there, and back.
Ctrl+B
Sleep 300ms
Type "2"
Sleep 1s
Type "t"
Sleep 600ms
Type@20ms "ranma action 'rename_workspace tests' && clear"
Enter
Sleep 600ms
Type "cargo test -q --lib toast"
Enter
Sleep 1.5s
Ctrl+B
Sleep 300ms
Type "1"
Sleep 1s
Escape
Sleep 500ms

# chapter: a toast when it ends out of sight
# The sumi example's command_finished hook: how it ended, and where.
Wait@300s /✓ cargo test/
Sleep 3s

# chapter: the which-key hint
# Pause in WM mode and the which-key hint lists every key.
Ctrl+B
Sleep 3s
Escape
Sleep 800ms
