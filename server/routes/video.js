import express from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '..', 'uploads')
const processedDir = path.join(__dirname, '..', 'processed')

// 确保目录存在
if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir, { recursive: true })
}

// 获取视频信息
router.get('/info/:filename', async (req, res) => {
    try {
        const { filename } = req.params
        const inputPath = path.join(uploadsDir, filename)

        if (!fs.existsSync(inputPath)) {
            return res.status(404).json({ error: '文件不存在' })
        }

        // 使用 ffprobe 获取视频信息
        const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${inputPath}"`
        const { stdout } = await execAsync(cmd)
        const info = JSON.parse(stdout)

        const videoStream = info.streams.find(s => s.codec_type === 'video')
        const audioStream = info.streams.find(s => s.codec_type === 'audio')

        res.json({
            duration: parseFloat(info.format.duration),
            width: videoStream?.width,
            height: videoStream?.height,
            fps: videoStream?.r_frame_rate,
            bitrate: parseInt(info.format.bit_rate),
            hasAudio: !!audioStream,
            size: parseInt(info.format.size)
        })
    } catch (error) {
        console.error('获取视频信息失败:', error)
        res.status(500).json({ error: '获取视频信息失败' })
    }
})

// 处理视频
router.post('/process', async (req, res) => {
    try {
        const { filename, options } = req.body
        const inputPath = path.join(uploadsDir, filename)

        if (!fs.existsSync(inputPath)) {
            return res.status(404).json({ error: '文件不存在' })
        }

        const ext = path.extname(filename)
        const baseName = path.basename(filename, ext)
        const outputFilename = `${baseName}_processed_${Date.now()}${ext}`
        // 保存到processed目录
        const outputPath = path.join(processedDir, outputFilename)

        // 构建 FFmpeg 命令
        let filters = []
        let inputOptions = []
        // 极高质量设置：CRF 15 视觉无损
        let outputOptions = [
            '-y',                    // 覆盖输出文件
            '-crf 15',               // 极高质量（15为视觉无损级别）
            '-preset slow',          // 慢速编码获取更高质量
            '-c:a aac',              // 音频编码
            '-b:a 320k'              // 极高质量音频
        ]

        // 裁剪（时间）
        if (options.startTime !== undefined && options.startTime > 0) {
            inputOptions.push(`-ss ${options.startTime}`)
        }
        if (options.endTime !== undefined) {
            inputOptions.push(`-to ${options.endTime}`)
        }

        // 倍速
        if (options.speed && options.speed !== 1) {
            const speed = options.speed
            // 视频倍速
            filters.push(`setpts=${1 / speed}*PTS`)
            // 音频倍速
            filters.push(`atempo=${speed}`)
        }

        // 静音
        if (options.mute) {
            outputOptions.push('-an')
        }

        // 分辨率
        if (options.resolution) {
            const [width, height] = options.resolution.split('x')
            filters.push(`scale=${width}:${height}`)
        }

        // 构建命令
        let cmd = 'ffmpeg'
        cmd += ` ${inputOptions.join(' ')}`
        cmd += ` -i "${inputPath}"`

        if (filters.length > 0) {
            // 分离视频和音频滤镜
            const videoFilters = filters.filter(f => !f.startsWith('atempo'))
            const audioFilters = filters.filter(f => f.startsWith('atempo'))

            if (videoFilters.length > 0 && audioFilters.length > 0) {
                cmd += ` -filter_complex "[0:v]${videoFilters.join(',')}[v];[0:a]${audioFilters.join(',')}[a]" -map "[v]" -map "[a]"`
            } else if (videoFilters.length > 0) {
                cmd += ` -vf "${videoFilters.join(',')}"`
            } else if (audioFilters.length > 0) {
                cmd += ` -af "${audioFilters.join(',')}"`
            }
        }

        cmd += ` ${outputOptions.join(' ')}`
        cmd += ` "${outputPath}"`

        console.log('[VideoProcess] 执行命令:', cmd)
        console.log('[VideoProcess] 输入文件:', inputPath)
        console.log('[VideoProcess] 输出文件:', outputPath)

        // 执行 FFmpeg
        try {
            const { stdout, stderr } = await execAsync(cmd)
            if (stderr) {
                console.log('[VideoProcess] FFmpeg 输出:', stderr.slice(-500))
            }
        } catch (ffmpegError) {
            console.error('[VideoProcess] FFmpeg 错误:', ffmpegError.message)
            console.error('[VideoProcess] FFmpeg stderr:', ffmpegError.stderr?.slice(-500))
            throw new Error(`FFmpeg处理失败: ${ffmpegError.message}`)
        }

        // 验证输出文件是否存在
        if (!fs.existsSync(outputPath)) {
            throw new Error('输出文件未生成')
        }

        // 获取输出文件信息
        const stats = fs.statSync(outputPath)
        console.log('[VideoProcess] 处理完成，文件大小:', stats.size)

        res.json({
            success: true,
            filename: outputFilename,
            path: `/processed/${encodeURIComponent(outputFilename)}`,
            size: stats.size
        })
    } catch (error) {
        console.error('视频处理失败:', error)
        res.status(500).json({ error: `视频处理失败: ${error.message}` })
    }
})

// 下载处理后的视频
router.get('/download/:filename', (req, res) => {
    const { filename } = req.params
    // 从processed目录查找
    let filePath = path.join(processedDir, filename)

    if (!fs.existsSync(filePath)) {
        // 兼容uploads目录
        filePath = path.join(uploadsDir, filename)
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: '文件不存在' })
    }

    res.download(filePath)
})

export default router
