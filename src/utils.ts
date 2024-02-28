import * as vscode from "vscode";
import * as fs from 'fs';


function makePad(pad:string, times:number) : string{
    var toReturn = '';
    for (let i = 0; i < times; i++) {
        toReturn += pad;
    }
    return toReturn;
}


export function printDocumentSymbol(docSymbol:vscode.DocumentSymbol,  indent : number = 0){
    let pad = makePad('    ', indent);
    let s = `${pad}${docSymbol.name}:  ${docSymbol.range.start.line} -> ${docSymbol.range.end.line} (${docSymbol.kind})`;
    console.log(s);
}


export function printDocumentSymbols(docSymbols : vscode.DocumentSymbol[], indent : number =  0){
    docSymbols.forEach((val) =>  {
        printDocumentSymbol(val, indent);
        printDocumentSymbols(val.children,  indent + 1);
    });
}


/**
 * Get a gut-extension configuration paramter value.  If it does not exist
 * then log and return the default.
 *
 * @param name The name of the gut-extension config parameter to get
 * @param defaultValue The default value to be returned, the default default is undefined
 */
export function getGutExtensionSetting(name:string, defaultValue:any = undefined) : any{
    let value = vscode.workspace.getConfiguration('gut-extension').get(name);
    if(value === undefined){
        console.log(`Missing config for:  gut-extension.${name}`);
        value = defaultValue;
    } else if(typeof(value) === "string"){
        value = value.trim();
    }
    return value;
}


export function getGodotConfigurationValue(name: string, defaultValue:any){
    let configValue = vscode.workspace.getConfiguration("godotTools").get(name, defaultValue);
    if(typeof(configValue) === "string"){
        configValue = configValue.trim();
    }
    return configValue || defaultValue;
}