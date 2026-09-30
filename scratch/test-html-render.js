/* eslint-disable */
const http = require('http');

function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
    }).on('error', reject);
  });
}

async function inspectSnippets() {
  const p1 = await fetchPage('/');
  const matches1 = p1.html.match(/class="[^"]*text-brand-muted[^"]*"/g) || [];
  console.log('Homepage text-brand-muted matches count:', matches1.length);
  matches1.slice(0, 3).forEach(m => console.log('  ' + m));

  const p2 = await fetchPage('/products/chanderi-embroidered-kurta-set');
  const matches2 = p2.html.match(/class="[^"]*text-brand-(muted|subtle|accent-dark)[^"]*"/g) || [];
  console.log('PDP matches count:', matches2.length);
  matches2.slice(0, 5).forEach(m => console.log('  ' + m));
}

inspectSnippets().catch(console.error);
