import { useRef } from 'react'
import './VideoUploader.css'

function VideoUploader({ videoFile, videoPreviewUrl, onVideoSelect }) {
    const fileInputRef = useRef(null)

    const handleDragOver = (e) => {
        e.preventDefault()
        e.currentTarget.classList.add('drag-over')
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.currentTarget.classList.remove('drag-over')
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.currentTarget.classList.remove('drag-over')

        const files = e.dataTransfer.files
        if (files.length > 0 && files[0].type.startsWith('video/')) {
            onVideoSelect(files[0])
        }
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file && file.type.startsWith('video/')) {
            onVideoSelect(file)
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="video-uploader">
            {videoPreviewUrl ? (
                <div className="video-preview-container">
                    <video
                        className="video-preview"
                        src={videoPreviewUrl}
                        controls
                    />
                    <div className="video-info">
                        <div className="video-info-item">
                            <span className="info-label">文件名</span>
                            <span className="info-value">{videoFile.name}</span>
                        </div>
                        <div className="video-info-item">
                            <span className="info-label">大小</span>
                            <span className="info-value">{formatFileSize(videoFile.size)}</span>
                        </div>
                        <div className="video-info-item">
                            <span className="info-label">类型</span>
                            <span className="info-value">{videoFile.type}</span>
                        </div>
                    </div>
                    <button
                        className="btn btn-secondary btn-change-video"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        🔄 更换视频
                    </button>
                </div>
            ) : (
                <div
                    className="upload-area"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">
                        <p className="upload-title">拖放视频文件到此处</p>
                        <p className="upload-subtitle">或点击选择文件</p>
                    </div>
                    <div className="upload-hint">
                        支持 MP4, MOV, AVI, MKV 等格式
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />
        </div>
    )
}

export default VideoUploader
