本插件让你在 Copilot Chat 中**同时使用多个模型提供方**：DeepSeek V4（Flash / Pro）与智谱 GLM-5.2。

每个提供方有独立的 API Key，分别保存在 VS Code 的 SecretStorage 中，互不干扰。

## 为每个提供方分别设置 Key

打开命令面板（`Cmd/Ctrl + Shift + P`），运行：

- `多模型 Copilot: 设置 API Key`

会弹出 QuickPick 列出所有支持的提供方。选择一个，粘贴对应的 Key 并确认。对每个想使用的提供方重复此操作。

## Key 的获取地址

- **DeepSeek** — <https://platform.deepseek.com/api_keys>
- **智谱 GLM** — <https://bigmodel.cn/usercenter/proj-mgmt/apikeys>

## 管理已保存的 Key

- `多模型 Copilot: 清除 API Key` — 移除已保存的 Key
- `多模型 Copilot: 获取 API Key` — 打开 DeepSeek Key 页面
