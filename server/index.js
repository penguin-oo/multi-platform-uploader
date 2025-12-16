import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import uploadRoutes from './routes/upload.js'
import aiRoutes from './routes/ai.js'
import platformRoutes from './routes/platforms.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件（用于存储上传的视频）
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// API路由
app.use('/api/upload', uploadRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/platforms', platformRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 错误处理
app.use((err, req, res, next) => {
    console.error('Server error:', err)
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    })
})

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器已启动: http://localhost:${PORT}`)
    console.log(`📁 API路由:`)
    console.log(`   - POST /api/upload          上传视频`)
    console.log(`   - GET  /api/upload/status   获取上传状态`)
    console.log(`   - POST /api/ai/generate     AI生成内容`)
    console.log(`   - GET  /api/platforms/status 平台登录状态`)
})

export default app
