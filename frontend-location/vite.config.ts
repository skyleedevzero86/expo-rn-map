import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const kakaoKey = env.VITE_KAKAO_MAP_KEY ?? ''

  return {
  plugins: [
    vue(),
    {
      name: 'html-kakao-key',
      transformIndexHtml(html) {
        if (!kakaoKey) {
          return html.replace(
            /<script src="\/\/dapi\.kakao\.com\/v2\/maps\/sdk\.js\?appkey=__VITE_KAKAO_MAP_KEY__"><\/script>\n?/,
            '<!-- VITE_KAKAO_MAP_KEY 없음: .env 설정 후 dev 재시작 -->'
          )
        }
        return html.replace('__VITE_KAKAO_MAP_KEY__', kakaoKey)
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  }
})
