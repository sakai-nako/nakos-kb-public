export async function probe(url: string, request: typeof fetch = fetch): Promise<void> {
  const response = await request(new URL('/', url), {
    method: 'HEAD',
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status !== 200 || !response.headers.get('content-type')?.includes('text/html')) {
    throw new Error(`KB health failed: HTTP ${response.status}`);
  }
}

export async function main(args: string[], request: typeof fetch = fetch): Promise<void> {
  if (args.length !== 1) throw new Error('usage: deployment-smoke.ts <URL>');
  await probe(args[0], request);
}

if (import.meta.main) {
  await main(Deno.args);
  console.log('KB HEAD smoke passed; writes=0; cleanup=0');
}
