import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({command}) => {
  return {
    // Production build uses RELATIVE asset paths ('./') so the SAME files work
    // from BOTH entry points, which both map to public_html/sslive/:
    //   • https://skill-sch.com/sslive/   (subfolder of the main domain)
    //   • https://sslive.skill-sch.com/    (subdomain whose docroot is that folder)
    // Safe because SSLive routes via query params + #hash only (no path routing).
    // Dev stays at root so `npm run dev` keeps working unchanged.
    base: command === 'build' ? './' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
