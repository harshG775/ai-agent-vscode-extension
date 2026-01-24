import * as vscode from "vscode";

const scmAction = async () => {
    const gitApi = vscode.extensions.getExtension("vscode.git")?.exports?.getAPI(1);
    if (!gitApi) {
        vscode.window.showErrorMessage("Git extension not found");
        return;
    }
    console.log("Git API:", gitApi);
    console.log("Repositories:", gitApi.repositories);

    const repo = gitApi.repositories[0];
    if (!repo) {
        vscode.window.showWarningMessage("No Git repository found");
        return;
    }

    repo.indexChanges.map((c: vscode.SourceControlResourceState) => {
        console.log("fsPath:", c.resourceUri);
        return c.resourceUri;
    });
    vscode.window.showInformationMessage("SCM button clicked 🚀");
};

export const activate = (context: vscode.ExtensionContext) => {
    context.subscriptions.push(vscode.commands.registerCommand("onyxExtension.scmAction", scmAction));
};
