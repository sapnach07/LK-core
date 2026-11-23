import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

const LIB_ENTRIES = {
  index: path.resolve(__dirname, 'src/lk-core/index.ts'),
  charts: path.resolve(__dirname, 'src/lk-core/charts/index.ts'),
  design: path.resolve(__dirname, 'src/lk-core/design/index.ts'),
  themes: path.resolve(__dirname, 'src/lk-core/themes/index.ts'),
  glass: path.resolve(__dirname, 'src/lk-core/glass/index.ts'),
  motion: path.resolve(__dirname, 'src/lk-core/motion/index.ts'),
  icons: path.resolve(__dirname, 'src/lk-core/icons/index.ts'),
  settings: path.resolve(__dirname, 'src/lk-core/settings/index.ts'),
  storage: path.resolve(__dirname, 'src/lk-core/storage/index.ts'),
  accessibility: path.resolve(__dirname, 'src/lk-core/accessibility/index.ts'),
  platform: path.resolve(__dirname, 'src/lk-core/platform/index.ts'),
  styles: path.resolve(__dirname, 'src/lk-core/styles/entry.ts'),
};

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: false,
    cssCodeSplit: false,
    sourcemap: true,
    lib: {
      entry: LIB_ENTRIES,
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-is',
        'lucide-react',
        'recharts',
      ],
      output: {
        preserveModules: false,
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'lk-core-copy-tokens-css-and-clean-style-stub',
      apply: 'build',
      closeBundle(error?: Error): void {
        if (error) return;
        const distDir = path.resolve(__dirname, 'dist');
        const tokensSrc = path.resolve(__dirname, 'src/lk-core/styles/tokens.css');
        const tokensDest = path.resolve(distDir, 'tokens.css');
        if (fs.existsSync(tokensSrc)) {
          fs.copyFileSync(tokensSrc, tokensDest);
        }
        // Provide empty TS declarations so `import '@lk/core/styles.css'` passes TS side-effect checks
        fs.writeFileSync(path.resolve(distDir, 'styles.css.d.ts'), 'export {};\n', 'utf8');
        fs.writeFileSync(path.resolve(distDir, 'tokens.css.d.ts'), 'export {};\n', 'utf8');
        // Remove empty JS wrapper emitted for CSS-only entry if present
        for (const stub of ['styles.js', 'styles.js.map']) {
          const stubPath = path.resolve(distDir, stub);
          if (fs.existsSync(stubPath)) {
            fs.rmSync(stubPath);
          }
        }
      },
    },
  ],
});
