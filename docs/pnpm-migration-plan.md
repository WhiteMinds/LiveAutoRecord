# Yarn 3 → pnpm 迁移计划

> 状态：待执行
> 创建日期：2026-02-15

## 目标

将包管理器从 Yarn 3.2.3（PnP 模式）迁移到 pnpm，同时移除 Lerna，使用 pnpm 原生 workspace 功能。

## 迁移范围

### 移除项

- Yarn 3（`.yarnrc.yml`、`.yarn/` 目录、`yarn.lock`）
- Lerna（`lerna.json`、root `package.json` 中的 lerna devDependency）
- Yarn PnP 相关配置（`.pnp.cjs`、`.pnp.loader.mjs`）
- `resolutions` 字段 → pnpm 的 `overrides`

### 新增项

- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `.npmrc`（配置 shamefully-hoist 等选项）

## 迁移步骤

### 1. 准备工作

- [ ] 确认 pnpm 最新稳定版本
- [ ] 确认所有 workspace 包的 `package.json` 格式兼容
- [ ] 备份当前依赖锁定状态

### 2. 配置迁移

- [ ] 创建 `pnpm-workspace.yaml`：
  ```yaml
  packages:
    - 'packages/*'
  ```
- [ ] 创建 `.npmrc`（根据需要配置）
- [ ] `package.json` 中 `resolutions` → `pnpm.overrides`
- [ ] `packageManager` 字段更新为 pnpm 版本
- [ ] 移除 `workspaces` 字段（pnpm 使用独立配置文件）

### 3. 依赖协议迁移

- [ ] `workspace:^` 协议 pnpm 原生支持，无需修改
- [ ] 检查 `yarn run -T` 用法 → 改为 pnpm 等效命令
- [ ] 检查 `installConfig.hoistingLimits`（electron 包） → pnpm 等效配置

### 4. 脚本迁移

- [ ] 全局搜索 `yarn` 命令，替换为 `pnpm` 等效命令
- [ ] `yarn workspace <name> <cmd>` → `pnpm --filter <name> <cmd>`
- [ ] `yarn run -T <cmd>` → `pnpm <cmd>`（pnpm workspace 中 root 的 devDeps 对子包可用）
- [ ] 更新 CI/CD 中的 yarn 命令

### 5. Lerna 替代

当前 Lerna 用途及替代方案：

| Lerna 功能 | pnpm 替代 |
|-----------|----------|
| `lerna version` | `changeset`（推荐）或手动管理 |
| `lerna publish` | `changeset publish` 或 `pnpm publish --filter` |
| `lerna run` | `pnpm -r run` |
| `lerna bootstrap` | `pnpm install`（原生） |

- [ ] 评估是否引入 `@changesets/cli` 做版本管理
- [ ] 或者评估是否直接手动管理版本号（项目发布频率不高的话）

### 6. 清理

- [ ] 删除 `.yarn/` 目录
- [ ] 删除 `.yarnrc.yml`
- [ ] 删除 `yarn.lock`
- [ ] 删除 `.pnp.cjs`、`.pnp.loader.mjs`（如存在）
- [ ] 删除 `lerna.json`
- [ ] 从 root `package.json` 移除 lerna 依赖
- [ ] 更新 `.gitignore`
- [ ] 更新 `CLAUDE.md` 中的命令说明

### 7. 验证

- [ ] `pnpm install` 成功
- [ ] 所有包 `pnpm build` 通过
- [ ] Electron 开发模式正常
- [ ] Electron 打包正常
- [ ] CI/CD 流水线通过

## 风险

| 风险 | 缓解措施 |
|------|----------|
| Electron 原生模块兼容性 | pnpm 的 `shamefully-hoist` 或 `.npmrc` 中配置 `public-hoist-pattern` |
| winston patch（`.yarn/patches/`） | 确认 patch 是否仍需要，pnpm 也支持 `pnpm patch` |
| 子包无法访问 root devDeps | pnpm 默认行为与 Yarn PnP 不同，需测试 |

## 关联

- 主升级计划：`docs/dependency-upgrade-plan.md`
- 当前 Yarn 配置：`.yarnrc.yml`
- 当前 Lerna 配置：`lerna.json`
