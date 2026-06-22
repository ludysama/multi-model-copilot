This extension lets you use **multiple model providers** side-by-side in Copilot Chat: DeepSeek V4 (Flash / Pro) and Zhipu GLM-5.2.

Each provider has its own API key, stored independently in VS Code's SecretStorage — they do not interfere with each other.

## Set keys per provider

Open the Command Palette (`Cmd/Ctrl + Shift + P`) and run:

- `Multi-Model Copilot: Set API Key`

A QuickPick appears listing every supported provider. Pick one, paste the corresponding key, and confirm. Repeat for each provider you want to use.

## Where to get keys

- **DeepSeek** — <https://platform.deepseek.com/api_keys>
- **Zhipu GLM** — <https://bigmodel.cn/usercenter/proj-mgmt/apikeys>

## Manage keys

- `Multi-Model Copilot: Clear API Key` — remove a stored key
- `Multi-Model Copilot: Get API Key` — open the DeepSeek key page
