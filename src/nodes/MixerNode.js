import { LiteGraph } from 'litegraph.js';

export function MixerNode() {
    this.addInput("audio1", "audio");
    this.addInput("audio2", "audio");
    this.addInput("audio3", "audio");
    this.addInput("audio4", "audio");
    this.addOutput("mixed", "audio");
    
    this.properties = {
        gain1: 1.0,
        gain2: 1.0,
        gain3: 1.0,
        gain4: 1.0,
        master_gain: 1.0
    };
    
    this.size = [180, 160];
    this.title = "Mixer";
    
    for (let i = 1; i <= 4; i++) {
        this.addWidget("slider", `ch${i}`, this.properties[`gain${i}`], (v) => {
            this.properties[`gain${i}`] = v;
        }, { min: 0, max: 2, step: 0.01 });
    }
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

MixerNode.title = "Mixer";
MixerNode.desc = "4-channel audio mixer";
MixerNode.type = "amy/mixer";

MixerNode.prototype.onExecute = function() {
    const inputs = [];
    
    for (let i = 0; i < 4; i++) {
        const audio = this.getInputData(i);
        if (audio) {
            inputs.push({
                ...audio,
                gain: this.properties[`gain${i + 1}`]
            });
        }
    }
    
    this.setOutputData(0, {
        type: "mixer",
        inputs: inputs,
        master_gain: this.properties.master_gain
    });
};

MixerNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#444";
    ctx.font = "10px Arial";
    ctx.fillText(`Master: ${this.properties.master_gain.toFixed(2)}`, 10, this.size[1] - 5);
};