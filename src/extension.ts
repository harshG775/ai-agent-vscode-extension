import * as vscode from "vscode";
import { API, GitExtension } from "./types/git";
const scmAction = async (gitExtension: GitExtension) => {
    const gitApi: API = gitExtension.getAPI(1);

    if (!gitApi) {
        vscode.window.showErrorMessage("Git extension not found");
        return;
    }
    if (gitApi.repositories.length === 0) {
        vscode.window.showWarningMessage("No Git repositories found");
        return;
    }
    if (gitApi.repositories.length > 0) {
        const repo = gitApi.repositories[0];

        const stagedFiles = repo.state.indexChanges;
        stagedFiles?.forEach((change) => {
            console.log(`Staged File: ${change.originalUri}`);
            console.log(`Status: ${change.status}`);
        });
    }
};

export const activate = async (context: vscode.ExtensionContext) => {
    const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");

    if (!gitExtension) {
        vscode.window.showErrorMessage("onyxExtension: Git extension not enabled");
        return;
    }
    const gitExports = await gitExtension.activate();

    context.subscriptions.push(vscode.commands.registerCommand("onyxExtension.scmAction", () => scmAction(gitExports)));
};
