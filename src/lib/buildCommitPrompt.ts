import { Commit } from "../types/git";

const formatList = (list: Commit[]) =>
    list?.length > 0 ? list.map((c) => `- ${c.message}`).join("\n") : "None provided.";

export const buildCommitPrompt = ({
    diffs,
    repoName,
    branchName,
    recentUserCommits,
    recentCommits,
    attachments,
    customInstructions = "",
}: {
    diffs: string;
    repoName: string;
    branchName: string;
    recentUserCommits: Commit[] | [];
    recentCommits: Commit[] | [];
    attachments: { id: string; isSummarized: string; path: string; content: string }[];
    customInstructions: string;
}) => {
    const attachmentsStr =
        attachments.length > 0
            ? attachments
                  .map(
                      (a) =>
                          `<attachment id="${a.id}" path="${a.path}" summarized="${a.isSummarized}">\n${a.content}\n</attachment>`,
                  )
                  .join("\n")
            : "No original files provided.";
    return `
<repository-context>
# REPOSITORY DETAILS:
Repository name: ${repoName}
Branch name: ${branchName}

</repository-context>
<recent-user-commits>
# RECENT USER COMMITS (For reference only, do not copy!):
${formatList(recentUserCommits)}

</recent-user-commits>

<recent-commits>
# RECENT REPOSITORY COMMITS (For reference only, do not copy!):
${formatList(recentCommits)}

</recent-commits>

<changes>
<original-code>
# ORIGINAL CODE:
${attachmentsStr}
</original-code>
<code-changes>
# CODE CHANGES:
\`\`\`diff
${diffs}
\`\`\`
</code-changes>

</changes>

<reminder>
Now generate a commit messages that describe the CODE CHANGES.
DO NOT COPY commits from RECENT COMMITS, but use it as reference for the commit style.
ONLY return a single markdown code block, NO OTHER PROSE!
\`\`\`text
commit message goes here
\`\`\`
</reminder>
<custom-instructions>
${customInstructions}
</custom-instructions>
`;
};
