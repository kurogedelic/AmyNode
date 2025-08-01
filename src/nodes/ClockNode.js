import { LiteGraph } from 'litegraph.js';

export function ClockNode() {
    this.addOutput("clock", "trigger");
    this.addOutput("reset", "trigger");
    
    this.properties = {
        bpm: 120,
        running: false,
        swing: 0,
        subdivision: 4 // 4 = quarter notes
    };
    
    this.size = [140, 80];
    this.title = "Clock";
    
    this.lastTime = 0;
    this.clockInterval = null;
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

ClockNode.title = "Clock";
ClockNode.desc = "Master Clock Generator";
ClockNode.type = "amy/clock";

ClockNode.prototype.onExecute = function() {
    const currentTime = Date.now();
    const interval = (60 / this.properties.bpm) * (4 / this.properties.subdivision) * 1000;
    
    if (this.properties.running && currentTime - this.lastTime >= interval) {
        this.setOutputData(0, true); // Clock pulse
        this.lastTime = currentTime;
    } else {
        this.setOutputData(0, false);
    }
    
    this.setOutputData(1, false); // Reset (controlled by user)
};

ClockNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#333";
    ctx.font = "9px Arial";
    ctx.fillText(`${this.properties.bpm} BPM`, 10, this.size[1] - 25);
    ctx.fillText(this.properties.running ? "RUNNING" : "STOPPED", 10, this.size[1] - 10);
    
    // Draw tempo indicator
    const beat = Math.floor((Date.now() / (60000 / this.properties.bpm)) % 4);
    ctx.fillStyle = this.properties.running && beat === 0 ? "#FF6600" : "#666";
    ctx.fillRect(this.size[0] - 20, this.size[1] - 30, 12, 12);
};