import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, '../..')
  const rootEnv = loadEnv(mode, rootDir, '')
  const localEnv = loadEnv(mode, __dirname, '')
  const env = { ...rootEnv, ...localEnv }
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
            ''
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
        configure: (proxy) => {
          let logged = false
          proxy.on('error', (err, _req, res) => {
            if (!logged) {
              logged = true
              console.warn('[vite] Backend unreachable (localhost:8080). Start with: cd location && gradlew.bat bootRun')
            }
            if (res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ details: 'Backend not running' }))
            }
          })
        },
      },
    },
  },
  }
})
