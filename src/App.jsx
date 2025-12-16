import { useState, useEffect } from 'react'
import VideoUploader from './components/VideoUploader'
import AIEditor from './components/AIEditor'
import PlatformSelector from './components/PlatformSelector'
import UploadProgress from './components/UploadProgress'
import SettingsModal from './components/SettingsModal'
import LoginModal from './components/LoginModal'
import './App.css'

// 平台配置
const PLATFORMS = [
    { id: 'bilibili', name: '哔哩哔哩', icon: '📺', color: '#00a1d6' },
    { id: 'douyin', name: '抖音', icon: '🎵', color: '#000000' },
    { id: 'xiaohongshu', name: '小红书', icon: '📕', color: '#fe2c55' },
    { id: 'kuaishou', name: '快手', icon: '⚡', color: '#ff4906' },
    { id: 'wechat', name: '微信视频号', icon: '💬', color: '#07c160' },
]

function App() {
    // 视频状态
    const [videoFile, setVideoFile] = useState(null)
    const [videoPreviewUrl, setVideoPreviewUrl] = useState(null)

    // 内容状态
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [tags, setTags] = useState([])

    // 平台状态
    const [selectedPlatforms, setSelectedPlatforms] = useState([])
    const [platformStatus, setPlatformStatus] = useState({})

    // UI状态
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState({})
    const [showSettings, setShowSettings] = useState(false)
    const [showLogin, setShowLogin] = useState(false)
    const [currentLoginPlatform, setCurrentLoginPlatform] = useState(null)

    // 设置
    const [settings, setSettings] = useState({
        aiApiKey: '',
        aiProvider: 'openai',
        autoSaveDraft: true,
        defaultTags: [],
    })

    // 加载设置
    useEffect(() => {
        const savedSettings = localStorage.getItem('uploaderSettings')
        if (savedSettings) {
            try {
                setSettings(JSON.parse(savedSettings))
            } catch (e) {
                console.error('Failed to load settings:', e)
            }
        }

        // 加载草稿
        const savedDraft = localStorage.getItem('uploaderDraft')
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft)
                setTitle(draft.title || '')
                setContent(draft.content || '')
                setTags(draft.tags || [])
            } catch (e) {
                console.error('Failed to load draft:', e)
            }
        }

        // 检查平台登录状态
        checkPlatformStatus()
    }, [])

    // 自动保存草稿
    useEffect(() => {
        if (settings.autoSaveDraft && (title || content || tags.length)) {
            const draft = { title, content, tags }
            localStorage.setItem('uploaderDraft', JSON.stringify(draft))
        }
    }, [title, content, tags, settings.autoSaveDraft])

    // 检查各平台登录状态
    const checkPlatformStatus = async () => {
        try {
            const response = await fetch('/api/platforms/status')
            if (response.ok) {
                const status = await response.json()
                setPlatformStatus(status)
            }
        } catch (e) {
            console.error('Failed to check platform status:', e)
            // 设置默认状态（全部未登录）
            const defaultStatus = {}
            PLATFORMS.forEach(p => {
                defaultStatus[p.id] = { loggedIn: false }
            })
            setPlatformStatus(defaultStatus)
        }
    }

    // 处理视频选择
    const handleVideoSelect = (file) => {
        setVideoFile(file)
        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl)
        }
        setVideoPreviewUrl(URL.createObjectURL(file))
    }

    // 处理平台选择
    const handlePlatformToggle = (platformId) => {
        const platform = platformStatus[platformId]

        // 如果未登录，弹出登录提示
        if (!platform?.loggedIn) {
            setCurrentLoginPlatform(platformId)
            setShowLogin(true)
            return
        }

        setSelectedPlatforms(prev =>
            prev.includes(platformId)
                ? prev.filter(id => id !== platformId)
                : [...prev, platformId]
        )
    }

    // 处理登录确认
    const handleLoginConfirm = async () => {
        // 重新检查登录状态
        await checkPlatformStatus()

        // 如果登录成功，自动选中该平台
        if (platformStatus[currentLoginPlatform]?.loggedIn) {
            setSelectedPlatforms(prev =>
                prev.includes(currentLoginPlatform) ? prev : [...prev, currentLoginPlatform]
            )
        }

        setShowLogin(false)
        setCurrentLoginPlatform(null)
    }

    // 处理重新登录
    const handleRelogin = async (platformId) => {
        // 先清除该平台的Cookie
        try {
            await fetch(`/api/platforms/${platformId}/logout`, { method: 'DELETE' })
        } catch (e) {
            console.error('Logout error:', e)
        }

        // 更新状态为未登录
        setPlatformStatus(prev => ({
            ...prev,
            [platformId]: { ...prev[platformId], loggedIn: false }
        }))

        // 从已选中列表移除
        setSelectedPlatforms(prev => prev.filter(id => id !== platformId))

        // 打开登录弹窗
        setCurrentLoginPlatform(platformId)
        setShowLogin(true)
    }

    // 开始上传
    const handleStartUpload = async () => {
        if (!videoFile || selectedPlatforms.length === 0) {
            return
        }

        setIsUploading(true)

        // 初始化进度
        const initialProgress = {}
        selectedPlatforms.forEach(id => {
            initialProgress[id] = { status: 'pending', progress: 0 }
        })
        setUploadProgress(initialProgress)

        try {
            // 上传视频文件
            const formData = new FormData()
            formData.append('video', videoFile)
            formData.append('title', title)
            formData.append('content', content)
            formData.append('tags', JSON.stringify(tags))
            formData.append('platforms', JSON.stringify(selectedPlatforms))

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const result = await response.json()
                // 轮询获取上传状态
                pollUploadStatus(result.taskId)
            } else {
                throw new Error('Upload failed')
            }
        } catch (e) {
            console.error('Upload error:', e)
            setIsUploading(false)
        }
    }

    // 轮询上传状态
    const pollUploadStatus = async (taskId) => {
        const poll = async () => {
            try {
                const response = await fetch(`/api/upload/status/${taskId}`)
                if (response.ok) {
                    const status = await response.json()
                    setUploadProgress(status.platforms)

                    // 检查是否全部完成
                    const allDone = Object.values(status.platforms).every(
                        p => p.status === 'success' || p.status === 'failed'
                    )

                    if (allDone) {
                        setIsUploading(false)
                        return
                    }

                    // 继续轮询
                    setTimeout(poll, 1000)
                }
            } catch (e) {
                console.error('Poll error:', e)
            }
        }

        poll()
    }

    // 保存设置
    const handleSaveSettings = (newSettings) => {
        setSettings(newSettings)
        localStorage.setItem('uploaderSettings', JSON.stringify(newSettings))
        setShowSettings(false)
    }

    // 清除草稿
    const handleClearDraft = () => {
        setTitle('')
        setContent('')
        setTags([])
        localStorage.removeItem('uploaderDraft')
    }

    // 处理全选/取消全选
    const handleSelectAllPlatforms = (platformIds) => {
        setSelectedPlatforms(platformIds)
    }

    return (
        <div className="app">
            {/* 顶部导航 */}
            <header className="app-header">
                <div className="header-left">
                    <div className="logo">
                        <span className="logo-icon">🚀</span>
                        <span className="logo-text">多平台视频助手</span>
                    </div>
                </div>
                <div className="header-right">
                    <button
                        className="btn btn-ghost"
                        onClick={handleClearDraft}
                    >
                        清除草稿
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowSettings(true)}
                    >
                        ⚙️ 设置
                    </button>
                </div>
            </header>

            {/* 主内容区 */}
            <main className="app-main">
                {/* 左侧：视频上传区 */}
                <section className="panel panel-video glass-card slide-up">
                    <h2 className="panel-title">📹 视频文件</h2>
                    <VideoUploader
                        videoFile={videoFile}
                        videoPreviewUrl={videoPreviewUrl}
                        onVideoSelect={handleVideoSelect}
                    />
                </section>

                {/* 中间：AI编辑器 */}
                <section className="panel panel-editor glass-card slide-up" style={{ animationDelay: '0.1s' }}>
                    <h2 className="panel-title">✨ AI内容编辑</h2>
                    <AIEditor
                        title={title}
                        content={content}
                        tags={tags}
                        onTitleChange={setTitle}
                        onContentChange={setContent}
                        onTagsChange={setTags}
                        settings={settings}
                        videoFile={videoFile}
                    />
                </section>

                {/* 右侧：平台选择和进度 */}
                <section className="panel panel-platforms glass-card slide-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="panel-title">📱 发布平台</h2>
                    <PlatformSelector
                        platforms={PLATFORMS}
                        selectedPlatforms={selectedPlatforms}
                        platformStatus={platformStatus}
                        onToggle={handlePlatformToggle}
                        onSelectAllNotLoggedIn={handleSelectAllPlatforms}
                        onRelogin={handleRelogin}
                    />

                    <div className="divider"></div>

                    <h2 className="panel-title">📊 上传进度</h2>
                    <UploadProgress
                        platforms={PLATFORMS}
                        selectedPlatforms={selectedPlatforms}
                        progress={uploadProgress}
                    />

                    <button
                        className="btn btn-primary btn-upload"
                        onClick={handleStartUpload}
                        disabled={!videoFile || selectedPlatforms.length === 0 || isUploading}
                    >
                        {isUploading ? (
                            <>
                                <span className="spinner"></span>
                                上传中...
                            </>
                        ) : (
                            <>🚀 开始发布</>
                        )}
                    </button>
                </section>
            </main>

            {/* 设置弹窗 */}
            {showSettings && (
                <SettingsModal
                    settings={settings}
                    onSave={handleSaveSettings}
                    onClose={() => setShowSettings(false)}
                />
            )}

            {/* 登录弹窗 */}
            {showLogin && (
                <LoginModal
                    platform={PLATFORMS.find(p => p.id === currentLoginPlatform)}
                    onConfirm={handleLoginConfirm}
                    onClose={() => {
                        setShowLogin(false)
                        setCurrentLoginPlatform(null)
                    }}
                />
            )}
        </div>
    )
}

export default App
