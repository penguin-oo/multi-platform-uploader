import express from 'express'

const router = express.Router()

// 生成标题
router.post('/generate-title', async (req, res) => {
    try {
        const { content, videoName, apiKey, provider } = req.body

        if (!apiKey && provider !== 'ollama') {
            return res.status(400).json({ error: '需要提供API Key' })
        }

        let title = ''

        // 根据provider调用不同的AI服务
        switch (provider) {
            case 'openai':
                title = await generateWithOpenAI(apiKey, 'title', { content, videoName })
                break
            case 'deepseek':
                title = await generateWithDeepSeek(apiKey, 'title', { content, videoName })
                break
            case 'moonshot':
                title = await generateWithMoonshot(apiKey, 'title', { content, videoName })
                break
            case 'ollama':
                title = await generateWithOllama('title', { content, videoName })
                break
            default:
                // 回退：基于视频名称和内容生成简单标题
                title = generateFallbackTitle(videoName, content)
        }

        res.json({ title })
    } catch (error) {
        console.error('Generate title error:', error)
        res.status(500).json({ error: error.message })
    }
})

// 优化内容
router.post('/optimize-content', async (req, res) => {
    try {
        const { title, content, apiKey, provider } = req.body

        if (!apiKey && provider !== 'ollama') {
            return res.status(400).json({ error: '需要提供API Key' })
        }

        let optimizedContent = content
        let tags = []

        switch (provider) {
            case 'openai':
                const result = await generateWithOpenAI(apiKey, 'content', { title, content })
                optimizedContent = result.content
                tags = result.tags
                break
            case 'deepseek':
                const deepseekResult = await generateWithDeepSeek(apiKey, 'content', { title, content })
                optimizedContent = deepseekResult.content
                tags = deepseekResult.tags
                break
            case 'moonshot':
                const moonshotResult = await generateWithMoonshot(apiKey, 'content', { title, content })
                optimizedContent = moonshotResult.content
                tags = moonshotResult.tags
                break
            case 'ollama':
                const ollamaResult = await generateWithOllama('content', { title, content })
                optimizedContent = ollamaResult.content
                tags = ollamaResult.tags
                break
            default:
                // 回退：简单优化
                optimizedContent = content
                tags = extractKeywords(content)
        }

        res.json({ content: optimizedContent, tags })
    } catch (error) {
        console.error('Optimize content error:', error)
        res.status(500).json({ error: error.message })
    }
})

// OpenAI调用
async function generateWithOpenAI(apiKey, type, data) {
    const prompt = type === 'title'
        ? `根据以下视频信息生成一个吸引人的中文标题（20字以内）：
视频文件名：${data.videoName || '未知'}
视频描述：${data.content || '无描述'}
只返回标题文本，不要其他内容。`
        : `优化以下视频描述，使其更吸引人，并提取5个相关标签：
标题：${data.title}
原描述：${data.content}
返回JSON格式：{"content": "优化后的描述", "tags": ["标签1", "标签2", ...]}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
        })
    })

    if (!response.ok) {
        throw new Error('OpenAI API调用失败')
    }

    const result = await response.json()
    const text = result.choices[0].message.content

    if (type === 'title') {
        return text.trim()
    } else {
        try {
            return JSON.parse(text)
        } catch {
            return { content: text, tags: [] }
        }
    }
}

// DeepSeek调用
async function generateWithDeepSeek(apiKey, type, data) {
    const prompt = type === 'title'
        ? `根据以下视频信息生成一个吸引人的中文标题（20字以内）：
视频文件名：${data.videoName || '未知'}
视频描述：${data.content || '无描述'}
只返回标题文本。`
        : `优化以下视频描述，使其更吸引人，并提取5个相关标签：
标题：${data.title}
原描述：${data.content}
返回JSON格式：{"content": "优化后的描述", "tags": ["标签1", "标签2", ...]}`

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
        })
    })

    if (!response.ok) {
        throw new Error('DeepSeek API调用失败')
    }

    const result = await response.json()
    const text = result.choices[0].message.content

    if (type === 'title') {
        return text.trim()
    } else {
        try {
            return JSON.parse(text)
        } catch {
            return { content: text, tags: [] }
        }
    }
}

// Moonshot调用
async function generateWithMoonshot(apiKey, type, data) {
    const prompt = type === 'title'
        ? `根据以下视频信息生成一个吸引人的中文标题（20字以内）：
视频文件名：${data.videoName || '未知'}
视频描述：${data.content || '无描述'}
只返回标题文本。`
        : `优化以下视频描述，使其更吸引人，并提取5个相关标签：
标题：${data.title}
原描述：${data.content}
返回JSON格式：{"content": "优化后的描述", "tags": ["标签1", "标签2", ...]}`

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'moonshot-v1-8k',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
        })
    })

    if (!response.ok) {
        throw new Error('Moonshot API调用失败')
    }

    const result = await response.json()
    const text = result.choices[0].message.content

    if (type === 'title') {
        return text.trim()
    } else {
        try {
            return JSON.parse(text)
        } catch {
            return { content: text, tags: [] }
        }
    }
}

// Ollama本地调用
async function generateWithOllama(type, data) {
    const prompt = type === 'title'
        ? `生成一个吸引人的中文视频标题（20字以内），视频描述：${data.content || data.videoName || '无描述'}`
        : `优化以下视频描述并提取标签：${data.content}`

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen2:7b',
                prompt,
                stream: false
            })
        })

        if (!response.ok) {
            throw new Error('Ollama服务未运行')
        }

        const result = await response.json()

        if (type === 'title') {
            return result.response.trim()
        } else {
            try {
                return JSON.parse(result.response)
            } catch {
                return { content: result.response, tags: extractKeywords(result.response) }
            }
        }
    } catch (error) {
        console.error('Ollama error:', error)
        throw new Error('Ollama本地服务连接失败，请确保Ollama已启动')
    }
}

// 回退方案：基于视频名称生成标题
function generateFallbackTitle(videoName, content) {
    if (videoName) {
        // 移除扩展名和特殊字符
        return videoName
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .slice(0, 30)
    }
    if (content) {
        return content.slice(0, 30)
    }
    return '精彩视频分享'
}

// 提取关键词作为标签
function extractKeywords(text) {
    if (!text) return []

    // 简单的关键词提取（实际应用中可以使用更复杂的NLP）
    const keywords = text
        .replace(/[，。！？、；：""'']/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 2 && word.length <= 10)
        .slice(0, 5)

    return [...new Set(keywords)]
}

export default router
