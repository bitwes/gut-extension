import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';

export class GutTools{
	private context: vscode.ExtensionContext;
	private workspace_dir = vscode.workspace.rootPath;
	private connection_status: vscode.StatusBarItem;

	constructor(p_context: vscode.ExtensionContext) {
		this.context = p_context;
		this.connection_status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
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
        return `--path "${this.workspace_dir}" -d -s res://addons/gut/gut_cmdln.gd `;
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

    private runAtCursor(){
        let path = "";
        let testName = "";
        let innerClass = "";

        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            path = this.getFilePath(activeEditor);
            testName = this.getTestName(activeEditor);
            innerClass = this.getInnerClassName(activeEditor);
        }    
        
        let cmd = this.getBaseGutCmd();
        if(path !==  ""){
            cmd+= " -gselect=" + path;
        }

        if(testName !== ""){
            cmd += " -gunit_test_name=" + testName;
        }

        if(innerClass !==  ""){
            cmd += " -ginner_class=" + innerClass;
        }

        this.runCmd(cmd);
    }

}