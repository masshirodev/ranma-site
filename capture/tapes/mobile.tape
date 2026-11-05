# The mobile panel's still: ranma's mobile view (mobile.ranma, on
# driver_change), on a terminal that says it is a phone (RANMA_MOBILE=1), at
# a phone's 390×844, three times over.

Set Screen 1170x2532
Set Scale 3
Set FontSize 9
Set Mobile true
Set TypingSpeed 10ms

Hide
Wait /❯/
Type "ranma"
Enter
Sleep 2s
Type "nvim src/layout.rs"
Enter
Wait /NORMAL/
Ctrl+B
Type "t"
Sleep 800ms
Type "clear && git log --oneline --graph -40"
Enter
Sleep 2s
Screenshot static/media/mobile.webp
