import { amyWASM } from './AmyWASM.js';

export class AudioEngine {
    constructor() {
        this.context = null;
        this.nodes = new Map();
        this.isRunning = false;
        this.masterGain = null;
        this.useAMYWASM = false; // Toggle for WASM vs WebAudio
        this.amyInitialized = false;
    }
    
    async start() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
        }
        
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
        
        // Try to initialize AMY WASM if not already done
        if (!this.amyInitialized) {
            try {
                console.log('🔄 Initializing audio engine...');
                const amySuccess = await amyWASM.initialize(this.context);
                // For now, always use WebAudio fallback
                console.log('🎵 Using WebAudio for preview');
                this.amyInitialized = false;
                this.createWebAudioFallback();
            } catch (error) {
                console.error('AMY WASM initialization failed:', error);
                console.log('⚠️ Using WebAudio fallback due to AMY WASM error');
                this.createWebAudioFallback();
            }
        }
        
        this.isRunning = true;
    }
    
    createWebAudioFallback() {
        // Create a simple test tone for verification when AMY WASM fails
        if (!this.testOscillator) {
            this.testOscillator = this.context.createOscillator();
            this.testGain = this.context.createGain();
            
            this.testOscillator.frequency.value = 440; // A4
            this.testGain.gain.value = 0.1; // Low volume
            
            this.testOscillator.connect(this.testGain);
            this.testGain.connect(this.masterGain);
            
            this.testOscillator.start();
            // Silent start
        }
    }
    
    stop() {
        this.isRunning = false;
        this.clearAllNodes();
        
        // Stop test oscillator if running
        if (this.testOscillator) {
            try {
                this.testOscillator.stop();
                this.testOscillator.disconnect();
                this.testGain.disconnect();
            } catch (error) {
                // Oscillator may already be stopped
            }
            this.testOscillator = null;
            this.testGain = null;
            console.log('🔇 Test oscillator stopped');
        }
    }
    
    clearAllNodes() {
        this.nodes.forEach(node => {
            if (node.oscillator) {
                node.oscillator.stop();
                node.oscillator.disconnect();
            }
            if (node.gain) {
                node.gain.disconnect();
            }
        });
        this.nodes.clear();
    }
    
    updateFromGraph(graph) {
        if (!this.isRunning || !this.context) return;
        
        // New node system doesn't have runStep, skip it
        // graph.runStep();
        
        const graphNodes = graph.getNodes();
        const existingIds = new Set(this.nodes.keys());
        const currentIds = new Set(graphNodes.map(n => n.id));
        
        // Remove deleted nodes
        existingIds.forEach(id => {
            if (!currentIds.has(id)) {
                this.removeAudioNode(id);
            }
        });
        
        // Update each node type
        graphNodes.forEach(node => {
            switch (node.type) {
                case "oscillator":
                case "amy/oscillator":
                    this.updateOscillator(node);
                    break;
                case "lfo":
                case "amy/lfo":
                    this.updateLFO(node);
                    break;
                case "mixer":
                case "amy/mixer":
                    this.updateMixer(node);
                    break;
                case "filter":
                case "amy/filter":
                    this.updateFilter(node);
                    break;
                case "reverb":
                case "amy/reverb":
                    this.updateReverb(node);
                    break;
                case "chorus":
                case "amy/chorus":
                    this.updateChorus(node);
                    break;
                case "echo":
                case "amy/echo":
                    this.updateEcho(node);
                    break;
                case "amy/sampleplayer":
                    this.updateSamplePlayer(node);
                    break;
                case "amy/sequencer":
                    this.updateSequencer(node);
                    break;
                case "amy/clock":
                    this.updateClock(node);
                    break;
                case "amy/keyboard":
                    this.updateKeyboard(node);
                    break;
                case "amy/drums":
                    this.updateDrumMachine(node);
                    break;
                case "output":
                case "amy/output":
                    this.updateOutput(node);
                    break;
            }
        });
        
        this.updateConnections(graph);
    }
    
    updateOscillator(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        // Try AMY WASM first if available
        if (this.amyInitialized && !audioNode) {
            try {
                const amyOscId = amyWASM.createOscillator(graphNode.properties);
                if (amyOscId >= 0) {
                    audioNode = { 
                        amyOscId, 
                        type: 'oscillator', 
                        isAMY: true 
                    };
                    this.nodes.set(graphNode.id, audioNode);
                    console.log(`✅ Using AMY WASM for oscillator ${graphNode.id}`);
                    return; // Early return for AMY WASM
                } else {
                    console.log(`⚠️ AMY WASM oscillator creation failed, falling back to WebAudio for ${graphNode.id}`);
                }
            } catch (error) {
                console.error(`❌ AMY WASM oscillator error for ${graphNode.id}:`, error);
                console.log('🔄 Falling back to WebAudio approximation');
            }
        }
        
        // Fallback to WebAudio if AMY WASM not available or failed
        if (!audioNode) {
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();
            
            // Chain: oscillator -> filter -> gain -> output
            oscillator.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            oscillator.start();
            
            audioNode = { oscillator, gain, filter, type: 'oscillator', isAMY: false };
            this.nodes.set(graphNode.id, audioNode);
            console.log(`⚠️ Using WebAudio approximation for oscillator ${graphNode.id}`);
        }
        
        // Map AMY wave types to WebAudio types
        const waveTypes = {
            'SINE': 'sine',
            'PULSE': 'square',  // Pulse approximated as square
            'SAW_DOWN': 'sawtooth',
            'SAW_UP': 'sawtooth', // Both sawtooth types use same WebAudio type
            'TRIANGLE': 'triangle',
            'NOISE': 'sawtooth', // Noise approximated (would need white noise generator)
            'KS': 'sawtooth',    // Karplus-Strong approximated
            'PCM': 'sine',       // Sample playback approximated as sine
            'PARTIAL': 'sine',   // Partial synthesis approximated
            'ALGO': 'sine',      // Algorithm synthesis approximated
            'FM': 'sine'         // FM synthesis approximated
        };
        
        // Get parameters from new or legacy system
        let waveType, frequency, amplitude;
        if (graphNode.getParameter) {
            // New node system
            waveType = graphNode.getParameter('wave_type') || 'SINE';
            frequency = graphNode.getParameter('frequency') || 440;
            amplitude = graphNode.getParameter('amplitude') || 0.5;
        } else {
            // Legacy properties system - handle undefined properties
            const properties = graphNode.properties || {};
            waveType = properties.wave_type || 'SINE';
            frequency = properties.frequency || 440;
            amplitude = properties.amplitude || 0.5;
        }
        
        audioNode.oscillator.type = waveTypes[waveType] || 'sine';
        
        // Get input values or use parameter defaults
        const freq = graphNode.getInputData?.(0) ?? frequency;
        const amp = graphNode.getInputData?.(1) ?? amplitude;
        const modAmount = graphNode.getInputData?.(2) ?? 0;
        
        // Update parameters - different logic for AMY vs WebAudio
        if (audioNode.isAMY) {
            // Update AMY WASM oscillator with error handling
            try {
                amyWASM.setFrequency(audioNode.amyOscId, freq);
                amyWASM.setAmplitude(audioNode.amyOscId, amp);
                
                // Update wave type if changed
                if (waveType) {
                    const amyWaveType = amyWASM.mapWaveType(waveType);
                    amyWASM.setOscillatorType(audioNode.amyOscId, amyWaveType);
                }
            } catch (error) {
                console.error(`❌ Failed to update AMY oscillator ${audioNode.amyOscId}:`, error);
            }
        } else {
            // Update WebAudio oscillator
            audioNode.oscillator.frequency.setValueAtTime(freq, this.context.currentTime);
            audioNode.gain.gain.setValueAtTime(amp, this.context.currentTime);
        }
        
        // Apply filter if configured (only for WebAudio nodes)
        const properties = graphNode.properties || {};
        if (!audioNode.isAMY && audioNode.filter && properties.filter_type !== "NONE") {
            const filterTypes = {
                'LPF': 'lowpass',
                'HPF': 'highpass', 
                'BPF': 'bandpass'
            };
            audioNode.filter.type = filterTypes[properties.filter_type] || 'lowpass';
            audioNode.filter.frequency.setValueAtTime(
                properties.filter_freq || 1000, 
                this.context.currentTime
            );
            audioNode.filter.Q.setValueAtTime(
                properties.filter_resonance || 1, 
                this.context.currentTime
            );
        } else if (audioNode.isAMY && properties.filter_type && properties.filter_type !== "NONE") {
            // Handle AMY filter settings
            try {
                amyWASM.setFilter(audioNode.amyOscId, 
                    properties.filter_type, 
                    properties.filter_freq || 1000, 
                    properties.filter_resonance || 1);
            } catch (error) {
                console.error('Failed to set AMY filter:', error);
            }
        }
        
        // Apply phase offset if available (only for WebAudio)
        if (!audioNode.isAMY && audioNode.oscillator && properties.phase !== undefined) {
            // WebAudio doesn't support direct phase control, but we can approximate
            audioNode.oscillator.detune.setValueAtTime(
                properties.phase * 100, 
                this.context.currentTime
            );
        } else if (audioNode.isAMY && properties.phase !== undefined) {
            // AMY supports direct phase control
            try {
                amyWASM.setPhase(audioNode.amyOscId, properties.phase);
            } catch (error) {
                console.error('Failed to set AMY phase:', error);
            }
        }
    }
    
    updateMixer(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        if (!audioNode) {
            const mixerGain = this.context.createGain();
            mixerGain.connect(this.masterGain);
            
            audioNode = { 
                gain: mixerGain, 
                type: 'mixer',
                inputGains: []
            };
            
            for (let i = 0; i < 4; i++) {
                const inputGain = this.context.createGain();
                inputGain.connect(mixerGain);
                audioNode.inputGains.push(inputGain);
            }
            
            this.nodes.set(graphNode.id, audioNode);
        }
        
        const properties = graphNode.properties || {};
        audioNode.gain.gain.setValueAtTime(
            properties.master_gain || 1.0, 
            this.context.currentTime
        );
        
        for (let i = 0; i < 4; i++) {
            const gainValue = properties[`gain${i + 1}`] || 1.0;
            audioNode.inputGains[i].gain.setValueAtTime(
                gainValue, 
                this.context.currentTime
            );
        }
    }
    
    removeAudioNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        // Stop and disconnect oscillators
        if (node.oscillator) {
            try {
                node.oscillator.stop();
                node.oscillator.disconnect();
            } catch (e) {
                // Oscillator might already be stopped
            }
        }
        
        // Disconnect gain nodes
        if (node.gain) {
            node.gain.disconnect();
        }
        
        // Disconnect input/output gains
        if (node.inputGain) {
            node.inputGain.disconnect();
        }
        if (node.outputGain) {
            node.outputGain.disconnect();
        }
        
        // Disconnect input gains (mixer)
        if (node.inputGains) {
            node.inputGains.forEach(g => g.disconnect());
        }
        
        // Disconnect filters
        if (node.filter) {
            node.filter.disconnect();
        }
        
        // Disconnect effect nodes
        if (node.convolver) node.convolver.disconnect();
        if (node.delay) node.delay.disconnect();
        if (node.feedback) node.feedback.disconnect();
        if (node.wetGain) node.wetGain.disconnect();
        if (node.dryGain) node.dryGain.disconnect();
        if (node.output) node.output.disconnect();
        if (node.lfo) {
            try {
                node.lfo.stop();
                node.lfo.disconnect();
            } catch (e) {
                // LFO might already be stopped
            }
        }
        if (node.lfoGain) node.lfoGain.disconnect();
        
        // Disconnect sample/drum nodes
        if (node.noise) {
            try {
                node.noise.stop();
                node.noise.disconnect();
            } catch (e) {
                // Buffer source might already be stopped
            }
        }
        
        this.nodes.delete(nodeId);
    }
    
    updateConnections(graph) {
        // First, disconnect all existing connections except to masterGain
        this.nodes.forEach(node => {
            if (node.gain && node.type === 'oscillator') {
                node.gain.disconnect();
            }
            if (node.outputGain && node.type === 'output') {
                // Keep output connected to masterGain, but disconnect input
                if (node.inputGain) {
                    node.inputGain.disconnect();
                }
            }
        });
        
        // Re-establish connections based on actual graph links
        if (graph.links) {
            Object.values(graph.links).forEach(link => {
                if (link) {
                    const sourceAudioNode = this.nodes.get(link.origin_id);
                    const targetAudioNode = this.nodes.get(link.target_id);
                    
                    if (sourceAudioNode && targetAudioNode) {
                        this.connectAudioNodes(sourceAudioNode, targetAudioNode, link.target_slot);
                        console.log(`🔗 Connected ${sourceAudioNode.type} → ${targetAudioNode.type}`);
                    }
                }
            });
        }
        
        // Connect any unconnected oscillators directly to master (fallback)
        this.nodes.forEach((node, nodeId) => {
            if (node.type === 'oscillator' && node.gain) {
                // Check if this oscillator is connected to anything
                const hasConnection = graph.links && Object.values(graph.links).some(link => 
                    link && link.origin_id === nodeId
                );
                
                if (!hasConnection) {
                    console.log(`🔗 Fallback: Connecting unconnected ${node.type} to master`);
                    node.gain.connect(this.masterGain);
                }
            }
        });
    }
    
    connectAudioNodes(sourceAudioNode, targetAudioNode, targetInput = 0) {
        if (!sourceAudioNode || !targetAudioNode) return;
        
        // Get the source output node
        let sourceOutput = null;
        if (sourceAudioNode.gain) {
            sourceOutput = sourceAudioNode.gain;
        } else if (sourceAudioNode.output) {
            sourceOutput = sourceAudioNode.output;
        } else if (sourceAudioNode.oscillator) {
            sourceOutput = sourceAudioNode.oscillator;
        }
        
        // Get the target input node
        let targetInput_node = null;
        if (targetAudioNode.type === 'output' && targetAudioNode.inputGain) {
            targetInput_node = targetAudioNode.inputGain;
        } else if (targetAudioNode.type === 'mixer' && targetAudioNode.inputGains) {
            targetInput_node = targetAudioNode.inputGains[targetInput] || targetAudioNode.inputGains[0];
        } else if (targetAudioNode.input && Array.isArray(targetAudioNode.input)) {
            targetInput_node = targetAudioNode.input[0]; // Use first input for chorus/echo
        } else if (targetAudioNode.dryGain) {
            targetInput_node = targetAudioNode.dryGain; // For effects
        } else if (targetAudioNode.filter) {
            targetInput_node = targetAudioNode.filter;
        }
        
        // Make the connection
        if (sourceOutput && targetInput_node) {
            try {
                sourceOutput.connect(targetInput_node);
                console.log(`✅ Audio connection: ${sourceAudioNode.type} → ${targetAudioNode.type}`);
            } catch (error) {
                console.error(`❌ Audio connection failed: ${sourceAudioNode.type} → ${targetAudioNode.type}`, error);
            }
        } else {
            console.warn(`⚠️ Could not connect: ${sourceAudioNode.type} → ${targetAudioNode.type} (missing nodes)`);
        }
    }

    // LFO Node - Low frequency oscillator for modulation
    updateLFO(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        if (!audioNode) {
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            
            oscillator.connect(gain);
            // LFOs don't connect to audio output by default
            
            oscillator.start();
            
            audioNode = { oscillator, gain, type: 'lfo' };
            this.nodes.set(graphNode.id, audioNode);
        }
        
        // LFOs use very low frequencies
        const properties = graphNode.properties || {};
        const frequency = Math.max(0.1, properties.frequency || 1);
        audioNode.oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
        audioNode.gain.gain.setValueAtTime(properties.amplitude || 1, this.context.currentTime);
    }

    // Filter Node - Audio processing filter
    updateFilter(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        if (!audioNode) {
            const filter = this.context.createBiquadFilter();
            const gain = this.context.createGain();
            
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            audioNode = { filter, gain, type: 'filter' };
            this.nodes.set(graphNode.id, audioNode);
        }
        
        const filterTypes = {
            'LPF': 'lowpass',
            'HPF': 'highpass',
            'BPF': 'bandpass'
        };
        
        const properties = graphNode.properties || {};
        audioNode.filter.type = filterTypes[properties.filter_type] || 'lowpass';
        audioNode.filter.frequency.setValueAtTime(
            properties.frequency || 1000,
            this.context.currentTime
        );
        audioNode.filter.Q.setValueAtTime(
            properties.resonance || 1,
            this.context.currentTime
        );
    }

    // Reverb Effect
    updateReverb(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        if (!audioNode) {
            // Simple reverb approximation using delay and feedback
            const convolver = this.context.createConvolver();
            const dryGain = this.context.createGain();
            const wetGain = this.context.createGain();
            const output = this.context.createGain();
            
            // Create simple impulse response
            this.createReverbImpulse(convolver);
            
            // Setup routing: input -> dry + (convolver -> wet) -> output
            dryGain.connect(output);
            convolver.connect(wetGain);
            wetGain.connect(output);
            output.connect(this.masterGain);
            
            audioNode = { 
                convolver, dryGain, wetGain, output, 
                type: 'reverb',
                input: dryGain // For connection convenience
            };
            this.nodes.set(graphNode.id, audioNode);
        }
        
        const properties = graphNode.properties || {};
        const level = properties.level || 0.3;
        audioNode.dryGain.gain.setValueAtTime(1 - level, this.context.currentTime);
        audioNode.wetGain.gain.setValueAtTime(level, this.context.currentTime);
    }

    // Chorus Effect
    updateChorus(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        if (!audioNode) {
            const delay = this.context.createDelay();
            const lfo = this.context.createOscillator();
            const lfoGain = this.context.createGain();
            const wetGain = this.context.createGain();
            const dryGain = this.context.createGain();
            const output = this.context.createGain();
            
            // Setup chorus modulation
            lfo.connect(lfoGain);
            lfoGain.connect(delay.delayTime);
            delay.connect(wetGain);
            wetGain.connect(output);
            dryGain.connect(output);
            output.connect(this.masterGain);
            
            lfo.start();
            
            audioNode = { 
                delay, lfo, lfoGain, wetGain, dryGain, output,
                type: 'chorus',
                input: [delay, dryGain] // Both delay and dry paths
            };
            this.nodes.set(graphNode.id, audioNode);
        }
        
        const props = graphNode.properties || {};
        audioNode.delay.delayTime.setValueAtTime(props.max_delay || 0.02, this.context.currentTime);
        audioNode.lfo.frequency.setValueAtTime(props.lfo_freq || 0.5, this.context.currentTime);
        audioNode.lfoGain.gain.setValueAtTime(props.depth || 0.002, this.context.currentTime);
        audioNode.wetGain.gain.setValueAtTime(props.level || 0.5, this.context.currentTime);
        audioNode.dryGain.gain.setValueAtTime(1 - (props.level || 0.5), this.context.currentTime);
    }

    // Echo/Delay Effect  
    updateEcho(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        if (!audioNode) {
            const delay = this.context.createDelay();
            const feedback = this.context.createGain();
            const wetGain = this.context.createGain();
            const dryGain = this.context.createGain();
            const output = this.context.createGain();
            
            // Setup echo feedback loop
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(wetGain);
            wetGain.connect(output);
            dryGain.connect(output);
            output.connect(this.masterGain);
            
            audioNode = { 
                delay, feedback, wetGain, dryGain, output,
                type: 'echo',
                input: [delay, dryGain]
            };
            this.nodes.set(graphNode.id, audioNode);
        }
        
        const props = graphNode.properties || {};
        audioNode.delay.delayTime.setValueAtTime(props.delay_time || 0.3, this.context.currentTime);
        audioNode.feedback.gain.setValueAtTime(props.feedback || 0.3, this.context.currentTime);
        audioNode.wetGain.gain.setValueAtTime(props.level || 0.5, this.context.currentTime);
        audioNode.dryGain.gain.setValueAtTime(1 - (props.level || 0.5), this.context.currentTime);
    }

    // Sample Player - BETA implementation
    updateSamplePlayer(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        if (!audioNode) {
            // BETA: Use oscillator as placeholder for sample playback
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            
            oscillator.connect(gain);
            gain.connect(this.masterGain);
            oscillator.type = 'sine'; // Placeholder
            oscillator.start();
            
            audioNode = { oscillator, gain, type: 'sampleplayer', beta: true };
            this.nodes.set(graphNode.id, audioNode);
            
            console.warn('BETA: Sample Player using sine wave placeholder');
        }
        
        // BETA: Basic frequency/amplitude control
        const properties = graphNode.properties || {};
        audioNode.oscillator.frequency.setValueAtTime(
            properties.base_freq || 440,
            this.context.currentTime
        );
        audioNode.gain.gain.setValueAtTime(
            properties.amplitude || 0.5,
            this.context.currentTime
        );
    }

    // Sequencer - BETA implementation
    updateSequencer(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        if (!audioNode) {
            // BETA: Sequencer doesn't produce audio directly
            audioNode = { 
                type: 'sequencer', 
                beta: true,
                currentStep: 0,
                lastTick: 0
            };
            this.nodes.set(graphNode.id, audioNode);
            
            console.warn('BETA: Sequencer node - timing logic not fully implemented');
        }
        
        // BETA: Basic step advancement (would need proper clock sync)
        const properties = graphNode.properties || {};
        if (Date.now() - audioNode.lastTick > 250) { // 240 BPM approximate
            audioNode.currentStep = (audioNode.currentStep + 1) % (properties.steps || 16);
            audioNode.lastTick = Date.now();
        }
    }

    // Clock Generator - BETA implementation
    updateClock(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        const properties = graphNode.properties || {};
        if (!audioNode) {
            audioNode = { 
                type: 'clock', 
                beta: true,
                interval: 60000 / (properties.bpm || 120),
                lastTick: 0
            };
            this.nodes.set(graphNode.id, audioNode);
            
            console.warn('BETA: Clock node - basic timing only');
        }
        
        audioNode.interval = 60000 / (properties.bpm || 120);
    }

    // Keyboard Input - BETA implementation  
    updateKeyboard(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        const properties = graphNode.properties || {};
        if (!audioNode) {
            audioNode = { 
                type: 'keyboard', 
                beta: true,
                currentNote: properties.current_note || 60,
                gateOn: false
            };
            this.nodes.set(graphNode.id, audioNode);
            
            console.warn('BETA: Keyboard node - web interaction required');
        }
        
        // BETA: Would need proper MIDI or keyboard event handling
    }

    // Drum Machine - BETA implementation
    updateDrumMachine(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        if (!audioNode) {
            // BETA: Use noise generator for drums
            const bufferSize = 2 * this.context.sampleRate;
            const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.context.createBufferSource();
            const gain = this.context.createGain();
            
            noise.buffer = noiseBuffer;
            noise.loop = true;
            noise.connect(gain);
            gain.connect(this.masterGain);
            noise.start();
            
            audioNode = { 
                noise, gain, 
                type: 'drums', 
                beta: true,
                currentStep: 0
            };
            this.nodes.set(graphNode.id, audioNode);
            
            console.warn('BETA: Drum Machine using noise generator placeholder');
        }
        
        // BETA: Basic volume control
        const properties = graphNode.properties || {};
        audioNode.gain.gain.setValueAtTime(
            properties.volume || 0.3,
            this.context.currentTime
        );
    }

    // Output Node - Final audio output/DAC
    updateOutput(graphNode) {
        let audioNode = this.nodes.get(graphNode.id);
        
        if (!audioNode) {
            // Create output node chain: input -> outputGain -> masterGain
            const inputGain = this.context.createGain();
            const outputGain = this.context.createGain();
            
            // Chain connections
            inputGain.connect(outputGain);
            outputGain.connect(this.masterGain);
            
            audioNode = { 
                inputGain,    // This is where other nodes connect TO
                outputGain,   // This controls final output volume
                type: 'output',
                isOutput: true
            };
            this.nodes.set(graphNode.id, audioNode);
            
            console.log('✅ Created Audio Output node with input routing');
        }
        
        // Update output parameters - handle undefined properties
        const properties = graphNode.properties || {};
        const volume = properties.master_volume || 1.0;
        audioNode.outputGain.gain.setValueAtTime(volume, this.context.currentTime);
        
        // Store output settings for AMY WASM
        if (this.amyInitialized) {
            try {
                // Set global AMY volume
                const amyVolume = Math.min(1.0, volume);
                amyWASM.sendMessage(`g${amyVolume.toFixed(3)}`); // Global volume command
                
                // Set stereo/mono mode if supported
                if (properties.stereo_mode) {
                    console.log('📻 AMY Output: Stereo mode enabled');
                }
            } catch (error) {
                console.error('❌ Failed to set AMY output parameters:', error);
            }
        }
    }

    // Helper method to create reverb impulse response
    createReverbImpulse(convolver) {
        const length = this.context.sampleRate * 2; // 2 second reverb
        const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        convolver.buffer = impulse;
    }
}