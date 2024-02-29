import * as assert from 'assert';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension';
import { GutTerminal } from "../../gut-terminal";


suite('Gut Terminal Test Suite', () => {
    async function resetConfig(){
        let config = vscode.workspace.getConfiguration("gut-extension");
        await config.update("shell", '', true);
        await config.update('additionalOptions', '-d', true);
        await config.update('godotOverridePath', '', true);
        await config.update('discardTerminal', true, true);
    }

    let settings = vscode.workspace.getConfiguration("gut-extension");

    let getGodotPathReturnValue = 'NOT SET';
    function getGodotPathMock(){
        return getGodotPathReturnValue;
    }

    suiteSetup(async () => {
        await resetConfig();
        vscode.commands.registerCommand('godotTools.getGodotPath', getGodotPathMock);
    });

    teardown(async () => {
        await resetConfig();
        getGodotPathReturnValue = "NOT SET";
    });

    test('can make one', () => {
        let gt = new GutTerminal('test');
        assert.strictEqual(gt instanceof GutTerminal, true);
    });

    test('get shell returns default shell when not set', () => {
        let gt = new GutTerminal('test');
        assert.strictEqual(gt.getShell(), vscode.env.shell);
    });

    test('get shell returns setting when set', async () => {
        let gt = new GutTerminal('test');
        await settings.update("shell", 'bash', true);

        assert.strictEqual(gt.getShell(), 'bash');
    });

    test('getRunGodotCommand returns godot3 path maybe', async () => {
        let gt = new GutTerminal('test');
        getGodotPathReturnValue = "test value";
        assert.strictEqual(await gt.getRunGodotCommand(), '"test value"');
    });

    test('getRunGodotCommand returns override path when set', async ()=>{
        let gt = new GutTerminal('test');
        await settings.update("godotOverridePath", 'it_is_overrode', true);
        assert.strictEqual(await gt.getRunGodotCommand(), '"it_is_overrode"');
    });

    test('when shell is powershell gut command starts with &', async ()=>{
        let gt = new GutTerminal('test');
        await settings.update('shell', 'powershell', true);

        gt.refreshTerminal();
        let cmd = await gt.getRunGodotCommand();

        assert.strictEqual(cmd?.startsWith("&"), true);
    });
});
