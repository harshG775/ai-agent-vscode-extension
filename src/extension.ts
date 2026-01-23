import * as vscode from "vscode";

class MyWebviewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {}
    private _getHtml(webview: vscode.Webview) {
        return `
        <div>hello world${webview.options.localResourceRoots}</div>
    `;
    }
    public resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtml(webviewView.webview);
    }
}

export const activate = (context: vscode.ExtensionContext) => {
    const provider = new MyWebviewProvider(context.extensionUri);

    context.subscriptions.push(vscode.window.registerWebviewViewProvider("myExtensionView", provider));
};
