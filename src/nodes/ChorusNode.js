import { LiteGraph } from 'litegraph.js';

export function ChorusNode() {
    this.addInput("audio", "audio");
    this.addInput("level", "number");
    this.addInput("rate", "number");
    this.addOutput("audio", "audio");
    
    this.properties = {
        // AMY Chorus parameters
        level: 0.3,
        max_delay: 15,  // ms
        lfo_freq: 0.5,  // Hz
        depth: 0.8
    };
    
    this.size = [140, 80];
    this.title = "Chorus";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

ChorusNode.title = "Chorus";
ChorusNode.desc = "AMY Chorus Effect";
ChorusNode.type = "amy/chorus";

ChorusNode.prototype.onExecute = function() {
    const audio_input = this.getInputData(0);
    const level = this.getInputData(1) ?? this.properties.level;
    const rate = this.getInputData(2) ?? this.properties.lfo_freq;
    
    this.properties.level = level;
    this.properties.lfo_freq = rate;
    
    if (audio_input) {
        this.setOutputData(0, {
            type: "amy_chorus",
            input: audio_input,
            level: level,
            max_delay: this.properties.max_delay,
            lfo_freq: rate,
            depth: this.properties.depth,
            effect_id: this.id
        });
    }
};

ChorusNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#333";
    ctx.font = "9px Arial";
    ctx.fillText("CHORUS", 10, this.size[1] - 25);
    ctx.fillText(`${this.properties.lfo_freq.toFixed(1)}Hz`, 10, this.size[1] - 10);
    
    ctx.font = "16px Arial";
    ctx.fillText("🌊", this.size[0] - 25, this.size[1] - 15);
};