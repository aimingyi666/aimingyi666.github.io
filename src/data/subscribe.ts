// 订阅配置：唯一需要改的地方
//
// 这个站不带后端（这是刻意的：无追踪、无数据库、无维护成本）。
// 所以订阅要么走第三方表单服务，要么暂时留空。
//
// 支持三种模式，改 ACTIVE_MODE 即可切换：
//
//   'formspree' —— 需在 https://formspree.io 注册，拿到 endpoint
//                  免费额度 50 条/月，不需要自己维护服务器
//   'buttondown' —— 需在 https://buttondown.email 注册（专门做 newsletter 的）
//                  免费额度 100 订阅者
//   'none'      —— 还没接。提交时给出诚实提示，不让用户撞 404
//
// 无论选哪个，只改这一个文件，页面和 JS 都不用动。

export type SubscribeMode = 'formspree' | 'buttondown' | 'none';

export const SUBSCRIBE = {
  /** 当前模式 */
  mode: 'none' as SubscribeMode,

  /** formspree 填 https://formspree.io/f/xxxxxxx
   *  buttondown 填 https://buttondown.email/api/emails/embed-subscribe/你的用户名 */
  endpoint: '',

  /** 订阅成功/失败后的落地页（第三方服务会跳回来） */
  thankyou: '/subscribed/',
} as const;

/** 是否真的能提交 */
export const canSubscribe = SUBSCRIBE.mode !== 'none' && SUBSCRIBE.endpoint !== '';
