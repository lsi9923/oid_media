import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages는 https://<user>.github.io/<repo>/ 경로로 서비스되므로
 * 프로덕션 빌드에서는 base를 저장소 이름으로 맞춰야 자산 경로가 깨지지 않는다.
 * 개발 서버와 다른 호스트(Netlify 등)에서는 루트를 쓴다.
 *
 * VITE_BASE 환경변수로 덮어쓸 수 있다. 예) VITE_BASE=/ npm run build
 */
const REPO_BASE = '/mindam-studio/';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: process.env.VITE_BASE ?? (command === 'build' ? REPO_BASE : '/'),
  server: {
    port: 5180,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}));
