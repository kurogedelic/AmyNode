# AmyNode

A visual patch editor for the [AMY audio synthesis library](https://github.com/bwhitman/amy), enabling intuitive sound design through a node-based interface.

## Features

- **Visual Node Editor**: Create audio patches by connecting nodes visually
- **Real-time Audio Preview**: Hear your patches instantly with WebAudio preview
- **Arduino Code Generation**: Export your patches as Arduino-compatible code
- **Preset Library**: Start with built-in presets or save your own
- **AMY Compatibility**: Designed for the AMY synthesizer library

## Quick Start

### Online Demo
Try AmyNode directly in your browser: [https://kurogedelic.github.io/AmyNode/](https://kurogedelic.github.io/AmyNode/)

### Local Development

```bash
# Clone the repository
git clone https://github.com/kurogedelic/AmyNode.git
cd AmyNode

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Node Types

### Generators
- **Oscillator**: Multi-waveform sound generator (sine, pulse, saw, triangle, noise)
- **Sample Player**: PCM sample playback (Beta)
- **Drum Machine**: Rhythm pattern generator (Beta)

### Processors
- **Filter**: Low-pass, high-pass, and band-pass filtering
- **Mixer**: 4-channel audio mixer
- **Effects**: Reverb, chorus, and echo

### Modulators
- **Envelope**: ADSR envelope generator
- **LFO**: Low-frequency oscillator for modulation
- **Sequencer**: Step sequencer (Beta)

### Input/Output
- **ADC**: Analog input simulation
- **GPIO**: Digital input/output
- **Audio Output**: Final audio output node

## Usage

1. **Create Nodes**: Drag nodes from the sidebar to the canvas
2. **Connect Nodes**: Click and drag between node ports to create connections
3. **Edit Parameters**: Select a node to edit its parameters in the properties panel
4. **Preview Audio**: Click Play to hear your patch
5. **Export Code**: Generate Arduino code for your patch

## Arduino Integration

AmyNode generates Arduino-compatible code that uses the AMY library:

```cpp
#include "amy.h"

void setup() {
    amy_start();
    // Your patch initialization code
}

void loop() {
    // Parameter updates and modulation
}
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Requires user interaction for audio

## Development

AmyNode is built with:
- Vanilla JavaScript for maximum compatibility
- WebAudio API for audio preview
- Canvas API for node visualization
- Vite for development and building

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

AmyNode is licensed under the GNU Lesser General Public License v3.0 (LGPL-3.0).

© 2024 Leo Kuroshita ([@kurogedelic](https://x.com/kurogedelic))

This project is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## Acknowledgments

- [AMY Synthesizer](https://github.com/bwhitman/amy) by Brian Whitman
- Node editor inspired by various visual programming environments
- Icons from [Phosphor Icons](https://phosphoricons.com)