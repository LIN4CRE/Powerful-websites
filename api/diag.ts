/**
 * TEMPORARY diagnostic endpoint. Removed before the final merge.
 * Reports how the Vercel Node runtime resolves the function's own modules.
 */
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const config = { maxDuration: 15 };

function listing(path: URL): string[] {
  try {
    return readdirSync(fileURLToPath(path)).slice(0, 40);
  } catch (error) {
    return [`ERROR ${String(error).slice(0, 160)}`];
  }
}

export async function GET(): Promise<Response> {
  const probes: Record<string, string> = {};
  for (const spec of ['./_lib/dataset.js', './_lib/dataset.ts', './_lib/dataset', './_lib/repo.js']) {
    try {
      await import(spec);
      probes[spec] = 'ok';
    } catch (error) {
      probes[spec] = String(error).slice(0, 240);
    }
  }

  return new Response(
    JSON.stringify(
      {
        node: process.version,
        cwd: process.cwd(),
        functionRoot: listing(new URL('./', import.meta.url)),
        lib: listing(new URL('./_lib/', import.meta.url)),
        probes,
      },
      null,
      1,
    ),
    { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } },
  );
}
