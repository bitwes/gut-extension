import * as vscode from "vscode";
import * as utils from "./utils";
import * as fs from 'fs';

/**
 *
 */
export class GutTerminal {
    private terminal : vscode.Terminal | undefined = undefined;
    private name = "gut";

    constructor(name:string){
        this.name = name;
    }

    private verifyEditorPathSetting(editorPath:string){
        let isValid = false;
        if (!fs.existsSync(editorPath) || !fs.statSync(editorPath).isFile()) {
            vscode.window.showErrorMessage(`Could not find Godot at:  [${editorPath}].  Please verify that the godot-tools extension is configured.`);
        } else {
            isValid = true;
        }
        return isValid;
    }


    public refreshTerminal(){
        this.terminal = vscode.window.terminals.find(t => t.name === this.name);
        let shouldDiscard = utils.getGutExtensionSetting('discardTerminal', true);

        if(shouldDiscard && this.terminal){
            this.terminal.dispose();
            this.terminal = undefined;
        }

        let terminalType : string = utils.getGutExtensionSetting("terminal", undefined) as string;
		if (!this.terminal) {
            if(terminalType !== "" && terminalType !== undefined){
                this.terminal = vscode.window.createTerminal(this.name, terminalType);
            } else {
                this.terminal = vscode.window.createTerminal(this.name);
            }
        }
    }


    public escapeCommand(command:string):string{
        let cmdEsc = `"${command}"`;
        if(this.isShellPowershell()){
            cmdEsc = `&${cmdEsc}`;
        }
        return cmdEsc;
    }


    public runCommand(command:string){
        if(this.terminal !== undefined){
            this.terminal.sendText(command, true);
            this.terminal.show();
        }
    }


    public isShellPowershell():boolean{
        if(this.terminal === undefined){
            return false;
        }

        let opts = this.terminal.creationOptions as vscode.TerminalOptions;
        const shellPath : string | undefined = opts.shellPath;
        let itIs = false;
        if (shellPath && (
            shellPath.endsWith("powershell.exe") || shellPath.endsWith('pwsh.exe'))){
                itIs = true;
        }
        return itIs;
    }


    public wrapForPS(value:string) : string{
        let wrapped = value;
        if(this.isShellPowershell()){
            wrapped = `"${wrapped}"`;
        }
        return wrapped;
    }


    public async getRunGodotCommand() : Promise<string | undefined>{
        let editorPath : string = await vscode.commands.executeCommand('godotTools.getGodotPath');
        let toReturn : string | undefined = editorPath;

        if(this.verifyEditorPathSetting(editorPath)){
            toReturn = this.escapeCommand(toReturn);
        } else {
            toReturn = undefined;
        }
        return toReturn;
    }


    public gutOption(option:string, value:string):string{
        let opt = ` -${option}=${this.wrapForPS(value)}`;
        return opt;
    }


    public optionSelectScript(scriptPath:string):string{
        return this.gutOption("gselect", scriptPath);
    }


    /**
     * Get the option to run an inner class based ont he current platform.
     * @param clasName The inner class name
     */
    public optionInnerClass(clasName:string):string{
        // technically this doesn't require "" since these class names can't
        // have characters that need to be escaped for powershell, but who
        // knows when that might change.
        return this.gutOption("ginner_class", clasName);
    }


    /**
     * Get the option to run a test with the given name.
     * @param testName The name of the test to run
     */
    public optionUnitTestname(testName:string):string{
        // This is the same case as optionInnerClass, wrapping for good measure.
        return this.gutOption("gunit_test_name", testName);
    }

}