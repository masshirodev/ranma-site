# The copy-mode loop on the page: search back, select, yank.

Output copy
Set Screen 2400x1350
Set Scale 2
Set FontSize 12
Set TypingSpeed 65ms

Hide
Wait /❯/
Type@10ms "ranma"
Enter
Sleep 1.5s
Type@10ms "clear && git --no-pager log --oneline -60"
Enter
Sleep 1s
Show

Sleep 800ms
# leader /: search the pane's history, most recent match first.
Ctrl+B
Sleep 400ms
Type "/"
Sleep 500ms
Type "title"
Sleep 400ms
Enter
Sleep 1.2s
# The matches lit, before the yank.
Poster
# n: the next match back; V selects the line, y yanks it to the clipboard.
Type "n"
Sleep 900ms
Type "V"
Sleep 700ms
Type "y"
Sleep 2s
