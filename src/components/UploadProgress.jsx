import './UploadProgress.css'

function UploadProgress({ platforms, selectedPlatforms, progress }) {
    if (selectedPlatforms.length === 0) {
        return (
            <div className="upload-progress-empty">
                <div className="empty-icon">📋</div>
                <p>请先选择要发布的平台</p>
            </div>
        )
    }

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return '等待中'
            case 'uploading': return '上传中'
            case 'processing': return '处理中'
            case 'success': return '成功'
            case 'failed': return '失败'
            default: return '准备中'
        }
    }

    const getStatusClass = (status) => {
        switch (status) {
            case 'success': return 'status-success'
            case 'failed': return 'status-failed'
            case 'uploading':
            case 'processing': return 'status-active'
            default: return 'status-pending'
        }
    }

    return (
        <div className="upload-progress">
            {selectedPlatforms.map(platformId => {
                const platform = platforms.find(p => p.id === platformId)
                const status = progress[platformId] || { status: 'ready', progress: 0 }

                return (
                    <div key={platformId} className="progress-item">
                        <div className="progress-header">
                            <span className="progress-platform">
                                {platform.icon} {platform.name}
                            </span>
                            <span className={`progress-status ${getStatusClass(status.status)}`}>
                                {getStatusText(status.status)}
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className={`progress-bar-fill ${getStatusClass(status.status)}`}
                                style={{ width: `${status.progress}%` }}
                            />
                        </div>
                        {status.error && (
                            <div className="progress-error">{status.error}</div>
                        )}
                        {status.url && (
                            <a
                                href={status.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="progress-link"
                            >
                                查看视频 →
                            </a>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export default UploadProgress
