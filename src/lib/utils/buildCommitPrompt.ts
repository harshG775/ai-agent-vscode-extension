import { Commit } from "../../types/git";


export const buildCommitPrompt = (
    diff: string,
    repoName: string,
    branchName: string,
    recentUserCommits: Commit[],
    recentRepoCommits: Commit[],
) => {
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
${recentRepoCommits.map((c) => `- ${(c.message)}`).join("\n")}
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
