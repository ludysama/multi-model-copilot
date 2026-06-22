<!-- marketplace-readme:remove-start -->

<h1 align="center">Multi-Model Copilot</h1>
<h3 align="center">DeepSeek V4 + GLM-5.2 in VS Code Copilot Chat</h3>

<p align="center">
  <img src="https://img.shields.io/github/v/release/ludysama/multi-model-copilot?style=for-the-badge&label=Version" alt="Version" />
</p>

<p align="center">
  English |
  <a href="https://github.com/ludysama/multi-model-copilot/blob/main/README.zh-cn.md">绠€浣撲腑鏂?/a>
</p>

---

> ## 馃嵈 Forked from [Vizards/deepseek-v4-for-copilot](https://github.com/Vizards/deepseek-v4-for-copilot) v0.6.2
> 
> **Original author: [Vizards](https://github.com/Vizards)** 鈥?all core DeepSeek V4 Copilot Chat integration is their work.
> **This fork** adds multi-model support (GLM-5.2, per-model API keys) and plans to add more providers.
> 
> 馃摝 [This fork](https://github.com/ludysama/multi-model-copilot) 路 馃敆 [Upstream](https://github.com/Vizards/deepseek-v4-for-copilot) 路 馃搫 MIT License
>
> _Screenshots below are from upstream 鈥?this fork adds GLM-5.2 alongside the same DeepSeek capabilities._

---

## 馃啎 What This Fork Adds

| Feature | Details |
|---------|---------|
| **GLM-5.2 (Zhipu)** | Zhipu flagship model in the Copilot picker 鈥?1M context, OpenAI-compatible endpoint |
| **Per-model API keys** | DeepSeek and Zhipu keys stored independently. Set once per provider via QuickPick |
| **Per-model base URL** | Each model carries its own `baseUrl`; fallback to global setting when absent |
| **Rebranded** | All commands / settings / IDs migrated from `deepseek-copilot` to `multi-model-copilot` |

### Multi-Provider Key Setup

Run `Multi-Model Copilot: Set API Key` from the Command Palette 鈥?a QuickPick lists every supported provider. Pick one, paste the key. Repeat for each provider. Keys never leave the OS keychain.

---

## 馃К Inherited from Upstream

Everything below works for DeepSeek V4 (Flash / Pro) and is preserved from upstream v0.6.2:

### DeepSeek V4 in the Model Picker
DeepSeek V4 Flash & Pro appear alongside GPT-4o, Claude, etc. 1M context, switch mid-chat.

### Vision Proxy
DeepSeek V4 is text-only. Drop an image into chat 鈫?auto-described by another Copilot vision model 鈫?fed to DeepSeek. Zero config.

### Thinking Mode
`none` / `high` / `max` reasoning effort per model, via Copilot Chat native picker.

### Full Copilot Stack
Agent mode, tool calling, instructions, MCP, skills 鈥?all work because this plugs into Copilot native provider API.

### Secure by Default
API keys live in VS Code `SecretStorage` (OS keychain), never in `settings.json` or Git.

### Zero Runtime Dependencies
Pure VS Code API + Node.js. No Python, Docker, or local proxy.

---

## Models

| Model | Provider | Context | Key Source |
|-------|----------|---------|------------|
| **DeepSeek V4 Flash** | DeepSeek | 1M | [platform.deepseek.com](https://platform.deepseek.com) |
| **DeepSeek V4 Pro** | DeepSeek | 1M | [platform.deepseek.com](https://platform.deepseek.com) |
| **GLM-5.2** | Zhipu | 1M | [bigmodel.cn](https://bigmodel.cn) |

---

## Quick Start

1. `Cmd+Shift+P` 鈫?`Multi-Model Copilot: Set API Key`
2. Pick provider 鈫?paste key 鈫?repeat for each provider
3. Open Copilot Chat 鈫?pick any model from the dropdown

### Prerequisites
- VS Code >= 1.116
- GitHub Copilot subscription (Free tier works)
- API key(s) from [DeepSeek](https://platform.deepseek.com) and/or [Zhipu](https://bigmodel.cn)

### Install
Download the `.vsix` from [GitHub Releases](https://github.com/ludysama/multi-model-copilot/releases) and run:
```
code --install-extension multi-model-copilot-0.6.2.vsix
```

---

## Settings (inherited from upstream)

| Setting | Default | Description |
|---------|---------|-------------|
| `multi-model-copilot.baseUrl` | `https://api.deepseek.com` | Fallback API endpoint |
| `multi-model-copilot.maxTokens` | `0` | Max output tokens (0 = unlimited) |
| `multi-model-copilot.modelIdOverrides` | official IDs | Override API model names |
| `multi-model-copilot.debugMode` | `minimal` | `minimal` / `metadata` / `verbose` |
| `multi-model-copilot.visionModel` | *(auto)* | Vision proxy model |
| `multi-model-copilot.visionPrompt` | *(built-in)* | Prompt for describing images |
| `multi-model-copilot.experimental.stabilizeToolList` | `false` | Improve cache-hit rate |

---

## License

MIT 鈥?Copyright (c) 2026 Vizards, Copyright (c) 2026 ludysama

<!-- marketplace-readme:remove-end -->