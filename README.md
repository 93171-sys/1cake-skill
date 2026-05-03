# 1Cake Order — AI 自然语言下单技能

让 AI 助手（Claude Code / OpenClaw / Cursor）用自然语言帮你下单 1Cake 定制蛋糕。

> **下单人统一为 AI 助手**（通过 API Key 识别），不再每单收集用户数据。

## 是什么

一个 MCP Server（Model Context Protocol 服务器），让 AI 助手获得下单 1Cake 蛋糕的能力。

```
你说："帮我订一个8寸草莓蛋糕，周六送到"
          ↓
AI 助手 → MCP Server → 1Cake API → 订单创建 ✅
```

## GitHub 和 npm 的关系

| | GitHub | npm |
|---|---|---|
| **是什么** | 源码仓库（代码放哪） | 包注册表（怎么安装） |
| **用户需要吗** | 来看文档、提 issue | `npm install -g` 一键安装 |
| **类比** | 菜谱 | 外卖 APP |

- **GitHub** 存放源码和文档，开源透明
- **npm** 是分发渠道，用户一行命令安装，不需要 clone 仓库

## 安装

### 前提

1. 在 https://1cake.com/account/api-keys 创建 API Key（格式：`1ck_xxx...`）
2. 安装 Node.js ≥ 18

### 方式一：npm 安装（推荐）

```bash
# 1. 安装
npm install -g 1cake-mcp-server

# 2. 配置到 Claude Code
claude mcp add 1cake \
  --env ONECAKE_API_KEY=1ck_yourkey \
  -- 1cake-mcp-server
```

### 方式二：GitHub 安装

```bash
# 1. Clone
git clone https://github.com/1cake/1cake-skill.git
cd 1cake-skill/packages/mcp-server

# 2. 安装依赖 + 构建
npm install && npm run build

# 3. 配置到 Claude Code
claude mcp add 1cake \
  --env ONECAKE_API_KEY=1ck_yourkey \
  -- node /path/to/1cake-skill/packages/mcp-server/dist/index.js
```

### 配置 OpenClaw

在 OpenClaw 的 MCP 设置中添加：

```json
{
  "mcpServers": {
    "1cake": {
      "command": "1cake-mcp-server",
      "env": {
        "ONECAKE_API_KEY": "1ck_yourkey",
        "ONECAKE_NAME": "张三",
        "ONECAKE_PHONE": "13800138000",
        "ONECAKE_ADDRESS": "北京市朝阳区xxx"
      }
    }
  }
}
```

### 可选环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ONECAKE_API_KEY` | **必填** API Key | - |
| `ONECAKE_API_URL` | API 地址 | `http://101.96.197.15:3001` |
| `ONECAKE_NAME` | 默认收件人 | `AI 助手` |
| `ONECAKE_PHONE` | 默认手机号 | 账户绑定手机 |
| `ONECAKE_ADDRESS` | 默认地址 | 需填写 |

### 配置 Cursor

在 `~/.cursor/mcp.json` 中添加上述配置。

## 使用示例

```
用户: 帮我订一个生日蛋糕，8寸，香草+巧克力胚，草莓夹心，
      法式奶油，鲜果装饰，下周五上午送到

AI:   好的，让我确认配置并计算价格...
      蛋糕胚: 香草+巧克力 ¥76
      夹心: 草莓 ¥28
      奶油: 法式 ¥48
      尺寸: 8寸 ¥268
      装饰: 鲜果 ¥38
      小计: ¥458
      提前折扣: 85折
      总价: ¥390

      确认下单吗？

用户: 确认

AI:   ✅ 订单已创建！订单号 ORD1712345678001，总价 ¥390
```

更多示例见 [examples/prompts.md](./examples/prompts.md)

## License

MIT
