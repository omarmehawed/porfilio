import "server-only";

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;
const README_LIMIT = 20_000;

export type RepoInfo = {
  url: string;
  description: string | null;
  homepage: string | null;
  stars: number;
  languages: string[];
  pushedAt: string | null;
};

export function isValidRepo(repo: string | null | undefined): repo is string {
  return Boolean(repo && REPO_PATTERN.test(repo) && !repo.includes(".."));
}

async function github(path: string, repo: string, accept = "application/vnd.github+json") {
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "omar-portfolio",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      headers,
      next: { revalidate: 3600, tags: ["github", `github:${repo.toLowerCase()}`] },
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? response : null;
  } catch {
    return null;
  }
}

export async function getRepoInfo(repo: string | null | undefined): Promise<RepoInfo | null> {
  if (!isValidRepo(repo)) return null;
  const [meta, languages] = await Promise.all([github("", repo), github("/languages", repo)]);
  if (!meta) return null;
  const data = (await meta.json()) as {
    html_url?: string;
    description?: string | null;
    homepage?: string | null;
    stargazers_count?: number;
    pushed_at?: string | null;
  };
  const languageBytes = languages ? ((await languages.json()) as Record<string, number>) : {};
  return {
    url: data.html_url ?? `https://github.com/${repo}`,
    description: data.description ?? null,
    homepage: data.homepage && /^https?:\/\//i.test(data.homepage) ? data.homepage : null,
    stars: data.stargazers_count ?? 0,
    languages: Object.entries(languageBytes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name),
    pushedAt: data.pushed_at ?? null,
  };
}

export async function getReadme(repo: string): Promise<string | null> {
  if (!isValidRepo(repo)) return null;
  const response = await github("/readme", repo, "application/vnd.github.raw+json");
  if (!response) return null;
  const text = await response.text();
  return text.trim() ? text.slice(0, README_LIMIT) : null;
}
