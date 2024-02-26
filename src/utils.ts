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

export function getGodotConfigurationValue(name: string, defaultValue: any = null){
    return vscode.workspace.getConfiguration("godotTools").get(name, defaultValue)||defaultValue;
}

/**
 */
export class CommandLineUtils {
    private workspace_dir = vscode.workspace.rootPath;

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
    public async getRunGodotCommand() : Promise<string | undefined>{
        let editorPath : string = await vscode.commands.executeCommand('godotTools.getGodotPath');
        let toReturn : string | undefined = editorPath;

        if(this.verifyEditorPathSetting(editorPath)){
            toReturn = toReturn.replace("${workspaceRoot}", this.workspace_dir ? this.workspace_dir : "${workspaceRoot}");
            toReturn = this.escapeCommand(toReturn);
        } else {
            toReturn = undefined;
        }
        return toReturn;
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
            vscode.window.showErrorMessage(`Could not find Godot at:  [${editorPath}].  Please verify that the godot-tools extension is configured.`);
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
