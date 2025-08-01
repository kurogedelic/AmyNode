import { LiteGraph } from 'litegraph.js';

export function EchoNode() {
    this.addInput("audio", "audio");
    this.addInput("delay_time", "number");
    this.addInput("feedback", "number");
    this.addOutput("audio", "audio");
    
    this.properties = {
        // AMY Echo parameters
        delay_time: 250,  // ms
        feedback: 0.4,
        level: 0.5,
        max_delay: 1000   // ms
    };
    
    this.size = [140, 80];
    this.title = "Echo";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

EchoNode.title = "Echo";
EchoNode.desc = "AMY Echo Effect";
EchoNode.type = "amy/echo";

EchoNode.prototype.onExecute = function() {
    const audio_input = this.getInputData(0);
    const delay_time = this.getInputData(1) ?? this.properties.delay_time;
    const feedback = this.getInputData(2) ?? this.properties.feedback;
    
    this.properties.delay_time = delay_time;
    this.properties.feedback = feedback;
    
    if (audio_input) {
        this.setOutputData(0, {
            type: "amy_echo",
            input: audio_input,
            delay_time: delay_time,
            feedback: feedback,
            level: this.properties.level,
            max_delay: this.properties.max_delay,
            effect_id: this.id
        });
    }
};

EchoNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#333";
    ctx.font = "9px Arial";
    ctx.fillText("ECHO", 10, this.size[1] - 25);
    ctx.fillText(`${this.properties.delay_time}ms`, 10, this.size[1] - 10);
    
    ctx.font = "16px Arial";
    ctx.fillText("📢", this.size[0] - 25, this.size[1] - 15);
};