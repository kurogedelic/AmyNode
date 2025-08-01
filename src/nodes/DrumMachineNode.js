import { LiteGraph } from 'litegraph.js';

export function DrumMachineNode() {
    this.addInput("clock", "trigger");
    this.addInput("reset", "trigger");
    this.addOutput("kick", "audio");
    this.addOutput("snare", "audio");
    this.addOutput("hihat", "audio");
    this.addOutput("cymbal", "audio");
    
    this.properties = {
        steps: 16,
        current_step: 0,
        
        // Drum patterns (1 = hit, 0 = rest)
        kick_pattern: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
        snare_pattern: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
        hihat_pattern: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        cymbal_pattern: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        
        // AMY patches for each drum
        kick_patch: 0,
        snare_patch: 1,
        hihat_patch: 2,
        cymbal_patch: 3,
        
        swing: 0,
        volume: 0.8
    };
    
    this.size = [200, 140];
    this.title = "Drum Machine";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

DrumMachineNode.title = "Drum Machine";
DrumMachineNode.desc = "AMY Drum Machine";
DrumMachineNode.type = "amy/drums";

DrumMachineNode.prototype.onExecute = function() {
    const clock = this.getInputData(0);
    const reset = this.getInputData(1);
    
    if (reset) {
        this.properties.current_step = 0;
    }
    
    if (clock) {
        const step = this.properties.current_step;
        
        // Output drum hits based on patterns
        this.setOutputData(0, this.properties.kick_pattern[step] ? {
            type: "amy_sample",
            patch: this.properties.kick_patch,
            velocity: this.properties.volume
        } : null);
        
        this.setOutputData(1, this.properties.snare_pattern[step] ? {
            type: "amy_sample", 
            patch: this.properties.snare_patch,
            velocity: this.properties.volume
        } : null);
        
        this.setOutputData(2, this.properties.hihat_pattern[step] ? {
            type: "amy_sample",
            patch: this.properties.hihat_patch, 
            velocity: this.properties.volume * 0.7
        } : null);
        
        this.setOutputData(3, this.properties.cymbal_pattern[step] ? {
            type: "amy_sample",
            patch: this.properties.cymbal_patch,
            velocity: this.properties.volume
        } : null);
        
        this.properties.current_step = (this.properties.current_step + 1) % this.properties.steps;
    }
};

DrumMachineNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#333";
    ctx.font = "8px Arial";
    ctx.fillText(`Step: ${this.properties.current_step + 1}/${this.properties.steps}`, 10, this.size[1] - 30);
    
    // Draw pattern grid
    const drums = ['K', 'S', 'H', 'C'];
    const patterns = [
        this.properties.kick_pattern,
        this.properties.snare_pattern, 
        this.properties.hihat_pattern,
        this.properties.cymbal_pattern
    ];
    
    for (let drum = 0; drum < 4; drum++) {
        ctx.fillText(drums[drum], 5, 35 + drum * 12);
        
        for (let step = 0; step < 8; step++) { // Show first 8 steps
            const x = 20 + step * 15;
            const y = 30 + drum * 12;
            
            ctx.fillStyle = patterns[drum][step] ? "#4CAF50" : "#333";
            if (step === this.properties.current_step % 8) {
                ctx.fillStyle = "#FF6600";
            }
            ctx.fillRect(x, y, 10, 8);
        }
    }
};