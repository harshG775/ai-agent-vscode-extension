import * as vscode from "vscode";
import { GitExtension, Repository } from "./types/git";

const generateCommitMessage = async (repo: Repository) => {
    try {
        const changes = await repo.diffIndexWithHEAD();
        if (changes.length <= 0) {
            vscode.window.showInformationMessage("No changes changes to analyze.");
            return;
        }
        //
        let finnalDiff = "";
        for (const diff of changes) {
            const fileDiff = await repo.diffIndexWithHEAD(diff.uri.fsPath);
            if (!fileDiff || fileDiff.trim() === "") {
                vscode.window.showInformationMessage("No staged file to analyze.");
                continue;
            }

            finnalDiff += fileDiff;
        }
        const messages = [
            {
                role: "system",
                content:
                    "You are a helpful assistant that generates informative git commit messages based on git diffs output. Skip preamble and remove all backticks surrounding the commit message.",
            },
            {
                role: "user",
                content: `
                Based on the provided git diff, generate a concise and descriptive commit message.

                The commit message should:
                1. Has a short title (50-72 characters)
                2. The commit message should adhere to the conventional commit format
                3. Describe what was changed and why
                4. Be clear and informative

                'git --no-pager diff --staged --diff-filter=d' Output:
                ${finnalDiff}
                `,
            },
        ];
        console.log("Staged Diff for AI$$$:\n", messages);

        repo.inputBox.value = "feat: logic implemented via ai";
    } catch (err) {
        vscode.window.showErrorMessage("Failed to get diff: " + err);
    }
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
