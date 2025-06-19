// build-electron-main.ts
import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildMain = async () => {
  // Build electron-main.ts (vẫn là ESM)
  await build({
    entryPoints: ['electron-main.ts'],
    bundle: true,
    platform: 'node',
    outfile: 'dist/electron-main.js',
    external: ['electron'], // Không bundle Electron vào main process
    format: 'esm', // Electron Main Process vẫn là ES Module
    tsconfig: 'tsconfig.json', // Sử dụng tsconfig của dự án
    treeShaking: true,
    sourcemap: process.env.NODE_ENV === 'development',
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    },
  });

  console.log('Electron main process built successfully to dist/electron-main.js');

  // Build server/index.ts và các tệp liên quan (BÂY GIỜ LÀ .cjs)
  await build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    outfile: 'dist/server/index.cjs', // THAY ĐỔI LỚN: Đổi thành .cjs
    format: 'cjs', // Biên dịch backend sang CommonJS
    tsconfig: 'tsconfig.json',
    treeShaking: true,
    sourcemap: process.env.NODE_ENV === 'development',
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    },
    external: ['better-sqlite3'],
  });
  console.log('Backend server built successfully to dist/server/index.cjs (as CJS)');

  // Build preload.js (vẫn là CJS)
  await build({
    entryPoints: ['preload.js'],
    bundle: true,
    platform: 'node',
    outfile: 'dist/preload.js',
    format: 'cjs', // Preload script vẫn là CommonJS
    tsconfig: 'tsconfig.json',
    sourcemap: process.env.NODE_ENV === 'development',
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    },
  });
  console.log('Preload script built successfully to dist/preload.js');
};

buildMain().catch((err) => {
  console.error('Error building Electron main process or server:', err);
  process.exit(1);
});