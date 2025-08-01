import { LiteGraph } from 'litegraph.js';

export function SamplePlayerNode() {
    this.addInput("trigger", "trigger");
    this.addInput("pitch", "number");
    this.addOutput("audio", "audio");
    
    this.properties = {
        // AMY PCM parameters
        patch: 0,        // Sample number
        velocity: 1.0,   // Playback velocity
        pitch: 1.0,      // Pitch multiplier
        loop: false,     // Loop sample
        start_pos: 0,    // Start position
        end_pos: 1.0,    // End position (0-1)
        
        // Sample info
        sample_name: "kick.wav",
        sample_length: 1000 // ms
    };
    
    this.size = [160, 100];
    this.title = "Sample Player";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

SamplePlayerNode.title = "Sample Player";
SamplePlayerNode.desc = "AMY PCM Sample Player";
SamplePlayerNode.type = "amy/sampleplayer";

SamplePlayerNode.prototype.onExecute = function() {
    const trigger = this.getInputData(0);
    const pitch = this.getInputData(1) ?? this.properties.pitch;
    
    this.properties.pitch = pitch;
    
    if (trigger) {
        this.setOutputData(0, {
            type: "amy_sample",
            patch: this.properties.patch,
            velocity: this.properties.velocity,
            pitch: pitch,
            loop: this.properties.loop,
            start_pos: this.properties.start_pos,
            end_pos: this.properties.end_pos,
            sample_id: this.id
        });
    }
};

SamplePlayerNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#333";
    ctx.font = "9px Arial";
    ctx.fillText(`Patch: ${this.properties.patch}`, 10, this.size[1] - 25);
    ctx.fillText(this.properties.sample_name, 10, this.size[1] - 10);
    
    ctx.font = "16px Arial";
    ctx.fillText("♪", this.size[0] - 25, this.size[1] - 15);
};