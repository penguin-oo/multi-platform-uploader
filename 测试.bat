@echo off
chcp 65001 >nul
title 测试脚本

echo.
echo 正在运行测试...
echo.

node test-upload.js

echo.
echo 测试完成！请查看 test-report.txt
echo.
pause
