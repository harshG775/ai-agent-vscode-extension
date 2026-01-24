import * as vscode from "vscode";
import { API, GitExtension } from "./types/git";
const scmActionGenerateCommitMessage = async (gitExtension: GitExtension) => {
    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    status.text = "$(sync~spin) Generating commit message...";
    status.show();
    try {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const gitApi: API = gitExtension.getAPI(1);

        const repo = gitApi.repositories[0];
        const diffs = await repo.diffIndexWithHEAD();

        if (!diffs) {
            vscode.window.showInformationMessage("No staged changes to analyze.");
            return;
        }

        // TODO: get context
        for (const diff of diffs) {
            console.log("diff:", diff);
        }

        // TODO: set ai response in the commit input box
        repo.inputBox.value = "<feat: ai commit message>";
    } catch (error) {
        console.log(error);
    } finally {
        status.dispose();
    }
};

export const activate = async (context: vscode.ExtensionContext) => {
    const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");

    if (!gitExtension) {
        vscode.window.showErrorMessage("onyxExtension: Git extension not enabled");
        return;
    }
    const gitExports = await gitExtension.activate();

    context.subscriptions.push(
        vscode.commands.registerCommand("onyxExtension.scmAction", async () => {
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: "Generating commit message with AI...",
                    cancellable: false,
                },
                async () => {
                    await scmActionGenerateCommitMessage(gitExports);
                },
            );
        }),
    );
};
