# 生产环境边界

- 项目：EasyCV 简历辅导平台
- 端口：3200
- 目录：/home/ubuntu/resume-coach
- 进程：PM2：resume-coach；MySQL Docker

## 推荐检查

`npm install；npm run check；npm run build`

## 不上传、不覆盖

.env、MySQL 数据、上传文件和日志。这些内容只应通过独立的生产备份机制保存，不属于 Git 源码。

本仓库公开可见。任何真实凭据都不应写入代码、Issue、Actions 日志或 Git 历史。
