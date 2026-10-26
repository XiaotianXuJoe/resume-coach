# Agent 维护说明

## 项目

- 名称：EasyCV 简历辅导平台
- 技术栈：React 19 + Vite + Hono + tRPC + Drizzle + MySQL
- 生产端口：3200
- 服务器目录：/home/ubuntu/resume-coach
- 运行方式：PM2：resume-coach；MySQL Docker
- 检查／构建：npm install；npm run check；npm run build

## 维护约束

不得同步本地 .env；部署后必须验证真实读库接口。

- GitHub 是源码权威；生产服务器只保留运行环境、密钥和业务数据。
- 修改应在新分支完成，检查后合并到 `main`，再按提交或标签部署。
- 不得把真实配置、密码、API Key、Cookie、用户数据、数据库、上传文件或日志提交到本公开仓库。
- 不得为了调试而放开静态文件、代理或管理接口的访问控制。
- 不要直接在服务器生产目录手工改代码后不回写仓库。

## 不得进入仓库的运行内容

.env、MySQL 数据、上传文件和日志。

详细生产边界见 `docs/PRODUCTION.md`。执行部署前同时参考项目原有 README 和交接文档；如文档冲突，先确认现状再操作。
