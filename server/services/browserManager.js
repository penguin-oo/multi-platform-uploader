import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const cookiesDir = join(__dirname, '..', 'cookies')

// 确保目录存在
if (!fs.existsSync(cookiesDir)) {
    fs.mkdirSync(cookiesDir, { recursive: true })
}

class BrowserManager {
    constructor() {
        this.browser = null          // 单一浏览器实例
        this.contexts = {}           // 每个账号组独立上下文: { 1: context1, 2: context2 }
        this.chromium = null
        this.currentPlatform = null
        this.currentAccount = 1      // 当前账号：1 或 2
    }

    // 延迟加载 Playwright
    async getPlaywright() {
        if (!this.chromium) {
            try {
                const playwright = await import('playwright')
                this.chromium = playwright.chromium
            } catch (e) {
                console.error('Failed to load playwright:', e)
                throw new Error('Playwright未安装，请运行: npx playwright install chromium')
            }
        }
        return this.chromium
    }

    // 获取Cookie文件路径（支持账号）
    getCookieFile(platformId, accountNum = 1) {
        return join(cookiesDir, `${platformId}_${accountNum}.json`)
    }

    // 打开登录页面（支持账号）
    async openLoginPage(platformId, config, accountNum = 1) {
        console.log(`Opening login page for ${platformId} (账号${accountNum}): ${config.loginUrl}`)

        const chromium = await this.getPlaywright()

        // 启动新浏览器
        const browser = await chromium.launch({
            headless: false,
            args: ['--start-maximized', '--no-sandbox']
        })

        const context = await browser.newContext({
            viewport: null,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

        // 加载已保存的Cookie
        await this.loadCookies(context, platformId, accountNum)

        const page = await context.newPage()

        // 保存Cookie的函数
        const saveCookies = async () => {
            try {
                const cookies = await context.cookies()
                const cookieFile = this.getCookieFile(platformId, accountNum)
                fs.writeFileSync(cookieFile, JSON.stringify(cookies, null, 2))
                console.log(`Cookies saved for ${platformId} (账号${accountNum})`)
            } catch (e) {
                console.error('Failed to save cookies:', e)
            }
        }

        page.on('close', saveCookies)
        browser.on('disconnected', saveCookies)

        await page.goto(config.loginUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        })

        return { browser, context, page }
    }

    // 加载Cookie（支持账号）
    async loadCookies(context, platformId, accountNum = 1) {
        const cookieFile = this.getCookieFile(platformId, accountNum)
        if (fs.existsSync(cookieFile)) {
            try {
                const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf-8'))
                if (Array.isArray(cookies) && cookies.length > 0) {
                    await context.addCookies(cookies)
                    console.log(`Loaded ${cookies.length} cookies for ${platformId} (账号${accountNum})`)
                }
            } catch (e) {
                console.error('Failed to load cookies:', e)
            }
        }
    }

    // 保存当前Cookie（支持账号）
    async saveCookies(platformId, accountNum = 1) {
        const context = this.contexts[accountNum]
        if (!context) return
        try {
            const cookies = await context.cookies()
            const cookieFile = this.getCookieFile(platformId, accountNum)
            fs.writeFileSync(cookieFile, JSON.stringify(cookies, null, 2))
            console.log(`Cookies saved for ${platformId} (账号${accountNum})`)
        } catch (e) {
            console.error('Failed to save cookies:', e)
        }
    }

    // 检查账号登录状态
    checkAccountStatus(platformId, accountNum = 1) {
        const cookieFile = this.getCookieFile(platformId, accountNum)
        if (fs.existsSync(cookieFile)) {
            try {
                const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf-8'))
                return Array.isArray(cookies) && cookies.length > 0
            } catch (e) {
                return false
            }
        }
        return false
    }

    // 获取或创建指定账号组的上下文
    async getOrCreateContext(accountNum) {
        // 如果该账号组已有上下文，直接返回
        if (this.contexts[accountNum]) {
            return this.contexts[accountNum]
        }

        // 确保浏览器已启动
        if (!this.browser) {
            const chromium = await this.getPlaywright()
            console.log('[BrowserManager] 启动浏览器...')
            this.browser = await chromium.launch({
                headless: false,
                args: ['--start-maximized', '--no-sandbox']
            })

            // 浏览器关闭时清理
            this.browser.on('disconnected', () => {
                console.log('[BrowserManager] 浏览器已关闭')
                this.browser = null
                this.contexts = {}
                this.currentPlatform = null
            })
        }

        // 为该账号组创建独立的上下文
        console.log(`[BrowserManager] 为账号组${accountNum}创建独立上下文...`)
        const context = await this.browser.newContext({
            viewport: null,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

        this.contexts[accountNum] = context
        return context
    }

    // 获取或创建页面（支持账号）
    async getPage(platformId, accountNum = 1) {
        const platformKey = `${platformId}_${accountNum}`

        // 获取或创建该账号组的独立上下文
        const context = await this.getOrCreateContext(accountNum)

        // 保存之前平台的Cookie
        if (this.currentPlatform && this.currentPlatform !== platformKey) {
            const [prevPlatform, prevAccount] = this.currentPlatform.split('_')
            await this.saveCookies(prevPlatform, parseInt(prevAccount) || 1)
        }

        // 加载新平台的Cookie
        await this.loadCookies(context, platformId, accountNum)

        // 创建新的标签页
        console.log(`[BrowserManager] 为 ${platformId} (账号${accountNum}) 创建新标签页...`)
        const newPage = await context.newPage()
        this.currentPlatform = platformKey
        this.currentAccount = accountNum

        return newPage
    }

    // 为保持向后兼容，保留 getContext 方法
    async getContext(platformId, accountNum = 1) {
        await this.getPage(platformId, accountNum)
        const context = this.contexts[accountNum]
        return {
            newPage: async () => context.newPage(),
            cookies: async () => context.cookies(),
            addCookies: async (cookies) => context.addCookies(cookies)
        }
    }

    // 关闭浏览器
    async close() {
        // 保存所有账号组的Cookie
        if (this.currentPlatform) {
            const [platform, account] = this.currentPlatform.split('_')
            await this.saveCookies(platform, parseInt(account) || 1)
        }
        if (this.browser) {
            try {
                await this.browser.close()
            } catch (e) {
                // 忽略
            }
            this.browser = null
            this.contexts = {}
            this.currentPlatform = null
        }
    }
}

export const browserManager = new BrowserManager()
