# aftertaste

[English](README.md) · 中文

taste-skill 告诉 agent 要有品味。**aftertaste** 检查它到底有没有。

Playwright 截图 + 确定性 slop 审计。不需要 API key。100 分是人做的、有辨识度；0 分是顶级套模板。

    npx aftertaste http://localhost:5173

![CLI 报告](https://cdn.jsdelivr.net/gh/mcbbugu/aftertaste@main/docs/cli.png)

![套模板样例](https://cdn.jsdelivr.net/gh/mcbbugu/aftertaste@main/docs/slop.png)

对照页 `demo/craft.html` 会打成有辨识度：

![手工对照](https://cdn.jsdelivr.net/gh/mcbbugu/aftertaste@main/docs/craft.png)

## 这是什么

命令行评审。用 Chromium 打开 URL，把 PNG 存到 `.aftertaste/`，再按 CSS 和文案打 0–100 分。100 是有选择的页面，0 是峰值模板。不调用任何模型 API。

## 和 taste-skill 的关系

taste-skill（Leonxlnx/taste-skill）是说明书：写 CSS 之前告诉 agent 怎么设计。

aftertaste 是验收：看已经上线的页面。生成时用 taste-skill，你觉得做完了，就对预览 URL 跑 aftertaste。

## 它抓什么

证据来自页面上真实的 CSS 和文案：

- 字体：Inter、Roboto、Arial、只用 system-ui、Space Grotesk、Plus Jakarta Sans 当全部气质
- 配色：紫/靛渐变、gray-50 卡片、单一强调色
- 布局：三张等宽功能卡、居中英雄区配 Get started / Learn more、一排 Lucide、段落 padding 完全一样、圆角全是 12/16
- 文案：Welcome to、unleash、seamless、next-generation、empower、破折号堆砌、空泛 H1
- 动效：没有，或每块都是同一套 fade-in

`demo` 审计 `demo/slop.html`（中位 AI 落地页）。`demo/craft.html` 是对照：字体、颜色、结构是选过的。

`--skill` 会按这个 URL 的事实写入 `.cursor/skills/aftertaste/SKILL.md`：字族、渐变、H1、三张卡。不是空泛的设计建议。

`--json` 输出 JSON。`--fail-under N` 低于 N 分就以退出码 1 失败（给 CI 用）。

## 命令

    aftertaste http://localhost:5173
    aftertaste demo
    aftertaste http://localhost:5173 --json
    aftertaste http://localhost:5173 --skill

前面加 `npx`。需要 Node 20+。Playwright 的 Chromium 装一次即可。

打分测试在 `test/score.test.ts`（用 fixture，不访问网络）。

PR 上自动评论分数见 `.github/workflows/aftertaste.yml`。`action.yml` 是 composite 封装。

## License

MIT
