# dsh-english-teacher

DSH Web 的「英语老师」面板：侧边栏一个入口，打开是一页——上面输入中/英文，下面四列结果。

| 列 | 内容 |
|---|---|
| ① 语法与对比 | 逐条 `原句 → 修正` + 一句理由（中文输入时留空） |
| ② 修改版 | 应用最小修正后的英文 |
| ③ 通用版 | 日常工作口语里怎么说 |
| ④ 专业版 | 文档 / 邮件 / 评审里的正式说法 |

## 结构

- `index.mjs` —— **Host 半侧**：声明 Config（决定用哪个模型）、发布私有 RPC 通道 `/dsh-english-teacher`、用 `ctx.llm.stream()` 发起模型调用并把回答解析成四列。
- `client.js` —— **浏览器半侧**：注册侧边栏入口（`sidebar.panellist`）与页面（root 作用域 `main` keyed slot，key 与入口 id 相同），手写 `window.__ModuleLoader__.load` 封装，无构建步骤。
- `cordis.patch.yml` —— bundle patch，把一个 Loader 行插进 profile。

## 模型

默认走 DSH 的模型设施（`provider: bailian` / `model: deepseek-v4.1-flash`），可改成任何已注册的 provider，包括本机 llama.cpp 暴露的 `hy-mt` 路由。

配置字段全部标了 `.volatile()`，因此会出现在设置页；编辑后的值由 Settings 服务写进 profile patch 的独立行（`- id: english-teacher-panel`）。

## 安装

```bash
dsh plugin --profile web add file:/Users/xt03375/dsh-english-teacher
```

装完 `dsh-english-teacher` 会自动进入 `package.json` 的 `dsh.profile.bundles`。

> ⚠️ **创建与配置必须分属两层，这是设置页能保存的前提。**
> patch 文档的语义是：`- insert:` = **新增**行；裸 `- id: …` 行 = **修改已存在**的行（找不到目标就跳过，并报 `patch: entry … not found`）。
> 所以 **bundle 的 `cordis.patch.yml` 用 `- insert:` 创建行**（该 bundle 必须列在 `dsh.profile.bundles` 里），**profile 的 `cordis.patch.yml` 只保留带 `config` 的裸行**——那正是 `dsh-config-editor` 保存时写入的目标。
> 若两行写在同一份文档里，保存校验 `find(row => row.id === id)` 会取到 `insert` 那条（config 为空），判定不相等 → 保存被拒：`Configuration for "…" is overridden by a home patch or command-line overlay`。

## 已知边界

- 四列的**②③④**（改写与两个版本）实测质量好；**①**（语法解释）在本地 1.8B 翻译模型上会给出错误理由——默认的远端模型没有这个问题。
- 输入上限 8000 字符（Host 侧拦）。
