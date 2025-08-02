/**
 * AMY-specific node definitions
 */

import { AmyNode } from './NodeSystem.js';

// Base class for AMY nodes
export class AmyNodeBase extends AmyNode {
    constructor(type) {
        super(type);
        this.category = 'general';
    }
    
    generateAmyEvent() {
        // Override in subclasses
        return {};
    }
}

// Oscillator Node
export class OscillatorNode extends AmyNodeBase {
    constructor() {
        super('oscillator');
        this.title = 'Oscillator';
        this.category = 'generator';
        
        // Outputs
        this.addOutput('Audio', 'AUDIO');
        
        // Parameters
        const waveOptions = ['SINE', 'PULSE', 'SAW_DOWN', 'SAW_UP', 'TRIANGLE', 'NOISE', 'KS', 'PCM', 'ALGO', 'PARTIAL'];
        this.addParameter('wave_type', 'SINE', null, null, null, 'select', waveOptions);
        this.addParameter('frequency', 440, 20, 20000, 1);
        this.addParameter('amplitude', 0.5, 0, 1, 0.01);
        this.addParameter('phase', 0, 0, 1, 0.01);
        this.addParameter('duty', 0.5, 0, 1, 0.01);
    }
    
    generateCode() {
        const wave = this.getParameter('wave_type');
        const freq = this.getParameter('frequency');
        const amp = this.getParameter('amplitude');
        const phase = this.getParameter('phase');
        
        let code = `// ${this.title}\n`;
        code += `amy_event e = amy_default_event();\n`;
        code += `e.osc = ${this.oscIndex || 0};\n`;
        code += `e.wave = ${wave};\n`;
        code += `e.freq = ${freq};\n`;
        code += `e.amp = ${amp};\n`;
        code += `e.phase = ${phase};\n`;
        
        if (wave === 'PULSE') {
            code += `e.duty = ${this.getParameter('duty')};\n`;
        }
        
        code += `amy_add_event(&e);\n`;
        return code;
    }
}

// Filter Node
export class FilterNode extends AmyNodeBase {
    constructor() {
        super('filter');
        this.title = 'Filter';
        this.category = 'processor';
        
        // Inputs/Outputs
        this.addInput('Audio In', 'AUDIO');
        this.addInput('Freq Mod', 'CONTROL');
        this.addOutput('Audio Out', 'AUDIO');
        
        // Parameters
        const filterOptions = ['LPF', 'HPF', 'BPF'];
        this.addParameter('filter_type', 'LPF', null, null, null, 'select', filterOptions);
        this.addParameter('filter_freq', 1000, 20, 20000, 1);
        this.addParameter('filter_resonance', 1.0, 0.1, 20, 0.1);
    }
    
    generateCode() {
        const type = this.getParameter('filter_type');
        const freq = this.getParameter('filter_freq');
        const res = this.getParameter('filter_resonance');
        
        let code = `// ${this.title}\n`;
        code += `e.filter_type = ${type === 'LPF' ? 1 : type === 'BPF' ? 2 : 3};\n`;
        code += `e.filter_freq = ${freq};\n`;
        code += `e.filter_resonance = ${res};\n`;
        
        return code;
    }
}

// Envelope Node
export class EnvelopeNode extends AmyNodeBase {
    constructor() {
        super('envelope');
        this.title = 'Envelope';
        this.category = 'modulation';
        
        // Inputs/Outputs
        this.addInput('Audio In', 'AUDIO');
        this.addInput('Gate', 'GATE');
        this.addOutput('Audio Out', 'AUDIO');
        
        // Parameters
        this.addParameter('attack', 0.01, 0, 5, 0.01);
        this.addParameter('decay', 0.1, 0, 5, 0.01);
        this.addParameter('sustain', 0.7, 0, 1, 0.01);
        this.addParameter('release', 0.5, 0, 5, 0.01);
    }
    
    generateCode() {
        const a = this.getParameter('attack');
        const d = this.getParameter('decay');
        const s = this.getParameter('sustain');
        const r = this.getParameter('release');
        
        let code = `// ${this.title} - ADSR Envelope\n`;
        code += `e.bp0[0] = ${a};     // Attack time\n`;
        code += `e.bp0[1] = 1.0;      // Attack level\n`;
        code += `e.bp0[2] = ${d};     // Decay time\n`;
        code += `e.bp0[3] = ${s};     // Sustain level\n`;
        code += `e.bp1[0] = ${r};     // Release time\n`;
        code += `e.bp1[1] = 0.0;      // Release level\n`;
        
        return code;
    }
}

// LFO Node
export class LFONode extends AmyNodeBase {
    constructor() {
        super('lfo');
        this.title = 'LFO';
        this.category = 'modulation';
        
        // Outputs
        this.addOutput('Control', 'CONTROL');
        
        // Parameters
        this.addParameter('frequency', 1, 0.01, 20, 0.01);
        this.addParameter('amplitude', 1, 0, 1, 0.01);
        const lfoWaveOptions = ['SINE', 'TRIANGLE', 'SAW_DOWN', 'SAW_UP', 'PULSE'];
        this.addParameter('wave_type', 'SINE', null, null, null, 'select', lfoWaveOptions);
    }
    
    generateCode() {
        const freq = this.getParameter('frequency');
        const amp = this.getParameter('amplitude');
        const wave = this.getParameter('wave_type');
        
        let code = `// ${this.title} - Low Frequency Oscillator\n`;
        code += `amy_event lfo = amy_default_event();\n`;
        code += `lfo.osc = ${this.oscIndex || 0};\n`;
        code += `lfo.wave = ${wave};\n`;
        code += `lfo.freq = ${freq};\n`;
        code += `lfo.amp = ${amp};\n`;
        code += `amy_add_event(&lfo);\n`;
        
        return code;
    }
}

// Mixer Node
export class MixerNode extends AmyNodeBase {
    constructor() {
        super('mixer');
        this.title = 'Mixer';
        this.category = 'utility';
        
        // Inputs/Outputs
        this.addInput('Input 1', 'AUDIO');
        this.addInput('Input 2', 'AUDIO');
        this.addInput('Input 3', 'AUDIO');
        this.addInput('Input 4', 'AUDIO');
        this.addOutput('Mix Out', 'AUDIO');
        
        // Parameters
        this.addParameter('gain_1', 1.0, 0, 2, 0.01);
        this.addParameter('gain_2', 1.0, 0, 2, 0.01);
        this.addParameter('gain_3', 0.0, 0, 2, 0.01);
        this.addParameter('gain_4', 0.0, 0, 2, 0.01);
    }
    
    generateCode() {
        let code = `// ${this.title} - 4-channel mixer\n`;
        code += `// Mix gains: ${this.getParameter('gain_1')}, ${this.getParameter('gain_2')}, ${this.getParameter('gain_3')}, ${this.getParameter('gain_4')}\n`;
        return code;
    }
}

// Reverb Node
export class ReverbNode extends AmyNodeBase {
    constructor() {
        super('reverb');
        this.title = 'Reverb';
        this.category = 'processor';
        
        // Inputs/Outputs
        this.addInput('Audio In', 'AUDIO');
        this.addOutput('Audio Out', 'AUDIO');
        
        // Parameters
        this.addParameter('level', 0.3, 0, 1, 0.01);
        this.addParameter('liveness', 0.7, 0, 1, 0.01);
        this.addParameter('damping', 0.5, 0, 1, 0.01);
        this.addParameter('xover_hz', 3000, 100, 10000, 100);
    }
    
    generateCode() {
        const level = this.getParameter('level');
        const liveness = this.getParameter('liveness');
        const damping = this.getParameter('damping');
        const xover = this.getParameter('xover_hz');
        
        let code = `// ${this.title} - Global reverb effect\n`;
        code += `amy_send_message("r${level.toFixed(3)},${liveness.toFixed(3)},${damping.toFixed(3)},${xover}");\n`;
        
        return code;
    }
}

// Chorus Node
export class ChorusNode extends AmyNodeBase {
    constructor() {
        super('chorus');
        this.title = 'Chorus';
        this.category = 'processor';
        
        // Inputs/Outputs
        this.addInput('Audio In', 'AUDIO');
        this.addOutput('Audio Out', 'AUDIO');
        
        // Parameters
        this.addParameter('level', 0.5, 0, 1, 0.01);
        this.addParameter('max_delay', 320, 100, 1000, 10);
        this.addParameter('lfo_freq', 0.5, 0.1, 10, 0.1);
        this.addParameter('depth', 0.5, 0, 1, 0.01);
    }
    
    generateCode() {
        const level = this.getParameter('level');
        const delay = this.getParameter('max_delay');
        const freq = this.getParameter('lfo_freq');
        const depth = this.getParameter('depth');
        
        let code = `// ${this.title} - Global chorus effect\n`;
        code += `amy_send_message("c${level.toFixed(3)},${delay.toFixed(3)},${freq.toFixed(3)},${depth.toFixed(3)}");\n`;
        
        return code;
    }
}

// ADC Input Node
export class ADCNode extends AmyNodeBase {
    constructor() {
        super('adc');
        this.title = 'ADC Input';
        this.category = 'input';
        
        // Outputs
        this.addOutput('Control', 'CONTROL');
        
        // Parameters
        this.addParameter('pin', 0, 0, 15, 1);
        this.addParameter('min_value', 0, -10000, 10000, 1);
        this.addParameter('max_value', 1, -10000, 10000, 1);
        this.addParameter('smooth', 0.1, 0, 1, 0.01);
    }
    
    generateCode() {
        const pin = this.getParameter('pin');
        const min = this.getParameter('min_value');
        const max = this.getParameter('max_value');
        const smooth = this.getParameter('smooth');
        
        let code = `// ${this.title} - Analog input\n`;
        code += `float adc${pin}_raw = analogRead(${pin});\n`;
        code += `float adc${pin}_smoothed = adc${pin}_smoothed * ${smooth} + adc${pin}_raw * (1.0 - ${smooth});\n`;
        code += `float adc${pin}_mapped = map(adc${pin}_smoothed, 0, 1023, ${min}, ${max});\n`;
        
        return code;
    }
}

// GPIO Input Node
export class GPIONode extends AmyNodeBase {
    constructor() {
        super('gpio');
        this.title = 'GPIO Input';
        this.category = 'input';
        
        // Outputs
        this.addOutput('Gate', 'GATE');
        
        // Parameters
        this.addParameter('pin', 2, 0, 40, 1);
        this.addParameter('pullup', true, null, null, null, 'boolean');
        this.addParameter('invert', false, null, null, null, 'boolean');
    }
    
    generateCode() {
        const pin = this.getParameter('pin');
        const pullup = this.getParameter('pullup');
        const invert = this.getParameter('invert');
        
        let code = `// ${this.title} - Digital input\n`;
        code += `pinMode(${pin}, ${pullup ? 'INPUT_PULLUP' : 'INPUT'});\n`;
        code += `bool gpio${pin} = digitalRead(${pin})${invert ? ' == LOW' : ' == HIGH'};\n`;
        
        return code;
    }
}

// Output Node
export class OutputNode extends AmyNodeBase {
    constructor() {
        super('output');
        this.title = 'Audio Output';
        this.category = 'output';
        
        // Inputs
        this.addInput('Audio', 'AUDIO');
        
        // Parameters
        this.addParameter('gain', 1.0, 0, 2, 0.01);
    }
    
    generateCode() {
        const gain = this.getParameter('gain');
        
        let code = `// ${this.title} - Main audio output\n`;
        code += `// Output gain: ${gain}\n`;
        
        return code;
    }
}

// Map Range Node
export class MapNode extends AmyNodeBase {
    constructor() {
        super('map');
        this.title = 'Map Range';
        this.category = 'utility';
        
        // Inputs/Outputs
        this.addInput('Input', 'CONTROL');
        this.addOutput('Output', 'CONTROL');
        
        // Parameters
        this.addParameter('in_min', 0, -10000, 10000, 0.1);
        this.addParameter('in_max', 1, -10000, 10000, 0.1);
        this.addParameter('out_min', 0, -10000, 10000, 0.1);
        this.addParameter('out_max', 1, -10000, 10000, 0.1);
    }
    
    generateCode() {
        const inMin = this.getParameter('in_min');
        const inMax = this.getParameter('in_max');
        const outMin = this.getParameter('out_min');
        const outMax = this.getParameter('out_max');
        
        let code = `// ${this.title} - Value mapping\n`;
        code += `// Map from [${inMin}, ${inMax}] to [${outMin}, ${outMax}]\n`;
        
        return code;
    }
}

// Node factory
export const NODE_TYPES = {
    'oscillator': OscillatorNode,
    'filter': FilterNode,
    'envelope': EnvelopeNode,
    'lfo': LFONode,
    'mixer': MixerNode,
    'reverb': ReverbNode,
    'chorus': ChorusNode,
    'adc': ADCNode,
    'gpio': GPIONode,
    'output': OutputNode,
    'map': MapNode
};

export function createNodeFromType(type) {
    const NodeClass = NODE_TYPES[type];
    if (!NodeClass) {
        throw new Error(`Unknown node type: ${type}`);
    }
    return new NodeClass();
}