# Pathology Core - Specimen Management & Histology Repository
## 项目完整改动与开发记录 (Walkthrough Documentation)

本文件记录了在 `https://github.com/blackclowncy/pathology-core` 仓库中所完成的全部功能实现、架构设计、文件改动及业务逻辑。

- **GitHub 仓库地址**: [https://github.com/blackclowncy/pathology-core](https://github.com/blackclowncy/pathology-core)
- **GitHub Pages 在线访问**: [https://blackclowncy.github.io/pathology-core/](https://blackclowncy.github.io/pathology-core/)
- **当前版本**: v2.5.0 (Live)
- **所属实验室**: Tang Lab (Pathology & Organ Viability Core)

---

## 1. 整体架构与设计规范

### 1.1 视觉与交互规范 (Dark Clinical Theme)
- **主背景色**: `#0B1326` / `#0F172A`
- **卡片与面板**: `.glass-panel` 毛玻璃样式（`rgba(30, 41, 59, 0.7)`，边框 `#334155`）
- **核心青色 (Primary Cyan)**: `#4CD7F6` / `#06B6D4`
- **状态绿色 (Secondary Emerald)**: `#4EDEA3` (Clear / 正常)
- **待处理琥珀色 (Warning / Pending)**: `#FF7F8B` / `#FFB2B7`
- **超期/预警红色 (Error / Flagged)**: `#FFB4AB` / `#93000A`
- **字体规范**:
  - 正文与标题: `Inter`
  - 数据与编号: `JetBrains Mono`
  - 临床图标库: `Google Material Symbols Outlined`

### 1.2 依赖库选型
- **Tailwind CSS**: 界面排版与响应式栅格
- **SheetJS (`xlsx.full.min.js`)**: 纯前端实现 `.xlsx` / `.csv` 的导出与批量解析导入
- **JsBarcode (`JsBarcode.all.min.js`)**: 生成 Code128 临床条形码（用于模态框及试管/包埋盒标签打印）
- **Chart.js**: 数据看板与质控分析图表绘制

---

## 2. 详细文件改动与功能实现清单

### 2.1 样本登记首页 [`index.html`](file:///e:/Project/Web/pathology-core/index.html)
- **器官类型选择器与 Position 解剖方位子选项**:
  - 提供 8 个标准器官图标按钮（Lung, Heart, Liver, Kidney, Pancreas, Spleen, Intestines, Other），保持原设计布局与交互。
  - **【最新增加】Position 方位子选项**：当选择 **`Kidney`** 或 **`Lung`** 时，在器官区下方动态展开 `Position` 选项（可选 **`Right`**, **`Left`**, **`Enbloc`**）；切换至其他器官类型时自动隐藏并清空。
  - 点击 `Other` 时自动动态展开自定义器官文本输入框。
- **自动流水号生成**:
  - 自动生成唯一跟踪编号（例如 `T-2026-0819-01`），表单提交后自动刷新流水号。
- **【最新升级】阻断与取材时间支持年月日几点几分 (`datetime-local`)**:
  - `Clamp Time` 与 `Collection Time` 升级为包含年月日的精准时间选择器。
  - **冷缺血时间 (Cold Ischemia Time) 实时自动计算**：
    - 精准计算阻断至取材的总毫秒与分钟差（格式化为 `Xh Ymin`）。
    - 当冷缺血时间超过 24 小时（>1440 分钟）时，字体自动变为红色警示呼吸灯动效并打上 `Flagged` 标记。
- **热缺血时间与 N/A 快速切换**:
  - 支持分钟数录入；勾选 N/A 时自动禁用并灰化输入框。
- **临床病史多选 (Medical History)**:
  - 包含 10 项临床常见病史（HTN, Diabetes, CAD, COPD, Obesity, CKD, Liver, Tobacco, Alcohol, Drugs）。
- **Status 灌注与成像多选 & 并列 Histology 选项**:
  - 位于 Manual Remarks 正上方，分为两个并列配置项：
    - **`Status (Check all that apply)`**: 包含 `NMP` (Normothermic Machine Perfusion)、`HMP` (Hypothermic Machine Perfusion)、`Structure Image` (OCT/PAI/Ultrasound) 三项多选。
    - **`Histology`**: 独立的并列配置项，无子选项，提供单个独立勾选框（勾选/不勾选）。
- **Excel 导出与批量导入**:
  - 整合 SheetJS，导出包含 `Position`、`Histology` 及完整年月日时间的全部样本 `.xlsx` 文件，或上传批量合并入库。
- **动态 Recent Log 面板**:
  - 实时从 `localStorage` 获取最新入库样本并以卡片形式排列。
  - 包含器官与方位（如 `Lung (Right)`）、状态标签、NMP/HMP 标签、保存方式、架位与相对时间。
  - 点击卡片即可调出 **样本详情模态框 (Specimen Detail Modal)**。

---

### 2.2 数据持久化与业务层 [`js/storage.js`](file:///e:/Project/Web/pathology-core/js/storage.js)
- **存储引擎 (`SpecimenStore`)**:
  - 基于 `localStorage` 构建完整的 CRUD 管理系统。
  - 内置初始 Demo 样本种子（涵盖肺、肝、肾、心脏、胰腺等不同保存方式及灌注状态）。
- **多维度筛选引擎 (`filter`)**:
  - 关键字模糊搜索（检索 Donor ID, T-ID, 器官, 备注, 灌注状态, 病史等）。
  - 年份（Year）、器官（Organ）、性别（Gender）、年龄段（Age Range）、BMI 范围。
  - 病史（Diagnosis/History）。
  - **冷缺血时间精准筛选**:
    - `< 12 hours` (冷缺血 < 720 分钟)
    - `12 - 24 hours` (冷缺血 720 ~ 1440 分钟)
    - `> 24 hours` (冷缺血 > 1440 分钟)
- **实验室配置管理**:
  - 默认 `labId: 'Tang Lab'`，机构名称与主理人信息配置。
- **审计日志与系统通知**:
  - 记录登记、更新、删除、导出等操作审计流。
  - 跨组件事件分发机制 (`pathology_store_change`)，实现多标签页/多窗口数据实时响应。

---

### 2.3 公共交互控制器 [`js/common.js`](file:///e:/Project/Web/pathology-core/js/common.js)
- **临床 Toast 提示系统 (`showToast`)**:
  - 针对 Success、Error、Warning、Info 四种级别提供渐入式悬浮提示。
- **样本详情模态框 (`openSpecimenModal`)**:
  - 展示供体基本信息、病史、灌注状态（NMP/HMP/Structure Image）、冷热缺血耗时与临床备注。
  - 动态调用 JsBarcode 渲染 Code128 条形码。
  - **【最新增加】编辑入口**：弹窗顶部与底部均提供 **`Edit Record` / `Edit Info`** 按钮，点击直接打开标本编辑表单。
- **【最新增加】标本全信息编辑控制器 (`openEditSpecimenModal`)**:
  - 支持对任意已有标本进行全量字段的在线编辑与更新：
    - **Donor ID** (供体编号)
    - **Organ Type** (器官类型选择器)
    - **Position** (若为 Lung 或 Kidney，自动展开 Right / Left / Enbloc 解剖方位选择)
    - **Preservation** (-80C Frozen / Fixed)
    - **Storage Location** (冰箱/架位编号)
    - **Demographics** (Age, Gender, BMI, Cause of Death)
    - **Timing** (Warm Ischemia & N/A 选项，Clamp Time & Collection Time 纯英文 Flatpickr 日期时间选择器，冷缺血耗时实时自动重算)
    - **Status (Perfusion / Modality)** (NMP, HMP, Structure Image 多选)
    - **Histology** (独立勾选框)
    - **Medical History** (10 项病史复选)
    - **Manual Remarks** (临床备注多行文本输入)
    - **Quality Status** (Clear / Pending / Flagged 质控状态)
  - 提交后自动通过 `SpecimenStore.save()` 持久化至 `localStorage`，触发 `pathology_store_change` 全局事件刷新所有视图，并弹出成功提示。
- **试管/包埋盒标签打印 (`printSpecimenLabel`)**:
  - 一键调用系统打印机，打印标准规格标签（包含 `PATHOLOGY CORE • TANG LAB`、Donor ID、Organ、Status、Location、条形码等）。
- **急诊绿色通道模态框 (`openEmergencyLogModal`)**:
  - 专为时间敏感的移植器官标本提供秒级极速登记通道。
- **病理学家资料模态框 (`openProfileModal`)**:
  - 展示 Tang Lab 实验室信息、负责人与系统运行版本。
- **全局通知中心与审计日志下拉弹窗**:
  - 顶部铃铛与时钟按钮呼出实时记录。

---

### 2.4 样本归档库 [`archive.html`](file:///e:/Project/Web/pathology-core/archive.html)
- **【最新美化】统计卡片 Banner**:
  - 优化图标尺寸为细腻的 `40px/20px` 临床光效徽章，数值采用 `JetBrains Mono` 大号高亮排版，增加悬停渐变高亮与质感边框。
- **【最新美化】器官快速过滤胶囊 (Filter Pills)**:
  - 每个器官标签均嵌入对应解剖图标（`pulmonology`、`nephrology`、`fluid`、`cardiology` 等），增加活动态荧光高亮阴影。
- **【最新美化】全功能数据表格与编辑操作**:
  - 表格标题栏增加临床属性图标与大写字母间距。
  - 器官列升级为带柔和背景色的独立微型图标徽章，副标题展示 Position（如 `Right`、`Left`、`Enbloc`）。
  - Status/Modality 列采用精细配色标签（NMP 琥珀金、HMP 天空青、Structure Image 靛蓝、Histology 翡翠绿）。
  - Cold Ischemia 列增加倒计时图标与智能超时红/绿胶囊。
  - **行操作栏新增「编辑」按钮 (`edit`)**：与「查看详情 (`visibility`)」、「打印标签 (`print`)」、「删除 (`delete`)」并列，带有悬停交互与 Tooltip 提示。
- **底部数据计数栏 (Table Counter Footer)**:
  - 实时显示 `Showing X of Y specimens` 动态计数与 Tang Lab 存储库在线指示灯。
- **批量操作栏**:
  - 选中多条记录时自动呼出批量删除按钮，并支持全库批量导出为 Excel。

---

### 2.5 实验室概览看板 [`dashboard.html`](file:///e:/Project/Web/pathology-core/dashboard.html)
- **核心 KPI 指标卡**:
  - 样本总数、超低温冻存比例、平均冷缺血时间、高风险标本数。
- **Chart.js 交互式图表**:
  - **器官存量分布柱状图**: 直观展示各器官类型的入库数量。
  - **保存方式占比甜甜圈图**: -80°C 冻存与固定液保存的结构分布。
- **快捷行动面板与实时动态流**:
  - 快速登记、导出报告、查看超时标本。

---

### 2.6 组织质控与分析 [`analytics.html`](file:///e:/Project/Web/pathology-core/analytics.html)
- **冷缺血达标直方图**:
  - 统计分析 `<12h`、`12-24h`、`>24h` 的样本分布区间。
- **供体病史共病率矩阵**:
  - 分析高血压、糖尿病、冠心病、吸烟史等在标本供体中的发生频次。
- **多模态影像与微血管质控指南**:
  - 结合光声成像（PAI）与超快超声（ULM）皮髓质交界区血流评价标准。

---

### 2.7 存储资源管理器 [`resources.html`](file:///e:/Project/Web/pathology-core/resources.html)
- **温控设备监控**:
  - -80°C 超低温冰箱（Sector S1、S2、S3）与常温固定标本柜（Cabinet C1）温度与容量监控。
- **架位与冻存盒 (Rack & Box) 可视化网格**:
  - 模拟 Freezer 1-4 层的存储槽位占用状态与剩余空间。

---

### 2.8 实验室系统设置与 Google Drive 云端自动备份 [`settings.html`](file:///e:/Project/Web/pathology-core/settings.html)
- **【最新增加】Google Drive 自动化云备份引擎 (`GoogleDriveSync`)**:
  - **背景与目的**：针对静态网站或本地运行时可能因更新网站/清除浏览器缓存导致的数据丢失风险，提供纯前端向指定 Google 账号网盘全自动同步备份的能力。
  - **执行身份精确绑定**：通过 Google Apps Script 的「以我的身份执行 (Execute as: Me)」特性，确保所有备份 100% 精确保存到创建脚本的特定 Google 账号中（保存于专属 `Tang_Lab_Pathology_Backups` 文件夹）。
  - **双格式云端备份**：
    - `Tang_Lab_Specimens_Latest.xlsx`：最新的标准 Excel 工作表。
    - `Tang_Lab_Pathology_Backup_Latest.json`：全量系统快照（包含全部样本、实验室配置及操作历史）。
    - `Archive_History/Tang_Lab_Specimens_YYYY-MM-DD_HH-mm.xlsx`：时间戳历史版本留存。
  - **自动同步触发机制**：
    - **变更即备份 (Auto-backup on Change)**：登记新样本、编辑信息、批量删除或导入时，后台防抖自动静默上传。
    - **顶部状态栏指示灯 (Cloud Status Badge)**：全站 7 个页面顶部导航栏实时展示云端同步状态（🟢 已同步 / 🔵 同步中 / ⚪ 未配置 / 🔴 异常），点击呼出控制卡片。
    - **一键云端恢复 (Restore from Google Drive)**：更换电脑或清除缓存后，一键从 Google Drive 拉取最新备份无损恢复。
  - **内置 1 分钟极速配置向导**：
    - 设置页和弹窗均提供一键复制代码按钮 (`copyAppsScriptCode()`) 及简明步骤指引。
    - 仓库内附标准脚本模板 [`docs/google_apps_script.js`](file:///e:/Project/Web/pathology-core/docs/google_apps_script.js)。
- **全库本地数据备份与还原**:
  - 支持一键导出包含全部标本、设置及操作历史的 `.json` 快照文件。
  - 支持上传历史备份 JSON 立即全库恢复。
- **出厂重置与安全清除**:
  - 提供恢复预设 Demo 样本数据功能及危险操作二次确认。

---

### 2.9 规范指南与支持文档 [`support.html`](file:///e:/Project/Web/pathology-core/support.html)
- **标准操作流程 (SOPs)**:
  - `SOP-01`: 10% 中性缓冲福尔马林 (NBF) 组织固定规范 (1:20 比例，24-48h)。
  - `SOP-02`: -80°C 异戊烷/液氮超低温急冻与 RNA 完整性保护。
  - `SOP-03`: 三重组织化学染色方案（H&E 常规形态、Masson 三色胶原纤维/IFTA 评估、PAS 肾小球硬化评估）。
  - `SOP-04`: 移植器官冷缺血超时质控与光声/微血管成像排查流程。
- **键盘快捷键与支持联系方式**:
  - 快速检索、快捷登记及与实验室主管直接取得联系。

---

## 3. Git 提交与同步验证记录

| 提交哈希 | 提交信息 | 影响文件 |
| :--- | :--- | :--- |
| `af0bd2c` | `feat: complete specimen registration, storage, Excel import/export, and branch pages` | 全部 HTML/JS/README 新建与重构 |
| `7a0c321` | `Update Lab ID to Tang Lab, update Cold Ischemia filters (<12h, 12-24h, >24h), and add Status checkboxes (NMP, HMP, Structure Image)` | `index.html`, `archive.html`, `dashboard.html`, `analytics.html`, `resources.html`, `settings.html`, `support.html`, `js/storage.js`, `js/common.js` |
| `478218f` | `Fix viewport cutoff, restore natural scrolling across all pages, and add pb-32` | 7 个页面 HTML 布局调整 |
| `392564b` | `feat: beautify archive page and add comprehensive specimen information editing` | `archive.html`, `js/common.js`, `walkthrough.md` |
| `b5872c1` | `fix: add backward-compatibility auto-migration for legacy localStorage specimen records` | `js/storage.js` |
| `(Latest)` | `feat: implement automatic Google Drive Excel and JSON cloud backup & sync engine` | `settings.html`, `js/storage.js`, `js/common.js`, `docs/google_apps_script.js`, `analytics.html`, `resources.html`, `support.html` |

全部代码已经通过本地语法校验（`node -c`）并成功推送到远程 GitHub 仓库 `main` 分支。

