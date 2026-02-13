import * as vscode from "vscode";

export class ChatViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly context: vscode.ExtensionContext) {}

    resolveWebviewView(view: vscode.WebviewView) {
        view.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "media")],
        };

        const scriptUri = view.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "chat.js"));

        view.webview.html = /*html*/ `
            <!DOCTYPE html>
            <html lang="en">
                <body>
                    <div id="messages"></div>
                    <input id="input" placeholder="Type a message..." />
                    
                    <script src="${scriptUri}"></script>
                </body>
            </html>
        `;

        view.webview.onDidReceiveMessage((message) => {
            if (message.type === "user-message") {
                view.webview.postMessage({
                    type: "assistant-message",
                    text: "Echo: " + message.text,
                });
            }
        });
    }
}
