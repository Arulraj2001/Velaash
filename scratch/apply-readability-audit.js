/* eslint-disable */
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(item.name)) {
        files = files.concat(walk(full));
      }
    } else if (/\.(tsx|ts|jsx|js)$/.test(item.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = walk('.');
const changesByFile = {};

for (const file of files) {
  const normalizedPath = file.replace(/\\/g, '/');
  if (normalizedPath.startsWith('scratch/')) continue;

  const content = fs.readFileSync(file, 'utf8');
  const fileChanges = [];

  const lines = content.split('\n');
  const newLines = lines.map((line, idx) => {
    let l = line;
    const oldLine = line;

    // Rule 1: placeholders
    l = l.replace(/placeholder:text-brand-dark\/[0-9]+/g, 'placeholder:text-brand-subtle');

    // Rule 2: line-through original price
    if (l.includes('line-through')) {
      l = l.replace(/text-brand-dark\/[0-9]+/g, 'text-brand-subtle');
    }

    // Rule 3: explicitly de-emphasized
    if (
      l.includes('cursor-not-allowed') ||
      l.includes('isFuture &&') ||
      l.includes('(Optional)') ||
      l.includes('h-full w-full flex items-center justify-center') ||
      l.includes('h-16 w-16 shrink-0 rounded-lg bg-brand-cream/60') ||
      (normalizedPath.includes('product-pagination') && (l.includes('text-brand-dark/30') || l.includes('text-brand-dark/40')))
    ) {
      l = l.replace(/text-brand-dark\/[0-9]+/g, 'text-brand-subtle');
    }

    // Rule 4: remaining text-brand-dark/XX -> text-brand-muted
    l = l.replace(/text-brand-dark\/[0-9]+/g, 'text-brand-muted');

    // Rule 5: Specific text-brand-gold icons on light backgrounds
    if (normalizedPath === 'app/page.tsx') {
      if (idx >= 290 && idx <= 345 && l.includes('text-brand-gold')) {
        l = l.replace(/text-brand-gold/g, 'text-brand-accent');
      }
    }

    if (normalizedPath.includes('order-confirmation') && normalizedPath.includes('page.tsx')) {
      if (l.includes('text-brand-gold')) {
        l = l.replace(/text-brand-gold/g, 'text-brand-accent');
      }
    }

    if (normalizedPath.includes('product-accordion.tsx') && l.includes('text-brand-gold')) {
      l = l.replace(/text-brand-gold/g, 'text-brand-accent');
    }

    if (normalizedPath.includes('pincode-checker.tsx') && l.includes('text-brand-gold')) {
      l = l.replace(/text-brand-gold/g, 'text-brand-accent');
    }

    if (normalizedPath.includes('size-guide-modal.tsx') && l.includes('text-brand-gold')) {
      l = l.replace(/text-brand-gold/g, 'text-brand-accent');
    }

    if (normalizedPath.includes('payment-method-step.tsx') && l.includes('text-brand-gold')) {
      l = l.replace(/text-brand-gold/g, 'text-brand-accent');
    }

    if (normalizedPath.includes('order-review-sidebar.tsx') && l.includes('text-brand-gold')) {
      l = l.replace(/text-brand-gold/g, 'text-brand-accent');
    }

    if (normalizedPath.includes('cart-order-summary.tsx') && l.includes('text-brand-gold')) {
      l = l.replace(/text-brand-gold/g, 'text-brand-accent');
    }

    if (normalizedPath.includes('product-detail-view.tsx')) {
      if (l.includes('<Sparkles className="text-brand-gold h-3 w-3" />')) {
        l = l.replace('text-brand-gold', 'text-brand-accent');
      }
      if (l.includes('<ShieldCheck className="text-brand-gold h-4 w-4 shrink-0" />')) {
        l = l.replace('text-brand-gold', 'text-brand-accent');
      }
      if (l.includes('<RotateCcw className="text-brand-gold h-4 w-4 shrink-0" />')) {
        l = l.replace('text-brand-gold', 'text-brand-accent');
      }
      if (l.includes('<Zap className="text-brand-gold fill-brand-gold h-4 w-4" />')) {
        l = l.replace('text-brand-gold fill-brand-gold', 'text-brand-accent fill-brand-accent');
      }
    }

    // Rule 6: Eyebrow labels on cream
    if (normalizedPath.includes('product-card.tsx') && l.includes('text-brand-accent truncate text-[10px] font-medium')) {
      l = l.replace('text-brand-accent truncate text-[10px] font-medium', 'text-brand-accent-dark truncate text-[11px] font-semibold');
    }
    if (normalizedPath.includes('product-reviews-section.tsx') && l.includes('text-brand-accent text-[11px] font-semibold')) {
      l = l.replace('text-brand-accent text-[11px] font-semibold', 'text-brand-accent-dark text-[11px] font-semibold');
    }
    if (normalizedPath.includes('product-detail-view.tsx') && l.includes('text-brand-accent text-[11px] font-semibold')) {
      l = l.replace('text-brand-accent text-[11px] font-semibold', 'text-brand-accent-dark text-[11px] font-semibold');
    }
    if (normalizedPath.includes('order-confirmation') && l.includes('text-xs font-semibold uppercase tracking-widest text-brand-accent')) {
      l = l.replace('text-brand-accent', 'text-brand-accent-dark');
    }
    if (normalizedPath === 'app/page.tsx' && l.includes('text-brand-accent text-xs font-semibold tracking-widest uppercase')) {
      l = l.replace('text-brand-accent', 'text-brand-accent-dark');
    }

    if (l !== oldLine) {
      fileChanges.push({ line: idx + 1, old: oldLine.trim(), new: l.trim() });
    }
    return l;
  });

  if (fileChanges.length > 0) {
    changesByFile[normalizedPath] = fileChanges;
    fs.writeFileSync(file, newLines.join('\n'), 'utf8');
  }
}

console.log('Modified files count:', Object.keys(changesByFile).length);
let totalReplacements = 0;
for (const [f, chs] of Object.entries(changesByFile)) {
  totalReplacements += chs.length;
}
console.log('Total line modifications:', totalReplacements);

// Save manifest to json for reporting
fs.writeFileSync('scratch/readability-replacements-manifest.json', JSON.stringify(changesByFile, null, 2), 'utf8');
console.log('Manifest written to scratch/readability-replacements-manifest.json');
