import * as vscode from "vscode";
import { GitExtension, Repository } from "./types/git";

const generateCommitMessage = async (repo: Repository) => {
    const diffs = await repo.diffIndexWithHEAD();

    if (!diffs) {
        vscode.window.showInformationMessage("No staged changes to analyze.");
        return;
    }

    // TODO: get context
    await new Promise((resolve) => setTimeout(resolve, 3000));
    for (const diff of diffs) {
        console.log("diff:", diff);
    }
    // TODO: set ai response in the commit input box
    repo.inputBox.value = "<feat: ai commit message>";
};

const runGenerateCommitMessage = async (repo: Repository) => {
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.SourceControl,
            title: "Onyx: Generating commit message…",
            cancellable: false,
        },
        () => generateCommitMessage(repo),
    );
};
export const activate = async (context: vscode.ExtensionContext) => {
    const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");
    if (!gitExtension) {
        vscode.window.showErrorMessage("Onyx: Git extension not available");
        return;
    }
    const gitExports = await gitExtension.activate();
    const gitApi = gitExports.getAPI(1);
    context.subscriptions.push(
        vscode.commands.registerCommand("onyx.git.generateCommitMessage", () => {
            const repo = gitApi.repositories[0];
            if (!repo) {
                vscode.window.showInformationMessage("Onyx: No Git repository found");
                return;
            }

            runGenerateCommitMessage(repo);
        }),
    );
};
