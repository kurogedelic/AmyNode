import { LiteGraph } from 'litegraph.js';

export function MapNode() {
    this.addInput("input", "number");
    this.addOutput("output", "number");
    
    this.properties = {
        in_min: 0,
        in_max: 1,
        out_min: 0,
        out_max: 100
    };
    
    this.size = [140, 100];
    this.title = "Map Range";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

MapNode.title = "Map Range";
MapNode.desc = "Maps input range to output range";
MapNode.type = "amy/map";

MapNode.prototype.onExecute = function() {
    const input = this.getInputData(0) ?? 0;
    
    const normalized = (input - this.properties.in_min) / 
                      (this.properties.in_max - this.properties.in_min);
    
    const output = this.properties.out_min + 
                  (normalized * (this.properties.out_max - this.properties.out_min));
    
    this.setOutputData(0, output);
};

MapNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#555";
    ctx.font = "9px Arial";
    
    const inputRange = `[${this.properties.in_min}-${this.properties.in_max}]`;
    const outputRange = `[${this.properties.out_min}-${this.properties.out_max}]`;
    
    ctx.fillText(inputRange, 10, 20);
    ctx.fillText("→", this.size[0] / 2 - 5, 20);
    ctx.fillText(outputRange, this.size[0] - 50, 20);
};