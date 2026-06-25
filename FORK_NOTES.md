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
- Zhipu 标准: `deepseek-copilot.apiKey.zhipu`（SecretStorage）
- Zhipu Coding Plan: `deepseek-copilot.apiKey.zhipu-coding`（SecretStorage，需单独申请）
- 三者 *互不干扰*，可共存

## 模型路由

| model id | baseUrl | key 来源 |
|---|---|---|
| `deepseek-v4-flash` | `https://api.deepseek.com` | per-model secret 或全局 |
| `deepseek-v4-pro` | `https://api.deepseek.com` | per-model secret 或全局 |
| `glm-5.2` | `https://open.bigmodel.cn/api/paas/v4` | per-model secret (`apiKey.zhipu`) |
| `glm-5.2-coding` | `https://open.bigmodel.cn/api/coding/paas/v4` | per-model secret (`apiKey.zhipu-coding`，Coding Plan 专用 key) |

可在 settings.json 用 `deepseek-copilot.modelIdOverrides` 覆盖实际 API model name（vLLM 自部署时把 `glm-5.2` 映射到本地模型名）。

## 已知限制

- GLM-5.2 `imageInput` 设为 `false`（智谱视觉模型是另一个 ID GLM-5V-Turbo，未集成）
- `requiresThinkingParam: false`（智谱不通过 request body 控制 thinking；如需启用 thinking 改 model picker 行为再说）
- `toolCalling: 256` 是保守的安全上限（智谱 OpenAI 兼容没硬限 64，但具体上限待实测验证）

## 上游同步策略

- 不主动 rebase 上游（避免冲突）
- release-please 管本 fork 的版本号
- 每次上游新版本时手工 cherry-pick bug fix 到本 fork

---

## v0.7.0 新增：自定义供应商 (Custom Provider)

通过 `Multi-Model Copilot: Add Custom Provider` 命令，可在 VS Code 中直接添加任意 OpenAI 兼容 API 供应商，无需编辑源码。

### 使用方式

1. 命令面板跑 `Multi-Model Copilot: Add Custom Provider`
2. 依次输入：显示名称 → API URL → 模型 ID → API Key
3. 自动保存到 `multi-model-copilot.customModels` settings，模型选择器即时刷新

### 技术实现

| 改动点 | 文件 | 说明 |
|---|---|---|
| `CustomModelDefinition` 类型 | `src/types.ts` | 用户自定义模型的 settings schema |
| `getAllModels()` 合并 builtin + custom | `src/consts.ts` | 替换硬编码 MODELS 为动态合并 |
| `saveCustomModel()` / `removeCustomModel()` | `src/consts.ts` | 读写 `customModels` settings |
| `getApiModelId()` 支持 custom 前缀 | `src/config.ts` | custom-* 模型读取 `apiModelId` 字段 |
| `addCustomProvider()` 4 步 InputBox | `src/provider/index.ts` | 交互式添加流程 |
| 所有 MODELS 消费者改为 `getAllModels()` | `src/auth.ts`, `src/config.ts`, `src/provider/request.ts`, `src/provider/index.ts` | 统一动态模型列表 |
| `REPLAY_MARKER_PREFIXES` → `getReplayMarkerPrefixes()` | `src/provider/replay/consts.ts`, `src/provider/replay/markers.ts` | 运行时包含 custom model IDs |
| `customModels` settings schema | `package.json` | 用户可在 settings.json 直接编辑 |
| i18n 中英文新增 12 个 key | `src/i18n.ts` | 添加流程所有提示文案 |
| 命令注册 | `package.json`, `package.nls*.json`, `src/runtime/provider.ts` | `addCustomProvider` 命令 |

### 自定义模型默认能力

| 属性 | 默认值 | 说明 |
|---|---|---|
| `maxInputTokens` | 128000 | 可覆盖 |
| `maxOutputTokens` | 32768 | 可覆盖 |
| `toolCalling` | 256 | 可覆盖 |
| `imageInput` | false | 可覆盖 |
| `thinking` | false | 可覆盖 |
| `requiresThinkingParam` | false | 不发送 thinking 参数 |
