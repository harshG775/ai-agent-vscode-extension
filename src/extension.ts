import * as vscode from "vscode";

class MyWebviewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtml(webviewView.webview);

        // Handle messages sent from the webview to the extension
        webviewView.webview.onDidReceiveMessage((data) => {
            switch (data.type) {
                case "askAgent":
                    vscode.window.showInformationMessage(`Agent is thinking about: ${data.value}`);
                    break;
            }
        });
    }

    private _getHtml(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { color: var(--vscode-foreground); }
                        input { width: 100%; margin-bottom: 10px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); }
                        button { width: 100%; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 4px; cursor: pointer; }
                    </style>
                </head>
                <body>
                    <input id="prompt" type="text" placeholder="Ask the AI agent...">
                    <button id="send">Send</button>

                    <script>
                        const vscode = acquireVsCodeApi();
                        const btn = document.getElementById('send');
                        const input = document.getElementById('prompt');

                        btn.addEventListener('click', () => {
                            vscode.postMessage({ type: 'askAgent', value: input.value });
                        });
                    </script>
                </body>
            </html>
        `;
    }
}

export const activate = (context: vscode.ExtensionContext) => {
    const provider = new MyWebviewProvider(context.extensionUri);

    context.subscriptions.push(vscode.window.registerWebviewViewProvider("myExtensionView", provider));
};
