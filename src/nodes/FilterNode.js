import { LiteGraph } from 'litegraph.js';

export function FilterNode() {
    this.addInput("audio", "audio");
    this.addInput("frequency", "number");
    this.addInput("resonance", "number");
    this.addInput("mod_source", "audio");
    this.addOutput("audio", "audio");
    
    this.properties = {
        // AMY Filter types: LPF, HPF, BPF
        filter_type: "LPF",
        frequency: 1000,
        resonance: 1.0,
        
        // Modulation
        mod_source: -1,
        mod_target: "FREQUENCY",
        mod_amount: 0
    };
    
    this.size = [160, 100];
    this.title = "Filter";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

FilterNode.title = "Filter";
FilterNode.desc = "AMY Audio Filter";
FilterNode.type = "amy/filter";

FilterNode.prototype.onExecute = function() {
    const audio_input = this.getInputData(0);
    const freq = this.getInputData(1) ?? this.properties.frequency;
    const resonance = this.getInputData(2) ?? this.properties.resonance;
    const mod_source = this.getInputData(3);
    
    this.properties.frequency = freq;
    this.properties.resonance = resonance;
    
    if (audio_input) {
        this.setOutputData(0, {
            type: "amy_filter",
            input: audio_input,
            filter_type: this.properties.filter_type,
            frequency: freq,
            resonance: resonance,
            mod_source: mod_source ? mod_source.oscillator_id : this.properties.mod_source,
            mod_target: this.properties.mod_target,
            mod_amount: this.properties.mod_amount,
            filter_id: this.id
        });
    }
};

FilterNode.prototype.onPropertyChanged = function(name, value) {
    if (name === "filter_type") {
        const validTypes = ["LPF", "HPF", "BPF"];
        if (!validTypes.includes(value)) {
            this.properties.filter_type = "LPF";
        }
    } else if (name === "mod_target") {
        const validTargets = ["FREQUENCY", "RESONANCE"];
        if (!validTargets.includes(value)) {
            this.properties.mod_target = "FREQUENCY";
        }
    }
};

FilterNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#333";
    ctx.font = "9px Arial";
    ctx.fillText(this.properties.filter_type, 10, this.size[1] - 25);
    ctx.fillText(`${this.properties.frequency.toFixed(0)}Hz`, 10, this.size[1] - 10);
    
    const filterSymbols = {
        LPF: "↘",  // Low pass
        HPF: "↗",  // High pass
        BPF: "↕"   // Band pass
    };
    
    ctx.font = "20px Arial";
    const symbol = filterSymbols[this.properties.filter_type] || "⟋";
    ctx.fillText(symbol, this.size[0] - 30, this.size[1] - 15);
    
    // Show resonance
    ctx.font = "8px Arial";
    ctx.fillStyle = "#666";
    ctx.fillText(`Q:${this.properties.resonance.toFixed(1)}`, this.size[0] - 45, this.size[1] - 5);
};