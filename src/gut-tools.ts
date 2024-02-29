import * as vscode from "vscode";
import * as utils from "./utils";
import {RunAtCursor} from "./run-at-cursor";
import { GutTerminal } from "./gut-terminal";


class GodotDebugConfiguration implements vscode.DebugConfiguration{
    public type = "godot";
    public name = "GUT Debugger";
    public request = "launch";
    public project = "${workspaceFolder}";
    public port = 6007;
    public address = "127.0.0.1";
    public launch_game_instance = true;
    public launch_scene = false;
    public additional_options = "";

    public useGodotExtensionSettings(){
        this.port = utils.getGodotConfigurationValue("lsp.serverPort", this.port);
        this.address = utils.getGodotConfigurationValue("lsp.serverHost", this.address);
    }
}


export class GutTools{
    private gutTerminal : GutTerminal = new GutTerminal("GutTests");

	constructor() {}

    public activate() {
        vscode.commands.registerCommand("gut-extension.show_help", ()=>{
            this.showHelp();
        });

        vscode.commands.registerCommand("gut-extension.run_all", ()=>{
            this.runAllTests();
        });
        vscode.commands.registerCommand("gut-extension.run_script", ()=>{
            this.runScript();
        });
        vscode.commands.registerCommand("gut-extension.run_cursor", ()=>{
            this.runAtCursor();
        });

        vscode.commands.registerCommand("gut-extension.run_all_debugger", ()=>{
            this.runAllTests(true);
        });
        vscode.commands.registerCommand("gut-extension.run_script_debugger", ()=>{
            this.runScript(true);
        });
        vscode.commands.registerCommand("gut-extension.run_cursor_debugger", ()=>{
            this.runAtCursor(true);
        });
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
 

    private async isGutInstalled(){
        let gutFiles = await vscode.workspace.findFiles("**/addons/gut/gut.gd");
        let yesGutHasBeenFoundHere = true;
        if(gutFiles.length === 0){
            yesGutHasBeenFoundHere = false;
            vscode.window.showErrorMessage("GUT check failed:  addons/gut/gut.gd not found.  Is GUT installed?");
        }
        return yesGutHasBeenFoundHere;
    }

    /**
     * Runs GUT for the current workspace.  Any other eninge options or GUT
     * options should be supplied through options parameter.
     * @param options other GUT or Godot options
     */
    private async runGut(options:string = ''){
        let cmd = await this.gutTerminal.getRunGodotCommand();
        let configOpts = utils.getGutExtensionSetting('additionalOptions', '');
        cmd += ' -s res://addons/gut/gut_cmdln.gd ';
        if(cmd){
            this.gutTerminal.runCommand(`${cmd} ${configOpts} ${options}`);
        }
    }


    private async runGutDebugger(options:string = "") {
        var debuggerSearch : vscode.Uri[] = await vscode.workspace.findFiles("**/addons/gut/gut_vscode_debugger.gd");
        var gutScript = "gut_cmdln.gd";
        if(debuggerSearch.length === 1){
            gutScript = "gut_vscode_debugger.gd";
        }

        let config = new GodotDebugConfiguration();
        config.useGodotExtensionSettings();
        config.additional_options = ` -s \"res://addons/gut/${gutScript}\" `;
        config.additional_options += options;
        vscode.debug.startDebugging(undefined, config);
    }


    private async runTests(options:string, useDebugger:boolean){
        let gutInstalled = await this.isGutInstalled();
        if(!gutInstalled){
            return;
        }

        if(useDebugger){
            await this.runGutDebugger(options);
        } else {
            await this.runGut(options);
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
    private runAllTests(useDebugger=false){
        if(!this.isGodotExtensionRunning()){
            return;
        }

        this.gutTerminal.refreshTerminal();
        this.runTests("", useDebugger);
    }


    /**
     * Run the current script
     */
    private runScript(useDebugger=false){
        if(!this.isGodotExtensionRunning()){
            return;
        }

        this.gutTerminal.refreshTerminal();
        const activeEditor = vscode.window.activeTextEditor;
        if(this.isActiveEditorFileValid(activeEditor)){
            let path = this.getFilePath(activeEditor);
            this.runTests(this.gutTerminal.optionSelectScript(path), useDebugger);
        }
    }


    /**
     * Runs GUT for the currently focused file, inner class, and test method.
     */
    private async runAtCursor(useDebugger=false){
        if(!this.isGodotExtensionRunning()){
            return;
        }

        this.gutTerminal.refreshTerminal();
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
                let opts = rac.getOptionsForLine(this.gutTerminal, info, line);
                this.runTests(opts, useDebugger);
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
        this.gutTerminal.refreshTerminal();
        this.runGut('-gh');
    }

}