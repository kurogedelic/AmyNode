export class CodeGenerator {
    constructor() {
        this.nodeIdMap = new Map();
        this.nodeCounter = 0;
        this.template = null;
    }
    
    async loadTemplate() {
        if (!this.template) {
            try {
                const response = await fetch('/templates/arduino_template.ino');
                this.template = await response.text();
            } catch (error) {
                console.error('Failed to load template:', error);
                this.template = null;
            }
        }
        return this.template;
    }
    
    generate(graph) {
        this.nodeIdMap.clear();
        this.nodeCounter = 0;
        
        const nodes = graph._nodes;
        const connections = this.extractConnections(graph);
        
        if (this.template) {
            return this.generateFromTemplate(nodes, connections);
        } else {
            let code = this.generateHeader();
            code += this.generateSetup(nodes, connections);
            code += this.generateLoop(nodes, connections);
            return code;
        }
    }
    
    generateFromTemplate(nodes, connections) {
        // Filter nodes by type with null check
        const oscillators = nodes.filter(n => n.type === 'amy/oscillator');
        const lfos = nodes.filter(n => n.type === 'amy/lfo');
        const filters = nodes.filter(n => n.type === 'amy/filter');  
        const effects = nodes.filter(n => n.type && (n.type.includes('amy/reverb') || n.type.includes('amy/chorus') || n.type.includes('amy/echo')));
        const envelopes = nodes.filter(n => n.type === 'amy/envelope');
        const mixers = nodes.filter(n => n.type === 'amy/mixer');
        const modMatrices = nodes.filter(n => n.type === 'amy/modmatrix');
        const samplePlayers = nodes.filter(n => n.type === 'amy/sampleplayer');
        const sequencers = nodes.filter(n => n.type === 'amy/sequencer');
        const clocks = nodes.filter(n => n.type === 'amy/clock');
        const drums = nodes.filter(n => n.type === 'amy/drums');
        const keyboards = nodes.filter(n => n.type === 'amy/keyboard');
        const adcNodes = nodes.filter(n => n.type === 'amy/adc');
        const gpioNodes = nodes.filter(n => n.type === 'amy/gpio');
        const outputNodes = nodes.filter(n => n.type === 'amy/output');
        const mapNodes = nodes.filter(n => n.type === 'amy/map');
        
        const totalOscillators = oscillators.length + lfos.length + samplePlayers.length;
        
        console.log(`Code generation: ${oscillators.length} oscillators, ${effects.length} effects, ${totalOscillators} total voices`);
        
        const replacements = {
            PIN_DEFINITIONS: this.generatePinDefinitions(adcNodes, gpioNodes),
            GLOBAL_VARIABLES: this.generateGlobalVariables(nodes),
            OSCILLATOR_INDICES: this.generateOscillatorIndices(oscillators, lfos),
            NUM_OSCILLATORS: Math.max(totalOscillators, 1),
            CONNECTION_ANALYSIS: this.generateConnectionAnalysis(connections),
            PIN_SETUP: this.generatePinSetup(adcNodes, gpioNodes),
            OSCILLATOR_SETUP: this.generateOscillatorSetupTemplate(oscillators),
            LFO_SETUP: this.generateLFOSetup(lfos, oscillators.length),
            ENVELOPE_SETUP: this.generateEnvelopeSetup(envelopes),
            MIXER_SETUP: this.generateMixerSetup(mixers),
            SAMPLE_SETUP: this.generateSampleSetup(samplePlayers),
            FILTER_SETUP: this.generateFilterSetup(filters),
            EFFECT_SETUP: this.generateEffectSetup(effects),
            MODULATION_SETUP: this.generateModulationSetup(modMatrices, connections),
            SEQUENCER_SETUP: this.generateSequencerSetup(sequencers, clocks, drums),
            KEYBOARD_SETUP: this.generateKeyboardSetup(keyboards),
            OUTPUT_SETUP: this.generateOutputSetup(outputNodes),
            MAPPING_SETUP: this.generateMappingSetup(mapNodes),
            INITIAL_VALUES: this.generateInitialValues(nodes),
            INPUT_READING: this.generateInputReading(adcNodes, gpioNodes),
            MAPPINGS: this.generateMappings(nodes, connections),
            PARAMETER_UPDATES: this.generateParameterUpdates(nodes, connections),
            ENVELOPE_HANDLING: this.generateEnvelopeHandling(envelopes, connections),
            SEQUENCER_UPDATES: this.generateSequencerUpdates(sequencers, clocks, drums, keyboards),
            LOOP_DELAY: this.calculateOptimalLoopDelay(nodes),
            HELPER_FUNCTIONS: this.generateHelperFunctions(),
            PATCH_NAME: this.generatePatchName(nodes),
            PATCH_DESCRIPTION: this.generatePatchDescription(nodes, connections)
        };
        
        let code = this.template;
        Object.entries(replacements).forEach(([key, value]) => {
            code = code.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        
        return code;
    }
    
    generatePinDefinitions(adcNodes, gpioNodes) {
        let defs = [];
        adcNodes.forEach(node => {
            defs.push(`#define ${this.getNodeVariableName(node).toUpperCase()}_PIN ${node.properties.pin}`);
        });
        gpioNodes.forEach(node => {
            defs.push(`#define ${this.getNodeVariableName(node).toUpperCase()}_PIN ${node.properties.pin}`);
        });
        return defs.join('\n');
    }
    
    generateGlobalVariables(nodes) {
        let vars = [];
        nodes.forEach(node => {
            const varName = this.getNodeVariableName(node);
            if (node.type === 'amy/adc') {
                vars.push(`int ${varName}_raw = 0;`);
                vars.push(`float ${varName}_mapped = 0;`);
            } else if (node.type === 'amy/gpio') {
                vars.push(`bool ${varName}_state = false;`);
            }
        });
        return vars.join('\n');
    }
    
    generateOscillatorIndices(oscillators, lfos = []) {
        let indices = [];
        oscillators.forEach((osc, index) => {
            indices.push(`#define ${this.getNodeVariableName(osc).toUpperCase()}_INDEX ${index}`);
        });
        lfos.forEach((lfo, index) => {
            indices.push(`#define ${this.getNodeVariableName(lfo).toUpperCase()}_INDEX ${oscillators.length + index}`);
        });
        return indices.join('\n');
    }
    
    extractConnections(graph) {
        const connections = [];
        
        graph._nodes.forEach(node => {
            if (node.inputs) {
                node.inputs.forEach((input, inputIndex) => {
                    if (input.link !== null) {
                        const link = graph.links[input.link];
                        if (link) {
                            connections.push({
                                source: link.origin_id,
                                sourceSlot: link.origin_slot,
                                target: node.id,
                                targetSlot: inputIndex,
                                type: input.type
                            });
                        }
                    }
                });
            }
        });
        
        return connections;
    }
    
    generateHeader() {
        return `// Generated by AmyNode
// AMY Audio Library Arduino Sketch

#include "amy.h"

// Global variables
`;
    }
    
    generateSetup(nodes, connections) {
        let setup = `
void setup() {
    Serial.begin(115200);
    
    // Initialize AMY
    amy_start();
    
`;
        
        nodes.forEach(node => {
            const varName = this.getNodeVariableName(node);
            
            switch (node.type) {
                case 'amy/oscillator':
                    setup += this.generateOscillatorSetup(node, varName);
                    break;
                case 'amy/adc':
                    setup += this.generateADCSetup(node, varName);
                    break;
                case 'amy/gpio':
                    setup += this.generateGPIOSetup(node, varName);
                    break;
            }
        });
        
        setup += `}\n\n`;
        return setup;
    }
    
    generateOscillatorSetup(node, varName) {
        const oscIndex = this.nodeCounter++;
        const { wave_type, frequency, amplitude } = node.properties;
        
        return `
    // ${node.title || 'Oscillator'} setup
    amy_event e${oscIndex} = amy_default_event();
    e${oscIndex}.osc = ${oscIndex};
    e${oscIndex}.wave = ${wave_type.toUpperCase()};
    e${oscIndex}.freq = ${frequency};
    e${oscIndex}.amp = ${amplitude};
    amy_add_event(&e${oscIndex});
`;
    }
    
    generateADCSetup(node, varName) {
        return `
    // ${node.title || 'ADC Input'} setup
    pinMode(${node.properties.pin}, INPUT);
`;
    }
    
    generateGPIOSetup(node, varName) {
        const mode = node.properties.mode === 'input' ? 'INPUT' : 'OUTPUT';
        const pull = node.properties.pull === 'up' ? '_PULLUP' : '';
        
        return `
    // ${node.title || 'GPIO Pin'} setup
    pinMode(${node.properties.pin}, ${mode}${pull});
`;
    }
    
    generateLoop(nodes, connections) {
        let loop = `void loop() {
`;
        
        const adcNodes = nodes.filter(n => n.type === 'amy/adc');
        const gpioNodes = nodes.filter(n => n.type === 'amy/gpio' && n.properties.mode === 'input');
        
        adcNodes.forEach(node => {
            const varName = this.getNodeVariableName(node);
            loop += `    int ${varName} = analogRead(${node.properties.pin});\n`;
            
            const mappedConnections = connections.filter(c => c.source === node.id);
            mappedConnections.forEach(conn => {
                const targetNode = nodes.find(n => n.id === conn.target);
                if (targetNode?.type === 'amy/map') {
                    loop += this.generateMapCode(node, targetNode, varName);
                }
            });
        });
        
        gpioNodes.forEach(node => {
            const varName = this.getNodeVariableName(node);
            loop += `    bool ${varName} = digitalRead(${node.properties.pin});\n`;
        });
        
        const oscillatorConnections = connections.filter(c => {
            const targetNode = nodes.find(n => n.id === c.target);
            return targetNode?.type === 'amy/oscillator';
        });
        
        oscillatorConnections.forEach(conn => {
            const sourceNode = nodes.find(n => n.id === conn.source);
            const targetNode = nodes.find(n => n.id === conn.target);
            
            if (sourceNode && targetNode) {
                const sourceVar = this.getNodeVariableName(sourceNode);
                const targetIndex = nodes.filter(n => n.type === 'amy/oscillator').indexOf(targetNode);
                
                if (conn.targetSlot === 0) {
                    loop += `    amy.setFrequency(${targetIndex}, ${sourceVar}_mapped);\n`;
                } else if (conn.targetSlot === 1) {
                    loop += `    amy.setAmplitude(${targetIndex}, ${sourceVar}_mapped / 1023.0);\n`;
                }
            }
        });
        
        loop += `
    // Update AMY
    amy.update();
    
    delay(10); // Small delay for stability
}
`;
        return loop;
    }
    
    generateMapCode(adcNode, mapNode, varName) {
        const { in_min, in_max, out_min, out_max } = mapNode.properties;
        return `    float ${varName}_mapped = map(${varName}, ${in_min}, ${in_max}, ${out_min}, ${out_max});\n`;
    }
    
    generatePinSetup(adcNodes, gpioNodes) {
        let setup = [];
        adcNodes.forEach(node => {
            setup.push(`pinMode(${this.getNodeVariableName(node).toUpperCase()}_PIN, INPUT);`);
        });
        gpioNodes.forEach(node => {
            const mode = node.properties.mode === 'input' ? 'INPUT' : 'OUTPUT';
            const pull = node.properties.pull === 'up' ? '_PULLUP' : '';
            setup.push(`pinMode(${this.getNodeVariableName(node).toUpperCase()}_PIN, ${mode}${pull});`);
        });
        return setup.join('\n    ');
    }
    
    generateOscillatorSetupTemplate(oscillators) {
        return oscillators.map((osc, index) => {
            const varName = this.getNodeVariableName(osc).toUpperCase();
            const props = osc.properties;
            let setup = `// ${osc.title || 'Oscillator ' + index}
    amy_event e${index} = amy_default_event();
    e${index}.osc = ${varName}_INDEX;
    e${index}.wave = ${props.wave_type};
    e${index}.freq = ${props.frequency};
    e${index}.amp = ${props.amplitude};
    e${index}.phase = ${props.phase};`;
            
            // Add type-specific parameters
            if (props.wave_type === "PULSE") {
                setup += `\n    e${index}.duty = ${props.duty};`;
            }
            
            if (props.wave_type === "ALGO") {
                setup += `\n    e${index}.ratio = ${props.ratio};`;
                setup += `\n    e${index}.algo = ${props.algo || 1};`;
            }
            
            if (props.wave_type === "KS") {
                setup += `\n    e${index}.feedback = ${props.ks_sustain};`;
            }
            
            if (props.wave_type === "PCM") {
                setup += `\n    e${index}.patch = ${props.patch};`;
            }
            
            if (props.wave_type === "PARTIAL") {
                setup += `\n    // Partials: ${props.partials}`;
            }
            
            // Add filter if configured
            if (props.filter_type !== "NONE") {
                const filterType = props.filter_type === "LPF" ? "1" : props.filter_type === "BPF" ? "2" : "3";
                setup += `\n    e${index}.filter_type = ${filterType};`;
                setup += `\n    e${index}.filter_freq = ${props.filter_freq};`;
                setup += `\n    e${index}.filter_resonance = ${props.filter_resonance};`;
            }
            
            setup += `\n    amy_add_event(&e${index});`;
            
            return setup;
        }).join('\n\n    ');
    }
    
    generateInitialValues(nodes) {
        return '// Initial values set in oscillator setup';
    }
    
    generateInputReading(adcNodes, gpioNodes) {
        let reading = [];
        adcNodes.forEach(node => {
            const varName = this.getNodeVariableName(node);
            reading.push(`${varName}_raw = analogRead(${varName.toUpperCase()}_PIN);`);
        });
        gpioNodes.forEach(node => {
            if (node.properties.mode === 'input') {
                const varName = this.getNodeVariableName(node);
                reading.push(`${varName}_state = digitalRead(${varName.toUpperCase()}_PIN);`);
            }
        });
        return reading.join('\n    ');
    }
    
    generateMappings(nodes, connections) {
        let mappings = [];
        nodes.filter(n => n.type === 'amy/map').forEach(mapNode => {
            const inputConn = connections.find(c => c.target === mapNode.id);
            if (inputConn) {
                const sourceNode = nodes.find(n => n.id === inputConn.source);
                if (sourceNode && sourceNode.type === 'amy/adc') {
                    const sourceVar = this.getNodeVariableName(sourceNode);
                    const { in_min, in_max, out_min, out_max } = mapNode.properties;
                    mappings.push(`${sourceVar}_mapped = map(${sourceVar}_raw, ${in_min}, ${in_max}, ${out_min}, ${out_max});`);
                }
            }
        });
        return mappings.join('\n    ');
    }
    
    generateParameterUpdates(nodes, connections) {
        let updates = [];
        connections.forEach(conn => {
            const targetNode = nodes.find(n => n.id === conn.target);
            const sourceNode = nodes.find(n => n.id === conn.source);
            
            if (!targetNode || !sourceNode) return;
            
            const targetVar = this.getNodeVariableName(targetNode).toUpperCase();
            const sourceVar = this.getNodeVariableName(sourceNode);
            
            if (targetNode.type === 'amy/oscillator') {
                switch (conn.targetSlot) {
                    case 0: // frequency input
                        updates.push(`amy.setFrequency(${targetVar}_INDEX, ${sourceVar}_mapped);`);
                        break;
                    case 1: // amplitude input
                        updates.push(`amy.setAmplitude(${targetVar}_INDEX, ${sourceVar}_mapped / 1023.0);`);
                        break;
                    case 2: // modulation source
                        updates.push(`amy.setModulation(${targetVar}_INDEX, ${this.getNodeVariableName(sourceNode).toUpperCase()}_INDEX, ${targetNode.properties.mod_amount});`);
                        break;
                }
            } else if (targetNode.type === 'amy/filter') {
                switch (conn.targetSlot) {
                    case 1: // frequency input
                        updates.push(`amy.setFilterFreq(${targetVar}_INDEX, ${sourceVar}_mapped);`);
                        break;
                    case 2: // resonance input
                        updates.push(`amy.setFilterResonance(${targetVar}_INDEX, ${sourceVar}_mapped / 1023.0);`);
                        break;
                }
            } else if (targetNode.type && (targetNode.type.includes('reverb') || targetNode.type.includes('chorus') || targetNode.type.includes('echo'))) {
                const effectType = targetNode.type.split('/')[1];
                switch (conn.targetSlot) {
                    case 1: // level input
                        updates.push(`amy.set${effectType.charAt(0).toUpperCase() + effectType.slice(1)}Level(${sourceVar}_mapped / 1023.0);`);
                        break;
                    case 2: // parameter 2 (rate/feedback/delay)
                        if (effectType === 'chorus') {
                            updates.push(`amy.setChorusRate(${sourceVar}_mapped);`);
                        } else if (effectType === 'echo') {
                            updates.push(`amy.setEchoDelay(${sourceVar}_mapped);`);
                        } else if (effectType === 'reverb') {
                            updates.push(`amy.setReverbFeedback(${sourceVar}_mapped / 1023.0);`);
                        }
                        break;
                }
            }
        });
        return updates.join('\n    ');
    }
    
    generateEnvelopeHandling(nodes, connections) {
        return '// Envelope handling not yet implemented';
    }
    
    generateFilterSetup(filters) {
        if (filters.length === 0) return "// No standalone filters configured";
        
        return filters.map((filter, index) => {
            const varName = this.getNodeVariableName(filter).toUpperCase();
            const props = filter.properties;
            return `// ${filter.title || 'Filter ' + index}
    // Note: Filters applied per oscillator in AMY
    #define ${varName}_INDEX ${index}`;
        }).join('\n\n    ');
    }

    generateEffectSetup(effects) {
        if (effects.length === 0) return "// No effects configured";
        
        return effects.map((effect, index) => {
            const effectType = effect.type.split('/')[1].toLowerCase();
            const props = effect.properties;
            let setup = `// ${effect.title || effectType + ' ' + index}`;
            
            switch (effectType) {
                case 'reverb':
                    setup += `\n    amy.setReverb(${props.level}, ${props.feedback}, ${props.liveness}, ${props.damping});`;
                    break;
                case 'chorus':
                    setup += `\n    amy.setChorus(${props.level}, ${props.max_delay}, ${props.lfo_freq}, ${props.depth});`;
                    break;
                case 'echo':
                    setup += `\n    amy.setEcho(${props.delay_time}, ${props.feedback}, ${props.level}, ${props.max_delay});`;
                    break;
            }
            
            return setup;
        }).join('\n\n    ');
    }

    generateLFOSetup(lfos, oscillatorOffset) {
        if (lfos.length === 0) return "// No LFOs configured";
        
        return lfos.map((lfo, index) => {
            const varName = this.getNodeVariableName(lfo).toUpperCase();
            const props = lfo.properties;
            const oscIndex = oscillatorOffset + index;
            
            return `// ${lfo.title || 'LFO ' + index}
    amy.setOscillatorType(${varName}_INDEX, AMY_${props.wave_type});
    amy.setFrequency(${varName}_INDEX, ${props.frequency}); // Low frequency for modulation
    amy.setAmplitude(${varName}_INDEX, ${props.amplitude});
    amy.setPhase(${varName}_INDEX, ${props.phase});`;
        }).join('\n\n    ');
    }

    generateModulationSetup(modMatrices, connections) {
        if (modMatrices.length === 0) return "// No modulation matrices configured";
        
        return modMatrices.map((matrix, index) => {
            const varName = this.getNodeVariableName(matrix).toUpperCase();
            let setup = `// ${matrix.title || 'Modulation Matrix ' + index}`;
            
            // Generate modulation routing from matrix
            for (let src = 0; src < 4; src++) {
                for (let dest = 0; dest < 4; dest++) {
                    const amount = matrix.properties.matrix[src][dest];
                    if (amount !== 0) {
                        setup += `\n    // Route source ${src} to dest ${dest} with amount ${amount}`;
                        setup += `\n    amy.setModulationAmount(${src}, ${dest}, ${amount});`;
                    }
                }
            }
            
            return setup;
        }).join('\n\n    ');
    }

    generateSampleSetup(samplePlayers) {
        if (samplePlayers.length === 0) return "// No sample players configured";
        
        return samplePlayers.map((player, index) => {
            const varName = this.getNodeVariableName(player).toUpperCase();
            const props = player.properties;
            
            return `// ${player.title || 'Sample Player ' + index}
    #define ${varName}_INDEX ${index}
    // Sample patch: ${props.patch} (${props.sample_name})
    // Note: Load sample ${props.sample_name} to patch ${props.patch} in AMY`;
        }).join('\n\n    ');
    }

    generateSequencerSetup(sequencers, clocks, drums) {
        let setup = [];
        
        if (sequencers.length > 0) {
            setup.push("// Sequencer setup");
            sequencers.forEach((seq, index) => {
                const varName = this.getNodeVariableName(seq).toUpperCase();
                const props = seq.properties;
                setup.push(`// ${seq.title || 'Sequencer ' + index}`);
                setup.push(`#define ${varName}_STEPS ${props.steps}`);
                setup.push(`int ${varName.toLowerCase()}_sequence[${props.steps}] = {${props.sequence.join(', ')}};`);
                setup.push(`int ${varName.toLowerCase()}_gates[${props.steps}] = {${props.gates.join(', ')}};`);
                setup.push(`int ${varName.toLowerCase()}_current_step = 0;`);
            });
        }
        
        if (clocks.length > 0) {
            setup.push("// Clock setup");
            clocks.forEach((clock, index) => {
                const varName = this.getNodeVariableName(clock).toUpperCase();
                const props = clock.properties;
                setup.push(`// ${clock.title || 'Clock ' + index}`);
                setup.push(`#define ${varName}_BPM ${props.bpm}`);
                setup.push(`unsigned long ${varName.toLowerCase()}_last_tick = 0;`);
                setup.push(`unsigned long ${varName.toLowerCase()}_interval = ${Math.round(60000 / props.bpm)};`);
            });
        }
        
        if (drums.length > 0) {
            setup.push("// BETA: Drum Machine (Complex timing - future implementation)");
            drums.forEach((drum, index) => {
                const varName = this.getNodeVariableName(drum).toUpperCase();
                setup.push(`// ${drum.title || 'Drum Machine ' + index} - BETA`);
                setup.push(`// TODO: Implement drum pattern sequencing`);
            });
        }
        
        return setup.length > 2 ? setup.join('\n    ') : "// No sequencer modules configured";
    }

    generateKeyboardSetup(keyboards) {
        if (keyboards.length === 0) return "// No keyboard inputs configured";
        
        return keyboards.map((keyboard, index) => {
            const varName = this.getNodeVariableName(keyboard).toUpperCase();
            const props = keyboard.properties;
            
            return `// BETA: ${keyboard.title || 'Keyboard ' + index} (Interactive input - web only)
    // Note: Keyboard input requires web interface or MIDI hardware
    float ${varName.toLowerCase()}_frequency = 440.0;
    int ${varName.toLowerCase()}_gate = 0;
    float ${varName.toLowerCase()}_velocity = ${props.velocity};`;
        }).join('\n\n    ');
    }

    generateSequencerUpdates(sequencers, clocks, drums, keyboards) {
        let updates = [];
        
        // Clock updates
        clocks.forEach((clock) => {
            const varName = this.getNodeVariableName(clock).toUpperCase();
            updates.push(`// Update ${clock.title || 'Clock'}`);
            updates.push(`if (millis() - ${varName.toLowerCase()}_last_tick >= ${varName.toLowerCase()}_interval) {`);
            updates.push(`    ${varName.toLowerCase()}_last_tick = millis();`);
            updates.push(`    // Clock tick - trigger connected sequencers`);
            updates.push(`}`);
        });
        
        // Sequencer updates
        sequencers.forEach((seq) => {
            const varName = this.getNodeVariableName(seq).toUpperCase();
            updates.push(`// Update ${seq.title || 'Sequencer'}`);
            updates.push(`// TODO: Connect to clock input for step advancement`);
            updates.push(`// Current note: ${varName.toLowerCase()}_sequence[${varName.toLowerCase()}_current_step]`);
        });
        
        // Beta warnings for complex nodes
        if (drums.length > 0) {
            updates.push("// BETA: Drum machine updates not implemented - complex pattern timing required");
        }
        
        if (keyboards.length > 0) {
            updates.push("// BETA: Keyboard updates require MIDI or web interface integration");
        }
        
        return updates.length > 0 ? updates.join('\n    ') : "// No sequencer updates needed";
    }

    generateOutputSetup(outputNodes) {
        if (outputNodes.length === 0) return "// No output nodes configured";
        
        return outputNodes.map((output, index) => {
            const varName = this.getNodeVariableName(output).toUpperCase();
            const props = output.properties;
            
            return `// ${output.title || 'Audio Output ' + index}
    // Master volume: ${props.master_volume || 1.0}
    // Stereo mode: ${props.stereo_mode ? 'enabled' : 'disabled'}
    // Output channel: ${props.output_channel || 0}
    amy.setGlobalVolume(${props.master_volume || 1.0});`;
        }).join('\n\n    ');
    }

    generateHelperFunctions() {
        return `// Map function for float values
float mapFloat(float x, float in_min, float in_max, float out_min, float out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// AMY oscillator type constants (if not defined in library)
#ifndef AMY_SINE  
#define AMY_SINE 0
#define AMY_PULSE 1
#define AMY_SAW_DOWN 2
#define AMY_SAW_UP 3
#define AMY_TRIANGLE 4
#define AMY_NOISE 5
#define AMY_KS 6
#define AMY_PCM 7
#define AMY_PARTIAL 8
#define AMY_ALGO 9
#define AMY_FM 10
#endif

// AMY filter constants
#ifndef AMY_FILTER_NONE
#define AMY_FILTER_NONE 0
#define AMY_FILTER_LPF 1
#define AMY_FILTER_HPF 2
#define AMY_FILTER_BPF 3
#endif`;
    }
    
    generateConnectionAnalysis(connections) {
        if (!connections.length) return '// No connections in patch';
        
        let analysis = `// Patch connections analysis:\n`;
        connections.forEach((conn, index) => {
            analysis += `//   ${index + 1}. Node ${conn.source} output ${conn.sourceSlot} → Node ${conn.target} input ${conn.targetSlot}\n`;
        });
        return analysis;
    }
    
    generateEnvelopeSetup(envelopes) {
        if (!envelopes.length) return '// No envelopes in patch';
        
        let setup = `\n  // Envelope setup (AMY breakpoint format)\n`;
        envelopes.forEach((env, index) => {
            const props = env.properties;
            const attack = props.attack || 0.01;
            const decay = props.decay || 0.1;
            const sustain = props.sustain || 0.7;
            const release = props.release || 0.5;
            
            // AMY breakpoint envelope format
            setup += `  amy_event e_env${index} = amy_default_event();\n`;
            setup += `  e_env${index}.osc = ${index};\n`;
            setup += `  e_env${index}.bp0[0] = ${attack};     // Attack time\n`;
            setup += `  e_env${index}.bp0[1] = 1.0;           // Attack level\n`;
            setup += `  e_env${index}.bp0[2] = ${decay};      // Decay time\n`;
            setup += `  e_env${index}.bp0[3] = ${sustain};    // Sustain level\n`;
            setup += `  e_env${index}.bp1[0] = ${release};    // Release time\n`;
            setup += `  e_env${index}.bp1[1] = 0.0;           // Release level\n`;
            setup += `  amy_add_event(&e_env${index});\n`;
        });
        return setup;
    }
    
    generateMixerSetup(mixers) {
        if (!mixers.length) return '// No mixers in patch';
        
        let setup = `\n  // Mixer setup\n`;
        mixers.forEach((mixer, index) => {
            const props = mixer.properties;
            setup += `  // ${mixer.title || 'Mixer'} - 4-channel mixer\n`;
            for (let i = 1; i <= 4; i++) {
                const gain = props[`gain${i}`] || 1.0;
                if (gain !== 1.0) {
                    setup += `  amy_send_message("v${index}a${gain.toFixed(3)}\\n");\n`;
                }
            }
        });
        return setup;
    }
    
    generateMappingSetup(mapNodes) {
        if (!mapNodes.length) return '// No value mappings in patch';
        
        let setup = `\n  // Value mapping setup\n`;
        mapNodes.forEach(map => {
            const props = map.properties;
            setup += `  // ${map.title || 'Map Range'}: ${props.input_min}-${props.input_max} → ${props.output_min}-${props.output_max}\n`;
        });
        return setup;
    }
    
    calculateOptimalLoopDelay(nodes) {
        // Calculate optimal loop delay based on patch complexity
        const complexity = nodes.length;
        if (complexity > 20) return 5;
        if (complexity > 10) return 10;
        return 20;
    }
    
    generatePatchName(nodes) {
        if (!nodes.length) return 'Empty Patch';
        
        const oscillators = nodes.filter(n => n.type === 'amy/oscillator').length;
        const effects = nodes.filter(n => n.type && n.type.includes('amy/')).length - oscillators;
        
        return `AMY Patch (${oscillators} voices, ${effects} effects)`;
    }
    
    generatePatchDescription(nodes, connections) {
        const stats = {
            oscillators: nodes.filter(n => n.type === 'amy/oscillator').length,
            lfos: nodes.filter(n => n.type === 'amy/lfo').length,
            effects: nodes.filter(n => n.type && (n.type.includes('reverb') || n.type.includes('chorus') || n.type.includes('echo'))).length,
            filters: nodes.filter(n => n.type === 'amy/filter').length,
            envelopes: nodes.filter(n => n.type === 'amy/envelope').length,
            connections: connections.length
        };
        
        let desc = `Generated patch with ${stats.oscillators} oscillators`;
        if (stats.lfos) desc += `, ${stats.lfos} LFOs`;
        if (stats.effects) desc += `, ${stats.effects} effects`;
        if (stats.filters) desc += `, ${stats.filters} filters`;
        if (stats.envelopes) desc += `, ${stats.envelopes} envelopes`;
        desc += `, ${stats.connections} connections`;
        
        return desc;
    }
    
    getNodeVariableName(node) {
        if (!this.nodeIdMap.has(node.id)) {
            const baseName = node.type.split('/')[1];
            this.nodeIdMap.set(node.id, `${baseName}_${node.id}`);
        }
        return this.nodeIdMap.get(node.id);
    }
}