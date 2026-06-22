# Fork 说明 · DeepSeek V4 for Copilot Chat (Multi-Model)

本仓库 fork 自 [Vizards/deepseek-v4-for-copilot](https://github.com/Vizards/deepseek-v4-for-copilot) v0.6.2，在原版基础上增加 *多模型并存* 支持 — DeepSeek V4 + 智谱 GLM-5.2 在 Copilot Chat 模型选择器里同时可选。

## 相比上游改了什么

| 改动点 | 文件 | 说明 |
|---|---|---|
| `ModelDefinition` 加 `baseUrl?` / `apiKeySecret?` 字段 | `src/types.ts` | 每个 model 自带 endpoint + secret key |
| MODELS 数组加 GLM-5.2 完整定义 | `src/consts.ts` | 智谱 OpenAI 兼容端点 · 1M 上下文 · $1.4/$4.4 per M |
| `getBaseUrl(modelId?)` per-model 路由 | `src/config.ts` | 没声明 baseUrl 的 model 走全局 `settings.baseUrl` |
| `getApiKey(modelId?)` 3 级兜底 | `src/auth.ts` | ① per-model secret → ② 全局 secret → ③ settings.apiKey |
| `request.ts` 传 `modelInfo.id` | `src/provider/request.ts` | 让 request 拿到对应 model 的路由信息 |
| `provideLanguageModelChatInformation` 改异步 | `src/provider/index.ts` | `Promise.all` 遍历 MODELS 携带各自 baseUrl |
| `configureApiKey()` 改 QuickPick 选 model | `src/provider/index.ts` | 走 `Set API Key` 先选 model 再输 key |
| `setApiKeyForModel(modelId, apiKey)` | `src/auth.ts` | per-model 存到对应 SecretStorage key |
| i18n 加 5 个新 key | `src/i18n.ts` | QuickPick label/prompt/saved 文案（中英） |
| `toolCalling: 256` for GLM-5.2 | `src/consts.ts` | 智谱 OpenAI 兼容没硬限 64，避开 deepseek 限制 |
| package.json 改名 | `package.json` | `name: deepseek-v4-for-copilot-multimodel` · displayName `DeepSeek V4 + GLM-5.2 for Copilot Chat` |
| 命令前缀去 DeepSeek 窄化 | `package.nls*.json` | `Multi-Model Copilot: ...` / `多模型 Copilot: ...` |
| Walkthrough 反映多模型 | `package.nls*.json` + `resources/walkthrough/*` | 标题、描述、set-api-key、show-models 全部更新 |

## 完全保留原版功能

- DeepSeek V4 Pro / Flash · vision proxy · thinking effort · agent mode · tool calling · pricing currency
- 零运行时依赖（不改 `dependencies`，只加 `apiKeySecret` 字段）
- 原版 `release.yml` 流程（release-please + vsce + open-vsx）不变

## 用户侧使用流程

1. 命令面板跑 `Multi-Model Copilot: Set API Key`（中文：`多模型 Copilot: 设置 API Key`）
2. 弹出 QuickPick 选模型：`DeepSeek V4 Flash` / `DeepSeek V4 Pro` / `GLM-5.2 (智谱)`
3. 选完后 password input，填对应 key
4. Copilot Chat 模型下拉里直接切换

## API Key 存储

- DeepSeek: `deepseek-copilot.apiKey`（SecretStorage）
- Zhipu: `deepseek-copilot.apiKey.zhipu`（SecretStorage）
- 两者 *互不干扰*，可共存

## 模型路由

| model id | baseUrl | key 来源 |
|---|---|---|
| `deepseek-v4-flash` | `https://api.deepseek.com` | per-model secret 或全局 |
| `deepseek-v4-pro` | `https://api.deepseek.com` | per-model secret 或全局 |
| `glm-5.2` | `https://open.bigmodel.cn/api/paas/v4` | per-model secret (`apiKey.zhipu`) |

可在 settings.json 用 `deepseek-copilot.modelIdOverrides` 覆盖实际 API model name（vLLM 自部署时把 `glm-5.2` 映射到本地模型名）。

## 已知限制

- GLM-5.2 `imageInput` 设为 `false`（智谱视觉模型是另一个 ID GLM-5V-Turbo，未集成）
- `requiresThinkingParam: false`（智谱不通过 request body 控制 thinking；如需启用 thinking 改 model picker 行为再说）
- `toolCalling: 256` 是保守的安全上限（智谱 OpenAI 兼容没硬限 64，但具体上限待实测验证）

## 上游同步策略

- 不主动 rebase 上游（避免冲突）
- release-please 管本 fork 的版本号
- 每次上游新版本时手工 cherry-pick bug fix 到本 fork
