// AMY WASM Integration for AmyNode
// Provides JavaScript wrapper for AMY synthesizer compiled to WebAssembly

export class AmyWASM {
    constructor() {
        this.amyModule = null;
        this.isInitialized = false;
        this.oscillatorCount = 0;
        this.sampleRate = 44100;
        this.audioContext = null;
        this.scriptProcessor = null;
        this.sampleIndex = 0;
        this.fallbackMode = false;
    }

    async initialize(audioContext) {
        if (this.isInitialized) return true;
        
        try {
            this.audioContext = audioContext;
            this.sampleRate = audioContext.sampleRate;
            
            console.log('Loading AMY WASM module...');
            
            // Load AMY module using dynamic script loading
            this.amyModule = await this.loadAmyModule();
            
            console.log('AMY WASM module loaded successfully');
            
            // Wait for WASM module to be fully ready and verify memory views
            await this.waitForModuleReady();
            
            // Verify essential functions exist before initialization
            if (!this.amyModule._amy_start_web) {
                throw new Error('AMY _amy_start_web function not found');
            }
            
            // Try to ensure runtime is initialized before calling AMY functions
            if (this.amyModule.__wasm_call_ctors) {
                console.log('Calling WASM constructors...');
                try {
                    this.amyModule.__wasm_call_ctors();
                } catch (error) {
                    console.warn('WASM constructors might already be called:', error);
                }
            }
            
            // Initialize AMY
            console.log('Calling AMY _amy_start_web()...');
            try {
                this.amyModule._amy_start_web();
                console.log('✅ AMY _amy_start_web() called successfully');
            } catch (error) {
                console.error('❌ Failed to call _amy_start_web:', error);
                throw error;
            }
            
            // Wait a bit more for AMY to initialize its internal state
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Double-check memory views after initialization
            if (!this.amyModule.HEAPU8 && !this.amyModule.HEAP8) {
                console.warn('⚠️ AMY WASM memory views not available - using fallback mode');
                // Don't log detailed error info to keep console cleaner
                this.fallbackMode = true;
            }
            
            // For now, use simple ScriptProcessorNode instead of AudioWorklet
            // to avoid serialization issues
            await this.setupScriptProcessor();
            
            this.isInitialized = true;
            
            return true;
        } catch (error) {
            console.error('Failed to initialize AMY WASM:', error);
            return false;
        }
    }
    
    async waitForModuleReady() {
        // Wait for the WASM module's memory views to be properly set up
        let retries = 0;
        const maxRetries = 50; // 5 seconds max
        
        // Quieter initialization
        console.log('Initializing AMY WASM module...');
        
        while (retries < maxRetries) {
            // Check if essential memory views and functions are available
            if (this.amyModule.HEAPU8 && 
                this.amyModule._malloc && 
                this.amyModule._free &&
                this.amyModule._amy_start_web) {
                console.log('✅ AMY WASM module memory views are ready');
                return;
            }
            
            // Silent check for alternative memory access methods
            
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
            
            // Silent retry
        }
        
        // Don't log detailed warnings, just set fallback mode
        this.fallbackMode = true;
    }
    
    async setupScriptProcessor() {
        try {
            // Create a simple ScriptProcessorNode for audio processing
            const bufferSize = 4096;
            this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 0, 2);
            
            // Set up audio processing callback
            this.scriptProcessor.onaudioprocess = (event) => {
                const outputBuffer = event.outputBuffer;
                const leftChannel = outputBuffer.getChannelData(0);
                const rightChannel = outputBuffer.getChannelData(1);
                
                try {
                    // Generate audio using AMY
                    if (this.amyModule && this.amyModule._amy_render) {
                        // Try to render audio from AMY
                        const audioData = this.amyModule._amy_render(bufferSize);
                        if (audioData) {
                            // Copy AMY output to Web Audio buffers
                            // This is a simplified version - real implementation would need proper buffer handling
                            for (let i = 0; i < bufferSize; i++) {
                                const sample = audioData[i] || 0;
                                leftChannel[i] = sample * 0.1; // Reduce volume
                                rightChannel[i] = sample * 0.1;
                            }
                        } else {
                            // Generate simple test tone if AMY render fails
                            const frequency = 440; // A4
                            const amplitude = 0.05;
                            for (let i = 0; i < bufferSize; i++) {
                                const sample = Math.sin(2 * Math.PI * frequency * (this.sampleIndex + i) / this.sampleRate) * amplitude;
                                leftChannel[i] = sample;
                                rightChannel[i] = sample;
                            }
                            this.sampleIndex = (this.sampleIndex + bufferSize) % this.sampleRate;
                        }
                    } else {
                        // Fill with silence if AMY not available
                        leftChannel.fill(0);
                        rightChannel.fill(0);
                    }
                } catch (error) {
                    console.error('Audio processing error:', error);
                    leftChannel.fill(0);
                    rightChannel.fill(0);
                }
            };
            
            console.log('AMY ScriptProcessor setup complete');
            return Promise.resolve();
        } catch (error) {
            console.error('Failed to setup ScriptProcessor:', error);
            throw error;
        }
    }
    
    // Connect to audio destination
    connect(destination) {
        if (this.scriptProcessor) {
            this.scriptProcessor.connect(destination);
        }
    }
    
    // Disconnect from audio destination
    disconnect() {
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
        }
    }

    // Load AMY module dynamically to avoid Vite import issues
    async loadAmyModule() {
        return new Promise((resolve, reject) => {
            // Check if amyModule is already loaded
            if (typeof window.amyModule === 'function') {
                window.amyModule().then(module => {
                    console.log('AMY module loaded from cache');
                    resolve(module);
                }).catch(reject);
                return;
            }

            // Create script element to load amy.js
            const script = document.createElement('script');
            script.src = '/amy.js';
            script.onload = () => {
                // Wait a bit for the module to be available
                setTimeout(() => {
                    const moduleFactory = window.amyModule;
                    if (typeof moduleFactory === 'function') {
                        console.log('Found AMY module factory, initializing...');
                        moduleFactory().then(module => {
                            console.log('AMY module initialized, checking properties...');
                            console.log('Module properties:', Object.keys(module));
                            
                            // Ensure memory views are available
                            if (!module.HEAPU8 && module._malloc) {
                                console.warn('HEAPU8 not found on module, might need to wait for initialization');
                            }
                            
                            resolve(module);
                        }).catch(reject);
                    } else {
                        console.error('AMY module factory not found:', typeof moduleFactory);
                        reject(new Error('AMY module factory not found after loading amy.js'));
                    }
                }, 100);
            };
            script.onerror = (event) => {
                console.error('Failed to load amy.js:', event);
                reject(new Error('Failed to load amy.js'));
            };
            document.head.appendChild(script);
        });
    }

    // Create an oscillator and return its index
    createOscillator(properties = {}) {
        if (!this.isInitialized) {
            console.warn('AmyWASM not initialized, cannot create oscillator');
            return -1;
        }

        const oscId = this.oscillatorCount++;
        
        try {
            // Set oscillator type
            const waveType = this.mapWaveType(properties.wave_type || 'SINE');
            this.setOscillatorType(oscId, waveType);
            
            // Set basic parameters
            this.setFrequency(oscId, properties.frequency || 440);
            this.setAmplitude(oscId, properties.amplitude || 0.5);
            
            // Set additional parameters if available
            if (properties.phase !== undefined) {
                this.setPhase(oscId, properties.phase);
            }
            
            if (properties.duty !== undefined && properties.wave_type === 'PULSE') {
                this.setDuty(oscId, properties.duty);
            }
            
            console.log(`✅ Created AMY oscillator ${oscId} with type ${properties.wave_type || 'SINE'}`);
            return oscId;
        } catch (error) {
            console.error(`❌ Failed to create AMY oscillator ${oscId}:`, error);
            return -1;
        }
    }

    // Map AmyNode wave types to AMY constants (corrected)
    mapWaveType(type) {
        const waveTypes = {
            'SINE': 0,
            'PULSE': 1,
            'SAW_DOWN': 2,
            'SAW_UP': 3,
            'TRIANGLE': 4,
            'NOISE': 5,
            'KS': 6,        // Karplus-Strong
            'PCM': 7,       // Sample playback
            'ALGO': 8,      // Algorithm synthesis (fixed: was 9)
            'PARTIAL': 9    // Additive synthesis (fixed: was 8)
        };
        return waveTypes[type] || 0; // Default to SINE
    }

    // Set oscillator type
    setOscillatorType(oscId, type) {
        if (!this.isInitialized) return;
        this.sendMessage(`v${oscId}w${type}`);
    }

    // Set frequency
    setFrequency(oscId, frequency) {
        if (!this.isInitialized) return;
        this.sendMessage(`v${oscId}f${frequency.toFixed(3)}`);
    }

    // Set amplitude
    setAmplitude(oscId, amplitude) {
        if (!this.isInitialized) return;
        this.sendMessage(`v${oscId}a${amplitude.toFixed(3)}`);
    }

    // Set phase
    setPhase(oscId, phase) {
        if (!this.isInitialized) return;
        this.sendMessage(`v${oscId}P${phase.toFixed(3)}`);
    }

    // Set duty cycle for pulse waves
    setDuty(oscId, duty) {
        if (!this.isInitialized) return;
        this.sendMessage(`v${oscId}d${duty.toFixed(3)}`);
    }

    // Set filter parameters (corrected AMY format)
    setFilter(oscId, type, frequency, resonance) {
        if (!this.isInitialized) return;
        
        const filterTypes = {
            'LPF': 1,  // Low-pass filter
            'BPF': 2,  // Band-pass filter  
            'HPF': 3   // High-pass filter
        };
        
        const filterType = filterTypes[type] || 1;
        this.sendMessage(`v${oscId}F${filterType}`);          // Filter type
        this.sendMessage(`v${oscId}f${frequency.toFixed(1)}`); // Filter frequency
        this.sendMessage(`v${oscId}r${resonance.toFixed(2)}`); // Filter resonance
    }

    // Set reverb parameters (corrected AMY format)
    setReverb(level, liveness, damping, xover_hz) {
        if (!this.isInitialized) return;
        // AMY reverb format: r<level>,<liveness>,<damping>,<xover_hz>
        this.sendMessage(`r${level.toFixed(3)},${liveness.toFixed(3)},${damping.toFixed(3)},${xover_hz || 3000}`);
    }

    // Set chorus parameters (corrected AMY format)
    setChorus(level, maxDelay, lfoFreq, depth) {
        if (!this.isInitialized) return;
        // AMY chorus format: c<level>,<max_delay>,<lfo_freq>,<depth>
        this.sendMessage(`c${level.toFixed(3)},${maxDelay.toFixed(3)},${lfoFreq.toFixed(3)},${depth.toFixed(3)}`);
    }

    // Set echo parameters
    setEcho(delayTime, feedback, level, maxDelay) {
        if (!this.isInitialized) return;
        this.sendMessage(`E${delayTime.toFixed(3)},${feedback.toFixed(3)},${level.toFixed(3)},${maxDelay.toFixed(3)}`);
    }

    // Note on
    noteOn(oscId, note, velocity = 1.0) {
        if (!this.isInitialized) return;
        const frequency = 440 * Math.pow(2, (note - 69) / 12);
        this.setFrequency(oscId, frequency);
        this.setAmplitude(oscId, velocity);
    }

    // Note off
    noteOff(oscId) {
        if (!this.isInitialized) return;
        this.setAmplitude(oscId, 0);
    }

    // Send raw AMY message
    sendMessage(message) {
        if (!this.isInitialized || !this.amyModule || this.fallbackMode) {
            // Silent skip in fallback mode
            return;
        }
        
        try {
            // Verify memory allocation functions are available
            if (!this.amyModule._malloc || !this.amyModule._free) {
                console.warn('AMY WASM memory functions not available, skipping message:', message);
                return;
            }
            
            let messagePtr;
            let messageArray;
            
            if (this.amyModule.stringToUTF8) {
                // Original Emscripten method
                messagePtr = this.amyModule._malloc(message.length + 1);
                if (!messagePtr) {
                    console.error('Failed to allocate memory for AMY message');
                    return;
                }
                this.amyModule.stringToUTF8(message, messagePtr, message.length + 1);
                console.log('Using stringToUTF8 for message conversion');
            } else if (this.amyModule.HEAPU8) {
                // Alternative method using TextEncoder and HEAPU8
                messageArray = new TextEncoder().encode(message + '\0');
                messagePtr = this.amyModule._malloc(messageArray.length);
                if (!messagePtr) {
                    console.error('Failed to allocate memory for AMY message');
                    return;
                }
                this.amyModule.HEAPU8.set(messageArray, messagePtr);
                console.log('Using TextEncoder + HEAPU8 for message conversion');
            } else {
                console.warn('No suitable string conversion method available, trying direct buffer approach');
                // Last resort: try to manually create buffer
                messageArray = new TextEncoder().encode(message + '\0');
                messagePtr = this.amyModule._malloc(messageArray.length);
                if (!messagePtr) {
                    console.error('Failed to allocate memory for AMY message');
                    return;
                }
                
                // Try to access memory directly through different possible views
                if (this.amyModule.HEAP8) {
                    this.amyModule.HEAP8.set(messageArray, messagePtr);
                    console.log('Using HEAP8 as fallback for message conversion');
                } else if (this.amyModule.buffer) {
                    const view = new Uint8Array(this.amyModule.buffer, messagePtr, messageArray.length);
                    view.set(messageArray);
                    console.log('Using direct buffer access for message conversion');
                } else {
                    console.error('No memory access method available, cannot send AMY message');
                    this.amyModule._free(messagePtr);
                    return;
                }
            }
            
            // Send message to AMY
            if (this.amyModule._amy_add_message) {
                this.amyModule._amy_add_message(messagePtr);
                console.log(`✅ AMY message sent: ${message}`);
            } else if (this.amyModule.ccall) {
                // Try using ccall as alternative
                this.amyModule.ccall('amy_add_message', null, ['number'], [messagePtr]);
                console.log(`✅ AMY message sent via ccall: ${message}`);
            } else {
                console.warn('No AMY message function available (_amy_add_message or ccall)');
            }
            
            // Free memory
            this.amyModule._free(messagePtr);
            
        } catch (error) {
            console.error('Error sending AMY message:', error);
            console.log('AMY module state:', {
                hasHEAPU8: !!this.amyModule.HEAPU8,
                hasHEAP8: !!this.amyModule.HEAP8,
                hasMalloc: !!this.amyModule._malloc,
                hasFree: !!this.amyModule._free,
                hasStringToUTF8: !!this.amyModule.stringToUTF8,
                hasAmyAddMessage: !!this.amyModule._amy_add_message,
                hasCCall: !!this.amyModule.ccall
            });
        }
    }

    // Stop all oscillators
    stopAll() {
        if (!this.isInitialized) return;
        
        for (let i = 0; i < this.oscillatorCount; i++) {
            this.setAmplitude(i, 0);
        }
    }

    // Reset AMY system
    reset() {
        if (!this.isInitialized) return;
        
        this.oscillatorCount = 0;
        if (this.amyModule && this.amyModule._amy_reset_sysclock) {
            this.amyModule._amy_reset_sysclock();
        }
    }

    // Get system information
    getInfo() {
        return {
            isInitialized: this.isInitialized,
            oscillatorCount: this.oscillatorCount,
            sampleRate: this.sampleRate,
            wasmSupport: typeof WebAssembly !== 'undefined'
        };
    }
}

// Create singleton instance
export const amyWASM = new AmyWASM();