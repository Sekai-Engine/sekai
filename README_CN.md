# Sekai 文字冒险游戏引擎

<div align="center" style="display:grid;place-items:center;">
	<p>
	    <a href="https://atomgit.com/Sekai-Engine/sekai" target="_blank"><img width="180" src="./src/assets/icon.png" alt="sekai logo"></a>
        <h1>Sekai</h1>
    <p>
    <img src="https://img.shields.io/badge/License-MIT--License-blue.svg?style=flat-square&logo=opensourceinitiative&logoSize=14" alt="License" height="20">
    <img src="https://img.shields.io/badge/godot-4.0+-blue.svg" alt="License" height="20">
	<img src="https://img.shields.io/github/stars/Sekai-Engine/sekai?style=flat-square&logo=github&color=green&logoSize=14" alt="License" height="20">
</div>

Sekai 引擎是现代化文字冒险游戏引擎，内核基于 Godot Mono 开发，专注于提供高效、灵活的文字冒险游戏开发体验。

## 特性

|         特性         |                                            描述                                             |
| --------------- | ------------------------------------------------------------ |
| **开发语言**     | slang（将脚本解释为 JSON 格式）                                               |
| **开发模式**     | 支持直接开发与嵌入godot开发两种模式                                        |
| **支持平台**     | 当前主要支持windows/linux(mac、android、html可定制导出模板) |
| **多语言支持**  | 中文、英文、日文三语支持                                                          |
| **Godot 版本** | 内核基于 Godot 4.x 开发，采用C# (.NET 8.0 以上版本)                     |

## 使用

### 下载

您可以直接下载[发行版](https://github.com/Sekai-Engine/sekai/releases)进行开发

### 编译

编辑器采用tauri开发，在自行编译前您需要确保已经具备以下组件：

- nodejs(npm)
- rust(cargo)
- wget

我们提供了编译脚本方便快速编译使用，您可以下载源码：

```bash
git clone https://github.com/Sekai-Engine/sekai.git
cd sekai
```

linux环境下运行：

```bash
./make.sh
```

windows环境下运行：

```shell
./make.bat
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 致谢

- sekai基于[Godot Engine](https://godotengine.org/)开发 - 强大的开源游戏引擎.
- 感谢[100font](https://www.100font.com/)提供字体资源.
- sekai引擎引用[ezgal开发模板](https://github.com/GodotHub/ezgal).
- 感谢所有贡献者和社区成员.
