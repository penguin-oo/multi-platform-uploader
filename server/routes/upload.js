import express from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 确保上传目录存在
const uploadsDir = join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

// 配置multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir)
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`
        cb(null, uniqueName)
    }
})

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024 // 5GB限制
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true)
        } else {
            cb(new Error('只支持视频文件'))
        }
    }
})

// 任务存储
const tasks = new Map()

// 单独上传视频文件（用于视频处理）
router.post('/file', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传视频文件' })
        }

        res.json({
            success: true,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            path: `/uploads/${req.file.filename}`
        })
    } catch (error) {
        console.error('文件上传失败:', error)
        res.status(500).json({ error: '文件上传失败' })
    }
})

// 上传视频
router.post('/', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传视频文件' })
        }

        const { title, content, tags, platforms, accountSet } = req.body
        const taskId = uuidv4()

        // 创建任务
        const task = {
            id: taskId,
            video: {
                path: req.file.path,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size
            },
            title,
            content,
            tags: JSON.parse(tags || '[]'),
            platforms: JSON.parse(platforms || '[]'),
            accountSet: parseInt(accountSet) || 1, // 账号组：1或2
            status: 'pending',
            createdAt: new Date(),
            platformProgress: {}
        }

        // 初始化各平台进度
        task.platforms.forEach(platformId => {
            task.platformProgress[platformId] = {
                status: 'pending',
                progress: 0
            }
        })

        tasks.set(taskId, task)

        // 异步开始上传任务
        startUploadTask(task)

        res.json({
            success: true,
            taskId,
            message: '视频上传成功，开始发布到各平台'
        })
    } catch (error) {
        console.error('Upload error:', error)
        res.status(500).json({ error: error.message })
    }
})

// 获取上传状态
router.get('/status/:taskId', (req, res) => {
    const { taskId } = req.params
    const task = tasks.get(taskId)

    if (!task) {
        return res.status(404).json({ error: '任务不存在' })
    }

    res.json({
        taskId,
        status: task.status,
        platforms: task.platformProgress
    })
})

// 获取所有任务
router.get('/tasks', (req, res) => {
    const taskList = Array.from(tasks.values()).map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt,
        platforms: task.platforms
    }))

    res.json(taskList)
})

// 开始上传任务（模拟）
async function startUploadTask(task) {
    const { platformUploader } = await import('../services/platformUploader.js')

    for (const platformId of task.platforms) {
        try {
            // 更新状态为上传中
            task.platformProgress[platformId] = {
                status: 'uploading',
                progress: 10
            }

            // 执行上传（传递账号组参数）
            const result = await platformUploader.upload(platformId, {
                videoPath: task.video.path,
                title: task.title,
                content: task.content,
                tags: task.tags
            }, (progress) => {
                task.platformProgress[platformId].progress = progress
            }, task.accountSet)

            // 更新成功状态
            task.platformProgress[platformId] = {
                status: 'success',
                progress: 100,
                url: result.url
            }
        } catch (error) {
            // 更新失败状态
            task.platformProgress[platformId] = {
                status: 'failed',
                progress: 0,
                error: error.message
            }
        }
    }

    // 检查是否全部完成
    const allDone = Object.values(task.platformProgress).every(
        p => p.status === 'success' || p.status === 'failed'
    )

    if (allDone) {
        task.status = 'completed'
    }
}

export default router
