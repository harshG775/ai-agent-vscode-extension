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

const scmActionGenerateCommitMessage = async (repo: Repository) => {
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.SourceControl,
            title: "Generating commit message with AI...",
            cancellable: false,
        },
        async () => {
            await generateCommitMessage(repo);
        },
    );
};
export const activate = async (context: vscode.ExtensionContext) => {
    const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");

    if (gitExtension) {
        const gitExports = await gitExtension.activate();
        const gitApi = gitExports.getAPI(1);

        context.subscriptions.push(
            vscode.commands.registerCommand("onyxExtension.scmAction", () =>
                scmActionGenerateCommitMessage(gitApi.repositories[0]),
            ),
        );
    } else {
        vscode.window.showErrorMessage("onyxExtension: Git extension not enabled");
        return;
    }
};
