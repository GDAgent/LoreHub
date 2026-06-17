import { codeToHtml } from "shiki";

const languageAliases: Record<string, string> = {
  cpp: "cpp",
  markdown: "md",
};

export async function highlightCode(code: string, language: string) {
  return codeToHtml(code, {
    lang: languageAliases[language] ?? language,
    theme: "github-dark",
  });
}
