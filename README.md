Run GUT from VSCode.

Runs the current file.  To run all tests don't have an active editor.  If the current line is the decleration for a test then it will run that test.  If the current line is the decleration for a class then it will run that class.

Pretty much for personal use at this point.  You can try to use it, if you do then vscode should be configured to run `bash` or `zsh` as the terminal and you should have a `godot` command that points to something like `/Applications/Godot.app/Contents/MacOS/Godot`.

My setup is:
```
export GODOT=/Applications/Godot.app/Contents/MacOS/Godot
alias godot=eval $GODOT
```
