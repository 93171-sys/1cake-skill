# 1Cake Order — AI 自然语言下单技能

让 AI 助手（Claude Code / OpenClaw / Cursor）用自然语言帮你下单 1Cake 定制蛋糕。

> **手机验证码登录**，无需提前注册或管理 API Key。

## 是什么

一个 MCP Server（Model Context Protocol 服务器），让 AI 助手获得下单 1Cake 蛋糕的能力。

```
你说："帮我订一个8寸草莓蛋糕，周六送到"
AI："请输入手机号获取验证码"
你："13800138000"
          ↓
AI 发送验证码 → 你输入验证码 → 自动创建/关联账户
          ↓
AI 助手 → MCP Server → 1Cake API → 订单创建 ✅ → 返回支付链接
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

1. 有 1Cake 账户（或首次使用时通过手机验证码自动注册）
2. 安装 Node.js ≥ 18

### 方式一：npm 安装（推荐）

```bash
# 1. 安装
npm install -g 1cake-mcp-server

# 2. 配置到 Claude Code
claude mcp add 1cake \
  -- 1cake-mcp-server
```

配置完成后，直接在 AI 助手中说"帮我订蛋糕"，AI 会引导你完成手机验证码登录。

### 方式二：提前设置 API Key（可选，跳过登录步骤）

```bash
claude mcp add 1cake \
  --env ONECAKE_API_KEY=1ck_yourkey \
  -- 1cake-mcp-server
```

### 可选环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ONECAKE_API_KEY` | 预设 API Key（跳过登录） | 无（走手机验证码登录） |
| `ONECAKE_API_URL` | API 地址 | `http://101.96.197.15:3001` |
| `ONECAKE_NAME` | 默认收件人 | `AI 助手` |
| `ONECAKE_PHONE` | 默认手机号 | 账户绑定手机 |
| `ONECAKE_ADDRESS` | 默认地址 | 需填写 |

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
