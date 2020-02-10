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
    
    private getTestName(activeEditor:any){
        let name = "";
        var line =  activeEditor.selection.active.line;
        var lineText = activeEditor.document.lineAt(line).text.trim();
        if(lineText.startsWith("func ")){
            lineText = lineText.replace("func ", '').replace("()", '').trim();
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

    public activate() {
        let path = "";
        let testName = "";
        let innerClass = "";

        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            path = activeEditor.document.uri.toString();
            path = path.replace(/^.*[\\\/]/, '');
            testName = this.getTestName(activeEditor);
            innerClass = this.getInnerClassName(activeEditor);

        }    
        
        let cmd =  "godot -d  -s res://addons/gut/gut_cmdln.gd ";
        if(path !==  ""){
            cmd+= " -gselect=" + path;
        }

        if(testName !== ""){
            cmd += " -gunit_test_name=" + testName;
        }

        if(innerClass !==  ""){
            cmd += " -ginner_class=" + innerClass;
        }

        let terminal = vscode.window.createTerminal('Gut');
        terminal.show();
        terminal.sendText(cmd);
    
    }   
}