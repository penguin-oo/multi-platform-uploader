# 贡献指南 / Contributing

感谢你对本项目的关注！欢迎提交 Issue 和 Pull Request。

## 提交 Issue

在提交 Issue 前，请先搜索是否已有相似问题。

### Bug 报告

请提供以下信息：
- 操作系统版本
- Node.js 版本
- 具体的错误信息
- 复现步骤

### 功能建议

描述你希望添加的功能，以及使用场景。

## 提交 Pull Request

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 代码规范

- 使用 ESM 模块语法
- 保持代码简洁可读
- 添加必要的注释

## 平台适配

如果你要适配新平台或修复平台选择器：

1. 在 `server/services/platformUploader.js` 中添加/修改
2. 使用 Playwright 的稳定选择器
3. 添加适当的等待和错误处理
4. 测试完成后提交 PR
