import { reactive } from 'vue'

/**
 * 通知公告的模拟数据。
 * 顶部通知弹窗和通知公告页共用这一份，未读状态才能保持一致。
 * 接口就绪后替换为 GET /api/notice/list。
 */
export const notices = reactive([
  {
    id: 1,
    title: '关于开展 2026 年秋季学期期中教学检查的通知',
    type: '教学',
    publishAt: '2026-10-14 09:00',
    publisher: '教务处',
    unread: true,
    content:
      '各教学单位：\n\n为掌握本学期教学运行情况，学校定于第十周至第十一周开展期中教学检查。请各学院按要求组织自查，并于 10 月 24 日前将自查报告报送教务处。\n\n检查内容包括课堂教学秩序、教学资料完备情况、实验实践环节开展情况等。',
    attachments: ['期中教学检查自查表.docx']
  },
  {
    id: 2,
    title: '图书馆国庆后开放时间调整',
    type: '服务',
    publishAt: '2026-10-12 16:30',
    publisher: '图书馆',
    unread: true,
    content:
      '自 10 月 13 日起，图书馆开放时间恢复为：\n\n周一至周五 07:30 - 22:30\n周六、周日 08:30 - 21:30\n\n三楼自习区实行 24 小时开放，凭校园卡刷卡进入。',
    attachments: []
  },
  {
    id: 3,
    title: '一卡通系统维护公告',
    type: '服务',
    publishAt: '2026-10-10 11:00',
    publisher: '卡务中心',
    unread: true,
    content:
      '因系统升级，一卡通充值服务将于 10 月 16 日 22:00 至 23:00 暂停，期间消费功能不受影响。',
    attachments: []
  },
  {
    id: 4,
    title: '关于 2026 年秋季学期考试安排的说明',
    type: '教学',
    publishAt: '2026-10-08 10:00',
    publisher: '教务处',
    unread: false,
    content: '期中考试安排已在教务系统公布，请同学们登录教务系统查看具体考场和座位号。',
    attachments: []
  }
])

export function unreadCount() {
  return notices.filter((item) => item.unread).length
}

export function markAllRead() {
  notices.forEach((item) => {
    item.unread = false
  })
}
