@echo off
chcp 65001 >nul
title 多平台视频上传助手

echo.
echo ╔════════════════════════════════════════╗
echo ║     多平台视频上传助手 - 启动中...     ║
echo ╚════════════════════════════════════════╝
echo.

:: 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 检查 node_modules 是否存在
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [完成] 依赖安装成功
    echo.
)

:: 检查 Playwright 浏览器是否安装
if not exist "%USERPROFILE%\AppData\Local\ms-playwright" (
    echo [提示] 正在安装 Playwright 浏览器...
    call npx playwright install chromium
    echo [完成] 浏览器安装成功
    echo.
)

echo [启动] 正在启动服务...
echo.

:: 启动服务并打开浏览器
start "" http://localhost:5173
call npm run dev
