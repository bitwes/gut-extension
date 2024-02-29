# GUT Tools VSCode Extension
Tools to run your [GUT framework](https://github.com/bitwes/Gut/) unit/integration tests.

### Requires Godot 3.4 or Godot 4.0

[Short tutorial on setup and using the extension.](https://youtu.be/pqcA8A52CMs)

# Available Commands
* __GUT: Show Help__ - Displays the GUT command line help in the terminal window.
* __GUT: Run All__ - Runs the entire test suite.
* __GUT: Run Current Script__ - Runs the current test script.
* __GUT: Run at Cursor__ - Runs the current script and adds additional options based on where the cursor is located.  You can use this command to run a
    * Single test
    * An inner class
    * Current file.
    * In Godot 3, if the cursor is between methods then the current inner class or file will be ran.
* __GUT:  Run All/Current/Cursor (debugger)__ - Run tests through the debugger instead of the command line!  Use breakpoints, step through code, less `print` statements!   <br/>
__NOTE__:  You may not see the full output in the Debug Console.  GUT `v9.2.1` and `v7.4.3` fix this issue.  Until those are out, you may have to change `"should_exit": false` in your gutconfig file to see results when running through the debugger.


# Setup
## Godot Tools
This extension requires the Godot Tools extension and requires that the path settings for Godot 3 and Godot 4 are configured properly to point to the Godot Engine executables (or use the Godot Override Path setting).


## GUT
This tool uses the GUT command line interface to run tests (even when going through the debugger).  It requires you create a `res://.gutconfig.json` file or add settings in `gut-extension.AdditionalOptions` in order to find your tests.  More information can be found in the [GUT Command Line wiki page](https://github.com/bitwes/Gut/wiki/Command-Line).

### Sample .gutconfig.json
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
## Additional Options
 Here you can provide additional Godot or GUT options if you find the need to.  The default is `-d` to run Godot in debug mode.  You can view all the GUT options available by running __GUT: Show Help__.

__Possible Uses__
 * Use an alternate `.gutconfig.json` file.
 * Skip the `.gutconfig.json` file and add options to set your directories and other options.
 * Provide other Godot options or remove the debug mode option.

 It is recommended that you use a `.gutconfig.json`, the file is easier to manage than the setting, but we won't judge.


## Discard Terminal
Subsequent launches of GUT will discard the existing terminal window and create a new one.  When not checked you must kill Godot manually if an error occurs.


## Shell
The shell to use when running GUT.  Leave blank to use the default shell.  Does not affect running through debugger.


## Godot Override Path
GUT uses the godot-tools extension to get the path to the appropriate Godot executable when running tests.  When this is set, it will be used instead of the godot3 or godot4 path configured in godot-tools.  This is useful if you are windows and want to use a Unix shell.

It is recommended you set this per workspace if you work in Godot 3 and Godot 4 projects since it will be used regardless of project version.