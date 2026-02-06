# Sekai Visual Novel Game Engine

<div align="center" style="display:grid;place-items:center;">
	<p>
	    <a href="https://github.com/Sekai-Engine/sekai" target="_blank"><img width="180" src="./src/assets/icon.png" alt="sekai logo"></a>
        <h1>Sekai</h1>
    <p>
    <img src="https://img.shields.io/badge/License-MIT--License-blue.svg?style=flat-square&logo=opensourceinitiative&logoSize=14" alt="License" height="20">
    <img src="https://img.shields.io/badge/godot-4.0+-blue.svg" alt="License" height="20">
	<img src="https://img.shields.io/github/stars/Sekai-Engine/sekai?style=flat-square&logo=github&color=green&logoSize=14" alt="License" height="20">
</div>

Sekai Engine is a modern visual novel game engine, with its core developed based on Godot Mono. It focuses on providing an efficient and flexible development experience for visual novel games.

## Features

| Feature | Description |
|---------|-------------|
| **Development Language** | slang (interprets scripts into JSON format) |
| **Development Mode** | Supports both direct development and embedded Godot development modes |
| **Supported Platforms** | Currently mainly supports Windows/Linux (macOS, Android, HTML can be customized via export templates) |
| **Multi-language Support** | Supports Chinese, English, and Japanese |
| **Godot Version** | Core is developed based on Godot 4.x, using C# (.NET 8.0 or higher) |

## Usage

### Download

You can directly download the [release version](https://github.com/Sekai-Engine/sekai/releases) for development.

### Compilation

The editor is developed using Tauri. Before compiling yourself, you need to ensure you have the following components installed:

- Node.js (npm)
- Rust (cargo)
- wget

We provide compilation scripts for quick and easy compilation and usage. You can download the source code:

```bash
git clone https://github.com/Sekai-Engine/sekai.git
cd sekai
```

Run in a Linux environment:

```bash
./make.sh
```

Run in a Windows environment:

```shell
./make.bat
```

## Contributing

Welcome to submit Issues and Pull Requests!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Sekai is developed based on the [Godot Engine](https://godotengine.org/) - a powerful open-source game engine.
- Thanks to [100font](https://www.100font.com/) for providing font resources.
- Sekai Engine references the [ezgal development template](https://github.com/GodotHub/ezgal).
- Thanks to all contributors and community members.