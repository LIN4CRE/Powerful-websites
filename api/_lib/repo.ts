/**
 * GitHub-backed persistence for the scheduled scanner.
 *
 * The canonical shape stays the repository's JSON files. Writes go to a
 * dedicated data branch so directory updates never rebuild the application
 * (Vercel only builds main), and the branch is created on first write.
 *
 * Requires a fine-grained token with `contents: write` on this repository,
 * stored as the encrypted Vercel environment variable GITHUB_DATA_TOKEN.
 */
const OWNER = process.env.DATA_REPO_OWNER ?? 'LIN4CRE';
const REPO = process.env.DATA_REPO_NAME ?? 'Powerful-websites';
export const DATA_BRANCH = process.env.DATA_BRANCH ?? 'data/live';
const API = 'https://api.github.com';

export const DATA_FILES = [
  'sites.json',
  'candidates.json',
  'categories.json',
  'sources.json',
  'scan-metadata.json',
] as const;

export type DataFileName = (typeof DATA_FILES)[number];

export function githubToken(): string | null {
  return process.env.GITHUB_DATA_TOKEN?.trim() || null;
}

export function canPersist(): boolean {
  return githubToken() !== null;
}

async function githubFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = githubToken();
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'PowerfulWebsitesBot/1.1',
    'x-github-api-version': '2022-11-28',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return fetch(`${API}${path}`, { ...init, headers, signal: AbortSignal.timeout(15_000) });
}

/** Reads one JSON file from a branch, or null when it does not exist. */
export async function readRepoJson<T>(file: DataFileName, ref = DATA_BRANCH): Promise<T | null> {
  const response = await fetch(
    `https://raw.githubusercontent.com/${OWNER}/${REPO}/${ref}/data/${file}`,
    { headers: { 'user-agent': 'PowerfulWebsitesBot/1.1' }, signal: AbortSignal.timeout(8000) },
  ).catch(() => null);
  if (!response?.ok) return null;
  return (await response.json().catch(() => null)) as T | null;
}

async function fileSha(file: DataFileName, branch: string): Promise<string | null> {
  const response = await githubFetch(`/repos/${OWNER}/${REPO}/contents/data/${file}?ref=${branch}`);
  if (!response.ok) return null;
  const payload = (await response.json()) as { sha?: string };
  return payload.sha ?? null;
}

async function branchExists(branch: string): Promise<boolean> {
  const response = await githubFetch(`/repos/${OWNER}/${REPO}/git/ref/heads/${branch}`);
  return response.ok;
}

async function createDataBranch(): Promise<boolean> {
  const repo = await githubFetch(`/repos/${OWNER}/${REPO}`);
  if (!repo.ok) return false;
  const { default_branch: defaultBranch } = (await repo.json()) as { default_branch?: string };
  if (!defaultBranch) return false;
  const base = await githubFetch(`/repos/${OWNER}/${REPO}/git/ref/heads/${defaultBranch}`);
  if (!base.ok) return false;
  const { object } = (await base.json()) as { object?: { sha?: string } };
  if (!object?.sha) return false;
  const created = await githubFetch(`/repos/${OWNER}/${REPO}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${DATA_BRANCH}`, sha: object.sha }),
  });
  return created.ok || created.status === 422;
}

export interface WriteResult {
  committed: DataFileName[];
  unchanged: DataFileName[];
  branch: string;
  error?: string;
}

/** Writes only files whose content changed, creating the data branch if needed. */
export async function writeRepoJson(
  files: Partial<Record<DataFileName, unknown>>,
  message: string,
): Promise<WriteResult> {
  const result: WriteResult = { committed: [], unchanged: [], branch: DATA_BRANCH };
  if (!canPersist()) {
    result.error = 'GITHUB_DATA_TOKEN is not configured';
    return result;
  }

  if (!(await branchExists(DATA_BRANCH)) && !(await createDataBranch())) {
    result.error = 'Could not create the data branch';
    return result;
  }

  for (const [name, value] of Object.entries(files) as [DataFileName, unknown][]) {
    const content = `${JSON.stringify(value, null, 2)}\n`;
    const sha = await fileSha(name, DATA_BRANCH);
    if (sha) {
      const current = await githubFetch(
        `/repos/${OWNER}/${REPO}/contents/data/${name}?ref=${DATA_BRANCH}`,
      );
      if (current.ok) {
        const payload = (await current.json()) as { content?: string };
        if (payload.content) {
          const existing = Buffer.from(payload.content, 'base64').toString('utf8');
          if (existing.trim() === content.trim()) {
            result.unchanged.push(name);
            continue;
          }
        }
      }
    }

    const response = await githubFetch(`/repos/${OWNER}/${REPO}/contents/data/${name}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `${message} — ${name}`,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch: DATA_BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });
    if (response.ok) result.committed.push(name);
    else {
      const text = await response.text().catch(() => '');
      result.error = `GitHub rejected ${name}: ${response.status} ${text.slice(0, 180)}`;
      break;
    }
  }

  return result;
}
