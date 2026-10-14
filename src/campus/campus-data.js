// 校区 -> 学院 -> 专业 三级数据
// 该结构同时兼容 el-tree（label/children）与 el-cascader（value/label/children）
export const campusData = [
  {
    value: 'shizishan',
    label: '狮子山校区',
    children: [
      {
        value: 'shizishan-wenxue',
        label: '文学院',
        children: [
          { value: 'shizishan-wenxue-hanyuyan', label: '汉语言文学' },
          { value: 'shizishan-wenxue-hanyuguojiao', label: '汉语国际教育' },
          { value: 'shizishan-wenxue-mishuxue', label: '秘书学' }
        ]
      },
      {
        value: 'shizishan-jiaoyu',
        label: '教育科学学院',
        children: [
          { value: 'shizishan-jiaoyu-jiaoyuxue', label: '教育学' },
          { value: 'shizishan-jiaoyu-xueqian', label: '学前教育' },
          { value: 'shizishan-jiaoyu-xiaoxue', label: '小学教育' },
          { value: 'shizishan-jiaoyu-xinlixue', label: '心理学' }
        ]
      },
      {
        value: 'shizishan-lishi',
        label: '历史文化与旅游学院',
        children: [
          { value: 'shizishan-lishi-lishixue', label: '历史学' },
          { value: 'shizishan-lishi-lvyou', label: '旅游管理' },
          { value: 'shizishan-lishi-wenchuang', label: '文化产业管理' }
        ]
      },
      {
        value: 'shizishan-waiyu',
        label: '外国语学院',
        children: [
          { value: 'shizishan-waiyu-yingyu', label: '英语' },
          { value: 'shizishan-waiyu-riyu', label: '日语' },
          { value: 'shizishan-waiyu-eyu', label: '俄语' },
          { value: 'shizishan-waiyu-fanyi', label: '翻译' }
        ]
      }
    ]
  },
  {
    value: 'chenglong',
    label: '成龙校区',
    children: [
      {
        value: 'chenglong-jisuanji',
        label: '计算机科学学院',
        children: [
          { value: 'chenglong-jisuanji-ruanjian', label: '软件工程' },
          { value: 'chenglong-jisuanji-kexue', label: '计算机科学与技术' },
          { value: 'chenglong-jisuanji-wangluo', label: '网络工程' },
          { value: 'chenglong-jisuanji-wulian', label: '物联网工程' }
        ]
      },
      {
        value: 'chenglong-wudian',
        label: '物理与电子工程学院',
        children: [
          { value: 'chenglong-wudian-wulixue', label: '物理学' },
          { value: 'chenglong-wudian-dianzi', label: '电子信息工程' },
          { value: 'chenglong-wudian-tongxin', label: '通信工程' }
        ]
      },
      {
        value: 'chenglong-huacai',
        label: '化学与材料科学学院',
        children: [
          { value: 'chenglong-huacai-huaxue', label: '化学' },
          { value: 'chenglong-huacai-cailiao', label: '材料化学' },
          { value: 'chenglong-huacai-huanjing', label: '环境工程' }
        ]
      },
      {
        value: 'chenglong-shangxue',
        label: '商学院',
        children: [
          { value: 'chenglong-shangxue-gongshang', label: '工商管理' },
          { value: 'chenglong-shangxue-kuaiji', label: '会计学' },
          { value: 'chenglong-shangxue-shichang', label: '市场营销' },
          { value: 'chenglong-shangxue-caiwu', label: '财务管理' }
        ]
      }
    ]
  },
  {
    value: 'suining',
    label: '遂宁校区',
    children: [
      {
        value: 'suining-shuxue',
        label: '数学科学学院',
        children: [
          { value: 'suining-shuxue-shuxue', label: '数学与应用数学' },
          { value: 'suining-shuxue-xinxi', label: '信息与计算科学' },
          { value: 'suining-shuxue-tongji', label: '统计学' }
        ]
      },
      {
        value: 'suining-yinyue',
        label: '音乐学院',
        children: [
          { value: 'suining-yinyue-yinyuexue', label: '音乐学' },
          { value: 'suining-yinyue-wudao', label: '舞蹈学' },
          { value: 'suining-yinyue-yinyuebiaoyan', label: '音乐表演' }
        ]
      },
      {
        value: 'suining-tiyu',
        label: '体育学院',
        children: [
          { value: 'suining-tiyu-tiyujiaoyu', label: '体育教育' },
          { value: 'suining-tiyu-yundongxunlian', label: '运动训练' },
          { value: 'suining-tiyu-shehui', label: '社会体育指导与管理' }
        ]
      },
      {
        value: 'suining-makesi',
        label: '马克思主义学院',
        children: [
          { value: 'suining-makesi-sixiang', label: '思想政治教育' },
          { value: 'suining-makesi-zhexue', label: '哲学' },
          { value: 'suining-makesi-zhengzhixue', label: '政治学与行政学' }
        ]
      }
    ]
  }
]

export default campusData
