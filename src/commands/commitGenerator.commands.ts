import * as vscode from "vscode";
import { Repository } from "../types/git";
import { buildCommitPrompt } from "../lib/buildCommitPrompt";
export const commitGeneratorCommand = async (repo: Repository) => {
    const OPENROUTER_API_KEY = "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";

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.SourceControl,
            title: "Onyx: Generating commit message...",
            cancellable: false,
        },
        async () => {
            try {
                const changes = await repo.diffIndexWithHEAD();

                if (changes.length <= 0) {
                    vscode.window.showWarningMessage("No changes in staging to analyze.");
                    return;
                }

                let finalDiff = "";
                const attachments = [];

                for (const diff of changes) {
                    const fileDiff = await repo.diffIndexWithHEAD(diff.uri.fsPath);
                    if (finalDiff.length > 12_000) {
                        vscode.window.showWarningMessage("Staged changes are too large to summarize accurately.");
                        break;
                    }
                    finalDiff += `\n\n---\nFile: ${diff.uri.fsPath}\n---\n${fileDiff}`;
                    //////////
                    const filePath = diff.uri.fsPath;
                    try {
                        const originalContent = await repo.show("HEAD", filePath);

                        const content =
                            originalContent.length > 5000
                                ? originalContent.substring(0, 5000) + "\n... [truncated]"
                                : originalContent;

                        attachments.push({
                            id: filePath,
                            path: vscode.workspace.asRelativePath(diff.uri),
                            isSummarized: originalContent.length > 5000 ? "true" : "false",
                            content: content,
                        });
                    } catch (e) {
                        console.log(`New file detected or error fetching HEAD for ${filePath}`);
                    }

                    if (finalDiff.length > 15000) break;
                }

                const recentRepoCommits = await repo.log({ maxEntries: 2 });

                const userEmail = await repo.getConfig("user.email");

                const recentUserCommits = recentRepoCommits.filter((c) => c.authorEmail === userEmail);

                const messages = buildCommitPrompt({
                    diffs: finalDiff,
                    repoName: repo.state.HEAD?.name || "unknown",
                    branchName: repo.rootUri.fsPath.split(/[\\/]/).pop() || "unknown",
                    recentUserCommits,
                    recentCommits: recentRepoCommits,
                    attachments: attachments,
                    customInstructions: "",
                });
                console.log("messages for AI$$$:\n", messages);
                try {
                    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            // model: "tngtech/deepseek-r1t2-chimera:free",
                            model: "xiaomi/mimo-v2-flash",
                            temperature: 0,
                            messages: messages,
                            include_reasoning: true,
                        }),
                    });
                    const result: any = await response.json();

                    if (result?.error?.message) {
                        throw new Error(result.error.message);
                    }
                    console.log("result", result?.choices[0]?.message?.content);
                    const responseMessage = result?.choices[0]?.message?.content as string;
                    repo.inputBox.value = responseMessage
                        .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[\w]*\n?/g, "").replace(/```/g, ""))
                        .trim();
                } catch (err) {
                    vscode.window.showErrorMessage("API error: Failed to generate commit message: " + err);
                }
            } catch (err) {
                vscode.window.showErrorMessage("Failed to generate commit message" + err);
            }
        },
    );
};
