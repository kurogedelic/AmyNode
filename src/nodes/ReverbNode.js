import { LiteGraph } from 'litegraph.js';

export function ReverbNode() {
    this.addInput("audio", "audio");
    this.addInput("level", "number");
    this.addInput("feedback", "number");
    this.addOutput("audio", "audio");
    
    this.properties = {
        // AMY Reverb parameters
        level: 0.5,
        feedback: 0.7,
        liveness: 0.8,
        damping: 0.5
    };
    
    this.size = [140, 80];
    this.title = "Reverb";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

ReverbNode.title = "Reverb";
ReverbNode.desc = "AMY Reverb Effect";
ReverbNode.type = "amy/reverb";

ReverbNode.prototype.onExecute = function() {
    const audio_input = this.getInputData(0);
    const level = this.getInputData(1) ?? this.properties.level;
    const feedback = this.getInputData(2) ?? this.properties.feedback;
    
    this.properties.level = level;
    this.properties.feedback = feedback;
    
    if (audio_input) {
        this.setOutputData(0, {
            type: "amy_reverb",
            input: audio_input,
            level: level,
            feedback: feedback,
            liveness: this.properties.liveness,
            damping: this.properties.damping,
            effect_id: this.id
        });
    }
};

ReverbNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#333";
    ctx.font = "9px Arial";
    ctx.fillText("REVERB", 10, this.size[1] - 25);
    ctx.fillText(`Lvl:${(this.properties.level * 100).toFixed(0)}%`, 10, this.size[1] - 10);
    
    ctx.font = "16px Arial";
    ctx.fillText("🔊", this.size[0] - 25, this.size[1] - 15);
};