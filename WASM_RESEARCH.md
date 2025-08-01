# AMY WebAssembly Integration Research

## Overview
This document outlines the research findings and implementation plan for integrating the AMY synthesizer library compiled to WebAssembly (WASM) into AmyNode for accurate audio preview.

## AMY Library Key Facts
- **Repository**: https://github.com/shorepine/amy
- **Authors**: Dan Ellis and Brian Whitman
- **Description**: High-performance fixed-point music synthesizer library for microcontrollers
- **Languages**: C with Python and Arduino bindings
- **Platforms**: Web, Mac, Linux, ESP32 variants, Teensy, Raspberry Pi, Playdate, Pi Pico, iOS, Daisy
- **Status**: Actively maintained as of 2025

## WebAssembly Compilation Status

### ✅ Native WASM Support
AMY has **built-in Emscripten support** with dedicated build targets:

```bash
# Build basic web version
make docs/amy.js

# Build version with audio input support
make docs/amy-audioin.js
```

### Current Web Demos
- **Piano Demo**: https://shorepine.github.io/amy/piano.html
- Web demos prove WASM compilation works well in production

### Technical Architecture
- Uses **AudioWorklet** for web audio processing
- Tulip Creative Computer uses AMY WASM with MicroPython integration
- Messages sent from web process to AudioWorklet running AMY

## Integration Plan for AmyNode

### Phase 1: Basic WASM Integration

#### 1.1 Build AMY WASM Module
```bash
git clone https://github.com/shorepine/amy.git
cd amy
# Install emscripten if not present
make docs/amy.js
```

#### 1.2 Create AmyNode WASM Wrapper
Create `src/audio/AmyWASM.js`:
- Load compiled amy.js module
- Provide JavaScript interface to AMY functions
- Handle WASM memory management
- Convert AmyNode parameters to AMY format

#### 1.3 Update AudioEngine
Modify `src/audio/engine.js` to use AMY WASM instead of WebAudio:
- Replace WebAudio oscillators with AMY oscillators
- Map node parameters to AMY API calls
- Handle real-time parameter updates

### Phase 2: Feature Mapping

#### 2.1 Oscillator Types
Map AmyNode oscillator types to AMY constants:
```javascript
const AMY_TYPES = {
    'SINE': 0,
    'PULSE': 1, 
    'SAW_DOWN': 2,
    'SAW_UP': 3,
    'TRIANGLE': 4,
    'NOISE': 5,
    'KS': 6,        // Karplus-Strong
    'PCM': 7,       // Sample playback
    'PARTIAL': 8,   // Additive synthesis
    'ALGO': 9,      // Algorithm synthesis
    'FM': 10        // FM synthesis
};
```

#### 2.2 Effects Integration
Map AmyNode effects to AMY effects:
- Reverb: `amy_set_reverb(level, feedback, liveness, damping)`
- Chorus: `amy_set_chorus(level, max_delay, lfo_freq, depth)`
- Echo: `amy_set_echo(delay_time, feedback, level, max_delay)`

#### 2.3 Filter Support
Map filter nodes to AMY filter parameters:
- LPF, HPF, BPF support built into AMY oscillators
- Per-oscillator filter configuration

### Phase 3: Advanced Features

#### 3.1 Modulation Routing
Implement AMY's oscillator-to-oscillator modulation:
- Map LFO nodes to low-frequency AMY oscillators
- Implement modulation matrix routing
- Support for FM synthesis with modulation

#### 3.2 Real-time Updates
- Parameter updates via `amy_set_*` functions
- Smooth parameter interpolation
- Handling of node connection changes

#### 3.3 Performance Optimization
- AMY oscillator pooling
- Efficient parameter batching
- Memory usage optimization

### Phase 4: Code Generation Alignment

#### 4.1 Accurate Preview
Ensure generated Arduino code matches WASM preview:
- Same AMY API calls in both environments
- Identical parameter mappings
- Consistent synthesis behavior

#### 4.2 Testing Framework
- Unit tests comparing WASM output to expected results
- Integration tests for complex patches
- Performance benchmarks

## Implementation Steps

### Step 1: Environment Setup
1. Clone AMY repository
2. Install Emscripten toolchain
3. Build AMY WASM module
4. Add amy.js to AmyNode public directory

### Step 2: WASM Wrapper Development
1. Create AmyWASM class for managing WASM module
2. Implement JavaScript ↔ WASM bridge functions
3. Add error handling and memory management

### Step 3: AudioEngine Replacement
1. Replace current WebAudio implementation
2. Integrate AMY WASM for all audio generation
3. Test basic oscillator functionality

### Step 4: Feature Parity
1. Implement all AMY oscillator types
2. Add filter and effect support
3. Complete modulation system integration

### Step 5: Testing & Optimization
1. Compare WASM output to Arduino code output
2. Performance tuning for real-time operation
3. Browser compatibility testing

## Benefits of AMY WASM Integration

### ✅ Accuracy
- **Bit-perfect** preview matching Arduino output
- Same synthesis algorithms and parameter handling
- Identical filter and effect processing

### ✅ Performance
- **Highly optimized** C code compiled to WASM
- Better performance than WebAudio for complex patches
- Designed for resource-constrained environments

### ✅ Feature Completeness
- Access to **all AMY features** including:
  - Karplus-Strong synthesis
  - Additive/partial synthesis  
  - Algorithm-based FM synthesis
  - Built-in effects and filters
  - Advanced modulation routing

### ✅ Maintainability
- **Single codebase** for preview and Arduino generation
- Automatic feature parity as AMY library evolves
- Proven WebAssembly build system

## Technical Considerations

### Memory Management
- WASM heap size configuration
- Oscillator allocation/deallocation
- Parameter buffer management

### Audio Context Integration
- AudioWorklet vs ScriptProcessor compatibility
- Sample rate matching
- Latency optimization

### Browser Support
- Modern browser WASM support (95%+ coverage)
- AudioWorklet fallback strategies
- Mobile device compatibility

## Timeline Estimate

- **Phase 1**: 2-3 days (basic WASM integration)
- **Phase 2**: 3-4 days (feature mapping)
- **Phase 3**: 2-3 days (advanced features)
- **Phase 4**: 1-2 days (code generation alignment)

**Total**: ~8-12 days for complete AMY WASM integration

## Next Actions

1. ✅ Clone AMY repository and build WASM module
2. ✅ Analyze current AmyNode AudioEngine architecture
3. ✅ Design WASM wrapper API
4. ✅ Implement basic oscillator integration
5. ✅ Extend to full feature set
6. ✅ Performance testing and optimization

This integration will provide AmyNode with **industry-grade synthesis accuracy** while maintaining the visual programming interface and Arduino code generation capabilities.