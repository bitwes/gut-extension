import * as vscode from "vscode";
import * as utils from "./utils";
import {CursorLocation, RunAtCursor} from "./run-at-cursor";

export class GutTools{
    private cmdUtils = new utils.CommandLineUtils();
    private optionMaker = new utils.GutOptionMaker();

	constructor() {}

    public activate() {
        vscode.commands.registerCommand("gut-extension.run_cursor", ()=>{
            this.runAtCursor();
        });
        vscode.commands.registerCommand("gut-extension.run_all", ()=>{
            this.runAllTests();
        });
        vscode.commands.registerCommand("gut-extension.run_script", ()=>{
            this.runScript();
        });
        vscode.commands.registerCommand("gut-extension.show_help", ()=>{
            this.showHelp();
        });
    }

    /**
     * Get a gut-extension configuration paramter value.  If it does not exist
     * then log and return the default.
     *
     * @param name The name of the gut-extension config parameter to get
     * @param defaultValue The default value to be returned, the default default is undefined
     */
    private getGutExtensionSetting(name:string, defaultValue:any = undefined){
        let value = vscode.workspace.getConfiguration('gut-extension').get(name);
        if(value === undefined){
            console.log(`Missing config for:  gut-extension.${name}`);
            value = defaultValue;
        }
        return value;
    }

    /**
	 * Runs a command in a terminal with the specified name.  Depending on the
     * value of the discardTerminal setting this will either dispose of an
     * existing terminal with that name and create a new or use the existing one.
     *
	 * @param terminalName the name of the terminal to create or reuse
	 * @param command the command to run in the terminal
	 */
	private reuseTerminal(terminalName:string, command:string){
        let terminal = vscode.window.terminals.find(t => t.name === terminalName);
        let shouldDiscard = this.getGutExtensionSetting('discardTerminal', true);

        if(shouldDiscard && terminal){
            terminal.dispose();
            terminal = undefined;
        }

		if (!terminal) {
			terminal = vscode.window.createTerminal(terminalName);
        }

		terminal.sendText(command, true);
		terminal.show();
	}

    /**
     * Double checks that the Godot extension is running.
     */
    private isGodotExtensionRunning() : boolean{
        let toReturn = false;
        var extension =  vscode.extensions.getExtension('geequlim.godot-tools' );
        if(!extension){
            vscode.window.showErrorMessage('The GUT Extension requires the godot-tools plugin.');
        }else if(!extension?.isActive){
            vscode.window.showErrorMessage('The GUT Extension requires the godot-tool pluign to be active.');
        }else{
            toReturn = true;
        }
        return toReturn;
    }

    /**
     * Checks the document for the passed in editor and verifies it is a valid
     * file to attempt to run GUT with.  Shows error messages when it is not,
     * returns true/false based on if the file is valid.
     * @param activeEditor The editor to check.
     */
    private isActiveEditorFileValid(activeEditor:any):boolean{
        let toReturn = false;

        if (activeEditor) {
            let path = this.getFilePath(activeEditor);
            if(path !==  ""){
                if(path.endsWith('.gd')){
                    toReturn = true;
                }else{
                    vscode.window.showErrorMessage('Current file is not a GDScript file.');
                }
            }
        }else{
            vscode.window.showErrorMessage("No file currently has focus.");
        }
        return toReturn;
    }

    /**
     * Gets the symbol tree for the opened file.  This tree is created by the
     * Godot Tools Extension for .gd files.
     * @param document
     */
    private async getSymbols(document: vscode.TextDocument): Promise<any[]> {
        // The docs say that vscode.executeDocumentSymbolProvider returns a promise
        // of DocumentSymbol and SymbolInformation instances.  IDK what the
        // heck that means.  Is it both classes mashed into one?  Because that
        // is what it looks like when you print it.  This method used to return
        // and array of DocumentSymbol, but I want to use some of the
        // SymbolInformation data, so I changed this to <any[]> and you can cast
        // it to whatever you want...I guess.  Seems dumb but idk what else to
        // do and I've run out of "learning stuff" energy.
        return await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider', document.uri) || [];
    }


    /**
     * Runs GUT for the current workspace.  Any other eninge options or GUT
     * options should be supplied through options parameter.
     * @param options other GUT or Godot options
     */
    private runGut(options:string = ''){
        let cmd = this.cmdUtils.getRunGodotCommand();
        let configOpts = this.getGutExtensionSetting('additionalOptions', '');
        cmd += ' -s res://addons/gut/gut_cmdln.gd ';
        if(cmd){
            this.reuseTerminal('GutToolsTest', `${cmd} ${configOpts} ${options}`);
        }
    }

    /**
     * Gets the path for the file open in the passed in Editor.
     * @param activeEditor The active editor's file path
     */
    private getFilePath(activeEditor:any) : string{
        let path = activeEditor.document.uri.toString();
        path = path.replace(/^.*[\\\/]/, '');
        return path;
    }

    /**
     * Runs the entire test suite.
     */
    private runAllTests(){
        if(!this.isGodotExtensionRunning()){
            return;
        }
        this.runGut();
    }

    /**
     * Run the current script
     */
    private runScript(){
        if(!this.isGodotExtensionRunning()){
            return;
        }

        const activeEditor = vscode.window.activeTextEditor;
        if(this.isActiveEditorFileValid(activeEditor)){
            let path = this.getFilePath(activeEditor);
            this.runGut(this.optionMaker.optionSelectScript(path));
        }
    }

    /**
     * Runs GUT for the currently focused file, inner class, and test method.
     */
    private async runAtCursor(){
        if(!this.isGodotExtensionRunning()){
            return;
        }

        let activeEditor = vscode.window.activeTextEditor;
        // Have to "&& activeEditor" or vscode thinks it hasn't been checked for
        // undefined.  Must check it 2nd or we don't get all the error messages
        // out of isActiveEditorFileValid.
        if(this.isActiveEditorFileValid(activeEditor) && activeEditor){
            let doc = activeEditor.document;
            let line  = activeEditor.selection.active.line;

            let info = await this.getSymbols(doc);
            if(info.length > 0){
                let rac = new RunAtCursor();
                let opts = rac.getOptionsForLine(info, line);
                this.runGut(opts);
            } else {
                vscode.window.showErrorMessage(
                    'Run at cursor requires the workspace to be open in the ' +
                    'Godot Editor');
            }
        }
    }

    /**
     * Shows GUT help in the terminal window.
     */
    private showHelp(){
        this.runGut('-gh');
    }
}