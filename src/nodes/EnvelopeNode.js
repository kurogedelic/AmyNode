import { LiteGraph } from 'litegraph.js';

export function EnvelopeNode() {
    this.addInput("trigger", "trigger");
    this.addOutput("envelope", "envelope");
    
    this.properties = {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.5
    };
    
    this.size = [160, 120];
    
    this.addWidget("number", "attack", this.properties.attack, (v) => {
        this.properties.attack = Math.max(0, v);
    }, { min: 0, max: 2, step: 0.01 });
    
    this.addWidget("number", "decay", this.properties.decay, (v) => {
        this.properties.decay = Math.max(0, v);
    }, { min: 0, max: 2, step: 0.01 });
    
    this.addWidget("slider", "sustain", this.properties.sustain, (v) => {
        this.properties.sustain = v;
    }, { min: 0, max: 1, step: 0.01 });
    
    this.addWidget("number", "release", this.properties.release, (v) => {
        this.properties.release = Math.max(0, v);
    }, { min: 0, max: 5, step: 0.01 });
    
    this.title = "ADSR Envelope";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

EnvelopeNode.title = "ADSR Envelope";
EnvelopeNode.desc = "Attack Decay Sustain Release Envelope";
EnvelopeNode.type = "amy/envelope";

EnvelopeNode.prototype.onExecute = function() {
    const trigger = this.getInputData(0);
    
    this.setOutputData(0, {
        type: "envelope",
        attack: this.properties.attack,
        decay: this.properties.decay,
        sustain: this.properties.sustain,
        release: this.properties.release,
        triggered: !!trigger
    });
};

EnvelopeNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    const padding = 10;
    const graphWidth = this.size[0] - 2 * padding;
    const graphHeight = 30;
    const graphY = this.size[1] - graphHeight - padding;
    
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(padding, graphY, graphWidth, graphHeight);
    ctx.stroke();
    
    ctx.strokeStyle = "#4CAF50";
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const totalTime = this.properties.attack + this.properties.decay + 1 + this.properties.release;
    const scale = graphWidth / totalTime;
    
    let x = padding;
    let y = graphY + graphHeight;
    
    ctx.moveTo(x, y);
    
    x += this.properties.attack * scale;
    y = graphY;
    ctx.lineTo(x, y);
    
    x += this.properties.decay * scale;
    y = graphY + graphHeight * (1 - this.properties.sustain);
    ctx.lineTo(x, y);
    
    x += scale;
    ctx.lineTo(x, y);
    
    x += this.properties.release * scale;
    y = graphY + graphHeight;
    ctx.lineTo(x, y);
    
    ctx.stroke();
};