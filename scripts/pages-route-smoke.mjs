import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://layarbelajar.pages.dev';
const ROUTES = ['/', '/login', '/gabung', '/admin/akun'];

export async function checkPages(fetcher = fetch) {
  const reports = [];
  let expectedScript = null;
  for (const route of ROUTES) {
    const response = await fetcher(SITE + route, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    if (response.status !== 200)
      throw new Error('Route ' + route + ' returned HTTP ' + response.status);
    if (!String(response.headers.get('content-type')).includes('text/html')) {
      throw new Error('Route ' + route + ' did not return HTML.');
    }
    const html = await response.text();
    if (!html.includes('LayarBelajar') || !html.includes('id="root"')) {
      throw new Error('Route ' + route + ' did not return React shell.');
    }
    const asset = html.match(/src="(\/assets\/[^"]+\.js)"/);
    if (!asset) throw new Error('Missing JS asset in ' + route);
    if (expectedScript && asset[1] !== expectedScript)
      throw new Error('SPA assets differ by route.');
    expectedScript = asset[1];
    reports.push('route ' + route);
  }
  const js = await fetcher(SITE + expectedScript, {
    method: 'GET',
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  if (js.status !== 200 || !String(js.headers.get('content-type')).includes('javascript')) {
    throw new Error('Bundled JS missing or not JavaScript.');
  }
  if ((await js.text()).length < 100) throw new Error('Bundled JS is unexpectedly empty.');
  reports.push('bundled-js');
  return reports;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    for (const item of await checkPages()) console.log('PAGES_HTTP_PASS ' + item);
    console.log('PAGES_READONLY_PASS; Auth and browser rendering NOT VERIFIED.');
  } catch (error) {
    console.error('PAGES_HTTP_FAIL: ' + (error instanceof Error ? error.message : 'network'));
    process.exitCode = 1;
  }
}
