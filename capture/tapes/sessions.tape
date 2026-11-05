# The sessions loop on the page: detach, come back, the session switcher.

Output sessions
Set Screen 2400x1350
Set Scale 2
Set FontSize 11
Set TypingSpeed 65ms

Hide
Wait /❯/
Type@10ms "ranma"
Enter
Sleep 1.5s
# A second session to switch to, and some work to come back to.
Type@10ms "ranma open --session notes --cwd ~ -- zsh && clear && git log --oneline -14"
Enter
Sleep 800ms
Ctrl+B
Sleep 300ms
Type "t"
Sleep 600ms
Type@10ms "btop"
Enter
Sleep 2s
Show

Sleep 1s
Poster
# leader d: the terminal is back at its shell; ranma keeps running.
Ctrl+B
Sleep 400ms
Type "d"
Sleep 1.6s
Type "ranma"
Sleep 300ms
Enter
Sleep 1.8s
# leader backspace: the session switcher.
Ctrl+B
Sleep 400ms
Backspace
Sleep 2.2s
Escape
Sleep 800ms
