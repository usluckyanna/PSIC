# WorkGuide 版本 1

## 如何运行

在项目文件夹里用 Node.js 22 或更新版本运行：

```sh
node --env-file=.env server/local.mjs
```

打开 <http://127.0.0.1:3000>。AI 密钥来自服务器端 `getKey()`，模型为 `gpt-5.6-luna`。本机的 `.env` 提供 `KEYGEN_URL` 和 `KEYGEN_TOKEN`，并由 Git 忽略。

## 已完成

1. 粘贴老师的通知或作业，或载入一个虚构示例。选择阅读语言后，点击「发送给 AI」才会请求 OpenAI。
2. 查看一句话解释、带原文依据的行动清单和完整翻译。
3. 查看需要向老师核对的内容。刷新页面可恢复最近的输入和指南。

目前仅保存在此计算机上。输入和最近的结果保存在当前浏览器的 localStorage。发送时，通知正文会交给 AI 处理；演示请使用虚构示例。

## 下一步

用「科学作业」展示发送、解释、原文依据和翻译，用「图书馆通知」展示 AI 如何标出缺失的集合时间。刷新页面展示保存结果。

## 部署到 Vercel

1. 在 Vercel 选择 **Add New → Project**，导入 GitHub 上的 `usluckyanna/PSIC`。使用仓库根目录，保留默认构建设置。
2. 在项目的 **Environment Variables** 中添加 `KEYGEN_URL` 和 `KEYGEN_TOKEN`，勾选 **Production**。如果希望预览版也能使用 AI，再勾选 **Preview**。以后更改这两个值时，需要重新部署。
3. 点 **Deploy**。打开 Vercel 提供的网址，选择「科学作业」并点「发送给 AI」。看到学习指南后刷新，确认指南仍在同一个浏览器里。

`vercel.json` 将 `public/` 作为页面目录，`/api/chat` 由 Node.js 函数运行。函数把 `BRIEF.md` 随服务器代码打包。只有服务器端的 `getKey()` 会读取这两个环境变量并获取 AI 密钥。无需额外的环境变量、数据库或自定义构建命令。

浏览器按网址保存数据。本机网址保存的内容会留在本机网址，Vercel 网址有自己的保存记录。

## 可能稍后添加

- 还没有。
