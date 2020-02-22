# GUT Tools
Tools to run Godot Engine unit/integeration tests created with the GUT framework.

## Features
* Run the entire test suite.
* Run the current test script.
* Run the currently selected test, inner class, or script based on where the cursor is located.

## Available Commands
* `GUT: Run All`
* `GUT: Run Current Script`
* `GUT: Run at Cursor` <br/>
__NOTE:__ This command uses features provided by the Godot Tools extension that are only available when the current workspace is open in the Godot editor.  There is a short delay when first launching the editor where this command will not work.  Just wait a few seconds and try again.


# Setup
### Godot Tools
This extension requires the Godot Tools extension and requires that the `Godot_tools: Editor_path` setting is configured properly to point to the Godot Engine executable.

### GUT
This extension will only be active if the open workspace contains the GUT Godot plugin (`res://addons/gut/`).

This tool uses the [GUT command line interface](https://github.com/bitwes/Gut/wiki/Command-Line) to run tests.  It will use any configuration you have setup in the `res://.gutconfig.json` file to run your tests.  This does not use any configuration you have setup in a scene that contains the GUT control.