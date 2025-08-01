import { LiteGraph } from 'litegraph.js';

export function ADCNode() {
    this.addOutput("value", "number");
    this.addWidget("slider", "value", 0.5, (v) => {
        this.properties.value = v;
    }, { min: 0, max: 1, step: 0.01 });
    
    this.properties = {
        value: 0.5,
        min: 0,
        max: 1,
        pin: "A0"
    };
    
    this.size = [160, 80];
    this.title = "ADC Input";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

ADCNode.title = "ADC Input";
ADCNode.desc = "Analog to Digital Converter Input";
ADCNode.type = "amy/adc";

ADCNode.prototype.onExecute = function() {
    const scaledValue = this.properties.min + 
        (this.properties.value * (this.properties.max - this.properties.min));
    
    this.setOutputData(0, scaledValue);
};

ADCNode.prototype.onPropertyChanged = function(name, value) {
    if (name === "min" || name === "max") {
        const widget = this.widgets?.[0];
        if (widget) {
            widget.options.min = this.properties.min;
            widget.options.max = this.properties.max;
        }
    }
};

ADCNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#444";
    ctx.font = "10px Arial";
    ctx.fillText(`Pin: ${this.properties.pin}`, 10, this.size[1] - 5);
};