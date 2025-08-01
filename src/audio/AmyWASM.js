// AMY WASM Integration for AmyNode
// Provides JavaScript wrapper for AMY synthesizer compiled to WebAssembly

export class AmyWASM {
    constructor() {
        this.amyModule = null;
        this.isInitialized = false;
        this.oscillatorCount = 0;
        this.sampleRate = 44100;
        this.audioContext = null;
        this.audioWorklet = null;
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
            
            // Initialize AMY
            this.amyModule._amy_start_web();
            
            // Setup AudioWorklet for real-time processing
            await this.setupAudioWorklet();
            
            this.isInitialized = true;
            
            return true;
        } catch (error) {
            console.error('Failed to initialize AMY WASM:', error);
            return false;
        }
    }
    
    async setupAudioWorklet() {
        try {
            // Add worklet module
            await this.audioContext.audioWorklet.addModule('/src/audio/AmyWorkletProcessor.js');
            
            // Create worklet node
            this.audioWorklet = new AudioWorkletNode(this.audioContext, 'amy-worklet-processor', {
                numberOfInputs: 0,
                numberOfOutputs: 1,
                outputChannelCount: [2] // Stereo output
            });
            
            // Send WASM module to worklet
            this.audioWorklet.port.postMessage({
                type: 'init',
                wasmModule: this.amyModule
            });
            
            // Wait for initialization
            return new Promise((resolve, reject) => {
                this.audioWorklet.port.onmessage = (event) => {
                    if (event.data.type === 'initialized') {
                        console.log('AMY AudioWorklet initialized');
                        resolve();
                    } else if (event.data.type === 'error') {
                        reject(new Error(event.data.error));
                    }
                };
            });
        } catch (error) {
            console.error('Failed to setup AudioWorklet:', error);
            throw error;
        }
    }
    
    // Connect to audio destination
    connect(destination) {
        if (this.audioWorklet) {
            this.audioWorklet.connect(destination);
        }
    }
    
    // Disconnect from audio destination
    disconnect() {
        if (this.audioWorklet) {
            this.audioWorklet.disconnect();
        }
    }

    // Load AMY module dynamically to avoid Vite import issues
    async loadAmyModule() {
        return new Promise((resolve, reject) => {
            // Create script element to load amy.js
            const script = document.createElement('script');
            script.src = '/amy.js';
            script.onload = () => {
                // AMY module should be available as window.amyModule or global amyModule
                const moduleFactory = window.amyModule || (typeof amyModule !== 'undefined' ? amyModule : null);
                if (moduleFactory) {
                    moduleFactory().then(resolve).catch(reject);
                } else {
                    reject(new Error('AMY module not found after loading - check amy.js export'));
                }
            };
            script.onerror = () => {
                reject(new Error('Failed to load amy.js'));
            };
            document.head.appendChild(script);
        });
    }

    // Create an oscillator and return its index
    createOscillator(properties = {}) {
        if (!this.isInitialized) {
            console.error('AmyWASM not initialized');
            return -1;
        }

        const oscId = this.oscillatorCount++;
        
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
        
        console.log(`Created AMY oscillator ${oscId} with type ${properties.wave_type}`);
        return oscId;
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
        if (!this.isInitialized || !this.amyModule) return;
        
        try {
            // Convert JavaScript string to C string
            const messagePtr = this.amyModule._malloc(message.length + 1);
            this.amyModule.stringToUTF8(message, messagePtr, message.length + 1);
            
            // Send message to AMY
            this.amyModule._amy_add_message(messagePtr);
            
            // Free memory
            this.amyModule._free(messagePtr);
            
            console.log(`AMY message: ${message}`);
        } catch (error) {
            console.error('Error sending AMY message:', error);
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