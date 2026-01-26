import * as vscode from "vscode";
import { buildCommitPrompt } from "./lib/utils/buildCommitPrompt";
import { GitExtension, Repository } from "./types/git";


const getDiff = async (repo: Repository) => {
    const changes = await repo.diffIndexWithHEAD();
    if (changes.length <= 0) {
        vscode.window.showInformationMessage("No changes to analyze.");
        return "";
    }
    let finalDiff = "";
    const MAX_CHARS = 12_000;

    for (const diff of changes) {
        const fileDiff = await repo.diffIndexWithHEAD(diff.uri.fsPath);
        if (finalDiff.length > MAX_CHARS) {
            vscode.window.showWarningMessage("Staged changes are too large to summarize accurately.");
            break;
        }

        finalDiff += `\n\n---\nFile: ${diff.uri.fsPath}\n---\n${fileDiff}`;
    }
    return finalDiff || "";
};
const generateCommitMessage = async (repo: Repository) => {
    try {
        const diff = await getDiff(repo);
        const repoName = repo.state.HEAD?.name || "repository: unknown";
        const branchName = repo.rootUri.fsPath.split(/[\\/]/).pop() || "branch: unknown";
        const recentRepoCommits = await repo.log({ maxEntries: 5 });
        const userEmail = await repo.getConfig("user.email");
        const recentUserCommits = recentRepoCommits.filter((c) => c.authorEmail === userEmail);

        const commitPrompt = buildCommitPrompt(diff, repoName, branchName, recentUserCommits, recentRepoCommits);
        console.log("Staged Diff for AI$$$:\n", commitPrompt);

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
