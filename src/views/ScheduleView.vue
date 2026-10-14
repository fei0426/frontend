<script setup>
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'

const activeTab = ref('today')

// 模拟数据，接口就绪后替换为教务系统的课程、考试和教室数据
const todayCourses = [
  { name: '高等数学', period: '第 1-2 节', time: '08:00 - 09:40', room: 'A101', teacher: '王老师' },
  { name: '数据结构', period: '第 3-4 节', time: '10:00 - 11:40', room: 'B305', teacher: '李老师' },
  { name: '大学英语', period: '第 5-6 节', time: '14:00 - 15:40', room: 'C202', teacher: '张老师' }
]

const weekdays = ['周一', '周二', '周三', '周四', '周五']
const timetable = [
  {
    period: '第 1-2 节',
    cells: [
      { name: '高等数学', room: 'A101' },
      null,
      { name: '高等数学', room: 'A101' },
      null,
      { name: '大学物理', room: 'B108' }
    ]
  },
  {
    period: '第 3-4 节',
    cells: [
      null,
      { name: '数据结构', room: 'B305' },
      null,
      { name: '数据结构', room: 'B305' },
      null
    ]
  },
  {
    period: '第 5-6 节',
    cells: [
      { name: '大学英语', room: 'C202' },
      { name: '体育', room: '田径场' },
      null,
      { name: '软件工程', room: 'A402' },
      { name: '软件工程', room: 'A402' }
    ]
  },
  {
    period: '第 7-8 节',
    cells: [null, null, { name: '形势与政策', room: 'D201' }, null, null]
  }
]

const exams = [
  { name: '高等数学', date: '2026-11-05', time: '09:00 - 11:00', room: 'A101', seat: 'A-23' },
  { name: '数据结构', date: '2026-11-08', time: '14:00 - 16:00', room: 'B305', seat: 'B-07' },
  { name: '大学英语', date: '2026-11-12', time: '09:00 - 11:00', room: 'C202', seat: 'C-15' }
]

const roomQuery = ref({ building: '', day: '2026-10-15', period: '第 5-6 节' })
const roomResult = ref([])

function searchRoom() {
  // 接口就绪后替换为教务系统的教室查询接口
  roomResult.value = [
    { room: 'A101', building: '第一教学楼', capacity: 120, status: '空闲' },
    { room: 'A102', building: '第一教学楼', capacity: 120, status: '空闲' },
    { room: 'A201', building: '第一教学楼', capacity: 90, status: '已占用' },
    { room: 'A305', building: '第一教学楼', capacity: 60, status: '空闲' }
  ].filter((r) => !roomQuery.value.building || r.building.includes(roomQuery.value.building))
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h2 class="page-title">日程课表</h2>
        <p class="page-desc">课程、考试和教室数据来自教务系统，调课后会及时更新。</p>
      </div>
    </div>

    <div class="panel">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="今日课程" name="today">
          <el-empty v-if="!todayCourses.length" description="今天没有课程安排" />
          <ul v-else class="course-list">
            <li v-for="item in todayCourses" :key="item.name + item.period" class="course">
              <div class="course-time">
                <div class="course-period">{{ item.period }}</div>
                <div class="muted">{{ item.time }}</div>
              </div>
              <div class="course-main">
                <div class="course-name">{{ item.name }}</div>
                <div class="muted">{{ item.teacher }} · {{ item.room }}</div>
              </div>
            </li>
          </ul>
        </el-tab-pane>

        <el-tab-pane label="周课表" name="week">
          <el-table :data="timetable" border class="timetable">
            <el-table-column prop="period" label="节次" width="110" />
            <el-table-column
              v-for="(day, index) in weekdays"
              :key="day"
              :label="day"
              min-width="130"
            >
              <template #default="{ row }">
                <div v-if="row.cells[index]" class="slot">
                  <div class="slot-name">{{ row.cells[index].name }}</div>
                  <div class="muted">{{ row.cells[index].room }}</div>
                </div>
                <span v-else class="muted">—</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="考试安排" name="exam">
          <el-table :data="exams" border>
            <el-table-column prop="name" label="科目" min-width="160" />
            <el-table-column prop="date" label="日期" width="130" />
            <el-table-column prop="time" label="时间" width="170" />
            <el-table-column prop="room" label="考场" width="110" />
            <el-table-column prop="seat" label="座位号" width="110" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="教室查询" name="room">
          <div class="toolbar">
            <el-input
              v-model="roomQuery.building"
              placeholder="教学楼，如：第一教学楼"
              style="width: 220px"
            />
            <el-date-picker
              v-model="roomQuery.day"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="日期"
            />
            <el-select v-model="roomQuery.period" style="width: 150px">
              <el-option
                v-for="p in ['第 1-2 节', '第 3-4 节', '第 5-6 节', '第 7-8 节']"
                :key="p"
                :label="p"
                :value="p"
              />
            </el-select>
            <el-button type="primary" :icon="Search" @click="searchRoom">查询</el-button>
          </div>

          <el-empty v-if="!roomResult.length" description="点击查询查看空闲教室" />

          <el-table v-else :data="roomResult" border>
            <el-table-column prop="room" label="教室" width="110" />
            <el-table-column prop="building" label="教学楼" min-width="150" />
            <el-table-column prop="capacity" label="容量" width="100" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === '空闲' ? 'success' : 'info'"
                  size="small"
                  effect="plain"
                >
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
.course-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.course {
  display: flex;
  gap: 20px;
  padding: 14px 0;
  border-bottom: 1px solid #f2f3f5;
}

.course:last-child {
  border-bottom: none;
}

.course-time {
  flex: 0 0 130px;
}

.course-period {
  font-size: 14px;
  margin-bottom: 2px;
}

.course-name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 2px;
}

.slot-name {
  font-size: 13px;
  font-weight: 500;
}
</style>
