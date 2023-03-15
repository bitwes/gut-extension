import * as vscode from "vscode";
import * as utils from "./utils";


export class CursorLocation{
    private NOT_SET = '__THIS_IS_NOT_SET__';
    private scriptName = this.NOT_SET;
    private innerClassName = this.NOT_SET;
    private testName = this.NOT_SET;
    private optionMaker = new utils.GutOptionMaker();

    public setScript(name:string){
        this.scriptName = name;
    }

    public setInnerClass(name:string){
        this.innerClassName = name;
    }

    public clearInnerClass(){
        this.innerClassName = this.NOT_SET;
    }

    public setMethod(name:string){
        this.testName = name;
    }

    public clearMethod(){
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

    /**
     * I don't think this will work with Godot 4 yet since the end-line for
     * methods is the same as the start-line.
     * @param docSymbol
     * @param targetLine
     */
    private areAllLinesAboveEmpty(docSymbol:vscode.DocumentSymbol, targetLine:number) : boolean {
        let allLinesEmpty = true;
        let curLineNum = targetLine;

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

        return allLinesEmpty;
    }


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
            this.cursorLoc.clearInnerClass();
        }
        this.curIndentSize = newIndentSize;

        if(docSymbol.kind === vscode.SymbolKind.Class){
            this.cursorLoc.setInnerClass(docSymbol.name);
            this.cursorLoc.clearMethod();
        }else if(docSymbol.kind === vscode.SymbolKind.Method){
            // In Godot 4, the start and end line for a method are the
            // same, so we cannot use areAllLinesAboveEmpty to find the gap
            // between tests.  If we try to, we never get a method.
            if(docSymbol.range.start.line === docSymbol.range.end.line){
                this.cursorLoc.setMethod(docSymbol.name);
            } else {
                if(!this.areAllLinesAboveEmpty(docSymbol, targetLine)){
                    this.cursorLoc.setMethod(docSymbol.name);
                }
            }
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
                this.cursorLoc.setScript(docSymbols[0].name);
                this.curIndentSize = 0;
                this.traverseTree(docSymbols[0].children, lineNumber);
            }
        }

        return this.cursorLoc.getOptions();
    }
}