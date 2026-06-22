<!-- marketplace-readme:remove-start -->

<h1 align="center">多模型 Copilot</h1>
<h3 align="center">DeepSeek V4 + GLM-5.2 | VS Code Copilot Chat</h3>

<p align="center">
  <img src="https://img.shields.io/github/v/release/ludysama/multi-model-copilot?style=for-the-badge&label=Version" alt="版本" />
</p>

<p align="center">
  <a href="https://github.com/ludysama/multi-model-copilot/blob/main/README.md">English</a> |
  简体中文
</p>

---

> ## [FORK] Fork 自 [Vizards/deepseek-v4-for-copilot](https://github.com/Vizards/deepseek-v4-for-copilot) v0.6.2
>
> **原作者: [Vizards](https://github.com/Vizards)** -- DeepSeek V4 Copilot Chat 集成的核心工作全部归功于原作者。
> **本 Fork** 在上游基础上扩展多模型支持 (GLM-5.2 + 按模型独立 API Key), 后续计划加入更多提供方。
>
> [本 Fork](https://github.com/ludysama/multi-model-copilot) | [上游](https://github.com/Vizards/deepseek-v4-for-copilot) | MIT 协议
>
> *下方截图来自上游 -- 本 Fork 在相同 DeepSeek 能力基础上额外添加了 GLM-5.2。*

---

## [NEW] 本 Fork 新增功能

| 特性 | 说明 |
|------|------|
| **GLM-5.2 (智谱)** | 智谱旗舰模型接入 Copilot 选择器 -- 1M 上下文、OpenAI 兼容端点 |
| **按模型独立 API Key** | DeepSeek 和智谱的 Key 分开保存, 通过 QuickPick 按提供方分别设置 |
| **按模型独立 Base URL** | 每个模型自带 `baseUrl`, 无声明时回落全局设置 |
| **全面改名** | 命令/设置/ID 全部从 `deepseek-copilot` 迁移至 `multi-model-copilot` |

### 多提供方 Key 设置

命令面板运行 `多模型 Copilot: 设置 API Key` -- 弹出 QuickPick 列出所有支持的提供方。选一个、粘贴 Key、确认。对每个提供方重复。Key 保存在操作系统密钥链中, 绝不写入文件。

---

## [INHERITED] 继承自上游的功能

以下功能针对 DeepSeek V4 (Flash / Pro), 完整保留自上游 v0.6.2:

### DeepSeek V4 出现在模型选择器中
与 GPT-4o、Claude 等并列。1M 上下文, 支持对话中途切换。

### 视觉代理
DeepSeek V4 本身不支持图片。拖入截图 -> 自动由其他 Copilot 视觉模型描述 -> 文本喂给 DeepSeek。零配置。

### 思考模式
通过 Copilot Chat 原生选择器按模型设置 `停用` / `标准` / `深度` 推理强度。

### 完整 Copilot 能力栈
Agent 模式、工具调用、Instructions、MCP、Skills 全部正常工作。

### 安全优先
API Key 保存在操作系统密钥链中, 不写入 `settings.json`, 不进入 Git 历史。

### 零运行时依赖
纯 VS Code API + Node.js, 无需 Python、Docker 或本地代理。

---

## 模型

| 模型 | 提供方 | 上下文 | Key 获取 |
|------|--------|--------|----------|
| **DeepSeek V4 Flash** | DeepSeek | 1M | [platform.deepseek.com](https://platform.deepseek.com) |
| **DeepSeek V4 Pro** | DeepSeek | 1M | [platform.deepseek.com](https://platform.deepseek.com) |
| **GLM-5.2** | 智谱 | 1M | [bigmodel.cn](https://bigmodel.cn) |

---

## 快速开始

1. `Cmd+Shift+P` -> `多模型 Copilot: 设置 API Key`
2. 选择提供方 -> 粘贴 Key -> 对每个提供方重复
3. 打开 Copilot Chat -> 从下拉菜单选择任意模型

### 前置条件
- VS Code >= 1.116
- GitHub Copilot 订阅 (免费版即可)
- 从 [DeepSeek](https://platform.deepseek.com) 和/或 [智谱](https://bigmodel.cn) 获取 API Key

### 安装
从 [GitHub Releases](https://github.com/ludysama/multi-model-copilot/releases) 下载 `.vsix`, 执行:
```
code --install-extension multi-model-copilot-0.6.2.vsix
```

---

## 设置项 (继承自上游)

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| `multi-model-copilot.baseUrl` | `https://api.deepseek.com` | 兜底 API 端点 |
| `multi-model-copilot.maxTokens` | `0` | 最大输出 Token (0=不限) |
| `multi-model-copilot.modelIdOverrides` | 官方 ID | 覆盖 API 模型名 |
| `multi-model-copilot.debugMode` | `minimal` | `minimal` / `metadata` / `verbose` |
| `multi-model-copilot.visionModel` | *(自动)* | 视觉代理模型 |
| `multi-model-copilot.visionPrompt` | *(内置)* | 图片描述提示词 |
| `multi-model-copilot.experimental.stabilizeToolList` | `false` | 提升缓存命中率 |

---

## 开源协议

MIT -- Copyright (c) 2026 Vizards, Copyright (c) 2026 ludysama

<!-- marketplace-readme:remove-end -->
