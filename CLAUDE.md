# 1Cake Order Skill

通过自然语言在 1Cake 下单定制蛋糕。用户通过手机验证码登录，无需提前管理 API Key。

## When to Use

用户说「订蛋糕」「下单」「1cake」「帮我订一个...」时触发。

## 核心原则

- **手机验证码登录**：用户首次下单时，提供手机号 → 收验证码 → 登录。系统自动创建/关联账户，无需提前注册
- **下单人 = AI 助手**：登录后通过自动生成的 API Key 识别身份，不需要每单收集姓名/电话/地址
- **价格确认**：place_order 前必须先调 calculate_cake_price 确认价格
- **配置确认**：下单前复述完整配置，用户确认后再提交

## Authentication Flow

1. 用户表达订蛋糕意愿 → 先检查是否已登录
2. 未登录 → 调 `send_login_code` 发送验证码到用户手机
3. 用户提供验证码 → 调 `login_with_code` 验证登录
4. 登录成功后自动获得 API Key → 可以开始下单

## MCP Tools

### send_login_code
发送6位短信验证码。参数: phone(11位手机号)

### login_with_code
验证码登录。参数: phone, code(6位) → 自动创建/关联账户，返回 API Key

### get_cake_options
获取所有可选配置和价格。展示给用户做选择。

### calculate_cake_price
计算价格。参数: layers(1-3), fillings(1-2), cream, size, decoration, deliveryDate

### place_order
下单。recipient 信息可选（默认用账户绑定信息）。
参数: layers, fillings, cream, size, decoration, chocolateText?, deliveryDate, deliverySlot?, recipientName?, recipientPhone?, recipientAddress?, notes?
下单后自动创建微信支付，返回 payUrl 供用户扫码支付。

### check_order_status / list_my_orders / cancel_order / get_delivery_slots
订单查询和管理。

## Ordering Flow

1. 用户表达订蛋糕意愿 → 未登录则走 Authentication Flow
2. 调 get_cake_options 了解可选配置
3. 帮用户确定配置（根据口味、人数、预算推荐）
4. 调 calculate_cake_price 展示价格明细 → 用户确认
5. 调 place_order 下单（recipient 信息默认用账户绑定信息，用户可覆盖）
6. 返回订单号 + 支付链接（https://1cake.com/pay/{orderId}），用户点击扫码支付

## 蛋糕选项速查

| 类别 | 选项 | 价格 |
|------|------|------|
| 蛋糕胚(1-3层) | vanilla/chocolate/matcha/redvelvet | ¥38/层 |
| 夹心(1-2种) | strawberry/mango/caramel/oreo | ¥28/种 |
| 奶油 | french(推荐)/newzealand | ¥48/¥58 |
| 尺寸 | 4/6/8/10/12寸 | ¥128/198/268/358/458 |
| 装饰 | none(0)/fruit(38)/chocolate(48)/macaron(58)/flowers(48)/goldFoil(68)/sugarFlowers(58) | 见括号 |

配送折扣: 提前1-6天95折, 7-13天9折, 14-20天85折, 21天以上8折
