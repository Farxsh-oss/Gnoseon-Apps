import fs from 'fs';
import path from 'path';

const root = process.cwd();

const removePath = (relativePath) => {
  const target = path.resolve(root, relativePath);

  if (!target.startsWith(root)) {
    throw new Error(`Refusing to remove outside project: ${target}`);
  }

  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
};

const removeGlobLike = (relativeDir, predicate) => {
  const dir = path.resolve(root, relativeDir);

  if (!dir.startsWith(root) || !fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir)) {
    if (predicate(entry)) {
      removePath(path.join(relativeDir, entry));
    }
  }
};

removePath('dist');
removePath(path.join('node_modules', '.vite'));
removePath(path.join('src', 'tests', 'tsconfig.tsbuildinfo'));
removeGlobLike('logs', (entry) => entry.endsWith('.log'));

console.log('Cleaned generated development files.');
