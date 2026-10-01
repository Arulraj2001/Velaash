(async () => {
  const urls = [
    '/favicon.ico',
    '/favicon.svg',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/apple-touch-icon.png',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/site.webmanifest',
    '/admin/settings'
  ];
  console.log('--- Checking HTTP Endpoints ---');
  for (const u of urls) {
    try {
      const r = await fetch('http://localhost:3000' + u);
      console.log(u.padEnd(30), r.status, r.headers.get('content-type'));
    } catch (e) {
      console.error(u, e.message);
    }
  }

  const home = await fetch('http://localhost:3000/').then(r => r.text());
  const iconMatches = home.match(/<link[^>]*rel="[^"]*(icon|manifest)[^"]*"[^>]*>/gi) || [];
  console.log('\n--- Rendered HTML <head> Icon Links ---');
  iconMatches.forEach(m => console.log(m));
})();
