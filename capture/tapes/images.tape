# The images panel's still: a picture drawn in a pane with the kitty
# graphics protocol (plain `kitten icat`, which places at the cursor), beside
# a shell. The picture is this repository's README screenshot, copied into
# the staged home first (CAPTURE_ROOT is this repository's root).

Set Screen 2400x1350
Set Scale 2
Set FontSize 12
Set TypingSpeed 10ms

Hide
Wait /❯/
Type "cp $CAPTURE_ROOT/readme/screenshot.png ~/ranma.png && cd ~ && clear"
Enter
Sleep 300ms
Type "ranma"
Enter
Sleep 1.5s
Type "ranma action 'rename_workspace images' && clear"
Enter
Sleep 400ms
Ctrl+B
Type "t"
Sleep 800ms
Type "clear && file ranma.png"
Enter
Sleep 600ms
Ctrl+B
Left
Escape
Sleep 300ms
Type "kitten icat ranma.png"
Enter
Sleep 2.5s
Screenshot static/media/images.webp
