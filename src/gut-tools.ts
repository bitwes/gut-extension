import * as vscode from "vscode";
import { GodotBorrowedTools } from "./utils";

export class GutTools{
    private GodotTools = new GodotBorrowedTools();

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
	 * Creates a new terminal with the specified name or reuses the existing 
     * one.
	 * @param terminalName the name of the terminal to create or reuse
	 * @param command the command to run in the terminal
	 */
	private reuseTerminal(terminalName:string, command:string){
		let terminal = vscode.window.terminals.find(t => t.name === terminalName);
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
    private async getSymbols(document: vscode.TextDocument): Promise<vscode.DocumentSymbol[]> {
        return await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider', document.uri) || [];
    }
    
    /**
     * Get the GUT option for the line number that is passed in.
     * @param docSymbols Symbols for the document
     * @param line  line number
     */
    private getOptionForLine(docSymbols:vscode.DocumentSymbol[], line:number){
        let opts = "";
        for (let val of docSymbols) {
            opts += this.getOptionForSymbolInfo(val, line);
            opts += this.getOptionForLine(val.children, line);
        }
        
        return opts;
    }

    /**
     * The Godot extension will populate the DocumentSymbol, so this only 
     * works if the Editor has been launched for the workspace.
     */
    private getOptionForSymbolInfo(docSymbol:vscode.DocumentSymbol, line: number){
        let opt = "";
            
        if(docSymbol.range.start.line <= line && docSymbol.range.end.line >= line){
            // The Godot plugin uses Package for both the file and for inner
            // classes.
            if(docSymbol.kind === vscode.SymbolKind.Package){
                if(docSymbol.name.endsWith('.gd')){
                    opt = this.optionSelectScript(docSymbol.name);
                }else{
                    opt = this.optionInnerClass(docSymbol.name);
                }
            }

            // The Godot plugin uses Interface for methods.
            if(docSymbol.kind === vscode.SymbolKind.Interface){
                let allLinesEmpty = true;
                let curLineNum = line;
                
                // Ignore the blank space between methods.  Check all lines 
                // from the current line to the end of the method to see if 
                // they are blank or comments.
                while(allLinesEmpty && curLineNum <= docSymbol.range.end.line){
                    let lineText = vscode.window.activeTextEditor?.document.lineAt(curLineNum).text.trim();
                    if(lineText) {
                        allLinesEmpty = lineText === '' || lineText.startsWith('#');
                    } 
                    curLineNum += 1;
                }

                // When they are not all blank then we are in a method so add
                // that to the options.  When they are all blank then we are in
                // the space between two methods so don't add the options so 
                // that the Inner class or file is run.
                if(!allLinesEmpty){
                    opt = ` -gunit_test_name=${docSymbol.name}`;
                }
            }
        }
        return opt;
    }
    
    /**
     * Runs GUT for the current workspace.  Any other eninge options or GUT 
     * options should be supplied through options parameter.
     * @param options other GUT or Godot options
     */
    private runGut(options:string = ''){
        let cmd = this.GodotTools.getRunGodotCommand();
        let configOpts = vscode.workspace.getConfiguration('gut-extension').get('additionalOptions', '') || '';
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
     * Get the option to select a script based on the current platform.
     * @param scriptPath the name of the script to run
     */
    private optionSelectScript(scriptPath:string):string{
        return " -gselect=" + this.GodotTools.wrapForPS(scriptPath);
    }

    /**
     * Get the option to run an inner class based ont he current platform.
     * @param clasName The inner class name
     */
    private optionInnerClass(clasName:string):string{
        // technically this doesn't require "" since these class names can't
        // have characters that need to be escaped for powershell, but who
        // knows when that might change.
        return " -ginner_class=" + this.GodotTools.wrapForPS(clasName);
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
            this.runGut(this.optionSelectScript(path));
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
                let options = this.getOptionForLine(info, line);
                this.runGut(options);        
            }else{
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