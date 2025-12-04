import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // TODO: ফোনের ব্রাউজারে GitHub এ রিপোজিটরি খোলার পর সেই নামটি এখানে 'REPO_NAME' এর বদলে লিখুন।
  // উদাহরণ: যদি রিপোজিটরির নাম দেন 'shikkha-app', তাহলে লিখবেন: base: '/shikkha-app/',
  base: '/REPO_NAME/', 
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['@google/genai', 'react-markdown', 'lucide-react']
        }
      }
    }
  }
});