import * as vscode from "vscode";
import { API, GitExtension } from "./types/git";
const scmActionGenerateCommitMessage = async (gitExtension: GitExtension) => {
    const gitApi: API = gitExtension.getAPI(1);
    
    const repo = gitApi.repositories[0];
    const diffs = await repo.diffIndexWithHEAD();

    if (!diffs) {
        vscode.window.showInformationMessage("No staged changes to analyze.");
        return;
    }

    for (const diff of diffs) {
        console.log("diff:", diff);
    }

    // set ai response in the commit input box
    repo.inputBox.value = "<feat: ai commit message>";

};

export const activate = async (context: vscode.ExtensionContext) => {
    const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");

    if (!gitExtension) {
        vscode.window.showErrorMessage("onyxExtension: Git extension not enabled");
        return;
    }
    const gitExports = await gitExtension.activate();

    context.subscriptions.push(
        vscode.commands.registerCommand("onyxExtension.scmAction", () => scmActionGenerateCommitMessage(gitExports)),
    );
};
