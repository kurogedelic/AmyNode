# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AmyNode Overview

AmyNode is a web-based visual patch editor that uses the AMY audio library as its backend. It enables visual patch creation, audio preview functionality, and code generation for Arduino/embedded systems.

## Architecture Layers

### Layer 1: Visual Node UI
- Uses Litegraph.js for node-based interface
- Custom nodes: Oscillator, Envelope, Mixer, ADC (UI slider), GPIO (UI toggle), Map/Compare/Logic

### Layer 2: Audio Output (WebAudio)
- WebAudio API simulates AMY behavior initially
- Uses OscillatorNode and GainNode
- Future: AMY library compiled to WASM

### Layer 3: Code Generation
- Converts JSON structure to C/Arduino templates
- Generates .ino files with setup() and loop()
- Uses AMY API: amy_create_oscillator, amy_set_freq, etc.

### Layer 4: Parameter UI Auto-generation
- Automatic UI controls for AMY nodes
- Sliders, dropdowns, checkboxes
- Uses Litegraph.js addWidget or external panels

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Implementation Order

1. **Litegraph Prototype**: Start with Oscillator + ADC + Map nodes for dataflow validation
2. **WebAudio Testing**: Implement dynamic frequency control
3. **Code Generation**: Create C/Arduino skeleton generation
4. **WASM Integration**: Use emscripten for AMY compilation with AudioWorklet

## Design Guidelines

- Use smart flat design aesthetic
- Style with plain CSS and classes (no Tailwind CSS framework)
- Keep UI minimal and functional

## Key Technical Considerations

- AMY is a minimal audio library requiring custom node relationship definitions
- WASM audio output requires AudioWorklet and SharedArrayBuffer integration
- Code generation uses template-based approach

## File Structure (when implemented)

```
/src
  /nodes        # Custom Litegraph node definitions
  /audio        # WebAudio implementation
  /codegen      # Template-based code generation
  /ui           # Parameter UI components
/templates      # Arduino/C code templates
/public         # Static assets
```

## Testing Approach

- Test dataflow connections between nodes
- Verify audio output matches expected AMY behavior
- Validate generated code syntax and structure