import * as vscode from "vscode";
import * as utils from "./utils";


export class CursorLocation{
    private NOT_SET = '__THIS_IS_NOT_SET__';
    private scriptName = this.NOT_SET;
    private innerClassName = this.NOT_SET;
    private testName = this.NOT_SET;
    private optionMaker = new utils.GutOptionMaker();

    public setScriptName(name:string){
        this.scriptName = name;
    }

    public pushInnerClass(name:string){
        this.innerClassName = name;
    }

    public popInnerClass(){
        this.innerClassName = this.NOT_SET;
    }

    public pushMethod(name:string){
        this.testName = name;
    }

    public popMethod(){
        this.testName = this.NOT_SET;
    }

    public clear(){
        this.scriptName = this.NOT_SET;
        this.innerClassName = this.NOT_SET;
        this.testName = this.NOT_SET;
    }

    public getOptions() : string{
        let toReturn = '';
        if(this.scriptName != this.NOT_SET){
            toReturn += this.optionMaker.optionSelectScript(this.scriptName);
        }
        if(this.innerClassName != this.NOT_SET){
            toReturn += this.optionMaker.optionInnerClass(this.innerClassName);
        }
        if(this.testName != this.NOT_SET){
            toReturn += this.optionMaker.optionUnitTestname(this.testName);
        }

        return toReturn;
    }
}




export class RunAtCursor{
    private cursorLoc = new CursorLocation();
    private  curIndentSize = 0;


    private processDocSymbol(docData:any, targetLine:number){
        let docSymbol = docData as vscode.DocumentSymbol;
        let docInfo = docData as vscode.SymbolInformation;

        let curLineNum = docSymbol.range.start.line;
        let line = vscode.window.activeTextEditor?.document.lineAt(curLineNum);

        let newIndentSize = -1;
        if(line !== undefined){
            newIndentSize= line?.firstNonWhitespaceCharacterIndex;
        }

        if(newIndentSize < this.curIndentSize){
            this.cursorLoc.popInnerClass();
        }
        this.curIndentSize = newIndentSize;

        if(docSymbol.kind === vscode.SymbolKind.Class){
            this.cursorLoc.pushInnerClass(docSymbol.name);
            this.cursorLoc.popMethod();
        }else if(docSymbol.kind === vscode.SymbolKind.Method){
            this.cursorLoc.pushMethod(docSymbol.name);
        }
    }


    private traverseTree(docData:any[], targetLine:number) {

        let docIndex = 0;
        while(docIndex < docData.length && docData[docIndex].range.start.line <= targetLine){
            this.processDocSymbol(docData[docIndex], targetLine);
            this.traverseTree(docData[docIndex].children, targetLine);
            docIndex += 1;
        }
    }


    public getOptionsForLine(docData:any[], lineNumber:number) : string {
        this.cursorLoc.clear();
        let docSymbols = docData as vscode.DocumentSymbol[];

        if(docSymbols.length > 0) {
            if(docSymbols[0].kind === vscode.SymbolKind.Class && docSymbols[0].name.endsWith('.gd')){
                this.cursorLoc.setScriptName(docSymbols[0].name);
                this.curIndentSize = 0;
                this.traverseTree(docSymbols[0].children, lineNumber);
            }
        }

        return this.cursorLoc.getOptions();
    }
}