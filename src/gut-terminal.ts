import * as vscode from "vscode";
import * as utils from "./utils";
/**
 *
 */
export class GutTerminal {
    private terminal : vscode.Terminal | undefined = undefined;


    public refreshTerminal(terminalName:string){
        let terminal = vscode.window.terminals.find(t => t.name === terminalName);
        let shouldDiscard = utils.getGutExtensionSetting('discardTerminal', true);

        if(shouldDiscard && terminal){
            terminal.dispose();
            terminal = undefined;
        }

        let terminalType : string = utils.getGutExtensionSetting("terminal", undefined) as string;
		if (!terminal) {
            if(terminalType !== "" && terminalType !== undefined){
                terminal = vscode.window.createTerminal(terminalName, terminalType);
            } else {
                terminal = vscode.window.createTerminal(terminalName);
            }
        }
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