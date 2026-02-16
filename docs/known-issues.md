# Known Issues

## release.yml 未被 tag push 自动触发

**状态**：已修复
**发现日期**：2026-02-16
**修复日期**：2026-02-16

### 问题描述

`release.yml` 配置了 `on: push: tags: v4.*` 触发条件，但从未被 tag push 自动触发过。所有历史版本（v4.8.0、v4.9.0、v4.10.0）都是通过 `workflow_dispatch` 手动触发的。

### 原因分析

~~最初怀疑是 filter pattern `v4.*` 中 `*` 不匹配 `.` 导致的~~（错误诊断）。

实际原因：GitHub Actions 安全限制——**由 `GITHUB_TOKEN` 认证的操作不会触发其他 workflow**。

`changesets.yml` 的 checkout 步骤使用默认的 `GITHUB_TOKEN`：

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    # 未指定 token，默认使用 GITHUB_TOKEN
```

`actions/checkout` 会自动配置 git credential helper 为 `GITHUB_TOKEN`。即使后续 tag push 在 URL 中内嵌了 PAT：

```bash
git push "https://x-access-token:${PAT}@github.com/..." "$TAG"
```

GitHub 仍然可能根据 checkout 时建立的认证上下文判定该事件来源于 Actions，从而不触发后续 workflow。

### 修复方案

在 `changesets.yml` 的 checkout 步骤中使用 PAT：

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    token: ${{ secrets.repo_contents_token }}
```

这样 git credential helper 会自动配置为 PAT，后续所有 git 操作（包括 tag push）都使用 PAT 认证，能正确触发其他 workflow。

同时简化 tag push 命令为普通的 `git push origin "$TAG"`（不再需要内嵌 PAT 的 URL）。

### 附带改进

`release.yml` 的 tag 模式从 `v4.*` 改为 `v[0-9]*`，去除硬编码的主版本号。（注：`v4.*` 原本就能匹配 `v4.10.0`，因为 GitHub Actions filter pattern 中 `*` 只是不匹配 `/`，可以匹配 `.`。）

### 参考

- [GitHub Docs: Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows) — "events triggered by the `GITHUB_TOKEN` will not create a new workflow run"
- [GitHub Community Discussion #25617](https://github.com/orgs/community/discussions/25617) — "Pushing a tag within an action doesn't trigger another workflow"
- [GitHub Actions filter pattern cheat sheet](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#filter-pattern-cheat-sheet) — `*` 不匹配 `/`（可以匹配 `.`）
