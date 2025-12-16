import { useState } from 'react'
import './SettingsModal.css'

function SettingsModal({ settings, onSave, onClose }) {
    const [localSettings, setLocalSettings] = useState({ ...settings })

    const handleChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }))
    }

    const handleSave = () => {
        onSave(localSettings)
    }

    const handleAddDefaultTag = (e) => {
        if (e.key === 'Enter') {
            const tag = e.target.value.trim()
            if (tag && !localSettings.defaultTags.includes(tag)) {
                handleChange('defaultTags', [...localSettings.defaultTags, tag])
                e.target.value = ''
            }
        }
    }

    const handleRemoveDefaultTag = (tag) => {
        handleChange('defaultTags', localSettings.defaultTags.filter(t => t !== tag))
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>⚙️ 设置</h2>
                    <button className="btn btn-ghost btn-icon modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    {/* AI设置 */}
                    <div className="settings-section">
                        <h3 className="section-title">🤖 AI配置</h3>

                        <div className="form-group">
                            <label className="label">AI服务提供商</label>
                            <select
                                className="input-field"
                                value={localSettings.aiProvider}
                                onChange={(e) => handleChange('aiProvider', e.target.value)}
                            >
                                <option value="openai">OpenAI (GPT-4)</option>
                                <option value="deepseek">DeepSeek</option>
                                <option value="moonshot">Moonshot (月之暗面)</option>
                                <option value="ollama">Ollama (本地)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="label">API Key</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="输入你的API Key..."
                                value={localSettings.aiApiKey}
                                onChange={(e) => handleChange('aiApiKey', e.target.value)}
                            />
                            <p className="form-hint">
                                {localSettings.aiProvider === 'ollama'
                                    ? 'Ollama本地模式不需要API Key'
                                    : '你的API Key会安全地存储在本地'}
                            </p>
                        </div>
                    </div>

                    {/* 自动保存设置 */}
                    <div className="settings-section">
                        <h3 className="section-title">💾 保存设置</h3>

                        <div className="form-group">
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    checked={localSettings.autoSaveDraft}
                                    onChange={(e) => handleChange('autoSaveDraft', e.target.checked)}
                                />
                                <span className="toggle-text">自动保存草稿</span>
                            </label>
                            <p className="form-hint">编辑时自动保存标题、正文和标签</p>
                        </div>
                    </div>

                    {/* 默认标签 */}
                    <div className="settings-section">
                        <h3 className="section-title">🏷️ 默认标签</h3>

                        <div className="form-group">
                            <input
                                type="text"
                                className="input-field"
                                placeholder="输入标签，按回车添加"
                                onKeyDown={handleAddDefaultTag}
                            />
                            <div className="default-tags">
                                {localSettings.defaultTags.map((tag, index) => (
                                    <span key={index} className="tag">
                                        #{tag}
                                        <button
                                            className="tag-remove"
                                            onClick={() => handleRemoveDefaultTag(tag)}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <p className="form-hint">这些标签会自动添加到每个视频</p>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        取消
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        保存设置
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SettingsModal
