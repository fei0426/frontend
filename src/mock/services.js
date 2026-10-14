/**
 * 服务事项的模拟数据。
 *
 * 事项目录和后端将来的接口对应关系：
 *   GET  /api/service/items          事项目录
 *   GET  /api/service/items/{id}     单个事项的表单定义
 *
 * 表单字段用配置描述而不是写死组件，是为了加新事项时只加数据、不改代码。
 * field.type 支持：text / textarea / select / date / upload
 */
export const serviceCategories = [
  { key: 'all', label: '全部' },
  { key: 'life', label: '生活服务' },
  { key: 'academic', label: '教务事务' },
  { key: 'place', label: '场地预约' },
  { key: 'other', label: '其他' }
]

export const serviceItems = [
  {
    id: 'repair',
    name: '宿舍报修',
    category: 'life',
    department: '后勤保障处',
    sla: '48 小时内响应',
    materials: '故障照片（可选）',
    summary: '宿舍内水电、门窗、家具等设施损坏均可提交报修。',
    fields: [
      { key: 'location', label: '故障地点', type: 'text', required: true, placeholder: '如：3 号楼 201' },
      { key: 'faultType', label: '故障类型', type: 'select', required: true, options: ['水电', '门窗', '家具', '网络', '其他'] },
      { key: 'desc', label: '故障描述', type: 'textarea', required: true, placeholder: '请描述具体情况，便于维修人员准备工具' },
      { key: 'expectTime', label: '期望上门时间', type: 'date', required: false },
      { key: 'photos', label: '现场照片', type: 'upload', required: false, tip: '最多 3 张，支持 jpg / png，单张不超过 5MB' }
    ]
  },
  {
    id: 'classroom-repair',
    name: '教室设备报修',
    category: 'life',
    department: '现代教育技术中心',
    sla: '24 小时内响应',
    materials: '无需材料',
    summary: '教室投影、音响、电脑等教学设备故障报修。',
    fields: [
      { key: 'room', label: '教室', type: 'text', required: true, placeholder: '如：第二教学楼 301' },
      { key: 'device', label: '设备类型', type: 'select', required: true, options: ['投影仪', '音响', '教师机', '网络', '其他'] },
      { key: 'desc', label: '故障描述', type: 'textarea', required: true },
      { key: 'photos', label: '现场照片', type: 'upload', required: false, tip: '最多 3 张' }
    ]
  },
  {
    id: 'leave',
    name: '请假申请',
    category: 'academic',
    department: '学生工作处',
    sla: '3 个工作日内答复',
    materials: '证明材料（病假等需上传）',
    summary: '因事或因病无法参加教学活动时提交请假申请。',
    fields: [
      { key: 'leaveType', label: '请假类型', type: 'select', required: true, options: ['事假', '病假', '公假'] },
      { key: 'startDate', label: '开始日期', type: 'date', required: true },
      { key: 'endDate', label: '结束日期', type: 'date', required: true },
      { key: 'reason', label: '请假事由', type: 'textarea', required: true },
      { key: 'attachment', label: '证明材料', type: 'upload', required: false, tip: '病假需上传医院证明' }
    ]
  },
  {
    id: 'transcript',
    name: '成绩单打印',
    category: 'academic',
    department: '教务处',
    sla: '1 个工作日内办结',
    materials: '学生证照片',
    summary: '申请打印中英文成绩单，办结后到教务处领取。',
    fields: [
      { key: 'lang', label: '语种', type: 'select', required: true, options: ['中文', '中英文对照'] },
      { key: 'copies', label: '份数', type: 'text', required: true, placeholder: '请输入份数' },
      { key: 'purpose', label: '用途', type: 'text', required: false, placeholder: '如：出国申请、求职' },
      { key: 'attachment', label: '学生证照片', type: 'upload', required: true }
    ]
  },
  {
    id: 'classroom-book',
    name: '教室预约',
    category: 'place',
    department: '教务处',
    sla: '2 个工作日内答复',
    materials: '活动说明',
    summary: '班级或社团举办活动需要借用教室时提交预约。',
    fields: [
      { key: 'room', label: '预约教室', type: 'text', required: true, placeholder: '如：第一教学楼 205' },
      { key: 'useDate', label: '使用日期', type: 'date', required: true },
      { key: 'period', label: '使用时段', type: 'select', required: true, options: ['上午', '下午', '晚上', '全天'] },
      { key: 'activity', label: '活动内容', type: 'textarea', required: true },
      { key: 'attachment', label: '活动说明', type: 'upload', required: false }
    ]
  },
  {
    id: 'sports-book',
    name: '体育场地预约',
    category: 'place',
    department: '体育部',
    sla: '2 个工作日内答复',
    materials: '无需材料',
    summary: '篮球场、羽毛球场、田径场等体育场地预约。',
    fields: [
      { key: 'venue', label: '场地', type: 'select', required: true, options: ['篮球场', '羽毛球场', '网球场', '田径场'] },
      { key: 'useDate', label: '使用日期', type: 'date', required: true },
      { key: 'period', label: '使用时段', type: 'select', required: true, options: ['上午', '下午', '晚上'] },
      { key: 'people', label: '使用人数', type: 'text', required: true }
    ]
  },
  {
    id: 'student-card',
    name: '补办学生证',
    category: 'other',
    department: '学生工作处',
    sla: '5 个工作日内办结',
    materials: '一寸照片',
    summary: '学生证遗失或损坏后申请补办。',
    fields: [
      { key: 'reason', label: '补办原因', type: 'select', required: true, options: ['遗失', '损坏'] },
      { key: 'desc', label: '情况说明', type: 'textarea', required: false },
      { key: 'photo', label: '一寸照片', type: 'upload', required: true }
    ]
  },
  {
    id: 'certificate',
    name: '在读证明开具',
    category: 'other',
    department: '学生工作处',
    sla: '2 个工作日内办结',
    materials: '无需材料',
    summary: '开具在校就读证明，用于实习、签证等场景。',
    fields: [
      { key: 'purpose', label: '用途', type: 'text', required: true, placeholder: '如：实习、签证' },
      { key: 'copies', label: '份数', type: 'text', required: true }
    ]
  }
]

/** 按 id 取事项定义 */
export function findService(id) {
  return serviceItems.find((s) => s.id === id) || null
}
