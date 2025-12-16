import { useState, useEffect } from 'react'
import './LoginModal.css'

function LoginModal({ platform, onConfirm, onClose }) {
    const [isLoading, setIsLoading] = useState(false)
    const [loginUrl, setLoginUrl] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        // 获取登录URL
        startLogin()
    }, [platform])

    const startLogin = async () => {
        setIsLoading(true)
        setError('')

        try {
            const response = await fetch(`/api/platforms/${platform.id}/login`, {
                method: 'POST'
            })

            if (response.ok) {
                const data = await response.json()
                setLoginUrl(data.url)
            } else {
                setError('无法启动登录流程，请稍后重试')
            }
        } catch (e) {
            console.error('Login error:', e)
            setError('网络错误，请检查后端服务是否启动')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenBrowser = () => {
        // 通知后端打开浏览器
        fetch(`/api/platforms/${platform.id}/open-browser`, {
            method: 'POST'
        })
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content login-modal glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        <span className="platform-icon">{platform.icon}</span>
                        登录 {platform.name}
                    </h2>
                    <button className="btn btn-ghost btn-icon modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    <div className="login-instructions">
                        <div className="step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <p className="step-title">打开浏览器登录</p>
                                <p className="step-desc">
                                    点击下方按钮会打开一个浏览器窗口，请在该窗口中登录你的{platform.name}账号。
                                </p>
                            </div>
                        </div>

                        <div className="step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <p className="step-title">完成登录</p>
                                <p className="step-desc">
                                    登录成功后，保持浏览器窗口打开状态。
                                </p>
                            </div>
                        </div>

                        <div className="step">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <p className="step-title">确认登录</p>
                                <p className="step-desc">
                                    点击下方"我已登录"按钮，系统会自动保存你的登录状态。
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="login-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <div className="login-actions">
                        <button
                            className="btn btn-secondary btn-lg"
                            onClick={handleOpenBrowser}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <><span className="spinner"></span> 正在启动...</>
                            ) : (
                                <>🌐 打开浏览器登录</>
                            )}
                        </button>
                    </div>

                    <div className="login-note">
                        <span className="note-icon">🔒</span>
                        <p>你的登录信息仅保存在本地，不会上传到任何服务器。</p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        取消
                    </button>
                    <button className="btn btn-primary" onClick={onConfirm}>
                        ✓ 我已登录
                    </button>
                </div>
            </div>
        </div>
    )
}

export default LoginModal
