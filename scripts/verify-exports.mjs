import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const requiredFailures = [];
const verified = [];

function checkFile(relPath, label) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    requiredFailures.push(`Missing ${label}: ${relPath}`);
    return false;
  }
  const stat = fs.statSync(abs);
  if (stat.size === 0) {
    requiredFailures.push(`Empty ${label}: ${relPath}`);
    return false;
  }
  verified.push(`${label} -> ${relPath} (${stat.size} B)`);
  return true;
}

checkFile(pkg.main, 'main');
checkFile(pkg.module, 'module');
checkFile(pkg.types, 'types');
checkFile(pkg.style, 'style');

for (const [subpath, target] of Object.entries(pkg.exports || {})) {
  if (typeof target === 'string') {
    checkFile(target, `export[${subpath}]`);
  } else if (target && typeof target === 'object') {
    if (target.import) checkFile(target.import, `export[${subpath}].import`);
    if (target.default) checkFile(target.default, `export[${subpath}].default`);
    if (target.types) checkFile(target.types, `export[${subpath}].types`);
  }
}

// Verify React / Recharts are externalized in chunks and NOT bundled inline
const distJsFiles = [
  ...fs.readdirSync(path.join(root, 'dist')).filter((f) => f.endsWith('.js')).map((f) => path.join(root, 'dist', f)),
  ...(fs.existsSync(path.join(root, 'dist/chunks'))
    ? fs.readdirSync(path.join(root, 'dist/chunks')).filter((f) => f.endsWith('.js')).map((f) => path.join(root, 'dist/chunks', f))
    : []),
];
const combinedLibJs = distJsFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
if (!/from\s*["']react["']|from\s*["']react\/jsx-runtime["']/.test(combinedLibJs)) {
  requiredFailures.push('Library bundle does not reference external React runtime.');
}
if (!/from\s*["']recharts["']/.test(combinedLibJs)) {
  requiredFailures.push('Library bundle does not reference external Recharts dependency.');
}
if (combinedLibJs.includes('react.production') || combinedLibJs.includes('ReactSharedInternals')) {
  requiredFailures.push('React runtime appears to have been bundled into dist/!');
}

// Verify CSS tokens & utilities exist in dist/styles.css
const stylesCss = fs.readFileSync(path.join(root, 'dist/styles.css'), 'utf8');
for (const token of ['--lk-accent', '--lk-blur', '.lk-glass-surface', '.lk-chart-tooltip', 'lkFadeSlideUp']) {
  if (!stylesCss.includes(token)) {
    requiredFailures.push(`dist/styles.css missing required rule/token: ${token}`);
  }
}

console.log(`Verified ${verified.length} package export artifacts for ${pkg.name}@${pkg.version}:`);
for (const line of verified) {
  console.log(`  OK  ${line}`);
}

if (requiredFailures.length > 0) {
  console.error('\nExport verification failed:');
  for (const err of requiredFailures) {
    console.error(`  ERR ${err}`);
  }
  process.exit(1);
}

console.log('\nAll @lk/core exports, TypeScript declarations, and CSS bundles verified.');
