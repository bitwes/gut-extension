# GUT Tools VSCode Extension
Tools to run your unit/integration tests created with the [GUT framework](https://github.com/bitwes/Gut/).

[Short tutorial on setup and using the extension.](https://youtu.be/pqcA8A52CMs)
## Available Commands
* `GUT: Show Help` - Displays the GUT command line help in the terminal window.
* `GUT: Run All` - Runs the entire test suite.
* `GUT: Run Current Script` - Runs the current test script.
* `GUT: Run at Cursor` - Runs the current script and adds additional options based on where the cursor is located.  You can use this command to run a single test, an inner class, or the entire current file.  If the cursor is between methods then the current inner class or file will be ran.<br/><br/>
__NOTE:__ `Run at Cursor` uses features provided by the Godot Tools extension that are only available when the current workspace is open in the Godot editor.  There is a short delay when first launching the editor where this command will not work.  Just wait a few seconds and try again.

# Setup
### Godot Tools
This extension requires the Godot Tools extension and requires that the `Godot_tools: Editor_path` setting is configured properly to point to the Godot Engine executable.

### GUT
This extension will only be active if the open workspace contains the GUT Godot plugin (`res://addons/gut/`).

This tool uses the GUT command line interface to run tests.  It requires you create a `res://.gutconfig.json` file or add settings in `gut-extension.AdditionalOptions` in order to find your tests.  More information can be found in the [GUT Command Line wiki page](https://github.com/bitwes/Gut/wiki/Command-Line).

#### Sample .gutconfig.json
Any option that the GUT command line tool accepts can be configured in the `gutconfig.json` file.  These are the most commonly used.
```
{
    "dirs":[
        "res://test/"
    ],
    "include_subdirs":true,
    "ignore_pause":true,
    "log_level":2,
    "should_exit":false,
    "should_maximize":true
}
```

# Settings
#### `gut-extension.AdditionalOptions`
 Here you can provide additional Godot or GUT options if you find the need to.  The default is `-d` to run Godot in debug mode.  You can view all the GUT options available by running `GUT: Show Help`.

__Possible Uses__
 * Use an alternate `.gutconfig.json` file.
 * Skip the `.gutconfig.json` file and add options to set your directories and other options.  
 * Provide other Godot options or remove the debug mode option.
 
 It is recommended that you use a `.gutconfig.json`, the file is easier to manage than the setting, but we won't judge.

#### `gut-extension.discardTerminal`
A boolean value that decides if subsequent launches of GUT will discard the existing terminal window and create a new one or reuse the existing one.  When not checked you must kill Godot manually if an error occurs.  If you do not then subsequent runs of GUT will not work.  The upside to leaving this unchecked is that output from previous runs is preserved in the terminal.
