# AmyNode

AmyNode is a visual patch editor for the AMY audio synthesis library, enabling visual creation of audio patches with Arduino code generation.

## Features

- **Visual Node Editor**: Create audio patches using a node-based interface
- **AMY Library Integration**: Full compatibility with AMY synthesizer commands
- **Arduino Code Generation**: Export patches as Arduino sketches
- **Real-time Audio Preview**: WebAudio-based preview (AMY WASM integration ready)
- **Preset System**: Built-in presets and user preset management
- **Professional UI**: High-DPI support, dark theme, keyboard shortcuts

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/kurogedelic/AmyNode.git
cd AmyNode

# Install dependencies
npm install

# Run development server
npm run dev
```

### Usage

1. **Creating Nodes**: Drag from sidebar or click to create
2. **Connecting Nodes**: Click and drag between ports
3. **Keyboard Shortcuts**: Press F1 to see all shortcuts
4. **Export Code**: Click Export to generate Arduino sketch

## License

MIT License
