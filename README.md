# Open Ziwei Chart MVP

这是一个基于开源库 iztro、react-iztro、lunar-javascript 开发的紫微斗数排盘 Web App 第一版 MVP，用于学习和研究排盘功能。项目不复制任何商业软件的 UI、文案、素材或专有数据。

## 使用的开源库

- iztro：紫微斗数排盘核心算法
- react-iztro：React 紫微斗数星盘组件
- lunar-javascript：公历、农历、干支、生肖等历法辅助计算

## 安装方法

```bash
npm install
```

## 运行方法

```bash
npm run dev
```

如需使用 AI 解读，请复制 `.env.local.example` 为 `.env.local`，并配置：

```bash
OPENAI_API_KEY=你的_OPENAI_API_KEY
OPENAI_MODEL=gpt-5.5-mini
```

## 构建方法

```bash
npm run build
```

## GitHub Pages

项目已配置 GitHub Actions 静态部署。推送到 `main` 后会自动构建并发布到：

[https://pam003-crypto.github.io/open-ziwei-chart-mvp/](https://pam003-crypto.github.io/open-ziwei-chart-mvp/)

注意：GitHub Pages 是静态托管，不能执行 Next.js API Route。AI 解读按钮需要在支持服务端 API 的环境中运行，例如本地 `npm run dev` 或后续部署到 Vercel / Node 服务。

## 当前功能

- 出生信息输入
- 公历 / 农历选择
- 十二时辰选择
- 紫微斗数命盘展示
- 命例保存
- 命例重新载入
- 命例删除
- JSON 导入导出
- 本地规则解读
- 基于本地规则结果的 AI 解读入口

## 后续计划

- 真太阳时
- 早晚子时
- 闰月规则校准
- 四化流派设置
- 大限 / 流年详细展示
- PDF / PNG 导出
