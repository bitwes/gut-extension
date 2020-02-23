import * as vscode from "vscode";
import * as fs from 'fs';

export function printDocumentSymbol(docSymbol:vscode.DocumentSymbol,  indent : number = 0){
    let pad = '  ';
    let s = `${docSymbol.name}:  ${docSymbol.range.start.line} -> ${docSymbol.range.end.line} (${docSymbol.kind})`;
    console.log(s);
}

export function printDocumentSymbols(docSymbols : vscode.DocumentSymbol[], indent : number =  0){
    docSymbols.forEach((val) =>  {
        printDocumentSymbol(val, indent);
        printDocumentSymbols(val.children,  indent + 1);
    });
}

/**
 * This class contains logic from the godot_tools vscode extension.  This is 
 * should be deleted after the PR for new non-pallette commands is merged.
 */
export class GodotBorrowedTools {
    private workspace_dir = vscode.workspace.rootPath;
    private CONFIG_CONTAINER = "godot_tools";

    private get_configuration(name: string, default_value: any = null) {
        return vscode.workspace.getConfiguration(this.CONFIG_CONTAINER).get(name, default_value) || default_value;
    }
    
    public isShellPowershell(){
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

    public wrapForPS(value:string) : string{
        let wrapped = value;
        if(this.isShellPowershell()){
            wrapped = `"${wrapped}"`;
        }
        return wrapped;
    }

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
    public getRunGodotCommand(){
        let editorPath = this.get_configuration("editor_path", "");
        if(this.verifyEditorPathSetting(editorPath)){
            editorPath = editorPath.replace("${workspaceRoot}", this.workspace_dir);
            editorPath = this.escapeCommand(editorPath);	
        } else {
            editorPath = undefined;
        }
        return editorPath;
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
            vscode.window.showErrorMessage(`Could not find ${editorPath}.  Please verify that the Godot_tools:Editor_path setting has a proper value.`);
        } else {
            isValid = true;
        }
        return isValid;
    }
}