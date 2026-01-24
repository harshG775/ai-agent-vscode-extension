import * as vscode from "vscode";
import { GitExtension, Repository } from "./types/git";

const generateCommitMessage = async (repo: Repository) => {
    const diffs = await repo.diffIndexWithHEAD();

    if (!diffs || diffs.length === 0) {
        vscode.window.showInformationMessage("No staged changes to analyze.");
        return;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    repo.inputBox.value = "feat: logic implemented via ai";
};

const runGenerateCommitMessage = async (repo: Repository) => {
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.SourceControl,
            title: "Onyx: Generating commit message...",
            cancellable: false,
        },
        () => generateCommitMessage(repo),
    );
};

export const activate = async (context: vscode.ExtensionContext) => {
    const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");

    if (!gitExtension) {
        return;
    }

    const gitExports = await gitExtension.activate();
    const gitApi = gitExports.getAPI(1);
    if (!gitApi) {
        console.error("Git API not found");
        return;
    }
    const disposable = vscode.commands.registerCommand(
        "onyx.git.generateCommitMessage",
        async (uri?: vscode.SourceControl) => {
            const repo = uri
                ? gitApi.repositories.find((r) => r.ui.selected) || gitApi.repositories[0]
                : gitApi.repositories[0];

            if (!repo) {
                vscode.window.showErrorMessage("Onyx: No Git repository found.");
                return;
            }

            await runGenerateCommitMessage(repo);
        },
    );

    context.subscriptions.push(disposable);
};
