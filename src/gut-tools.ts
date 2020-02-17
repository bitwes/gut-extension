import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';

export class GutTools{
	private context: vscode.ExtensionContext;    

	constructor(p_context: vscode.ExtensionContext) {
		this.context = p_context;
    }

    public activate() {
        vscode.commands.registerCommand("gut-tool.run_cursor", ()=>{
            this.runAtCursor();
        });
        vscode.commands.registerCommand("gut-tool.run_all", ()=>{
            this.runAllTests();
        });    
        vscode.commands.registerCommand("gut-tool.run_script", ()=>{
            this.runScript();
        });    
    }   
    
    private async getSymbols(document: vscode.TextDocument): Promise<vscode.DocumentSymbol[]> {
        return await vscode.commands.executeCommand<vscode.DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', document.uri) || [];
    }
    
    private async runAtCursor(){
        let activeEditor = vscode.window.activeTextEditor;
        if(activeEditor){
            let doc = activeEditor.document;
            let line  = activeEditor.selection.active.line;
            
            let info = await this.getSymbols(doc);            
            let options = this.getOptionForLine(info, line);
            this.runCmd(this.getBaseGutCmd() + " " + options);    
        }
    }

    private getOptionForSymbolInfo(docSymbol:vscode.DocumentSymbol, line: number){
        let opt = "";
        if(docSymbol.range.start.line <= line && docSymbol.range.end.line >= line){
            this.printDocumentSymbol(docSymbol);
            if(docSymbol.kind === vscode.SymbolKind.Package){
                if(docSymbol.name.endsWith('.gd')){
                    opt = ` -gselect=${docSymbol.name}`;
                }else{
                    opt =  ` -ginner_class=${docSymbol.name}`;
                }
            }

            if(docSymbol.kind ===  vscode.SymbolKind.Interface){
                let isLastEmptyLine = false
                if(line === docSymbol.range.end.line){
                    var lineText = vscode.window.activeTextEditor?.document.lineAt(line).text.trim();
                    isLastEmptyLine = lineText === '';
                }

                // Ignore the method if we are in the space between methods.
                if(!isLastEmptyLine){
                    opt = ` -gunit_test_name=${docSymbol.name}`;
                }
                
            }
        }
        return  opt;
    }
    
    private getOptionForLine(docSymbols:vscode.DocumentSymbol[], line:number){
        let opts = "";
        for (let val of docSymbols) {
            opts += this.getOptionForSymbolInfo(val, line);
            opts += this.getOptionForLine(val.children, line);
        }
        
        return opts;
    }

    private printDocumentSymbol(docSymbol:vscode.DocumentSymbol,  indent : number = 0){
        let pad = '  ';
        let s = `${docSymbol.name}:  ${docSymbol.range.start.line} -> ${docSymbol.range.end.line} (${docSymbol.kind})`;
    }
    
    private printDocumentSymbols(docSymbols : vscode.DocumentSymbol[], indent : number =  0){
        docSymbols.forEach((val) =>  {
            this.printDocumentSymbol(val, indent);
            this.printDocumentSymbols(val.children,  indent + 1);
        });
    }

    private runCmd(cmd:string){
        vscode.commands.executeCommand('godot-tool.run_godot', cmd);
    }

    private getTestName(activeEditor:any){
        let name = "";
        var line =  activeEditor.selection.active.line;
        var lineText = activeEditor.document.lineAt(line).text.trim();
        if(lineText.startsWith("func ")){
            lineText = lineText.replace("func ", '').replace("():", '').trim();
            name = lineText;
        }            
        return name;
    }

    private getInnerClassName(activeEditor:any){
        let name = "";
        var line =  activeEditor.selection.active.line;
        var lineText = activeEditor.document.lineAt(line).text.trim();
        if(lineText.startsWith("class")){
            lineText = lineText.replace("class", '').replace(":", '').trim();
            name = lineText;
        }            
        return name;
    }

    private getFilePath(activeEditor:any){
        let path = activeEditor.document.uri.toString();
        path = path.replace(/^.*[\\\/]/, '');
        return path;
    }

    private getBaseGutCmd(){        
        return ` -d -s res://addons/gut/gut_cmdln.gd `;
    }

    private runAllTests(){
        this.runCmd(this.getBaseGutCmd());
    }

    private runScript(){
        let path = "";

        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            path = this.getFilePath(activeEditor);
            let cmd = this.getBaseGutCmd();
            if(path !==  ""){
                cmd+= " -gselect=" + path;
            }    
            this.runCmd(cmd);
        }else{
            vscode.window.setStatusBarMessage("No file selected");
            vscode.window.showErrorMessage("No file opened");
        }        
    }
}