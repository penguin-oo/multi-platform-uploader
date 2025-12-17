import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cookie存储目录
const cookiesDir = join(__dirname, '..', 'cookies')
if (!fs.existsSync(cookiesDir)) {
    fs.mkdirSync(cookiesDir, { recursive: true })
}

// 平台配置
const platformConfigs = {
    bilibili: {
        name: '哔哩哔哩',
        loginUrl: 'https://passport.bilibili.com/login',
        checkUrl: 'https://api.bilibili.com/x/web-interface/nav',
        domain: '.bilibili.com'
    },
    douyin: {
        name: '抖音',
        loginUrl: 'https://creator.douyin.com/creator-micro/home',
        checkUrl: 'https://creator.douyin.com/web/api/media/user/info/',
        domain: '.douyin.com'
    },
    xiaohongshu: {
        name: '小红书',
        loginUrl: 'https://creator.xiaohongshu.com/login',
        checkUrl: 'https://creator.xiaohongshu.com/api/galaxy/user/my/info',
        domain: '.xiaohongshu.com'
    },
    kuaishou: {
        name: '快手',
        loginUrl: 'https://cp.kuaishou.com/article/publish/video',
        checkUrl: 'https://cp.kuaishou.com/rest/cp/account/info',
        domain: '.kuaishou.com'
    },
    wechat: {
        name: '微信视频号',
        loginUrl: 'https://channels.weixin.qq.com/platform/login',
        checkUrl: 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/auth/auth_data',
        domain: '.qq.com'
    }
}

// 检查单个账号Cookie是否有效
function checkCookieValid(platformId, accountNum) {
    const cookieFile = join(cookiesDir, `${platformId}_${accountNum}.json`)
    if (fs.existsSync(cookieFile)) {
        try {
            const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf-8'))
            const isValid = cookies.some(c => {
                if (!c.expires) return true
                return new Date(c.expires * 1000) > new Date()
            })
            return isValid
        } catch (e) {
            return false
        }
    }
    return false
}

// 获取所有平台状态（包含双账号）
router.get('/status', async (req, res) => {
    const status = {}

    for (const [platformId, config] of Object.entries(platformConfigs)) {
        status[platformId] = {
            name: config.name,
            account1: { loggedIn: checkCookieValid(platformId, 1) },
            account2: { loggedIn: checkCookieValid(platformId, 2) },
            // 向后兼容：任一账号登录即为已登录
            loggedIn: checkCookieValid(platformId, 1) || checkCookieValid(platformId, 2)
        }
    }

    res.json(status)
})

// 获取单个平台状态
router.get('/:platformId/status', async (req, res) => {
    const { platformId } = req.params
    const config = platformConfigs[platformId]

    if (!config) {
        return res.status(404).json({ error: '未知平台' })
    }

    const cookieFile = join(cookiesDir, `${platformId}.json`)

    if (fs.existsSync(cookieFile)) {
        try {
            const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf-8'))
            const isValid = cookies.some(c => {
                if (!c.expires) return true
                return new Date(c.expires * 1000) > new Date()
            })

            res.json({ loggedIn: isValid, name: config.name })
        } catch (e) {
            res.json({ loggedIn: false, name: config.name })
        }
    } else {
        res.json({ loggedIn: false, name: config.name })
    }
})

// 初始化登录流程
router.post('/:platformId/login', async (req, res) => {
    const { platformId } = req.params
    const config = platformConfigs[platformId]

    if (!config) {
        return res.status(404).json({ error: '未知平台' })
    }

    res.json({
        success: true,
        url: config.loginUrl,
        message: `请在浏览器中登录${config.name}`
    })
})

// 打开浏览器进行登录（支持账号参数）
router.post('/:platformId/open-browser', async (req, res) => {
    const { platformId } = req.params
    const { accountNum = 1 } = req.body // 默认账号1
    const config = platformConfigs[platformId]

    if (!config) {
        return res.status(404).json({ error: '未知平台' })
    }

    try {
        const { browserManager } = await import('../services/browserManager.js')
        await browserManager.openLoginPage(platformId, config, accountNum)

        res.json({ success: true, message: `浏览器已打开 (账号${accountNum})` })
    } catch (error) {
        console.error('Open browser error:', error)
        res.status(500).json({ error: error.message })
    }
})

// 保存Cookie（从浏览器获取后调用）
router.post('/:platformId/save-cookies', async (req, res) => {
    const { platformId } = req.params
    const { cookies } = req.body

    if (!platformConfigs[platformId]) {
        return res.status(404).json({ error: '未知平台' })
    }

    try {
        const cookieFile = join(cookiesDir, `${platformId}.json`)
        fs.writeFileSync(cookieFile, JSON.stringify(cookies, null, 2))

        res.json({ success: true, message: 'Cookie已保存' })
    } catch (error) {
        console.error('Save cookies error:', error)
        res.status(500).json({ error: error.message })
    }
})

// 清除Cookie（登出）
router.delete('/:platformId/logout', (req, res) => {
    const { platformId } = req.params

    if (!platformConfigs[platformId]) {
        return res.status(404).json({ error: '未知平台' })
    }

    const cookieFile = join(cookiesDir, `${platformId}.json`)

    if (fs.existsSync(cookieFile)) {
        fs.unlinkSync(cookieFile)
    }

    res.json({ success: true, message: '已登出' })
})

export default router
