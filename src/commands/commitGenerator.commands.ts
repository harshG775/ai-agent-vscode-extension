import * as vscode from "vscode";
import { Commit, Repository } from "../types/git";

const getDiff = async (repo: Repository, { maxChars = 12_000 }: { maxChars: number }) => {
    const changes = await repo.diffIndexWithHEAD();
    if (changes.length <= 0) {
        vscode.window.showWarningMessage("No changes in staging to analyze.");
        return "";
    }
    let finalDiff = "";

    for (const diff of changes) {
        const fileDiff = await repo.diffIndexWithHEAD(diff.uri.fsPath);
        if (finalDiff.length > maxChars) {
            vscode.window.showWarningMessage("Staged changes are too large to summarize accurately.");
            break;
        }

        finalDiff += `\n\n---\nFile: ${diff.uri.fsPath}\n---\n${fileDiff}`;
    }
    return finalDiff || "";
};

const buildCommitPrompt = ({
    diff,
    repoName,
    branchName,
    recentUserCommits,
    recentRepoCommits,
}: {
    diff: string;
    repoName: string;
    branchName: string;
    recentUserCommits: Commit[];
    recentRepoCommits: Commit[];
}) => {
    return [
        {
            role: "system",
            content: `
You are an AI programming assistant, helping a software developer craft the best git commit messages for their code changes.
You excel at interpreting the purpose behind code changes to generate concise, clear, and conventional commit messages.
Follow Microsoft content policies and avoid unsafe or copyrighted content.
`,
        },
        {
            role: "user",
            content: `
<repository-context>
Repository name: ${repoName}
Branch name: ${branchName}
</repository-context>

<user-commits>
# RECENT USER COMMITS (for reference, do not copy):
${recentUserCommits.map((c) => `- ${c.message}`).join("\n")}
</user-commits>

<recent-commits>
# RECENT REPOSITORY COMMITS (for reference, do not copy):
${recentRepoCommits.map((c) => `- ${c.message}`).join("\n")}
</recent-commits>

<changes>
<code-changes>
\`\`\`diff
${diff}
\`\`\`
</code-changes>
</changes>

<reminder>
Generate a single, concise commit message describing these changes.
Follow Conventional Commit format.
50-72 character title.
Do NOT include backticks or explanations.
ONLY return a single markdown code block:
\`\`\`text
commit message here
\`\`\`
</reminder>
`,
        },
    ];
};

export const commitGeneratorCommand = async (repo: Repository) => {
    const OPENROUTER_API_KEY = "";
    

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.SourceControl,
            title: "Onyx: Generating commit message...",
            cancellable: false,
        },
        async () => {
            try {
                const diff = await getDiff(repo, { maxChars: 12_000 });

                const repoName = repo.state.HEAD?.name || "repository: unknown";

                const branchName = repo.rootUri.fsPath.split(/[\\/]/).pop() || "branch: unknown";

                const recentRepoCommits = await repo.log({ maxEntries: 5 });

                const userEmail = await repo.getConfig("user.email");

                const recentUserCommits = recentRepoCommits.filter((c) => c.authorEmail === userEmail);

                const messages = buildCommitPrompt({
                    diff,
                    repoName,
                    branchName,
                    recentUserCommits,
                    recentRepoCommits,
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
                            model: "allenai/molmo-2-8b:free",
                            temperature: 0,
                            messages: messages,
                            include_reasoning: true,
                        }),
                    });
                    const result: any = await response.json();
                    const responseMessage = result?.choices[0]?.message?.content as string;
                    repo.inputBox.value = responseMessage
                        .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[\w]*\n?/g, "").replace(/```/g, ""))
                        .trim();;
                } catch (err) {
                    vscode.window.showErrorMessage("API error: Failed to generate commit message: " + err);
                }
            } catch (err) {
                vscode.window.showErrorMessage("Failed to generate commit message" + err);
            }
        },
    );
};
