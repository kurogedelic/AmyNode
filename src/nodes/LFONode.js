import { LiteGraph } from 'litegraph.js';

export function LFONode() {
    this.addInput("frequency", "number");
    this.addInput("amplitude", "number");
    this.addOutput("modulation", "audio");
    
    this.properties = {
        // AMY LFO parameters - using oscillator with low frequency
        wave_type: "SINE",
        frequency: 1.0,  // Low frequency for modulation
        amplitude: 0.5,
        phase: 0,
        
        // LFO-specific settings
        is_lfo: true,
        sync_to_tempo: false,
        tempo_ratio: 1.0
    };
    
    this.size = [160, 100];
    this.title = "LFO";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

LFONode.title = "LFO";
LFONode.desc = "Low Frequency Oscillator for Modulation";
LFONode.type = "amy/lfo";

LFONode.prototype.onExecute = function() {
    const freq = this.getInputData(0) ?? this.properties.frequency;
    const amp = this.getInputData(1) ?? this.properties.amplitude;
    
    this.properties.frequency = freq;
    this.properties.amplitude = amp;
    
    this.setOutputData(0, {
        type: "amy_lfo",
        wave_type: this.properties.wave_type,
        frequency: freq,
        amplitude: amp,
        phase: this.properties.phase,
        is_lfo: true,
        oscillator_id: this.id
    });
};

LFONode.prototype.onPropertyChanged = function(name, value) {
    if (name === "wave_type") {
        const validTypes = ["SINE", "TRIANGLE", "SAW_UP", "SAW_DOWN", "PULSE", "NOISE"];
        if (!validTypes.includes(value)) {
            this.properties.wave_type = "SINE";
        }
    }
};

LFONode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#333";
    ctx.font = "9px Arial";
    ctx.fillText("LFO", 10, this.size[1] - 25);
    ctx.fillText(`${this.properties.frequency.toFixed(2)}Hz`, 10, this.size[1] - 10);
    
    const waveSymbols = {
        SINE: "∿",
        TRIANGLE: "△",
        SAW_UP: "⩙",
        SAW_DOWN: "⩘",
        PULSE: "⊓",
        NOISE: "▨"
    };
    
    ctx.font = "16px Arial";
    ctx.fillStyle = "#9C27B0"; // Modulation color
    const symbol = waveSymbols[this.properties.wave_type] || "∿";
    ctx.fillText(symbol, this.size[0] - 25, this.size[1] - 15);
};