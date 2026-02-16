---
name: release
description: >
  执行 LiveAutoRecord 完整发布流程：验证 changeset、检查 Electron 版本 bump 策略、
  提交推送、等待 CI 创建 Version Packages PR、验证并 rebase merge PR、
  等待 npm 发布和 Electron 构建上传 GitHub Releases。
  适用场景：当用户要求发布新版本、执行 release、合并 Version PR、
  或 .changeset/ 下已有待发布的 changeset 文件时使用。
---

# 发布新版本

执行 LiveAutoRecord 的完整发布流程。

## 前置条件检查

1. 确认当前在 `master` 分支且工作区干净（除了 `.changeset/*.md`）
2. 确认存在未提交或已暂存的 changeset 文件（`.changeset/*.md`，排除 `config.json` 和 `README.md`）
3. 如果没有 changeset，提示用户先运行 `pnpm changeset` 创建

## 步骤 1：验证 changeset 内容

读取 `.changeset/` 下的 changeset 文件，检查：

- 包名是否正确（必须是 `@autorecord/*` 下的有效包名）
- 版本类型是否合理（patch/minor/major）

### Electron 版本特别检查

**重要**：`updateInternalDependencies: "patch"` 配置意味着 electron 只会自动 patch bump。如果需要 minor 或 major 版本变更（如新功能发布），必须在 changeset 中**显式声明** `'@autorecord/electron': minor`（或 major）。

检查逻辑：

- 如果任何 recorder 或 manager 包有 minor/major 变更，提醒用户是否需要 electron 也做 minor/major bump
- 显示当前 electron 版本（从 `apps/electron/package.json` 读取）和预期新版本

运行 `pnpm changeset status` 确认变更列表正确。

## 步骤 2：提交 changeset

```bash
git add .changeset/*.md
git commit -m "chore: add changeset for <version> release"
```

其中 `<version>` 是预期的 electron 版本号（如 `v4.10.0`）。

## 步骤 3：推送到 master

```bash
git push origin master
```

推送后等待 CI（changesets.yml）自动创建 "Version Packages" PR。

## 步骤 4：等待并验证 Version Packages PR

```bash
# 轮询等待 PR 创建（最多等待 2 分钟）
gh pr list --search "Version Packages" --state open
```

PR 创建后，验证内容：

1. `gh pr view <number>` — 确认版本号正确
2. `gh pr diff <number>` — 确认变更内容：
   - changeset 文件被删除
   - 对应包的 `package.json` 版本号正确更新
   - `CHANGELOG.md` 正确生成
   - 没有意外的文件变更

将验证结果展示给用户，等待用户确认后再合并。

## 步骤 5：Rebase Merge PR

用户确认后执行：

```bash
gh pr merge <number> --rebase
```

## 步骤 6：等待 CI 发布

合并后 changesets.yml 再次触发，执行：

1. `pnpm release` → 发布 npm 包
2. 创建 Electron release tag（如 `v4.10.0`）

```bash
gh run list --workflow=changesets.yml --limit 1
gh run watch <run-id>
```

等待完成后确认：

- npm 包发布成功（检查 workflow 日志）
- tag 已创建：`gh api repos/{owner}/{repo}/tags --jq '.[0].name'`

## 步骤 7：确认 Electron 构建

tag push 应自动触发 release.yml（changesets.yml checkout 使用 PAT 认证）。确认：

```bash
gh run list --workflow=release.yml --limit 3
```

如果未自动触发，手动兜底：

```bash
gh workflow run release.yml --ref v<version>
```

等待构建完成：

```bash
gh run list --workflow=release.yml --limit 1
gh run watch <run-id>
```

## 步骤 8：同步本地仓库

```bash
git pull --rebase origin master
```

## 完成

输出发布摘要：

- npm 包版本和名称
- Electron 版本
- GitHub Release 链接：`https://github.com/WhiteMinds/LiveAutoRecord/releases/tag/v<version>`
- Release workflow 状态
