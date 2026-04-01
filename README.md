# Gamble AI · 毛利 / 回本计算器

可调参数的定价、单次 Parse/Judge 毛利、以及「一批用户 + 月固定成本」下的回本用户数粗算。逻辑与主站 `pricing-model` 一致（Tier1 → Haiku，Tier2/3 → Sonnet）。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 推到单独的 GitHub 仓库

1. 在 GitHub 上新建空仓库（不要勾选添加 README，避免冲突），例如 `gamble-ai-calculator`。
2. 在本目录执行：

```bash
git init
git add .
git commit -m "Initial commit: pricing calculator"
git branch -M main
git remote add origin https://github.com/YOUR_USER/gamble-ai-calculator.git
git push -u origin main
```

将 `YOUR_USER` 换成你的用户名或组织名。

## 构建

```bash
npm run build
npm start
```
