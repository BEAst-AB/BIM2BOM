export default {
  root: './',
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    fs: {
      allow: ['..'] // Allow serving files from parent directories if needed
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  optimizeDeps: {
    exclude: ['web-ifc'],
    include: ['three', '@thatopen/components', '@thatopen/components-front', '@thatopen/fragments', '@thatopen/ui']
  },
  // Ensure proper WASM handling
  assetsInclude: ['**/*.wasm'],
  worker: {
    format: 'es'
  }
}
