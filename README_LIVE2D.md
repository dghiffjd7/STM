# Live2D 模型当前状态

## ⚠️ 临时禁用

由于 PixiJS WebGL 初始化问题，Live2D 模型渲染功能已临时禁用。

**当前模式**: 使用 emoji 占位符显示桌宠

## 🎨 占位符功能

虽然没有 Live2D 动画，但所有核心功能都正常工作：

- ✅ **拖拽移动**: 点击并拖动桌宠到任意位置
- ✅ **状态显示**: 不同状态显示不同 emoji
  - 😊 idle（空闲）
  - 😄 hover（悬停）
  - 😮 drag（拖拽）
  - 💬 speak（说话）
  - 🤔 think（思考）
  - 😵 error（错误）
  - 😴 sleep（睡眠）
- ✅ **AI 聊天**: 完整的对话功能
- ✅ **TTS 语音**: 文字转语音播放
- ✅ **设置界面**: 所有配置选项可用
- ✅ **透明窗口**: 背景透明，桌面整合

## 🚀 启动应用

```bash
npm run dev
```

现在应该可以看到一个**粉紫色渐变圆形**的桌宠，中间显示 emoji 表情。

## 🔧 关于 Live2D

Live2D 功能将在解决 WebGL 兼容性问题后重新启用。

详细信息请查看 `LIVE2D_ISSUE_WEBGL.md`。

## 📚 其他文档

- `README.md` - 项目主文档
- `LIVE2D_ISSUE_WEBGL.md` - Live2D 问题详情和解决方案
- `claude.md` - 开发规则

