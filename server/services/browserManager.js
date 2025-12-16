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
        this.context = null          // 单一上下文
        this.chromium = null
        this.currentPlatform = null
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

    // 打开登录页面
    async openLoginPage(platformId, config) {
        console.log(`Opening login page for ${platformId}: ${config.loginUrl}`)

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
        await this.loadCookies(context, platformId)

        const page = await context.newPage()

        // 保存Cookie的函数
        const saveCookies = async () => {
            try {
                const cookies = await context.cookies()
                const cookieFile = join(cookiesDir, `${platformId}.json`)
                fs.writeFileSync(cookieFile, JSON.stringify(cookies, null, 2))
                console.log(`Cookies saved for ${platformId}`)
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

    // 加载Cookie
    async loadCookies(context, platformId) {
        const cookieFile = join(cookiesDir, `${platformId}.json`)
        if (fs.existsSync(cookieFile)) {
            try {
                const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf-8'))
                if (Array.isArray(cookies) && cookies.length > 0) {
                    await context.addCookies(cookies)
                    console.log(`Loaded ${cookies.length} cookies for ${platformId}`)
                }
            } catch (e) {
                console.error('Failed to load cookies:', e)
            }
        }
    }

    // 保存当前Cookie
    async saveCookies(platformId) {
        if (!this.context) return
        try {
            const cookies = await this.context.cookies()
            const cookieFile = join(cookiesDir, `${platformId}.json`)
            fs.writeFileSync(cookieFile, JSON.stringify(cookies, null, 2))
            console.log(`Cookies saved for ${platformId}`)
        } catch (e) {
            console.error('Failed to save cookies:', e)
        }
    }

    // 获取或创建页面（同一浏览器窗口，每个平台新建标签页）
    async getPage(platformId) {
        // 如果已经有浏览器实例，在同一个浏览器中创建新标签页
        if (this.browser && this.context) {
            // 保存之前平台的Cookie
            if (this.currentPlatform && this.currentPlatform !== platformId) {
                await this.saveCookies(this.currentPlatform)
            }

            // 加载新平台的Cookie
            await this.loadCookies(this.context, platformId)

            // 创建新的标签页（不关闭旧的）
            console.log(`[BrowserManager] 为 ${platformId} 创建新标签页...`)
            const newPage = await this.context.newPage()
            this.currentPlatform = platformId

            return newPage
        }

        // 首次创建浏览器
        const chromium = await this.getPlaywright()

        console.log('[BrowserManager] 启动浏览器...')
        this.browser = await chromium.launch({
            headless: false,
            args: ['--start-maximized', '--no-sandbox']
        })

        this.context = await this.browser.newContext({
            viewport: null,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

        // 加载Cookie
        await this.loadCookies(this.context, platformId)

        const page = await this.context.newPage()
        this.currentPlatform = platformId

        // 浏览器关闭时清理
        this.browser.on('disconnected', () => {
            console.log('[BrowserManager] 浏览器已关闭')
            this.browser = null
            this.context = null
            this.currentPlatform = null
        })

        return page
    }

    // 为保持向后兼容，保留 getContext 方法
    async getContext(platformId) {
        await this.getPage(platformId)
        return {
            newPage: async () => this.context.newPage(),
            cookies: async () => this.context.cookies(),
            addCookies: async (cookies) => this.context.addCookies(cookies)
        }
    }

    // 关闭浏览器
    async close() {
        if (this.currentPlatform) {
            await this.saveCookies(this.currentPlatform)
        }
        if (this.browser) {
            try {
                await this.browser.close()
            } catch (e) {
                // 忽略
            }
            this.browser = null
            this.context = null
            this.currentPlatform = null
        }
    }
}

export const browserManager = new BrowserManager()
