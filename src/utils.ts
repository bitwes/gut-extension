import * as vscode from "vscode";
import * as fs from 'fs';


function makePad(pad:string, times:number) : string{
    var toReturn = '';
    for (let i = 0; i < times; i++) {
        toReturn += pad;
    }
    return toReturn;
}

export function printDocumentSymbol(docSymbol:vscode.DocumentSymbol,  indent : number = 0){
    let pad = makePad('    ', indent);
    let s = `${pad}${docSymbol.name}:  ${docSymbol.range.start.line} -> ${docSymbol.range.end.line} (${docSymbol.kind})`;
    console.log(s);
}

export function printDocumentSymbols(docSymbols : vscode.DocumentSymbol[], indent : number =  0){
    docSymbols.forEach((val) =>  {
        printDocumentSymbol(val, indent);
        printDocumentSymbols(val.children,  indent + 1);
    });
}

/**
 * This class contains logic from the godot_tools vscode extension.  This
 * should be deleted after the PR for new non-pallette commands is merged.
 */
export class CommandLineUtils {
    private workspace_dir = vscode.workspace.rootPath;
    private CONFIG_CONTAINER = "godot_tools";

    private get_configuration(name: string, default_value: any = null) {
        return vscode.workspace.getConfiguration(this.CONFIG_CONTAINER).get(name, default_value) || default_value;
    }

    /**
     * Checks if the configured shell is powershell.exe or pwsh.exe
     */
    private isShellPowershell(){
        let itIs = false;
        if (process.platform === "win32") {
            const POWERSHELL = "powershell.exe";
            const shell_plugin = vscode.workspace.getConfiguration("terminal.integrated.shell");
            // the default is powershell if not set.
            let shell = (shell_plugin ? shell_plugin.get("windows", POWERSHELL) : POWERSHELL) || POWERSHELL;
            if (shell.endsWith(POWERSHELL) || shell.endsWith('pwsh.exe')) {
                itIs = true;
            }
        }
        return itIs;
    }

    /**
     * Wraps the value with double quotes if the terminal being used is Powershell.
     * @param value the value to be wrapped
     */
    public wrapForPS(value:string) : string{
        let wrapped = value;
        if(this.isShellPowershell()){
            wrapped = `"${wrapped}"`;
        }
        return wrapped;
    }

    /**
     * Wraps the command with double quotes and prepends a & when the current
     * shell is powershell.
     * @param cmd a command
     */
    private escapeCommand(cmd: string){
        let cmdEsc = `"${cmd}"`;
        if(this.isShellPowershell()){
            cmdEsc = `&${cmdEsc}`;
        }
        return cmdEsc;
    }

    /**
     * Returns a string that can be used to launch Godot for the current
     * workspace.  This uses the editor_path setting.  If that value of that
     * setting cannot be found on the file system then undefined will be
     * returned and an error message will be displayed on the screen.
     */
    public getRunGodotCommand(){
        let editorPath = this.get_configuration("editor_path", "");
        if(this.verifyEditorPathSetting(editorPath)){
            editorPath = editorPath.replace("${workspaceRoot}", this.workspace_dir);
            editorPath = this.escapeCommand(editorPath);
        } else {
            editorPath = undefined;
        }
        return editorPath;
    }

    /**
     * Verifies that the path passed in exists.  If it does not then an error
     * message will be displayed and false will be returned.  Otherwise true
     * will be returned.
     * @param editorPath The path to the godot executable
     */
    private verifyEditorPathSetting(editorPath:string){
        let isValid = false;
        if (!fs.existsSync(editorPath) || !fs.statSync(editorPath).isFile()) {
            vscode.window.showErrorMessage(`Could not find ${editorPath}.  Please verify that the Godot_tools:Editor_path setting has a proper value.`);
        } else {
            isValid = true;
        }
        return isValid;
    }
}


export class GutOptionMaker{
    private cmdUtils = new CommandLineUtils();

    /**
     * Get the option to select a script based on the current platform.
     * @param scriptPath the name of the script to run
     */
    public optionSelectScript(scriptPath:string):string{
        return " -gselect=" + this.cmdUtils.wrapForPS(scriptPath);
    }

    /**
     * Get the option to run an inner class based ont he current platform.
     * @param clasName The inner class name
     */
    public optionInnerClass(clasName:string):string{
        // technically this doesn't require "" since these class names can't
        // have characters that need to be escaped for powershell, but who
        // knows when that might change.
        return " -ginner_class=" + this.cmdUtils.wrapForPS(clasName);
    }

    /**
     * Get the option to run a test with the given name.
     * @param testName The name of the test to run
     */
    public optionUnitTestname(testName:string):string{
        // This is the same case as optionInnerClass, wrapping for good measure.
        return " -gunit_test_name=" + this.cmdUtils.wrapForPS(testName);
    }
}
