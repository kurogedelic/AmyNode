import { LiteGraph } from 'litegraph.js';

export function GPIONode() {
    this.addOutput("state", "boolean");
    
    this.properties = {
        pin: 13,
        mode: "input",
        pull: "none",
        state: false
    };
    
    this.size = [140, 80];
    this.title = "GPIO Pin";
    
    if (this.properties.mode === "output") {
        this.addInput("state", "boolean");
    }
    
    this.addWidget("toggle", "state", this.properties.state, (v) => {
        this.properties.state = v;
    });
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

GPIONode.title = "GPIO Pin";
GPIONode.desc = "General Purpose Input/Output Pin";
GPIONode.type = "amy/gpio";

GPIONode.prototype.onExecute = function() {
    if (this.properties.mode === "input") {
        this.setOutputData(0, this.properties.state);
    } else {
        const inputState = this.getInputData(0);
        if (inputState !== undefined) {
            this.properties.state = !!inputState;
            if (this.widgets?.[0]) {
                this.widgets[0].value = this.properties.state;
            }
        }
    }
};

GPIONode.prototype.onPropertyChanged = function(name, value) {
    if (name === "mode") {
        if (value === "output" && this.inputs.length === 0) {
            this.addInput("state", "boolean");
        } else if (value === "input" && this.inputs.length > 0) {
            this.removeInput(0);
        }
    }
};

GPIONode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#444";
    ctx.font = "10px Arial";
    ctx.fillText(`Pin ${this.properties.pin} (${this.properties.mode})`, 10, this.size[1] - 5);
    
    const stateIndicator = this.properties.state ? "●" : "○";
    ctx.font = "16px Arial";
    ctx.fillStyle = this.properties.state ? "#4CAF50" : "#666";
    ctx.fillText(stateIndicator, this.size[0] - 25, this.size[1] - 5);
};