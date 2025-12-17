import { browserManager } from './browserManager.js'

// 平台上传配置
const platformUploaders = {
    bilibili: uploadToBilibili,
    douyin: uploadToDouyin,
    xiaohongshu: uploadToXiaohongshu,
    kuaishou: uploadToKuaishou,
    wechat: uploadToWechat
}

class PlatformUploader {
    async upload(platformId, data, onProgress, accountNum = 1) {
        const uploader = platformUploaders[platformId]
        if (!uploader) {
            throw new Error(`不支持的平台: ${platformId}`)
        }
        // 传递账号参数
        return await uploader(data, onProgress, accountNum)
    }
}

// ==================== 哔哩哔哩 ====================
async function uploadToBilibili(data, onProgress, accountNum = 1) {
    const page = await browserManager.getPage('bilibili', accountNum)

    try {
        console.log('[Bilibili] 开始上传...')
        onProgress(10)

        await page.goto('https://member.bilibili.com/platform/upload/video/frame', {
            waitUntil: 'load',
            timeout: 120000
        })
        console.log('[Bilibili] 页面加载完成')
        onProgress(20)

        await page.waitForTimeout(5000)

        // B站文件上传选择器
        const fileInput = page.locator('input[type="file"]').first()
        await fileInput.setInputFiles(data.videoPath)
        console.log('[Bilibili] 视频开始上传...')
        onProgress(30)

        // 等待上传进度出现和完成
        console.log('[Bilibili] 等待上传完成...')
        await page.waitForTimeout(10000)
        onProgress(50)

        // 等待标题输入框出现（表示上传成功进入编辑页面）
        try {
            await page.waitForSelector('input[maxlength="80"], .video-title input', { timeout: 600000 })
            console.log('[Bilibili] 上传完成，进入编辑页面')
        } catch (e) {
            console.log('[Bilibili] 等待编辑页面超时，尝试继续...')
        }
        onProgress(60)

        // 填写标题
        const titleInput = await page.$('input[maxlength="80"]')
        if (titleInput) {
            await titleInput.fill('')
            await titleInput.fill(data.title)
            console.log('[Bilibili] 标题已填写')
        }
        onProgress(65)

        // ★★★ 自动勾选"自制" ★★★
        console.log('[Bilibili] 勾选自制...')
        try {
            // 方法1: 点击类型区域的"自制"选项
            const selfMadeLabel = page.locator('label').filter({ hasText: '自制' }).first()
            if (await selfMadeLabel.count() > 0) {
                await selfMadeLabel.click()
                console.log('[Bilibili] 已勾选自制')
            } else {
                // 方法2: 通过文本定位
                const selfMadeText = page.getByText('自制', { exact: true }).first()
                if (await selfMadeText.count() > 0) {
                    await selfMadeText.click()
                    console.log('[Bilibili] 已勾选自制(方法2)')
                }
            }
        } catch (e) {
            console.log('[Bilibili] 勾选自制失败:', e.message)
        }
        onProgress(70)

        // 填写简介
        const descInput = await page.$('textarea')
        if (descInput) {
            await descInput.fill(data.content)
            console.log('[Bilibili] 简介已填写')
        }
        onProgress(80)

        // 添加标签
        if (data.tags && data.tags.length > 0) {
            const tagContainer = await page.$('.tag-container input, input[placeholder*="标签"]')
            if (tagContainer) {
                for (const tag of data.tags.slice(0, 5)) {
                    await tagContainer.fill(tag)
                    await page.keyboard.press('Enter')
                    await page.waitForTimeout(500)
                }
                console.log('[Bilibili] 标签已添加')
            }
        }
        onProgress(90)

        console.log('[Bilibili] ✓ 信息填写完成，请手动检查后发布')
        onProgress(100)

        return { success: true, message: '信息已填写，请手动发布' }
    } catch (error) {
        console.error('[Bilibili] 上传失败:', error)
        throw new Error(`哔哩哔哩上传失败: ${error.message}`)
    }
}

// ==================== 抖音 ====================
async function uploadToDouyin(data, onProgress, accountNum = 1) {
    const page = await browserManager.getPage('douyin', accountNum)

    try {
        console.log('[Douyin] 开始上传...')
        onProgress(10)

        await page.goto('https://creator.douyin.com/creator-micro/content/upload', {
            waitUntil: 'load',
            timeout: 120000
        })
        console.log('[Douyin] 页面加载完成')
        onProgress(20)

        await page.waitForTimeout(5000)

        // 检查是否需要登录
        const needLogin = await page.locator('text=手机号登录').count() + await page.locator('text=扫码登录').count()
        if (needLogin > 0) {
            throw new Error('Cookie已失效，请重新登录')
        }

        // 抖音文件上传选择器 - 参考 social-auto-upload
        const fileInput = page.locator("div[class^='container'] input").first()
        await fileInput.setInputFiles(data.videoPath)
        console.log('[Douyin] 视频开始上传...')
        onProgress(30)

        // 等待跳转到发布页面
        console.log('[Douyin] 等待跳转到发布页面...')
        let publishPageReached = false
        for (let i = 0; i < 120; i++) {
            const url = page.url()
            if (url.includes('publish') || url.includes('post/video')) {
                publishPageReached = true
                break
            }
            await page.waitForTimeout(1000)
        }

        if (!publishPageReached) {
            console.log('[Douyin] 等待发布页面超时，尝试继续...')
        }
        onProgress(50)

        await page.waitForTimeout(3000)

        // 填写作品描述（标题）- 抖音只有作品描述，没有单独的标题
        console.log('[Douyin] 填写作品描述...')
        // 定位到"作品描述"区域
        const descArea = page.locator('.zone-container, [class*="editor"]').first()
        if (await descArea.count() > 0) {
            await descArea.click()
            // 清空已有内容
            await page.keyboard.press('Control+A')
            await page.keyboard.press('Delete')
            // 只输入标题，不输入正文（抖音描述有字数限制）
            await page.keyboard.type(data.title)
            console.log('[Douyin] 作品描述已填写')
        } else {
            // 备用方案：查找作品标题输入框
            const titleContainer = page.getByText('作品标题').locator('..').locator('xpath=following-sibling::div[1]').locator('input')
            if (await titleContainer.count() > 0) {
                await titleContainer.fill(data.title.slice(0, 30))
            }
        }
        onProgress(70)

        // 添加话题
        console.log('[Douyin] 添加话题...')
        const zoneContainer = page.locator('.zone-container').first()
        if (await zoneContainer.count() > 0 && data.tags) {
            for (const tag of data.tags.slice(0, 3)) {
                await zoneContainer.type('#' + tag + ' ')
                await page.waitForTimeout(500)
            }
        }
        onProgress(90)

        // 不等待上传完成，直接完成（节省时间）
        console.log('[Douyin] ✓ 信息填写完成，视频正在后台上传')
        onProgress(100)

        return { success: true, message: '信息已填写，请手动发布' }
    } catch (error) {
        console.error('[Douyin] 上传失败:', error)
        throw new Error(`抖音上传失败: ${error.message}`)
    }
}

// ==================== 小红书 ====================
async function uploadToXiaohongshu(data, onProgress, accountNum = 1) {
    const page = await browserManager.getPage('xiaohongshu', accountNum)

    try {
        console.log('[Xiaohongshu] 开始上传...')
        onProgress(10)

        await page.goto('https://creator.xiaohongshu.com/publish/publish?source=official', {
            waitUntil: 'load',
            timeout: 120000
        })
        console.log('[Xiaohongshu] 页面加载完成')
        onProgress(20)

        await page.waitForTimeout(5000)

        // 点击视频发布标签（使用更精确的选择器）
        try {
            const videoTab = page.getByRole('button', { name: '上传视频' }).first()
            if (await videoTab.count() > 0) {
                await videoTab.click()
                await page.waitForTimeout(2000)
            }
        } catch (e) {
            console.log('[Xiaohongshu] 视频标签点击跳过')
        }

        // 小红书文件上传
        const fileInput = page.locator('input[type="file"]').first()
        await fileInput.setInputFiles(data.videoPath)
        console.log('[Xiaohongshu] 视频开始上传...')
        onProgress(30)

        // 等待上传完成
        console.log('[Xiaohongshu] 等待上传完成...')
        await page.waitForTimeout(10000)
        onProgress(50)

        // 等待编辑区域出现
        try {
            await page.waitForSelector('input[placeholder*="标题"], .c-input input', { timeout: 300000 })
        } catch (e) {
            console.log('[Xiaohongshu] 等待编辑区域超时')
        }
        onProgress(60)

        // 填写标题
        const titleInput = await page.$('input[placeholder*="标题"], .c-input input')
        if (titleInput) {
            await titleInput.fill(data.title)
            console.log('[Xiaohongshu] 标题已填写')
        }
        onProgress(70)

        // 填写正文
        const contentArea = page.locator('[contenteditable="true"], .ql-editor').first()
        if (await contentArea.count() > 0) {
            await contentArea.click()
            await page.keyboard.type(data.content)
            console.log('[Xiaohongshu] 正文已填写')
        }
        onProgress(80)

        // 添加话题
        if (data.tags && data.tags.length > 0) {
            for (const tag of data.tags.slice(0, 3)) {
                await page.keyboard.type('#' + tag + ' ')
                await page.waitForTimeout(500)
            }
            console.log('[Xiaohongshu] 话题已添加')
        }
        onProgress(85)

        // ★★★ 勾选原创声明 ★★★
        console.log('[Xiaohongshu] 勾选原创声明...')
        try {
            // 1. 点击"声明原创"按钮打开弹窗
            const declareBtn = page.locator('text=声明原创').first()
            if (await declareBtn.count() > 0) {
                await declareBtn.click()
                await page.waitForTimeout(1500)

                // 2. 勾选"我已阅读并同意《原创声明须知》"
                const agreeCheckbox = page.locator('text=我已阅读并同意').first()
                if (await agreeCheckbox.count() > 0) {
                    await agreeCheckbox.click()
                    console.log('[Xiaohongshu] 已勾选同意条款')
                    await page.waitForTimeout(500)

                    // 3. 点击确认按钮（弹窗中的第二个"声明原创"按钮）
                    const confirmBtns = page.locator('button:has-text("声明原创")')
                    const count = await confirmBtns.count()
                    if (count > 0) {
                        // 点击最后一个（弹窗中的确认按钮）
                        await confirmBtns.nth(count - 1).click()
                        console.log('[Xiaohongshu] 已确认原创声明')
                    }
                }
            }
        } catch (e) {
            console.log('[Xiaohongshu] 勾选原创声明失败:', e.message)
        }
        onProgress(90)

        console.log('[Xiaohongshu] ✓ 信息填写完成，请手动检查后发布')
        onProgress(100)

        return { success: true, message: '信息已填写，请手动发布' }
    } catch (error) {
        console.error('[Xiaohongshu] 上传失败:', error)
        throw new Error(`小红书上传失败: ${error.message}`)
    }
}

// ==================== 快手 ====================
async function uploadToKuaishou(data, onProgress, accountNum = 1) {
    const page = await browserManager.getPage('kuaishou', accountNum)

    try {
        console.log('[Kuaishou] 开始上传...')
        onProgress(10)

        await page.goto('https://cp.kuaishou.com/article/publish/video', {
            waitUntil: 'load',
            timeout: 120000
        })
        console.log('[Kuaishou] 页面加载完成')
        onProgress(20)

        await page.waitForTimeout(3000)

        // ★★★ 关闭所有可能的新手指引弹窗 ★★★
        console.log('[Kuaishou] 关闭新手指引弹窗...')

        // 定义关闭弹窗的辅助函数
        const closeGuidePopups = async () => {
            const closeButtons = [
                // 常见按钮文字
                'button:has-text("我知道了")',
                'button:has-text("知道了")',
                'button:has-text("跳过")',
                'button:has-text("关闭")',
                'button:has-text("下一步")',
                'button:has-text("完成")',
                'button:has-text("立即体验")',
                'button:has-text("开始使用")',
                'button:has-text("好的")',
                'button:has-text("确定")',
                // 通过文本匹配
                'text=我知道了',
                'text=知道了',
                'text=跳过',
                // 类名匹配
                '[class*="close-btn"]',
                '[class*="closeBtn"]',
                '[class*="close-icon"]',
                '[class*="closeIcon"]',
                '[class*="guide"] [class*="close"]',
                '[class*="modal"] [class*="close"]',
                '[class*="dialog"] [class*="close"]',
                '[class*="popup"] [class*="close"]',
                '[class*="mask"] [class*="close"]',
                // X 图标按钮
                '[aria-label="关闭"]',
                '[aria-label="close"]',
                '[title="关闭"]',
                // 新手指引特定
                '[class*="guide"] button',
                '[class*="novice"] button',
                '[class*="tutorial"] button'
            ]

            for (const selector of closeButtons) {
                try {
                    const btn = page.locator(selector).first()
                    if (await btn.count() > 0 && await btn.isVisible()) {
                        await btn.click()
                        console.log(`[Kuaishou] 关闭弹窗: ${selector}`)
                        await page.waitForTimeout(500)
                        return true
                    }
                } catch (e) {
                    // 忽略单个选择器错误
                }
            }
            return false
        }

        // 循环尝试关闭弹窗（最多10次）
        for (let i = 0; i < 10; i++) {
            const closed = await closeGuidePopups()
            if (!closed) break
            await page.waitForTimeout(500)
        }

        // 快手上传需要使用 fileChooser - 参考 social-auto-upload
        const uploadButton = page.locator("button[class^='_upload-btn']")
        await uploadButton.waitFor({ state: 'visible', timeout: 30000 })

        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            uploadButton.click()
        ])
        await fileChooser.setFiles(data.videoPath)
        console.log('[Kuaishou] 视频开始上传...')
        onProgress(30)

        await page.waitForTimeout(5000)

        // 再次尝试关闭弹窗（上传后可能出现新的指引）
        for (let i = 0; i < 5; i++) {
            const closed = await closeGuidePopups()
            if (!closed) break
            await page.waitForTimeout(500)
        }

        // 填写描述 - 参考 social-auto-upload
        console.log('[Kuaishou] 填写描述...')
        await page.getByText('描述').locator('xpath=following-sibling::div').click()
        await page.keyboard.press('Control+A')
        await page.keyboard.press('Delete')
        await page.keyboard.type(data.title)
        await page.keyboard.press('Enter')
        onProgress(60)

        // 添加话题
        if (data.tags && data.tags.length > 0) {
            for (const tag of data.tags.slice(0, 3)) {
                await page.keyboard.type('#' + tag + ' ')
                await page.waitForTimeout(1000)
            }
            console.log('[Kuaishou] 话题已添加')
        }
        onProgress(90)

        // 不等待上传完成，直接完成（节省时间）
        console.log('[Kuaishou] ✓ 信息填写完成，视频正在后台上传')
        onProgress(100)

        return { success: true, message: '信息已填写，请手动发布' }
    } catch (error) {
        console.error('[Kuaishou] 上传失败:', error)
        throw new Error(`快手上传失败: ${error.message}`)
    }
}

// ==================== 微信视频号 ====================
async function uploadToWechat(data, onProgress, accountNum = 1) {
    const page = await browserManager.getPage('wechat', accountNum)

    try {
        console.log('[WeChat] 开始上传...')
        onProgress(10)

        await page.goto('https://channels.weixin.qq.com/platform/post/create', {
            waitUntil: 'load',
            timeout: 120000
        })
        console.log('[WeChat] 页面加载完成')
        onProgress(20)

        await page.waitForTimeout(5000)

        // 检查是否需要登录
        const titleName = await page.locator('div.title-name:has-text("微信小店")').count()
        if (titleName > 0) {
            throw new Error('Cookie已失效，请重新登录')
        }

        // 微信视频号文件上传 - 参考 social-auto-upload
        const fileInput = page.locator('input[type="file"]').first()
        await fileInput.setInputFiles(data.videoPath)
        console.log('[WeChat] 视频开始上传...')
        onProgress(30)

        // 等待上传进度
        console.log('[WeChat] 等待视频上传...')
        await page.waitForTimeout(10000)
        onProgress(50)

        // 填写标题和话题
        console.log('[WeChat] 填写描述...')
        const inputEditor = page.locator('div.input-editor').first()
        if (await inputEditor.count() > 0) {
            await inputEditor.click()
            await page.keyboard.type(data.title)
            await page.keyboard.press('Enter')
            await page.keyboard.type(data.content)
        }
        onProgress(70)

        // 添加话题
        if (data.tags && data.tags.length > 0) {
            for (const tag of data.tags.slice(0, 3)) {
                await page.keyboard.type('#' + tag + ' ')
                await page.waitForTimeout(500)
            }
            console.log('[WeChat] 话题已添加')
        }
        onProgress(80)

        // ★★★ 勾选原创声明 ★★★
        console.log('[WeChat] 勾选原创声明...')
        try {
            // 查找"声明原创"复选框
            const originalCheckbox = page.locator('label').filter({ hasText: '声明后' }).first()
            if (await originalCheckbox.count() > 0) {
                await originalCheckbox.click()
                await page.waitForTimeout(1000)

                // 处理原创权益弹窗
                const agreeCheckbox = page.locator('text=我已阅读并同意').first()
                if (await agreeCheckbox.count() > 0) {
                    await agreeCheckbox.click()
                    console.log('[WeChat] 已勾选同意条款')

                    // 点击"声明原创"按钮
                    const confirmBtn = page.locator('button').filter({ hasText: '声明原创' }).first()
                    if (await confirmBtn.count() > 0) {
                        await confirmBtn.click()
                        console.log('[WeChat] 已确认原创声明')
                    }
                }
            }
        } catch (e) {
            console.log('[WeChat] 勾选原创声明失败:', e.message)
        }
        onProgress(90)

        // 不等待上传完成，直接完成（节省时间）
        console.log('[WeChat] ✓ 信息填写完成，视频正在后台上传')
        onProgress(100)

        console.log('[WeChat] ✓ 信息填写完成，请手动检查后点击发表')
        onProgress(100)

        return { success: true, message: '信息已填写，请手动发表' }
    } catch (error) {
        console.error('[WeChat] 上传失败:', error)
        throw new Error(`微信视频号上传失败: ${error.message}`)
    }
}

export const platformUploader = new PlatformUploader()
