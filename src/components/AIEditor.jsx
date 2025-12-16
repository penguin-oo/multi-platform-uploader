import { useState } from 'react'
import './AIEditor.css'

function AIEditor({
    title,
    content,
    tags,
    onTitleChange,
    onContentChange,
    onTagsChange,
    settings,
    videoFile
}) {
    const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
    const [isGeneratingContent, setIsGeneratingContent] = useState(false)
    const [tagInput, setTagInput] = useState('')

    // AI生成标题
    const handleGenerateTitle = async () => {
        if (!settings.aiApiKey) {
            alert('请先在设置中配置AI API Key')
            return
        }

        setIsGeneratingTitle(true)
        try {
            const response = await fetch('/api/ai/generate-title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    videoName: videoFile?.name,
                    apiKey: settings.aiApiKey,
                    provider: settings.aiProvider
                })
            })

            if (response.ok) {
                const data = await response.json()
                onTitleChange(data.title)
            }
        } catch (e) {
            console.error('Generate title error:', e)
        } finally {
            setIsGeneratingTitle(false)
        }
    }

    // AI优化内容
    const handleOptimizeContent = async () => {
        if (!settings.aiApiKey) {
            alert('请先在设置中配置AI API Key')
            return
        }

        setIsGeneratingContent(true)
        try {
            const response = await fetch('/api/ai/optimize-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    apiKey: settings.aiApiKey,
                    provider: settings.aiProvider
                })
            })

            if (response.ok) {
                const data = await response.json()
                onContentChange(data.content)
                if (data.tags) {
                    onTagsChange([...tags, ...data.tags])
                }
            }
        } catch (e) {
            console.error('Optimize content error:', e)
        } finally {
            setIsGeneratingContent(false)
        }
    }

    // 添加标签
    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            onTagsChange([...tags, tagInput.trim()])
            setTagInput('')
        }
    }

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddTag()
        }
    }

    // 删除标签
    const handleRemoveTag = (tagToRemove) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove))
    }

    return (
        <div className="ai-editor">
            {/* 标题编辑 */}
            <div className="editor-section">
                <div className="section-header">
                    <label className="label">视频标题</label>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={handleGenerateTitle}
                        disabled={isGeneratingTitle || !videoFile}
                    >
                        {isGeneratingTitle ? (
                            <><span className="spinner spinner-sm"></span> 生成中...</>
                        ) : (
                            <>✨ AI生成</>
                        )}
                    </button>
                </div>
                <input
                    type="text"
                    className="input-field"
                    placeholder="输入视频标题，或使用AI自动生成..."
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    maxLength={100}
                />
                <div className="char-count">{title.length}/100</div>
            </div>

            {/* 正文编辑 */}
            <div className="editor-section">
                <div className="section-header">
                    <label className="label">视频描述</label>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={handleOptimizeContent}
                        disabled={isGeneratingContent}
                    >
                        {isGeneratingContent ? (
                            <><span className="spinner spinner-sm"></span> 优化中...</>
                        ) : (
                            <>🪄 AI优化</>
                        )}
                    </button>
                </div>
                <textarea
                    className="input-field textarea-field"
                    placeholder="输入视频描述，AI可以帮你优化内容和生成标签..."
                    value={content}
                    onChange={(e) => onContentChange(e.target.value)}
                    maxLength={2000}
                />
                <div className="char-count">{content.length}/2000</div>
            </div>

            {/* 标签编辑 */}
            <div className="editor-section">
                <label className="label">标签</label>
                <div className="tags-input-container">
                    <input
                        type="text"
                        className="input-field tags-input"
                        placeholder="输入标签，按回车添加"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                    />
                    <button
                        className="btn btn-secondary btn-add-tag"
                        onClick={handleAddTag}
                    >
                        添加
                    </button>
                </div>
                <div className="tags-list">
                    {tags.map((tag, index) => (
                        <span key={index} className="tag">
                            #{tag}
                            <button
                                className="tag-remove"
                                onClick={() => handleRemoveTag(tag)}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    {tags.length === 0 && (
                        <span className="tags-placeholder">暂无标签</span>
                    )}
                </div>
            </div>

            {/* 预览提示 */}
            <div className="preview-hint">
                <div className="hint-icon">💡</div>
                <div className="hint-text">
                    <strong>提示：</strong>不同平台对标题和正文有不同的长度限制，系统会自动适配。
                </div>
            </div>
        </div>
    )
}

export default AIEditor
