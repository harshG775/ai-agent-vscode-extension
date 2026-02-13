import * as vscode from "vscode";
import { commitGeneratorCommand } from "./commands/commitGenerator.commands";
import { ChatViewProvider } from "./chat/chat-view-provider";

import { GitExtension } from "./types/git";

export const activate = async (context: vscode.ExtensionContext) => {
    const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");

    if (!gitExtension) {
        return;
    }

    const gitExports = await gitExtension.activate();
    const gitApi = gitExports.getAPI(1);
    if (!gitApi) {
        console.error("Git API not found");
    }

    context.subscriptions.push(
        vscode.commands.registerCommand("onyx.git.generateCommitMessage", async (uri?: vscode.SourceControl) => {
            const repo = uri
                ? gitApi.repositories.find((r) => r.ui.selected) || gitApi.repositories[0]
                : gitApi.repositories[0];

            if (!repo) {
                vscode.window.showErrorMessage("Onyx: No Git repository found.");
                return;
            }

            await commitGeneratorCommand(repo);
        }),
    );
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("onyx.chatView", new ChatViewProvider(context)),
    );
};
