# 功能权限管理（RBAC）设计说明

这套能力已经并入主应用，访问地址：`http://localhost:5173/`

登录、布局、权限控制三样现在是整个应用的公共基础设施，
所有功能页面都挂在它下面。`campus.html` 仍是独立的插件演示页，暂未并入。

页面演示顺序：登录页 → 工作台（看权限码清单）→ 对照其他页面观察菜单和按钮的变化。

## 一、这是什么

演示"基于角色的权限控制"在前后端分离项目里的落地方式，包含四层控制：

| 层次 | 位置 | 控制什么 |
| --- | --- | --- |
| 登录认证 | `api/auth.js`、`views/LoginView.vue` | 没登录不能进入系统 |
| 路由守卫 | `router/index.js` | 没有权限码的页面直接跳 403 |
| 菜单级 | `layout/BasicLayout.vue` | 左侧菜单按权限码过滤渲染 |
| 按钮级 | `directives/permission.js` | 没有权限码的按钮从 DOM 中移除 |

## 二、演示账号

密码统一是 `123456`，登录页有快捷按钮，点一下自动填充。

| 账号 | 角色 | 能看到的菜单 | 能看到的按钮 |
| --- | --- | --- | --- |
| `stu` | 学生 | 工作台、智能问答、报修工单 | 报修页：新建报修 |
| `tea` | 教师 | 工作台、智能问答、报修工单、知识库管理 | 报修页：审批；知识库页：无新增按钮 |
| `admin` | 管理员 | 全部菜单 | 全部按钮 |

登录后先看"工作台"页，那里列出了当前账号拿到的全部权限码，
再对照其他页面看菜单和按钮的变化。

## 三、权限码命名规范

统一使用 `模块:资源:操作` 三段式，前后端必须一致：

```
qa:chat:use                 使用智能问答
qa:knowledge:list           查看知识库
qa:knowledge:edit           编辑知识库
service:repair:list         查看报修工单
service:repair:submit       提交报修
service:repair:approve      审批报修
card:account:view           查看一卡通
notice:notice:publish       发布通知
system:user:list            用户管理
system:role:assign          分配角色
```

## 四、和后端对接

后端接口还没就绪，现在用 `api/auth.js` 里的假数据跑通流程。
后端做好之后，把该文件顶部的 `USE_MOCK` 改成 `false` 即可，其他代码不用动。

需要后端提供两个接口：

```
POST /api/auth/login
  入参：{ "username": "stu", "password": "123456" }
  返回：{ "token": "..." }

GET  /api/auth/me
  请求头：Authorization: Bearer <token>
  返回：{
    "username": "stu",
    "name": "张同学",
    "roles": ["学生"],
    "permissions": ["qa:chat:use", "service:repair:list", ...]
  }
```

## 五、重要说明：前端控制不是安全边界

这里的菜单隐藏和按钮移除只影响"看得见什么"，挡不住直接调接口的人。
演示时应当补上这一步：用教师的令牌直接请求审批接口，后端必须返回 `403`。

真正的访问控制必须在后端完成，前端这段代码只负责体验。

## 六、目录结构

```
src/
├── main.js                    应用入口，装配 Pinia、路由、Element Plus 和权限指令
├── App.vue                    只放一个 router-view
├── assets/
│   └── main.css               全局样式（含页面标题、权限码等公共类）
├── api/
│   ├── request.js             统一请求实例：注入令牌、处理 401 / 403
│   └── auth.js                登录与获取用户信息，含演示用假数据
├── stores/
│   └── auth.js                Pinia store：令牌、角色、权限码、判断方法
├── router/
│   ├── index.js               路由表 + 全局前置守卫
│   └── menu.js                菜单路由配置（供路由表和侧边栏共用）
├── directives/
│   └── permission.js          v-permission 按钮级指令
├── layout/
│   └── BasicLayout.vue        侧边栏 + 顶栏 + 内容区
├── components/
│   └── ChatBox.vue            问答组件，被 ChatView 复用
├── campus/                    校区数据插件（独立入口 campus.html，暂未并入主应用）
└── views/
    ├── LoginView.vue          登录页
    ├── DashboardView.vue      工作台，展示当前权限码清单
    ├── ChatView.vue           智能问答（复用 ChatBox 组件）
    ├── RepairView.vue         报修工单，演示按钮级差异
    ├── KnowledgeView.vue      知识库管理
    ├── UserManageView.vue     用户管理（仅管理员）
    └── ForbiddenView.vue      403 页面
```

新增功能页面的做法：在 `views/` 下建页面组件，在 `router/menu.js` 里加一条记录，
`meta.permission` 写上需要的权限码，侧边栏和路由守卫会自动生效。
