import * as vscode from "vscode";
class SidebarProvider implements vscode.TreeDataProvider<string> {
    getTreeItem(element: string): vscode.TreeItem {
        return new vscode.TreeItem(element);
    }

    getChildren(): string[] {
        return ["Hello", "AI", "Agent"];
    }
}

export function activate(context: vscode.ExtensionContext) {
    const provider = new SidebarProvider();
    context.subscriptions.push(vscode.window.registerTreeDataProvider("myExtensionView", provider));
}

export function deactivate() {}
