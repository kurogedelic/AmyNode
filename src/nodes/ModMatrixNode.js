import { LiteGraph } from 'litegraph.js';

export function ModMatrixNode() {
    this.addInput("source_1", "audio");
    this.addInput("source_2", "audio");
    this.addInput("source_3", "audio");
    this.addInput("source_4", "audio");
    this.addOutput("mod_out_1", "audio");
    this.addOutput("mod_out_2", "audio");
    this.addOutput("mod_out_3", "audio");
    this.addOutput("mod_out_4", "audio");
    
    this.properties = {
        // Modulation matrix - source to destination amounts
        matrix: [
            [0.0, 0.0, 0.0, 0.0], // Source 1 -> Dest 1,2,3,4
            [0.0, 0.0, 0.0, 0.0], // Source 2 -> Dest 1,2,3,4  
            [0.0, 0.0, 0.0, 0.0], // Source 3 -> Dest 1,2,3,4
            [0.0, 0.0, 0.0, 0.0]  // Source 4 -> Dest 1,2,3,4
        ],
        
        // Labels for UI
        source_labels: ["LFO 1", "LFO 2", "ENV 1", "OSC 1"],
        dest_labels: ["Freq", "Amp", "Filter", "Phase"]
    };
    
    this.size = [220, 180];
    this.title = "Mod Matrix";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

ModMatrixNode.title = "Mod Matrix";
ModMatrixNode.desc = "Modulation Routing Matrix";
ModMatrixNode.type = "amy/modmatrix";

ModMatrixNode.prototype.onExecute = function() {
    const sources = [
        this.getInputData(0),
        this.getInputData(1), 
        this.getInputData(2),
        this.getInputData(3)
    ];
    
    // Output mixed modulation signals
    for (let dest = 0; dest < 4; dest++) {
        let mixedSignal = {
            type: "modulation_mix",
            sources: [],
            amounts: [],
            dest_id: dest
        };
        
        for (let src = 0; src < 4; src++) {
            if (sources[src] && this.properties.matrix[src][dest] !== 0) {
                mixedSignal.sources.push(sources[src]);
                mixedSignal.amounts.push(this.properties.matrix[src][dest]);
            }
        }
        
        this.setOutputData(dest, mixedSignal);
    }
};

ModMatrixNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#333";
    ctx.font = "8px Arial";
    
    // Draw matrix grid
    const startX = 10;
    const startY = 30;
    const cellWidth = 40;
    const cellHeight = 20;
    
    // Draw column headers (destinations)
    for (let dest = 0; dest < 4; dest++) {
        ctx.fillText(this.properties.dest_labels[dest], startX + (dest + 1) * cellWidth, startY - 5);
    }
    
    // Draw matrix values
    for (let src = 0; src < 4; src++) {
        // Row header (source)
        ctx.fillText(this.properties.source_labels[src], startX - 5, startY + (src + 1) * cellHeight + 10);
        
        for (let dest = 0; dest < 4; dest++) {
            const value = this.properties.matrix[src][dest];
            const x = startX + (dest + 1) * cellWidth;
            const y = startY + (src + 1) * cellHeight;
            
            // Draw cell background
            ctx.fillStyle = value !== 0 ? "#444" : "#222";
            ctx.fillRect(x - 15, y - 8, 30, 16);
            
            // Draw value
            ctx.fillStyle = value !== 0 ? "#fff" : "#666";
            ctx.fillText(value.toFixed(1), x - 8, y + 3);
        }
    }
    
    ctx.fillStyle = "#9C27B0";
    ctx.font = "10px Arial";
    ctx.fillText("MOD MATRIX", this.size[0] - 70, this.size[1] - 5);
};