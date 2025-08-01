import { LiteGraph } from 'litegraph.js';

export function SequencerNode() {
    this.addInput("clock", "trigger");
    this.addInput("reset", "trigger");
    this.addOutput("gate", "trigger");
    this.addOutput("cv", "number");
    
    this.properties = {
        steps: 8,
        current_step: 0,
        sequence: [60, 62, 64, 65, 67, 69, 71, 72], // MIDI notes
        gates: [1, 1, 1, 1, 1, 1, 1, 1], // Gate pattern
        tempo: 120,
        swing: 0
    };
    
    this.size = [200, 120];
    this.title = "Sequencer";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

SequencerNode.title = "Sequencer";
SequencerNode.desc = "Step Sequencer for AMY";
SequencerNode.type = "amy/sequencer";

SequencerNode.prototype.onExecute = function() {
    const clock = this.getInputData(0);
    const reset = this.getInputData(1);
    
    if (reset) {
        this.properties.current_step = 0;
    }
    
    if (clock) {
        this.properties.current_step = (this.properties.current_step + 1) % this.properties.steps;
    }
    
    const currentNote = this.properties.sequence[this.properties.current_step];
    const currentGate = this.properties.gates[this.properties.current_step];
    
    // Convert MIDI note to frequency
    const frequency = 440 * Math.pow(2, (currentNote - 69) / 12);
    
    this.setOutputData(0, currentGate);
    this.setOutputData(1, frequency);
};

SequencerNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#333";
    ctx.font = "9px Arial";
    ctx.fillText(`Step: ${this.properties.current_step + 1}/${this.properties.steps}`, 10, this.size[1] - 25);
    ctx.fillText(`${this.properties.tempo} BPM`, 10, this.size[1] - 10);
    
    // Draw step indicators
    const stepWidth = (this.size[0] - 20) / this.properties.steps;
    for (let i = 0; i < this.properties.steps; i++) {
        const x = 10 + i * stepWidth;
        const y = this.size[1] - 45;
        
        ctx.fillStyle = i === this.properties.current_step ? "#FF6600" : 
                       this.properties.gates[i] ? "#4CAF50" : "#666";
        ctx.fillRect(x, y, stepWidth - 2, 8);
    }
};