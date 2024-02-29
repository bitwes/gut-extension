import * as vscode from "vscode";
import * as utils from "./utils";
import * as fs from 'fs';

/**
 *
 */
export class GutTerminal {
    private terminal : vscode.Terminal | undefined = undefined;
    private name : string = "gut";
    private lastShell : string | undefined = "";

    constructor(name:string){
        this.name = name;
    }


    public getShell(){
        let theShell = utils.getGutExtensionSetting("shell", undefined) as string;
        if(theShell === undefined || theShell === ""){
            theShell = vscode.env.shell;
        }
        return theShell;
    }

    public refreshTerminal(){
        this.terminal = vscode.window.terminals.find(t => t.name === this.name);
        let shouldDiscard = utils.getGutExtensionSetting('discardTerminal', true);
        let currentShell = this.getShell();

        if(this.terminal && (shouldDiscard || this.lastShell !== currentShell)){
            this.terminal.dispose();
            this.terminal = undefined;
        }
        this.lastShell = currentShell;

		if (!this.terminal) {
            if(currentShell !== "" && currentShell !== undefined){
                this.terminal = vscode.window.createTerminal(this.name, currentShell);
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

        let shellPath : string | undefined = this.getShell();
        let itIs = false;
        if (shellPath && (
            shellPath.toLowerCase().indexOf("powershell") > -1 ||
            shellPath.toLowerCase().indexOf("pwsh") > -1)){
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
        let editorPath : string = utils.getGutExtensionSetting("godotOverridePath", "");
        if(editorPath === ""){
            editorPath = await vscode.commands.executeCommand('godotTools.getGodotPath') as string;
        }

        let toReturn : string | undefined = editorPath;
        toReturn = this.escapeCommand(toReturn);
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