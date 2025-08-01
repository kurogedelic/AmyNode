export class NodePresets {
    constructor() {
        this.presets = this.getDefaultPresets();
        this.loadUserPresets();
    }
    
    getDefaultPresets() {
        return {
            // Basic oscillator patches
            'basic_sine': {
                name: 'Basic Sine Wave',
                description: 'Simple sine wave oscillator with output',
                category: 'Basic',
                nodes: [
                    {
                        type: 'amy/oscillator',
                        position: [100, 100],
                        properties: {
                            wave_type: 'SINE',
                            frequency: 440,
                            amplitude: 0.5
                        }
                    },
                    {
                        type: 'amy/output',
                        position: [300, 100],
                        properties: {}
                    }
                ],
                connections: [
                    { source: 0, sourceSlot: 0, target: 1, targetSlot: 0 }
                ]
            },
            
            'basic_pulse': {
                name: 'Basic Pulse Wave',
                description: 'Pulse wave with adjustable duty cycle',
                category: 'Basic',
                nodes: [
                    {
                        type: 'amy/oscillator', 
                        position: [100, 100],
                        properties: {
                            wave_type: 'PULSE',
                            frequency: 220,
                            amplitude: 0.5,
                            duty: 0.5
                        }
                    },
                    {
                        type: 'amy/output',
                        position: [300, 100],
                        properties: {}
                    }
                ],
                connections: [
                    { source: 0, sourceSlot: 0, target: 1, targetSlot: 0 }
                ]
            },
            
            // Filtered oscillators
            'filtered_saw': {
                name: 'Filtered Sawtooth',
                description: 'Sawtooth wave through low-pass filter',
                category: 'Filtered',
                nodes: [
                    {
                        type: 'amy/oscillator',
                        position: [100, 100],
                        properties: {
                            wave_type: 'SAW_DOWN',
                            frequency: 110,
                            amplitude: 0.7
                        }
                    },
                    {
                        type: 'amy/filter',
                        position: [300, 100],
                        properties: {
                            filter_type: 'LPF',
                            filter_freq: 1200,
                            filter_resonance: 2.0
                        }
                    },
                    {
                        type: 'amy/output',
                        position: [500, 100],
                        properties: {}
                    }
                ],
                connections: [
                    { source: 0, sourceSlot: 0, target: 1, targetSlot: 0 },
                    { source: 1, sourceSlot: 0, target: 2, targetSlot: 0 }
                ]
            },
            
            'resonant_filter': {
                name: 'Resonant Filter Sweep',
                description: 'High resonance filter with LFO modulation',
                category: 'Filtered',
                nodes: [
                    {
                        type: 'amy/oscillator',
                        position: [50, 100],
                        properties: {
                            wave_type: 'SAW_UP',
                            frequency: 55,
                            amplitude: 0.8
                        }
                    },
                    {
                        type: 'amy/filter',
                        position: [250, 100],
                        properties: {
                            filter_type: 'LPF',
                            filter_freq: 500,
                            filter_resonance: 8.0
                        }
                    },
                    {
                        type: 'amy/lfo',
                        position: [50, 250],
                        properties: {
                            frequency: 0.3,
                            amplitude: 400,
                            wave_type: 'SINE'
                        }
                    },
                    {
                        type: 'amy/output',
                        position: [450, 100],
                        properties: {}
                    }
                ],
                connections: [
                    { source: 0, sourceSlot: 0, target: 1, targetSlot: 0 },
                    { source: 2, sourceSlot: 0, target: 1, targetSlot: 1 }, // LFO to filter frequency
                    { source: 1, sourceSlot: 0, target: 3, targetSlot: 0 }
                ]
            },
            
            // Enveloped sounds
            'pluck_synth': {
                name: 'Plucked String Synth',
                description: 'Karplus-Strong plucked string synthesis',
                category: 'Synthesis',
                nodes: [
                    {
                        type: 'amy/oscillator',
                        position: [100, 100],
                        properties: {
                            wave_type: 'KS',
                            frequency: 330,
                            amplitude: 0.6,
                            feedback: 0.95
                        }
                    },
                    {
                        type: 'amy/envelope',
                        position: [300, 100],
                        properties: {
                            attack: 0.01,
                            decay: 0.3,
                            sustain: 0.4,
                            release: 2.0
                        }
                    },
                    {
                        type: 'amy/output',
                        position: [500, 100],
                        properties: {}
                    }
                ],
                connections: [
                    { source: 0, sourceSlot: 0, target: 1, targetSlot: 0 },
                    { source: 1, sourceSlot: 0, target: 2, targetSlot: 0 }
                ]
            },
            
            'pad_synth': {
                name: 'Warm Pad Synth',
                description: 'Warm pad sound with reverb',
                category: 'Synthesis', 
                nodes: [
                    {
                        type: 'amy/oscillator',
                        position: [50, 80],
                        properties: {
                            wave_type: 'TRIANGLE',
                            frequency: 220,
                            amplitude: 0.4
                        }
                    },
                    {
                        type: 'amy/oscillator',
                        position: [50, 180],
                        properties: {
                            wave_type: 'SINE',
                            frequency: 330,
                            amplitude: 0.3
                        }
                    },
                    {
                        type: 'amy/mixer',
                        position: [250, 130],
                        properties: {
                            gain_1: 0.7,
                            gain_2: 0.5
                        }
                    },
                    {
                        type: 'amy/filter',
                        position: [400, 130],
                        properties: {
                            filter_type: 'LPF',
                            filter_freq: 2000,
                            filter_resonance: 1.0
                        }
                    },
                    {
                        type: 'amy/reverb',
                        position: [550, 130],
                        properties: {
                            level: 0.3,
                            liveness: 0.7,
                            damping: 0.4
                        }
                    },
                    {
                        type: 'amy/output',
                        position: [700, 130],
                        properties: {}
                    }
                ],
                connections: [
                    { source: 0, sourceSlot: 0, target: 2, targetSlot: 0 },
                    { source: 1, sourceSlot: 0, target: 2, targetSlot: 1 },
                    { source: 2, sourceSlot: 0, target: 3, targetSlot: 0 },
                    { source: 3, sourceSlot: 0, target: 4, targetSlot: 0 },
                    { source: 4, sourceSlot: 0, target: 5, targetSlot: 0 }
                ]
            },
            
            // FM synthesis
            'fm_bass': {
                name: 'FM Bass',
                description: 'Deep FM bass sound',
                category: 'FM Synthesis',
                nodes: [
                    {
                        type: 'amy/oscillator',
                        position: [100, 100],
                        properties: {
                            wave_type: 'ALGO',
                            frequency: 110,
                            amplitude: 0.8,
                            ratio: 2.0,
                            algo: 1
                        }
                    },
                    {
                        type: 'amy/envelope',
                        position: [300, 100],
                        properties: {
                            attack: 0.01,
                            decay: 0.5,
                            sustain: 0.6,
                            release: 0.8
                        }
                    },
                    {
                        type: 'amy/filter',
                        position: [500, 100],
                        properties: {
                            filter_type: 'LPF',
                            filter_freq: 800,
                            filter_resonance: 1.5
                        }
                    },
                    {
                        type: 'amy/output',
                        position: [700, 100],
                        properties: {}
                    }
                ],
                connections: [
                    { source: 0, sourceSlot: 0, target: 1, targetSlot: 0 },
                    { source: 1, sourceSlot: 0, target: 2, targetSlot: 0 },
                    { source: 2, sourceSlot: 0, target: 3, targetSlot: 0 }
                ]
            },
            
            // Modulated sounds
            'wobble_bass': {
                name: 'Wobble Bass',
                description: 'LFO-modulated filter wobble effect',
                category: 'Modulated',
                nodes: [
                    {
                        type: 'amy/oscillator',
                        position: [50, 100],
                        properties: {
                            wave_type: 'SAW_DOWN',
                            frequency: 65,
                            amplitude: 0.9
                        }
                    },
                    {
                        type: 'amy/filter',
                        position: [250, 100],
                        properties: {
                            filter_type: 'LPF',
                            filter_freq: 300,
                            filter_resonance: 10.0
                        }
                    },
                    {
                        type: 'amy/lfo',
                        position: [50, 250],
                        properties: {
                            frequency: 4.0,
                            amplitude: 800,
                            wave_type: 'SINE'
                        }
                    },
                    {
                        type: 'amy/output',
                        position: [450, 100],
                        properties: {}
                    }
                ],
                connections: [
                    { source: 0, sourceSlot: 0, target: 1, targetSlot: 0 },
                    { source: 2, sourceSlot: 0, target: 1, targetSlot: 1 },
                    { source: 1, sourceSlot: 0, target: 3, targetSlot: 0 }
                ]
            }
        };
    }
    
    // Load user-created presets from localStorage
    loadUserPresets() {
        try {
            const stored = localStorage.getItem('amynode_user_presets');
            if (stored) {
                const userPresets = JSON.parse(stored);
                this.presets = { ...this.presets, ...userPresets };
            }
        } catch (error) {
            console.error('Failed to load user presets:', error);
        }
    }
    
    // Save user presets to localStorage
    saveUserPresets() {
        try {
            const userPresets = {};
            Object.entries(this.presets).forEach(([key, preset]) => {
                if (preset.category === 'User') {
                    userPresets[key] = preset;
                }
            });
            localStorage.setItem('amynode_user_presets', JSON.stringify(userPresets));
        } catch (error) {
            console.error('Failed to save user presets:', error);
        }
    }
    
    // Get all presets grouped by category
    getPresetsByCategory() {
        const categories = {};
        Object.entries(this.presets).forEach(([key, preset]) => {
            const category = preset.category || 'Other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({ key, ...preset });
        });
        return categories;
    }
    
    // Get single preset by key
    getPreset(key) {
        return this.presets[key] || null;
    }
    
    // Add new user preset
    addUserPreset(key, preset) {
        this.presets[key] = {
            ...preset,
            category: 'User',
            timestamp: new Date().toISOString()
        };
        this.saveUserPresets();
    }
    
    // Remove user preset
    removeUserPreset(key) {
        if (this.presets[key] && this.presets[key].category === 'User') {
            delete this.presets[key];
            this.saveUserPresets();
            return true;
        }
        return false;
    }
    
    // Create preset from current graph
    createPresetFromGraph(graph, name, description, category = 'User') {
        const nodes = graph._nodes.map(node => ({
            type: node.type,
            position: [node.pos[0], node.pos[1]],
            properties: { ...node.properties }
        }));
        
        const connections = [];
        graph._links.forEach(link => {
            if (link) {
                const sourceNodeIndex = nodes.findIndex(n => 
                    graph._nodes[n] && graph._nodes[n].id === link.origin_id
                );
                const targetNodeIndex = nodes.findIndex(n => 
                    graph._nodes[n] && graph._nodes[n].id === link.target_id
                );
                
                if (sourceNodeIndex >= 0 && targetNodeIndex >= 0) {
                    connections.push({
                        source: sourceNodeIndex,
                        sourceSlot: link.origin_slot,
                        target: targetNodeIndex,
                        targetSlot: link.target_slot
                    });
                }
            }
        });
        
        const key = name.toLowerCase().replace(/\s+/g, '_');
        return {
            key,
            preset: {
                name,
                description,
                category,
                nodes,
                connections
            }
        };
    }
}