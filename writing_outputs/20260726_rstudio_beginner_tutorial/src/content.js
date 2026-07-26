// 内容源：Windows + RStudio 零基础 R 语言入门教程
const C = [];
const h1 = (x) => C.push({ t: 'h1', x });
const h2 = (x) => C.push({ t: 'h2', x });
const h3 = (x) => C.push({ t: 'h3', x });
const p  = (x) => C.push({ t: 'p', x });
const b  = (...x) => x.forEach((y) => C.push({ t: 'b', x: y }));
const n  = (id, ...x) => x.forEach((y) => C.push({ t: 'n', x: y, id }));
const code = (lang, x) => C.push({ t: 'code', lang, x });
const out  = (x) => C.push({ t: 'out', x });
const tbl = (head, rows, widths) => C.push({ t: 'tbl', head, rows, widths });
const note = (x) => C.push({ t: 'note', x });
const warn = (x) => C.push({ t: 'warn', x });
const img = (path, w, h, cap) => C.push({ t: 'img', path, w, h, cap });
const pb = () => C.push({ t: 'pb' });
const toc = () => C.push({ t: 'toc' });

/* ============================== 封面 ============================== */
C.push({ t: 'title', x: 'R 语言零基础入门教程' });
C.push({ t: 'subtitle', x: 'Windows + RStudio · 从安装软件到跑完第一个真实案例' });
p('');
tbl(
  ['项目', '说明'],
  [
    ['适合谁', '完全没写过一行代码、没装过 R 的人。会用 Windows 打开文件夹就够了'],
    ['学完能做什么', '独立安装环境、看懂 RStudio 界面、写并保存脚本、读入自己的 Excel 数据、做统计检验、画出能放进 PPT 的图'],
    ['需要多久', '安装约 30 分钟；正文跟着敲一遍约 3 小时'],
    ['软件版本', 'R 4.6.1（2026-06-26 发布）+ RStudio 2026.07.1-147，Windows 10 / 11 64 位'],
    ['配套案例', '20 例样本（10 肿瘤 / 10 癌旁）的基因表达数据，做组间比较并出图'],
    ['编制日期', '2026 年 7 月 26 日'],
  ],
  [1900, 7460]
);
p('');
note('这份教程的所有代码都可以直接复制粘贴运行，所有显示的运行结果都是真实计算出来的，不是编的。你在自己电脑上跑，看到的数字应当与本文完全一致。');
pb();

/* ============================== 写在前面 ============================== */
h1('写在前面：三个新手最关心的问题');

h3('问 1：R 和 RStudio 是什么关系？要装两个吗？');
p('是的，要装两个，而且顺序不能反。打个比方：');
b(
  'R 是发动机。真正干活的是它，但它自己长得很难看，只有一个黑框框。',
  'RStudio 是驾驶舱。方向盘、仪表盘、座椅都在这里，你实际操作的是它。它自己不会算，所有计算都转交给 R。',
  '所以：先装 R（发动机），再装 RStudio（驾驶舱）。装好之后，日常只需要打开 RStudio，不用去管 R。'
);

h3('问 2：我数学/编程都不好，学得会吗？');
p('学得会。R 入门阶段本质上是"把一句中文翻译成一句固定格式的英文"。比如你想算平均值，中文是"算一下 x 的平均值"，R 里就写 mean(x)。你不需要理解它内部怎么算的，就像你不需要理解 Excel 的 AVERAGE 函数是怎么实现的。');

h3('问 3：会不会报一堆错？');
p('一定会。这很正常，写了十年代码的人每天也在报错。区别只在于：老手看到报错会读它，新手看到报错会慌。这份教程的每一章末尾都有"常见报错"，最后还有一章专门的报错速查表。记住一句话：报错不是失败，报错是 R 在告诉你哪里需要改。');
pb();
toc();
pb();

/* ============================== 第1章 安装 ============================== */
h1('第 1 章 安装：Windows 上把环境装好');
p('这一章从零开始，每一步都写清楚点哪里。全程需要联网，大约 30 分钟。');

h2('1.1 第一步：安装 R（发动机）');
n('inst1',
  '打开浏览器，访问 CRAN 官方 Windows 下载页：https://cran.r-project.org/bin/windows/base/',
  '页面最上方有一个醒目的蓝色链接，写着「Download R-4.6.1 for Windows」（88 MB）。点它，开始下载。',
  '下载完成后，在「下载」文件夹里找到 R-4.6.1-win.exe，双击运行。',
  '弹出「你要允许此应用对你的设备进行更改吗？」→ 点「是」。',
  '选择安装语言：建议选 English（选中文有时会导致后续报错信息出现乱码，反而更难查问题）。点 OK。',
  '接下来的所有界面，一路点「Next」即可，不需要改任何设置。安装路径保持默认。',
  '看到「Finish」，点击完成。R 装好了。'
);
note('版本说明：R 4.6.1 是本文编写时（2026-07-26）的 Windows 最新正式版。如果你看到的版本号更高（比如 4.6.2、4.7.0），直接下载最新的即可，本教程的所有代码都通用。');
warn('注意一个细节：安装 R 之后，你的开始菜单里会出现「R x64 4.6.1」这个程序。请不要用它！那是 R 自带的简陋黑框界面。我们要用的是下一步安装的 RStudio。');

h2('1.2 第二步：安装 RStudio（驾驶舱）');
n('inst2',
  '访问 Posit 官方下载页：https://posit.co/download/rstudio-desktop/',
  '页面上有两个步骤框，第 1 步是装 R（我们已经做完了），直接看第 2 步：「DOWNLOAD RSTUDIO DESKTOP FOR WINDOWS」，点这个蓝色大按钮。',
  '下载得到 RStudio-2026.07.1-147.exe（约 260 MB），双击运行。',
  '同样一路「下一步」，安装路径默认即可，最后点「完成」。',
  '在开始菜单搜索「RStudio」，点击打开。第一次启动会稍慢，属正常。'
);
p('如果一切顺利，你会看到一个分成几块区域的窗口。恭喜，环境装好了。');

h2('1.3 要不要装 Rtools？');
p('简短回答：初学阶段不需要，跳过。');
p('稍长的解释：Rtools 是一套编译工具，只有当你要安装的某个扩展包没有现成的 Windows 安装包、必须从源代码现场编译时才用得上。本教程用到的所有包都有现成安装包，不需要它。等你以后遇到「需要编译」的提示时，再去 https://cran.r-project.org/bin/windows/Rtools/ 下载对应版本（R 4.6 对应 Rtools 4.5）也来得及。');

h2('1.4 装完先做一次体检');
p('打开 RStudio，在左下角那块区域（叫 Console，控制台）里，你会看到一个大于号 > 在闪烁。把下面这行字复制进去，按回车：');
code('r', 'R.version.string');
p('如果看到类似下面这样的输出，说明 R 和 RStudio 已经正确连上了：');
out('[1] "R version 4.6.1 (2026-06-26)"');
p('再试一行，让 R 当计算器用：');
code('r', '1 + 1');
out('[1] 2');
p('能看到 2，说明一切正常，可以进入下一章。');

h3('本章常见问题');
tbl(
  ['现象', '原因', '怎么办'],
  [
    ['打开 RStudio 提示「R installation not found」', '先装了 RStudio，还没装 R；或 R 装在了非默认位置', '先按 1.1 装好 R，再重启 RStudio'],
    ['下载速度极慢', 'CRAN 主站在国外', '改用清华镜像下载：https://mirrors.tuna.tsinghua.edu.cn/CRAN/bin/windows/base/'],
    ['安装时提示没有权限', '当前 Windows 账户不是管理员', '右键安装包 →「以管理员身份运行」'],
    ['界面字太小看不清', '高分屏缩放问题', 'RStudio 菜单 Tools → Global Options → Appearance，把 Editor font size 调到 12～14'],
  ],
  [2600, 2600, 4160]
);
pb();

/* ============================== 第2章 界面 ============================== */
h1('第 2 章 认识 RStudio 界面：四个格子分别管什么');
p('RStudio 打开后是四个格子（第一次打开可能只有三个，左上角是空的，等你新建脚本后就会出现）。搞清楚这四块各管什么，你就不会再有"我该往哪里打字"的困惑。');
img('figures/rstudio_panes.png', 560, 300, '图 2-1　RStudio 的四个区域');

h2('2.1 四个区域详解');
tbl(
  ['位置', '名字', '作用', '通俗理解'],
  [
    ['左上', 'Source（源代码编辑器）', '写脚本、存代码的地方。写在这里的内容可以保存成文件，下次继续用', '你的稿纸。正式工作都在这里'],
    ['左下', 'Console（控制台）', '代码真正运行的地方。结果显示在这里', '计算器的显示屏。临时算个数可以直接在这敲'],
    ['右上', 'Environment（环境）', '列出你当前创建了哪些数据、变量', '你的储物柜清单。能看到手里有哪些东西'],
    ['右下', 'Files / Plots / Packages / Help', '看文件、看图、管理扩展包、查帮助', '工具箱。画的图会出现在 Plots 标签页'],
  ],
  [900, 2300, 3600, 2560]
);

h2('2.2 最重要的一个习惯：代码写在左上，不要写在左下');
p('新手最容易养成的坏习惯，就是一直在左下角 Console 里敲代码。为什么不好？因为 Console 里的内容关掉软件就没了，明天你想重跑一遍，得从头再敲一次。');
p('正确做法是：代码写在左上角的 Source 编辑器里，存成一个 .R 文件。这样代码就成了一份可以反复运行、可以发给别人、可以明年再打开看的资产。');

h3('怎么新建脚本');
n('newf',
  '点菜单栏 File → New File → R Script（快捷键 Ctrl + Shift + N）。',
  '左上角出现一个空白编辑区，标题是 Untitled1。',
  '在里面写代码。',
  '按 Ctrl + S 保存，取个名字比如 my_first.R，保存到你的工作文件夹。'
);

h3('怎么运行脚本里的代码');
tbl(
  ['你想做什么', '怎么操作'],
  [
    ['运行光标所在的这一行', '把光标放在那一行上，按 Ctrl + Enter'],
    ['运行选中的几行', '用鼠标选中，按 Ctrl + Enter'],
    ['从头到尾运行整个脚本', '按 Ctrl + Shift + Enter，或点编辑区右上角的 Source 按钮'],
    ['中途想停下来', '点 Console 右上角的红色停止图标，或按 Esc'],
  ],
  [3400, 5960]
);
note('按下 Ctrl + Enter 后，你会看到代码自动"跳"到了左下角 Console 并执行。这说明编辑器和控制台是连着的：你在上面写，它在下面跑。');

h2('2.3 建议先改的三个设置');
p('点菜单 Tools → Global Options，按下表调整。这三项能省掉后面很多莫名其妙的麻烦。');
tbl(
  ['设置项', '位置', '改成什么', '为什么'],
  [
    ['Restore .RData into workspace at startup', 'General 页', '取消勾选', '避免上次的残留数据污染这次分析，导致结果对不上'],
    ['Save workspace to .RData on exit', 'General 页', '选 Never', '同上，让每次启动都是干净的'],
    ['Default text encoding', 'Code → Saving 页', '设为 UTF-8', '中文注释和中文数据不乱码，这是 Windows 用户最容易踩的坑'],
  ],
  [3000, 1700, 1500, 3160]
);
warn('UTF-8 这一项对中文用户尤其重要。如果不设置，你写的中文注释在别人电脑上（或者你换台电脑）可能会变成一堆问号和方块。');

h2('2.4 关于"工作目录"：R 现在站在哪个文件夹？');
p('这是新手第二大困惑来源：明明文件就在那里，R 却说找不到。原因是 R 有一个"当前所在文件夹"的概念，叫工作目录（working directory）。它只会在这个文件夹里找文件。');
code('r', `# 看看 R 现在站在哪个文件夹
getwd()`);
out('[1] "C:/Users/YourName/Documents"');
p('注意这里的斜杠方向。Windows 资源管理器里显示的是反斜杠 C:\\Users\\...，但在 R 代码里必须写成正斜杠 C:/Users/... 或者双反斜杠 C:\\\\Users\\\\...。这是新手最常见的报错原因之一。');
code('r', `# 手动切换到你想要的文件夹（路径要用正斜杠）
setwd("C:/Users/YourName/Desktop/R_learning")`);

h3('更好的办法：用 Project 管理，从此不用管路径');
p('与其每次手动 setwd，不如用 RStudio 的 Project 功能。建好之后，双击项目文件打开，工作目录自动就是项目文件夹，永远不会错。');
n('proj',
  '点菜单 File → New Project → New Directory → New Project。',
  'Directory name 填一个英文名字，比如 R_learning。',
  'Create project as subdirectory of 点 Browse，选一个位置，比如桌面。',
  '点 Create Project。RStudio 会重启，右上角会显示项目名。',
  '以后每次学习，都从这个文件夹里双击 R_learning.Rproj 打开，工作目录自动就位。'
);
warn('给文件夹和文件起名时，请全部用英文字母、数字和下划线。中文路径、空格、特殊符号都可能引发难以排查的怪问题。比如用 R_learning 而不是「R 学习资料（新）」。');
pb();

/* ============================== 第3章 R 基础语法 ============================== */
h1('第 3 章 R 语言最小必备知识');
p('这一章只讲跑完案例真正会用到的东西。请打开 RStudio，新建一个脚本，跟着一行一行敲（不要复制粘贴，手敲能记住得多）。');

h2('3.1 把东西存起来：赋值');
p('R 里用 <- 这个箭头把右边的东西存到左边的名字里。这个符号有快捷键：Alt + 减号，会自动打出 <- 并带好空格。');
code('r', `x <- 10          # 把 10 存进名字 x
y <- 25
x + y`);
out('[1] 35');
p('存进去之后，右上角 Environment 区域就会列出 x 和 y，这就是你的"储物柜清单"。');
note('井号 # 后面的内容是注释，R 会完全忽略它，那是写给人看的。养成写注释的习惯，三个月后再打开脚本，你会感谢当初的自己。');

h3('起名字的规则');
b(
  '可以用字母、数字、点、下划线，但必须以字母开头。',
  '区分大小写：Age 和 age 是两个不同的东西，这一点常坑人。',
  '不要用 c、mean、sum、data 这些 R 自带的名字，会覆盖掉原有功能。',
  '推荐风格：小写字母加下划线，比如 tumor_data、gene_expr。'
);

h2('3.2 一串数字：向量');
p('向量就是一串同类型的数据，用 c() 把它们装起来（c 是 combine 的意思，这是 R 里使用频率最高的函数）。');
code('r', `# 5 个病人的年龄
ages <- c(62, 58, 71, 49, 65)
ages`);
out('[1] 62 58 71 49 65');
code('r', `length(ages)     # 有几个元素
mean(ages)       # 平均值
max(ages)        # 最大值`);
out(`[1] 5
[1] 61
[1] 71`);
p('向量运算是"整批"进行的，这是 R 最方便的特性之一。不需要写循环：');
code('r', `ages + 1         # 每个人都加 1 岁
ages > 60        # 每个人是否大于 60 岁`);
out(`[1] 63 59 72 50 66
[1]  TRUE FALSE  TRUE FALSE  TRUE`);

h3('取出其中某几个：用方括号');
code('r', `ages[1]          # 第 1 个（R 从 1 开始数，不是 0）
ages[c(1, 3)]    # 第 1 和第 3 个
ages[ages > 60]  # 所有大于 60 的`);
out(`[1] 62
[1] 62 71
[1] 62 71 65`);

h2('3.3 文字和分组');
code('r', `# 文字要用引号包起来
groups <- c("Tumor", "Tumor", "Normal", "Normal", "Tumor")
table(groups)    # 数一数每组各有几个`);
out(`groups
Normal  Tumor 
     2      3 `);
note('table() 是一个非常实用的函数，一秒钟就能知道每个分组有多少样本。做分析前先用它检查一下分组对不对，能避免很多低级错误。');

h2('3.4 一张表：数据框');
p('数据框（data frame）就是 R 里的 Excel 表格：每一列是一个变量，每一行是一条记录。这是做数据分析时最主要打交道的对象。');
code('r', `patients <- data.frame(
  id    = c("P01", "P02", "P03", "P04"),
  age   = c(62, 58, 71, 49),
  group = c("Tumor", "Normal", "Tumor", "Normal")
)
patients`);
out(`   id age  group
1 P01  62  Tumor
2 P02  58 Normal
3 P03  71  Tumor
4 P04  49 Normal`);
code('r', `str(patients)      # 看结构：有几行几列，每列什么类型`);
out(`'data.frame':	4 obs. of  3 variables:
 $ id   : chr  "P01" "P02" "P03" "P04"
 $ age  : num  62 58 71 49
 $ group: chr  "Tumor" "Normal" "Tumor" "Normal"`);
p('str() 是拿到任何数据后应该做的第一件事，它会告诉你行列数和每列的数据类型。');

h3('取出数据框里的东西');
code('r', `patients$age              # 取 age 这一列（美元符号）
patients[1, ]             # 取第 1 行（逗号前是行，后是列）
patients[, "age"]         # 取 age 列，另一种写法
patients[patients$group == "Tumor", ]   # 取出所有肿瘤样本的行`);
out(`[1] 62 58 71 49

   id age group
1 P01  62 Tumor

[1] 62 58 71 49

   id age group
1 P01  62 Tumor
3 P03  71 Tumor`);
warn('判断相等要用两个等号 ==，一个等号 = 是赋值。这是新手最高频的笔误，而且报错信息往往看不出问题在这。');

h2('3.5 函数怎么读');
p('函数的格式永远是：函数名(参数1, 参数2, ...)。括号里是你交给它的原料。');
code('r', `round(3.14159, digits = 2)   # 把 3.14159 保留 2 位小数`);
out('[1] 3.14');
p('不知道某个函数怎么用？在函数名前加问号，回车，右下角会弹出帮助文档：');
code('r', '?round');
note('帮助文档看不懂很正常，新手建议直接翻到最下面的 Examples（示例）部分，把例子复制到 Console 里跑一遍，比读说明更快理解。');

h2('3.6 安装和加载扩展包');
p('R 自带的功能是有限的，绝大多数强大功能来自扩展包（package）。这里有个常被搞混的概念：');
b(
  '安装（install.packages）：像手机装 App，一台电脑只需要做一次，装完就永久在硬盘上了。',
  '加载（library）：像打开 App，每次重启 RStudio 后、要用之前都得执行一次。'
);
code('r', `# 安装（只做一次，需要联网，可能要等几分钟）
install.packages("ggplot2")

# 加载（每次新开 RStudio 用之前都要执行）
library(ggplot2)`);
warn('注意引号的区别：install.packages("ggplot2") 包名要加引号，library(ggplot2) 不用加引号。这个不一致确实反人类，但记住就好。');

h3('国内用户建议：换个下载源');
p('默认从国外服务器下载，可能很慢或失败。执行下面这行切到清华镜像，速度会快很多（每次重开 RStudio 都要执行一次，或者写进脚本开头）：');
code('r', 'options(repos = c(CRAN = "https://mirrors.tuna.tsinghua.edu.cn/CRAN/"))');
pb();

/* ============================== 第4章 实战案例 ============================== */
h1('第 4 章 实战案例：比较肿瘤组和癌旁组的基因表达');
p('前面都是热身，这一章我们完整走一遍真实分析流程。场景是：你手上有 20 例样本，10 例肿瘤组织、10 例癌旁正常组织，测了某个基因（我们叫它 GENE1）的表达量。你想回答一个问题——这个基因在肿瘤里是不是表达更高？');
p('完整流程分六步：准备数据 → 检查数据 → 描述统计 → 画图看趋势 → 统计检验 → 导出结果。');

h2('4.1 第一步：准备数据');
p('真实工作中数据来自 Excel，我们 4.7 节会讲怎么读 Excel。这里为了让你现在就能跑起来，先用代码直接把数据敲进去。');
p('新建一个脚本，命名为 case_study.R，把下面的代码完整复制进去：');
code('r', `# ============================================
# 案例：GENE1 在肿瘤 vs 癌旁中的表达差异
# 日期：2026-07-26
# ============================================

# 20 例样本的基因表达值，单位是 log2(TPM+1)
expr <- c(4.2, 3.8, 4.5, 3.9, 4.1, 4.7, 3.6, 4.3, 4.0, 4.4,   # 10 例癌旁
          7.1, 6.5, 8.2, 5.9, 7.6, 6.8, 7.9, 6.2, 7.3, 8.0)   # 10 例肿瘤

# 对应的分组标签
group <- c(rep("Normal", 10), rep("Tumor", 10))

# 样本编号
sample_id <- paste0("S", 1:20)

# 组装成一张表
dat <- data.frame(sample_id = sample_id,
                  group     = group,
                  expression = expr)`);
note('rep("Normal", 10) 的意思是把 "Normal" 重复 10 次。paste0("S", 1:20) 会生成 S1, S2, ... S20。这两个函数在造测试数据时很常用。');

h2('4.2 第二步：检查数据（做任何分析前的必修课）');
code('r', `head(dat)        # 看前 6 行`);
out(`  sample_id  group expression
1        S1 Normal        4.2
2        S2 Normal        3.8
3        S3 Normal        4.5
4        S4 Normal        3.9
5        S5 Normal        4.1
6        S6 Normal        4.7`);
code('r', `str(dat)         # 看结构`);
out(`'data.frame':	20 obs. of  3 variables:
 $ sample_id : chr  "S1" "S2" "S3" "S4" ...
 $ group     : chr  "Normal" "Normal" "Normal" "Normal" ...
 $ expression: num  4.2 3.8 4.5 3.9 4.1 4.7 3.6 4.3 4 4.4`);
code('r', `table(dat$group)     # 每组几个样本
sum(is.na(dat$expression))   # 有没有缺失值`);
out(`
Normal  Tumor 
    10     10 

[1] 0`);
p('20 行 3 列、两组各 10 例、没有缺失值。数据是干净的，可以往下走。');
note('sum(is.na(x)) 用来数缺失值个数，结果是 0 说明没有缺失。真实数据里缺失值几乎必然存在，这一步千万别省。');

h2('4.3 第三步：描述统计');
code('r', `summary(dat$expression)      # 整体的五数概括`);
out(`   Min. 1st Qu.  Median    Mean 3rd Qu.    Max. 
  3.600   4.175   5.300   5.650   7.150   8.200 `);
p('现在分组来看。aggregate 的意思是"按某个分组，对某列做某种计算"：');
code('r', `# 按 group 分组，计算 expression 的平均值
aggregate(expression ~ group, data = dat, FUN = mean)`);
out(`   group expression
1 Normal       4.15
2  Tumor       7.15`);
code('r', `# 标准差
aggregate(expression ~ group, data = dat, FUN = sd)`);
out(`   group expression
1 Normal  0.3374743
2  Tumor  0.7905694`);
p('癌旁组平均 4.15，肿瘤组平均 7.15，相差 3.00。看起来差别很大，但"看起来"不算数，后面要用统计检验来确认。');

h2('4.4 第四步：画图（先看图，再做检验）');
p('这是个好习惯：先把数据画出来看形状，再做统计。图能一眼暴露出统计量掩盖的问题，比如离群值、分布严重偏斜。');

h3('方法一：用 R 自带的函数，一行搞定');
code('r', `boxplot(expression ~ group, data = dat,
        col  = c("lightblue", "salmon"),
        main = "Expression by group",
        ylab = "GENE1 expression  log2(TPM+1)")`);
img('figures/case_boxplot.png', 330, 277, '图 4-1　用 boxplot() 画出的箱线图');
p('图会出现在右下角的 Plots 标签页。点 Export → Save as Image 就能存成图片。');

h3('方法二：用 ggplot2，更好看也更灵活');
p('ggplot2 是 R 最著名的绘图包，论文里的图大多是它画的。第一次使用需要先安装：');
code('r', `install.packages("ggplot2")   # 只需装一次
library(ggplot2)              # 每次使用前加载

ggplot(dat, aes(x = group, y = expression, fill = group)) +
  geom_boxplot(alpha = 0.6) +
  geom_jitter(width = 0.1, size = 2) +
  labs(title = "GENE1 expression: Tumor vs Normal",
       x = "group", y = "expression") +
  theme_gray(base_size = 13)`);
img('figures/case_ggplot_box.png', 330, 277, '图 4-2　用 ggplot2 画出的箱线图（叠加了散点）');
p('ggplot2 的写法是"一层一层叠加"，用加号连接：');
tbl(
  ['这一层', '作用'],
  [
    ['ggplot(dat, aes(...))', '指定用哪份数据，x 轴放什么、y 轴放什么、按什么上色'],
    ['geom_boxplot()', '加一层箱线图'],
    ['geom_jitter()', '再加一层散点，把每个样本都画出来（左右随机抖动一点，避免重叠）'],
    ['labs()', '设置标题和坐标轴文字'],
    ['theme_gray()', '设置整体外观风格'],
  ],
  [2800, 6560]
);
note('图上叠加原始散点是个好习惯，尤其样本量小的时候。只画箱线图会隐藏"其实每组只有 10 个点"这一事实，容易让人高估结论的可靠性。');

h2('4.5 第五步：统计检验');
p('图上看着差别很大，但这个差别有没有可能只是随机波动造成的？这就是统计检验要回答的问题。');
p('两组连续变量比较，最常用的是 t 检验。R 里默认的 t.test 用的是 Welch 校正（不假设两组方差相等），这是更稳妥的选择：');
code('r', `t.test(expression ~ group, data = dat)`);
out(`	Welch Two Sample t-test

data:  expression by group
t = -11.036, df = 12.175, p-value = 1.065e-07
alternative hypothesis: true difference in means between group Normal and group Tumor is not equal to 0
95 percent confidence interval:
 -3.591316 -2.408684
sample estimates:
mean in group Normal  mean in group Tumor 
                4.15                 7.15 `);

h3('这一堆输出怎么读');
tbl(
  ['输出项', '本例的值', '含义'],
  [
    ['t', '-11.036', '检验统计量。绝对值越大，说明两组差异相对于波动越明显'],
    ['df', '12.175', '自由度。Welch 校正后不是整数，属正常现象'],
    ['p-value', '1.065e-07', '就是 0.0000001065。远小于 0.05，说明差异有统计学意义'],
    ['95 percent confidence interval', '-3.59 到 -2.41', '两组均值之差的 95% 置信区间。不包含 0，与 p 值结论一致'],
    ['mean in group ...', '4.15 和 7.15', '两组各自的平均值'],
  ],
  [2700, 1900, 4760]
);
p('负号是因为 R 按字母顺序把 Normal 排在 Tumor 前面，计算的是 Normal 减 Tumor。方向不影响结论。');
note('科学计数法读法：1.065e-07 表示 1.065 乘以 10 的负 7 次方，即 0.0000001065。同理 e-03 就是千分之几。');

h3('如果样本量小或数据不服从正态分布');
p('t 检验假设数据大致服从正态分布。样本量小的时候这个假设不好验证，可以改用不做正态假设的 Wilcoxon 秩和检验：');
code('r', `wilcox.test(expression ~ group, data = dat)`);
out(`	Wilcoxon rank sum exact test

data:  expression by group
W = 0, p-value = 0.0001083
alternative hypothesis: true location shift is not equal to 0`);
p('p 值同样远小于 0.05，两种方法结论一致，说明这个结论是稳健的。');
warn('提醒一句：p 小于 0.05 只说明"这个差异不太可能纯粹由随机造成"，它不代表差异很大，也不代表有生物学意义。本例中两组差 3 个 log2 单位（约 8 倍），这个效应量本身够大才是关键。永远同时报告效应量和 p 值，不要只看 p 值。');

h2('4.6 第六步：把结果导出');
code('r', `# 导出汇总表为 CSV，可以用 Excel 打开
result <- aggregate(expression ~ group, data = dat, FUN = mean)
write.csv(result, "result_summary.csv", row.names = FALSE)

# 保存刚才那张 ggplot 图
ggsave("gene1_boxplot.png", width = 5, height = 4, dpi = 300)`);
p('文件会保存在你的工作目录里（忘了在哪就运行 getwd() 看一眼）。右下角 Files 标签页也能直接看到它们。');
warn('Windows 用 Excel 打开 CSV 时中文可能乱码。解决办法：改用 write.csv(result, "result.csv", row.names = FALSE, fileEncoding = "GBK")，或者在 Excel 里用「数据 → 从文本/CSV」导入并选择 UTF-8 编码。');

h2('4.7 换成你自己的 Excel 数据');
p('学会了案例，怎么用到自己的数据上？关键是把数据读进来。');
h3('准备工作：整理好你的 Excel');
b(
  '第一行是列名，用英文，不要有空格，比如 sample_id、group、expression。',
  '从第二行开始是数据，一行一个样本。',
  '不要有合并单元格、不要有多余的标题行、不要在表格中间插空行。',
  '把文件放进你的项目文件夹（就是 getwd() 显示的那个位置）。'
);
h3('方法一：另存为 CSV 再读（最省事，不用装包）');
code('r', `# 在 Excel 里「另存为」→ 选择 CSV UTF-8 格式，存为 mydata.csv
dat <- read.csv("mydata.csv")
str(dat)     # 读进来先检查`);
h3('方法二：直接读 xlsx（需要装包）');
code('r', `install.packages("readxl")
library(readxl)

dat <- read_excel("mydata.xlsx", sheet = 1)   # 读第 1 个工作表
dat <- as.data.frame(dat)                     # 转成标准数据框
str(dat)`);
h3('方法三：完全不想打路径');
code('r', `# 运行后会弹出 Windows 的文件选择窗口，鼠标点选即可
dat <- read.csv(file.choose())`);
p('数据读进来之后，把 4.2 到 4.6 的代码里的列名换成你自己的列名，整套流程就能直接复用。');

h2('4.8 完整脚本');
p('把整个案例串起来，这就是一份完整可运行的分析脚本。建议保存下来，以后照着改：');
code('r', `# ============================================
# GENE1 表达差异分析
# 作者：你的名字
# 日期：2026-07-26
# ============================================

# ---- 0. 准备 ----
library(ggplot2)

# ---- 1. 数据 ----
expr <- c(4.2, 3.8, 4.5, 3.9, 4.1, 4.7, 3.6, 4.3, 4.0, 4.4,
          7.1, 6.5, 8.2, 5.9, 7.6, 6.8, 7.9, 6.2, 7.3, 8.0)
group <- c(rep("Normal", 10), rep("Tumor", 10))
dat <- data.frame(sample_id = paste0("S", 1:20),
                  group = group, expression = expr)

# ---- 2. 检查 ----
str(dat)
table(dat$group)
sum(is.na(dat$expression))

# ---- 3. 描述统计 ----
aggregate(expression ~ group, data = dat, FUN = mean)
aggregate(expression ~ group, data = dat, FUN = sd)

# ---- 4. 可视化 ----
p <- ggplot(dat, aes(x = group, y = expression, fill = group)) +
  geom_boxplot(alpha = 0.6) +
  geom_jitter(width = 0.1, size = 2) +
  labs(title = "GENE1 expression: Tumor vs Normal",
       x = "group", y = "expression") +
  theme_gray(base_size = 13)
print(p)

# ---- 5. 统计检验 ----
t.test(expression ~ group, data = dat)
wilcox.test(expression ~ group, data = dat)

# ---- 6. 导出 ----
write.csv(aggregate(expression ~ group, data = dat, FUN = mean),
          "result_summary.csv", row.names = FALSE)
ggsave("gene1_boxplot.png", plot = p, width = 5, height = 4, dpi = 300)

# ---- 记录环境信息，方便复现 ----
sessionInfo()`);
note('最后那行 sessionInfo() 会输出你的 R 版本和所有已加载包的版本。把它的输出保存下来，将来别人（或半年后的你）要复现这份分析时会非常有用。');
pb();

/* ============================== 第5章 报错 ============================== */
h1('第 5 章 报错速查：新手最常遇到的 12 个问题');
p('遇到红字不要慌。R 的报错信息虽然不友好，但基本都能对应到下面这几种情况。');
tbl(
  ['报错信息', '中文意思', '原因和解决办法'],
  [
    ['could not find function "xxx"', '找不到这个函数', '八成是包没加载。先 library(包名)；如果还不行说明包没装，先 install.packages("包名")'],
    ['object \'xxx\' not found', '找不到这个对象', '变量名打错了（注意大小写！），或者那行创建变量的代码还没运行'],
    ['cannot open file \'xxx\': No such file or directory', '找不到文件', '文件名打错，或文件不在工作目录里。运行 getwd() 看当前在哪，用 list.files() 看有哪些文件'],
    ['unexpected symbol / unexpected \')\'', '语法错误', '括号或引号没配对，或者少了逗号。检查括号是否成对、引号是否闭合'],
    ['Console 里出现一个 + 号，怎么敲都没反应', '命令没写完', 'R 在等你补全括号或引号。按 Esc 取消，然后检查上一行代码'],
    ['argument "x" is missing, with no default', '缺少必需的参数', '函数括号里少给了东西，用 ?函数名 查一下需要哪些参数'],
    ['non-numeric argument to binary operator', '对文字做了数学运算', '那一列其实是文本。用 str() 检查类型，需要时用 as.numeric() 转换'],
    ['there is no package called \'xxx\'', '没装这个包', 'install.packages("xxx")；注意包名大小写要完全正确'],
    ['安装包时提示 non-zero exit status', '包安装失败', '多为网络问题，换清华镜像重试；若提示需要编译，装 Rtools 或选择二进制版本'],
    ['画的图挤在一起看不清', '绘图窗口太小', '把右下角面板拖大，或用 ggsave() 直接存成指定尺寸的图片文件'],
    ['中文显示成方块或问号', '编码问题', 'Tools → Global Options → Code → Saving，把编码设为 UTF-8，然后重新保存脚本'],
    ['结果和昨天不一样', '环境里有残留数据', '按第 2.3 节关掉自动保存工作区；开始新分析前点扫帚图标清空环境'],
  ],
  [2700, 1700, 4960]
);

h2('5.1 自己排查问题的三个步骤');
n('debug',
  '读报错的第一行。R 的报错通常会指出是哪个函数、哪个对象出了问题，先把这个关键词找出来。',
  '把那一行代码拆开跑。比如 mean(dat$age) 报错，就先单独运行 dat$age 看看它到底是什么，往往一眼就看出问题。',
  '搜索报错信息。把红字里的英文（去掉你自己的变量名）复制到搜索引擎，加上 "r" 关键词。95% 的问题别人都遇到过，Stack Overflow 上有现成答案。'
);
note('还有一个万能招数：把 RStudio 完全关掉重开，然后从脚本第一行开始按 Ctrl+Enter 一行行重跑。很多"灵异问题"其实是环境里残留了旧变量。');
pb();

/* ============================== 第6章 下一步 ============================== */
h1('第 6 章 接下来学什么');

h2('6.1 巩固基础（1～2 周）');
tbl(
  ['资源', '链接', '说明'],
  [
    ['R for Data Science (2e)', 'https://r4ds.hadley.nz/', '免费在线英文书，公认最好的 R 数据分析入门教材。读前 8 章就够用很久'],
    ['Introduction to R (HBC)', 'https://hbctraining.github.io/Intro-to-R-flipped/', '哈佛医学院生信核心组的课程，专为生物医学背景的人设计，节奏适合零基础'],
    ['R and Bioconductor 入门课', 'https://carpentries-incubator.github.io/bioc-intro/', 'Carpentries 出品，从 Excel 思维过渡到 R 最平滑，2026 年仍在更新'],
    ['RStudio 官方速查卡', 'https://rstudio.github.io/cheatsheets/', '一页纸总结常用操作，打印出来贴在桌上很好用'],
  ],
  [2400, 3600, 3360]
);

h2('6.2 常用技能扩展');
tbl(
  ['想做什么', '学哪个包', '入门链接'],
  [
    ['更方便地筛选、排序、汇总数据', 'dplyr', 'https://dplyr.tidyverse.org/'],
    ['画各种漂亮的统计图', 'ggplot2', 'https://ggplot2-book.org/'],
    ['图上自动标注 p 值和显著性星号', 'ggpubr', 'https://rpkgs.datanovia.com/ggpubr/'],
    ['读写 Excel 文件', 'readxl / openxlsx', 'https://readxl.tidyverse.org/'],
    ['把代码、结果、文字写成一份报告', 'R Markdown / Quarto', 'https://quarto.org/'],
  ],
  [2600, 2200, 4560]
);

h2('6.3 如果你的目标是肿瘤生物信息学');
p('本教程是通用 R 入门。打好这个基础后，可以接着看同目录下的进阶手册《肿瘤生物信息学 R 语言学习与复现手册（2026 版）》，那份文档涵盖 TCGA/GEO 数据获取、差异表达分析、富集分析、生存分析、单细胞测序分析等专业内容。');
p('建议的衔接节奏：本教程全部跑通并能独立处理自己的 Excel 数据之后，再进入那份手册的第 3 章。');

h2('6.4 给新手的五条心里话');
n('advice',
  '每天写 20 分钟代码，比周末突击 4 小时有效得多。手感这东西需要连续性。',
  '不要只看不敲。看懂和写出来是两回事，看视频时觉得"好简单"，自己写时会发现处处卡壳，这很正常。',
  '报错时先深呼吸再读英文。80% 的报错读完第一行就知道问题在哪了。',
  '代码写完加注释。三个月后你一定会忘记当初为什么这么写。',
  '不要追求一开始就写得优雅。能跑出正确结果的丑代码，远胜过写不出来的漂亮代码。'
);
p('');
p('—— 全文完，祝你学得顺利 ——');

module.exports = C;
