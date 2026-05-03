interface ServerConfig {
  apiKey: string;
  apiUrl: string;
  defaults: { name: string; phone: string; address: string };
}

interface ToolDef {
  name: string;
  description: string;
  inputSchema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

const LAYER_FLAVORS = ['vanilla', 'chocolate', 'matcha', 'redvelvet'] as const;
const FILLING_TYPES = ['strawberry', 'mango', 'caramel', 'oreo'] as const;
const CREAM_TYPES = ['french', 'newzealand'] as const;
const SIZE_OPTIONS = ['4', '6', '8', '10', '12'] as const;
const DECORATION_TYPES = ['none', 'fruit', 'chocolate', 'macaron', 'flowers', 'goldFoil', 'sugarFlowers'] as const;

async function apiCall(config: ServerConfig, method: string, path: string, body?: unknown) {
  const res = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as any)?.message || `HTTP ${res.status}`);
  return data;
}

export function registerTools(config: ServerConfig): ToolDef[] {
  const { defaults } = config;

  return [
    // ── get_cake_options ──────────────────────────────────────────────────
    {
      name: 'get_cake_options',
      description:
        '获取 1Cake 所有可定制的蛋糕选项和价格。包括蛋糕胚(1-3层)、夹心(1-2种)、奶油、尺寸(4-12寸)、装饰类型。返回中文名、英文名、价格、推荐标记。',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        const pricing: any = await apiCall(config, 'GET', '/api/pricing');
        return {
          layers: [
            { key: 'vanilla', name: '香草蛋糕胚', nameEn: 'Vanilla', price: pricing.layers?.vanilla || 38 },
            { key: 'chocolate', name: '巧克力蛋糕胚', nameEn: 'Chocolate', price: pricing.layers?.chocolate || 38 },
            { key: 'matcha', name: '抹茶蛋糕胚', nameEn: 'Matcha', price: pricing.layers?.matcha || 38 },
            { key: 'redvelvet', name: '红丝绒蛋糕胚', nameEn: 'Red Velvet', price: pricing.layers?.redvelvet || 38 },
          ],
          fillings: [
            { key: 'strawberry', name: '草莓夹心', nameEn: 'Strawberry', price: pricing.fillings?.strawberry || 28 },
            { key: 'mango', name: '芒果夹心', nameEn: 'Mango', price: pricing.fillings?.mango || 28 },
            { key: 'caramel', name: '焦糖夹心', nameEn: 'Caramel', price: pricing.fillings?.caramel || 28 },
            { key: 'oreo', name: '奥利奥夹心', nameEn: 'Oreo', price: pricing.fillings?.oreo || 28 },
          ],
          cream: [
            { key: 'french', name: '法式奶油', nameEn: 'French Cream', price: pricing.cream?.french || 48, recommended: true },
            { key: 'newzealand', name: '新西兰奶油', nameEn: 'New Zealand Cream', price: pricing.cream?.newzealand || 58 },
          ],
          sizes: [
            { key: '4', name: '4寸', serves: '1-2人', price: pricing.sizes?.['4'] || 128 },
            { key: '6', name: '6寸', serves: '3-4人', price: pricing.sizes?.['6'] || 198 },
            { key: '8', name: '8寸', serves: '5-8人', price: pricing.sizes?.['8'] || 268 },
            { key: '10', name: '10寸', serves: '9-12人', price: pricing.sizes?.['10'] || 358 },
            { key: '12', name: '12寸', serves: '13-16人', price: pricing.sizes?.['12'] || 458 },
          ],
          decorations: [
            { key: 'none', name: '无装饰', nameEn: 'None', price: 0 },
            { key: 'fruit', name: '鲜果装饰', nameEn: 'Fresh Fruit', price: pricing.decorations?.fruit || 38 },
            { key: 'chocolate', name: '巧克力牌', nameEn: 'Chocolate Plaque', price: pricing.decorations?.chocolate || 48 },
            { key: 'macaron', name: '马卡龙', nameEn: 'Macaron', price: pricing.decorations?.macaron || 58 },
            { key: 'flowers', name: '干花装饰', nameEn: 'Dried Flowers', price: pricing.decorations?.flowers || 48 },
            { key: 'goldFoil', name: '金箔片', nameEn: 'Gold Foil', price: pricing.decorations?.goldFoil || 68 },
            { key: 'sugarFlowers', name: '糖霜花', nameEn: 'Sugar Flowers', price: pricing.decorations?.sugarFlowers || 58 },
          ],
          rules: {
            layers: '选1-3层蛋糕胚，可重复（如2层香草）',
            fillings: '选1-2种夹心，可重复',
            cream: '选1种奶油，french为推荐',
            size: '选1个尺寸',
            decoration: '选1种装饰，chocolate可选文字',
            chocolateText: '仅decoration=chocolate时可填，最多20字',
            deliveryDate: '配送日期YYYY-MM-DD，须至少提前1天',
            deliverySlot: '可选配送时段: 09:00-12:00 / 12:00-17:00 / 17:00-21:00',
            discount: '提前1-6天95折, 7-13天9折, 14-20天85折, 21天以上8折',
          },
        };
      },
    },

    // ── calculate_cake_price ──────────────────────────────────────────────
    {
      name: 'calculate_cake_price',
      description: '计算蛋糕价格。传入配置和配送日期，返回每项价格明细、小计、折扣、总价。下单前务必调此工具向用户确认价格。',
      inputSchema: {
        type: 'object',
        properties: {
          layers: { type: 'array', items: { type: 'string', enum: LAYER_FLAVORS }, description: '蛋糕胚(1-3个)' },
          fillings: { type: 'array', items: { type: 'string', enum: FILLING_TYPES }, description: '夹心(1-2个)' },
          cream: { type: 'string', enum: CREAM_TYPES, description: '奶油类型' },
          size: { type: 'string', enum: SIZE_OPTIONS, description: '尺寸' },
          decoration: { type: 'string', enum: DECORATION_TYPES, description: '装饰类型' },
          deliveryDate: { type: 'string', description: '配送日期 YYYY-MM-DD' },
        },
        required: ['layers', 'fillings', 'cream', 'size', 'decoration', 'deliveryDate'],
      },
      handler: async (args) => {
        const pricing: any = await apiCall(config, 'GET', '/api/pricing');
        const layers = (args.layers as string[]).map((l: string) => pricing.layers?.[l] || 38);
        const fillings = (args.fillings as string[]).map((f: string) => pricing.fillings?.[f] || 28);
        const creamP = pricing.cream?.[args.cream as string] || 48;
        const sizeP = pricing.sizes?.[args.size as string] || 128;
        const decoP = args.decoration === 'none' ? 0 : (pricing.decorations?.[args.decoration as string] || 0);
        const subtotal = [...layers, ...fillings, creamP, sizeP, decoP].reduce((a, b) => a + b, 0);

        const d1 = new Date(); d1.setHours(0, 0, 0, 0);
        const d2 = new Date(args.deliveryDate as string); d2.setHours(0, 0, 0, 0);
        const days = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000));
        const rate = days >= 21 ? 0.80 : days >= 14 ? 0.85 : days >= 7 ? 0.90 : days >= 1 ? 0.95 : 1.0;

        return {
          breakdown: {
            layers: { items: args.layers, subtotal: layers.reduce((a, b) => a + b, 0) },
            fillings: { items: args.fillings, subtotal: fillings.reduce((a, b) => a + b, 0) },
            cream: { item: args.cream, price: creamP },
            size: { item: args.size, price: sizeP },
            decoration: { item: args.decoration, price: decoP },
          },
          subtotal,
          discountRate: rate,
          discount: subtotal - Math.round(subtotal * rate),
          total: Math.round(subtotal * rate),
        };
      },
    },

    // ── place_order ───────────────────────────────────────────────────────
    {
      name: 'place_order',
      description:
        '下单定制蛋糕。收件人信息可选——如不提供，默认使用 AI 助手绑定的账户信息。' +
        '下单人统一为 AI 助手（通过 API Key 识别），不再每单收集用户数据。' +
        '务必先用 calculate_cake_price 确认价格和配置，再调用此工具。',
      inputSchema: {
        type: 'object',
        properties: {
          layers: { type: 'array', items: { type: 'string', enum: LAYER_FLAVORS }, description: '蛋糕胚(1-3个)' },
          fillings: { type: 'array', items: { type: 'string', enum: FILLING_TYPES }, description: '夹心(1-2个)' },
          cream: { type: 'string', enum: CREAM_TYPES, description: '奶油类型' },
          size: { type: 'string', enum: SIZE_OPTIONS, description: '尺寸' },
          decoration: { type: 'string', enum: DECORATION_TYPES, description: '装饰类型' },
          chocolateText: { type: 'string', description: '巧克力牌文字(最多20字)' },
          deliveryDate: { type: 'string', description: '配送日期 YYYY-MM-DD' },
          deliverySlot: { type: 'string', enum: ['09:00-12:00', '12:00-17:00', '17:00-21:00'], description: '配送时段' },
          recipientName: { type: 'string', description: `收件人(默认: ${defaults.name})` },
          recipientPhone: { type: 'string', description: `手机号(默认: ${defaults.phone || '账户绑定手机'})` },
          recipientAddress: { type: 'string', description: `地址(默认: ${defaults.address || '需填写'})` },
          notes: { type: 'string', description: '备注' },
        },
        required: ['layers', 'fillings', 'cream', 'size', 'decoration', 'deliveryDate'],
      },
      handler: async (args) => {
        const body = {
          layers: args.layers,
          fillings: args.fillings,
          cream: args.cream,
          size: args.size,
          decoration: args.decoration,
          chocolateText: args.chocolateText,
          deliveryDate: args.deliveryDate,
          deliverySlot: args.deliverySlot,
          recipientName: (args.recipientName as string) || defaults.name,
          recipientPhone: (args.recipientPhone as string) || defaults.phone,
          recipientAddress: (args.recipientAddress as string) || defaults.address,
          notes: args.notes,
        };
        const order: any = await apiCall(config, 'POST', '/api/orders/config', body);

        // Auto-create payment (WeChat Pay by default)
        let payment: any = null;
        try {
          payment = await apiCall(config, 'POST', '/api/payments', {
            orderId: order.id,
            method: 'wechat_pay',
          });
        } catch {
          // Payment creation is best-effort; order still succeeded
        }

        const payUrl = `https://1cake.com/pay/${order.id}`;
        return {
          success: true,
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          discount: order.discount,
          items: order.items?.map((i: any) => `${i.name} ¥${i.unitPrice}`),
          deliveryDate: order.deliveryDate,
          deliverySlot: order.deliverySlot,
          payment: payment ? {
            id: payment.id,
            method: payment.method,
            status: payment.status,
            qrCode: payment.qrCode,
            payUrl,
          } : { payUrl },
          message: `✅ 订单已创建！订单号 ${order.orderNumber}，总价 ¥${order.total}，请在 15 分钟内完成支付：${payUrl}`,
        };
      },
    },

    // ── check_order_status ────────────────────────────────────────────────
    {
      name: 'check_order_status',
      description: '查询订单状态。传入订单ID，返回当前状态、详情。',
      inputSchema: {
        type: 'object',
        properties: { orderId: { type: 'string', description: '订单ID' } },
        required: ['orderId'],
      },
      handler: async (args) => {
        const order: any = await apiCall(config, 'GET', `/api/orders/${args.orderId}`);
        const labels: Record<string, string> = {
          pending_payment: '待支付', paid: '已支付', preparing: '制作中',
          delivering: '配送中', delivered: '已送达', cancelled: '已取消', refunded: '已退款',
        };
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          statusLabel: labels[order.status] || order.status,
          total: order.total,
          deliveryDate: order.deliveryDate,
          deliverySlot: order.deliverySlot,
          recipientName: order.recipientName,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };
      },
    },

    // ── list_my_orders ──────────────────────────────────────────────────
    {
      name: 'list_my_orders',
      description: '获取我的订单列表，可按状态筛选。',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending_payment', 'paid', 'preparing', 'delivering', 'delivered', 'cancelled', 'refunded'] },
          limit: { type: 'number', description: '返回数量，默认10' },
        },
      },
      handler: async (args) => {
        const limit = (args.limit as number) || 10;
        const status = args.status ? `&status=${args.status}` : '';
        const result: any = await apiCall(config, 'GET', `/api/orders/my?page=1&limit=${limit}${status}`);
        return {
          total: result.total,
          orders: result.items?.map((o: any) => ({
            id: o.id, orderNumber: o.orderNumber, status: o.status, total: o.total, deliveryDate: o.deliveryDate, createdAt: o.createdAt,
          })),
        };
      },
    },

    // ── cancel_order ─────────────────────────────────────────────────────
    {
      name: 'cancel_order',
      description: '取消待支付订单。只能取消 pending_payment 状态的订单。',
      inputSchema: {
        type: 'object',
        properties: { orderId: { type: 'string', description: '订单ID' } },
        required: ['orderId'],
      },
      handler: async (args) => {
        const order: any = await apiCall(config, 'PATCH', `/api/orders/${args.orderId}`, { status: 'cancelled' });
        return { success: true, orderNumber: order.orderNumber, message: `订单 ${order.orderNumber} 已取消` };
      },
    },

    // ── get_delivery_slots ────────────────────────────────────────────────
    {
      name: 'get_delivery_slots',
      description: '获取指定日期的可用配送时段。',
      inputSchema: {
        type: 'object',
        properties: { date: { type: 'string', description: '日期 YYYY-MM-DD' } },
        required: ['date'],
      },
      handler: async (args) => {
        const slots: any = await apiCall(config, 'GET', `/api/orders/delivery-slots?date=${args.date}`);
        return {
          date: args.date,
          slots: Array.isArray(slots) ? slots.map((s: any) => ({
            slot: s.slot, label: s.label, available: s.available, remaining: s.maxOrders - s.currentOrders,
          })) : slots,
        };
      },
    },
  ];
}
