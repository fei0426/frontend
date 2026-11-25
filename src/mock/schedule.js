export const todayCourses = [
  {
    name: '高等数学',
    period: '第 1-2 节',
    time: '08:00 - 09:40',
    room: 'A101',
    teacher: '王老师',
    tone: 'sage'
  },
  {
    name: '数据结构',
    period: '第 3-4 节',
    time: '10:00 - 11:40',
    room: 'B305',
    teacher: '李老师',
    tone: 'blue'
  },
  {
    name: '大学英语',
    period: '第 5-6 节',
    time: '14:00 - 15:40',
    room: 'C202',
    teacher: '张老师',
    tone: 'amber'
  }
]

export const weekdays = ['周一', '周二', '周三', '周四', '周五']

export const timetable = [
  {
    period: '第 1-2 节',
    cells: [
      { name: '高等数学', room: 'A101', tone: 'sage' },
      null,
      { name: '高等数学', room: 'A101', tone: 'sage' },
      null,
      { name: '大学物理', room: 'B108', tone: 'blue' }
    ]
  },
  {
    period: '第 3-4 节',
    cells: [
      null,
      { name: '数据结构', room: 'B305', tone: 'blue' },
      null,
      { name: '数据结构', room: 'B305', tone: 'blue' },
      null
    ]
  },
  {
    period: '第 5-6 节',
    cells: [
      { name: '大学英语', room: 'C202', tone: 'amber' },
      { name: '体育', room: '田径场', tone: 'sage' },
      null,
      { name: '软件工程', room: 'A402', tone: 'blue' },
      { name: '软件工程', room: 'A402', tone: 'blue' }
    ]
  },
  {
    period: '第 7-8 节',
    cells: [
      null,
      null,
      { name: '形势与政策', room: 'D201', tone: 'amber' },
      null,
      null
    ]
  }
]

export const exams = [
  { name: '高等数学', date: '2026-11-05', time: '09:00 - 11:00', room: 'A101', seat: 'A-23' },
  { name: '数据结构', date: '2026-11-08', time: '14:00 - 16:00', room: 'B305', seat: 'B-07' },
  { name: '大学英语', date: '2026-11-12', time: '09:00 - 11:00', room: 'C202', seat: 'C-15' }
]
