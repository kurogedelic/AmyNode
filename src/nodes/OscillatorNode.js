import { LiteGraph } from 'litegraph.js';

export function OscillatorNode() {
    this.addInput("frequency", "number");
    this.addInput("amplitude", "number");
    this.addInput("mod_source", "audio");
    this.addInput("envelope", "envelope");
    this.addOutput("audio", "audio");
    
    this.properties = {
        // AMY Oscillator types: SINE, PULSE, SAW_DOWN, SAW_UP, TRIANGLE, NOISE, KS, PCM, PARTIAL, ALGO, FM
        wave_type: "SINE",
        frequency: 440,
        amplitude: 0.5,
        phase: 0,
        feedback: 0,
        
        // AMY-specific parameters
        // For PULSE waves
        duty: 0.5,
        
        // For FM synthesis (ALGO type)
        ratio: 1.0,
        fm_amount: 0,
        
        // For Karplus-Strong (KS)
        ks_sustain: 1.0,
        
        // For PCM sample playback
        patch: 0,
        
        // For PARTIAL synthesis
        partials: "1,0.5,0.25,0.125",
        
        // Filter parameters (built into AMY oscillators)
        filter_type: "NONE",
        filter_freq: 1000,
        filter_resonance: 1,
        
        // Modulation routing
        mod_source: -1,
        mod_target: "FREQUENCY",
        mod_amount: 0
    };
    
    this.size = [200, 160];
    this.audioNode = null;
    this.title = "AMY Oscillator";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

OscillatorNode.title = "Oscillator";
OscillatorNode.desc = "AMY Oscillator Node";
OscillatorNode.type = "amy/oscillator";

OscillatorNode.prototype.onExecute = function() {
    const freq = this.getInputData(0) ?? this.properties.frequency;
    const amp = this.getInputData(1) ?? this.properties.amplitude;
    const mod_source = this.getInputData(2);
    const envelope = this.getInputData(3);
    
    this.properties.frequency = freq;
    this.properties.amplitude = amp;
    
    this.setOutputData(0, {
        type: "amy_oscillator",
        // Core AMY parameters
        wave_type: this.properties.wave_type,
        frequency: freq,
        amplitude: amp,
        phase: this.properties.phase,
        feedback: this.properties.feedback,
        
        // Type-specific parameters
        duty: this.properties.duty,
        ratio: this.properties.ratio,
        fm_amount: this.properties.fm_amount,
        ks_sustain: this.properties.ks_sustain,
        patch: this.properties.patch,
        partials: this.properties.partials,
        
        // Filter parameters
        filter_type: this.properties.filter_type,
        filter_freq: this.properties.filter_freq,
        filter_resonance: this.properties.filter_resonance,
        
        // Modulation
        mod_source: mod_source ? mod_source.oscillator_id : this.properties.mod_source,
        mod_target: this.properties.mod_target,
        mod_amount: this.properties.mod_amount,
        
        // Runtime data
        envelope: envelope,
        oscillator_id: this.id
    });
};

OscillatorNode.prototype.onPropertyChanged = function(name, value) {
    if (name === "wave_type") {
        const validTypes = ["SINE", "PULSE", "SAW_DOWN", "SAW_UP", "TRIANGLE", "NOISE", "KS", "PCM", "PARTIAL", "ALGO", "FM"];
        if (!validTypes.includes(value)) {
            this.properties.wave_type = "SINE";
        }
    } else if (name === "filter_type") {
        const validFilters = ["NONE", "LPF", "HPF", "BPF"];
        if (!validFilters.includes(value)) {
            this.properties.filter_type = "NONE";
        }
    } else if (name === "mod_target") {
        const validTargets = ["FREQUENCY", "AMPLITUDE", "DUTY", "FILTER_FREQ"];
        if (!validTargets.includes(value)) {
            this.properties.mod_target = "FREQUENCY";
        }
    }
};

OscillatorNode.prototype.getMenuOptions = function() {
    return [
        {
            content: "Wave Type",
            has_submenu: true,
            callback: LiteGraph.showMenuNodeProperties
        }
    ];
};

OscillatorNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#333";
    ctx.font = "9px Arial";
    ctx.fillText(this.properties.wave_type, 10, this.size[1] - 25);
    ctx.fillText(`${this.properties.frequency.toFixed(1)}Hz`, 10, this.size[1] - 10);
    
    const waveSymbols = {
        SINE: "∿",
        PULSE: "⊓",
        SAW_DOWN: "⩘",
        SAW_UP: "⩙", 
        TRIANGLE: "△",
        NOISE: "▨",
        KS: "🎸",
        PCM: "♪",
        PARTIAL: "∑",
        ALGO: "🔧",
        FM: "📻"
    };
    
    ctx.font = "16px Arial";
    const symbol = waveSymbols[this.properties.wave_type] || "?";
    ctx.fillText(symbol, this.size[0] - 25, this.size[1] - 15);
    
    // Show filter if active
    if (this.properties.filter_type !== "NONE") {
        ctx.font = "8px Arial";
        ctx.fillStyle = "#666";
        ctx.fillText(`${this.properties.filter_type}`, this.size[0] - 50, this.size[1] - 5);
    }
};