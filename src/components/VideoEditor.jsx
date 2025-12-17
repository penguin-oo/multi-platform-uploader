import { useState, useRef, useEffect } from 'react'
import './VideoEditor.css'

function VideoEditor({ videoFile, videoUrl, onProcessed, onUseProcessed }) {
    const [videoInfo, setVideoInfo] = useState(null)
    const [processing, setProcessing] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploaded, setUploaded] = useState(false)
    const [serverFilename, setServerFilename] = useState(null)
    const [error, setError] = useState(null)
    const [progress, setProgress] = useState(0)
    const [processedResult, setProcessedResult] = useState(null) // 处理结果
    const videoRef = useRef(null)

    // 编辑选项
    const [startTime, setStartTime] = useState(0)
    const [endTime, setEndTime] = useState(0)
    const [speed, setSpeed] = useState(1)
    const [mute, setMute] = useState(false)

    // 从浏览器获取视频信息
    useEffect(() => {
        if (videoRef.current && videoUrl) {
            const video = videoRef.current
            video.onloadedmetadata = () => {
                setVideoInfo({
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight,
                    size: videoFile?.size || 0
                })
                setEndTime(video.duration)
            }
        }
    }, [videoUrl, videoFile])

    // 上传视频到服务器
    const uploadToServer = async () => {
        if (!videoFile || uploaded) return serverFilename

        setUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('video', videoFile)

            console.log('[VideoEditor] 开始上传视频...', videoFile.name, videoFile.size)

            const res = await fetch('/api/upload/file', {
                method: 'POST',
                body: formData
            })

            console.log('[VideoEditor] 上传响应状态:', res.status)

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                console.error('[VideoEditor] 上传失败:', errorData)
                throw new Error(errorData.error || `上传失败 (${res.status})`)
            }

            const data = await res.json()
            console.log('[VideoEditor] 上传成功:', data)
            setServerFilename(data.filename)
            setUploaded(true)
            return data.filename
        } catch (e) {
            console.error('[VideoEditor] 上传异常:', e)
            setError('上传到服务器失败: ' + e.message)
            throw e
        } finally {
            setUploading(false)
        }
    }

    // 格式化时间
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // 处理视频
    const handleProcess = async () => {
        if (!videoFile) return

        setProcessing(true)
        setError(null)
        setProgress(10)

        try {
            // 先上传到服务器
            setProgress(20)
            const filename = await uploadToServer()
            setProgress(40)

            const options = {}

            // 裁剪
            if (startTime > 0) options.startTime = startTime
            if (endTime < videoInfo?.duration) options.endTime = endTime

            // 倍速
            if (speed !== 1) options.speed = speed

            // 静音
            if (mute) options.mute = true

            setProgress(50)

            const res = await fetch('/api/video/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: filename,
                    options
                })
            })

            setProgress(80)

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || '处理失败')
            }

            const result = await res.json()
            setProgress(100)
            setProcessedResult(result) // 保存处理结果

            if (onProcessed) {
                onProcessed(result)
            }
        } catch (e) {
            setError(e.message)
        } finally {
            setProcessing(false)
            setProgress(0)
        }
    }

    // 设置当前播放位置为起点
    const setCurrentAsStart = () => {
        if (videoRef.current) {
            setStartTime(videoRef.current.currentTime)
        }
    }

    // 设置当前播放位置为终点
    const setCurrentAsEnd = () => {
        if (videoRef.current) {
            setEndTime(videoRef.current.currentTime)
        }
    }

    return (
        <div className="video-editor">
            <h3>🎬 视频处理</h3>

            {/* 视频预览 */}
            <div className="video-preview">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    style={{ width: '100%', maxHeight: '300px' }}
                />
            </div>

            {/* 视频信息 */}
            {videoInfo && (
                <div className="video-info">
                    <span>时长: {formatTime(videoInfo.duration)}</span>
                    <span>分辨率: {videoInfo.width}x{videoInfo.height}</span>
                    <span>大小: {(videoInfo.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
            )}

            {/* 编辑选项 */}
            <div className="edit-options">
                {/* 裁剪 */}
                <div className="option-group">
                    <label>✂️ 裁剪时间</label>
                    <div className="time-range">
                        <div className="time-input">
                            <span>开始:</span>
                            <input
                                type="range"
                                min="0"
                                max={videoInfo?.duration || 100}
                                step="0.1"
                                value={startTime}
                                onChange={(e) => setStartTime(parseFloat(e.target.value))}
                            />
                            <span>{formatTime(startTime)}</span>
                            <button className="btn-small" onClick={setCurrentAsStart}>📍</button>
                        </div>
                        <div className="time-input">
                            <span>结束:</span>
                            <input
                                type="range"
                                min="0"
                                max={videoInfo?.duration || 100}
                                step="0.1"
                                value={endTime}
                                onChange={(e) => setEndTime(parseFloat(e.target.value))}
                            />
                            <span>{formatTime(endTime)}</span>
                            <button className="btn-small" onClick={setCurrentAsEnd}>📍</button>
                        </div>
                    </div>
                </div>

                {/* 倍速 */}
                <div className="option-group">
                    <label>⏩ 播放速度</label>
                    <div className="speed-options">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                            <button
                                key={s}
                                className={`speed-btn ${speed === s ? 'active' : ''}`}
                                onClick={() => setSpeed(s)}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>
                </div>

                {/* 静音 */}
                <div className="option-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={mute}
                            onChange={(e) => setMute(e.target.checked)}
                        />
                        🔇 静音（移除音频）
                    </label>
                </div>
            </div>

            {/* 处理按钮 */}
            <div className="process-actions">
                <button
                    className="btn-process"
                    onClick={handleProcess}
                    disabled={processing}
                >
                    {processing ? `处理中... ${progress}%` : '🚀 开始处理'}
                </button>
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}

            {/* 进度条 */}
            {processing && (
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            {/* 处理完成结果 */}
            {processedResult && (
                <div className="process-result">
                    <div className="result-header">✅ 视频处理完成！</div>
                    <div className="result-info">
                        <span>文件: {processedResult.filename}</span>
                        <span>大小: {(processedResult.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="result-actions">
                        <a
                            href={`/api/video/download/${encodeURIComponent(processedResult.filename)}`}
                            download
                            className="btn-download"
                        >
                            📥 下载视频
                        </a>
                        <button
                            className="btn-use"
                            onClick={() => {
                                // 用处理后的视频替换当前视频
                                if (onUseProcessed) {
                                    onUseProcessed(processedResult)
                                }
                            }}
                        >
                            ✅ 使用此视频上传
                        </button>
                    </div>
                    <div className="result-preview">
                        <video
                            src={processedResult.path}
                            controls
                            style={{ width: '100%', maxHeight: '200px' }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default VideoEditor
