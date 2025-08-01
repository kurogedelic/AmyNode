import { LiteGraph } from 'litegraph.js';

export function KeyboardNode() {
    this.addOutput("note", "number");
    this.addOutput("gate", "trigger");
    this.addOutput("velocity", "number");
    
    this.properties = {
        octave: 4,
        transpose: 0,
        velocity: 0.8,
        
        // Current state
        current_note: 60, // Middle C
        gate_on: false,
        
        // Keyboard layout
        keys: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    };
    
    this.size = [220, 100];
    this.title = "Keyboard";
    
    this.pressed_keys = new Set();
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

KeyboardNode.title = "Keyboard";
KeyboardNode.desc = "Virtual Keyboard Input";
KeyboardNode.type = "amy/keyboard";

KeyboardNode.prototype.onExecute = function() {
    // Convert MIDI note to frequency
    const frequency = 440 * Math.pow(2, (this.properties.current_note - 69) / 12);
    
    this.setOutputData(0, frequency);
    this.setOutputData(1, this.properties.gate_on);
    this.setOutputData(2, this.properties.velocity);
};

KeyboardNode.prototype.onMouseDown = function(e, localPos) {
    // Simple keyboard interaction
    const keyWidth = (this.size[0] - 20) / 12;
    const keyIndex = Math.floor((localPos[0] - 10) / keyWidth);
    
    if (keyIndex >= 0 && keyIndex < 12) {
        this.properties.current_note = (this.properties.octave * 12) + keyIndex + this.properties.transpose;
        this.properties.gate_on = true;
        this.pressed_keys.add(keyIndex);
        return true;
    }
    return false;
};

KeyboardNode.prototype.onMouseUp = function(e) {
    this.properties.gate_on = false;
    this.pressed_keys.clear();
};

KeyboardNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    ctx.fillStyle = "#333";
    ctx.font = "8px Arial";
    ctx.fillText(`Octave: ${this.properties.octave}`, 10, this.size[1] - 20);
    ctx.fillText(`Note: ${this.properties.keys[this.properties.current_note % 12]}${Math.floor(this.properties.current_note / 12)}`, 10, this.size[1] - 8);
    
    // Draw mini keyboard
    const keyWidth = (this.size[0] - 20) / 12;
    const keyHeight = 25;
    const startY = this.size[1] - 55;
    
    for (let i = 0; i < 12; i++) {
        const x = 10 + i * keyWidth;
        const isBlackKey = [1, 3, 6, 8, 10].includes(i);
        const isPressed = this.pressed_keys.has(i);
        
        ctx.fillStyle = isPressed ? "#FF6600" : (isBlackKey ? "#222" : "#ddd");
        ctx.fillRect(x, startY, keyWidth - 1, keyHeight);
        
        ctx.strokeStyle = "#666";
        ctx.strokeRect(x, startY, keyWidth - 1, keyHeight);
        
        // Label
        ctx.fillStyle = isBlackKey ? "#fff" : "#000";
        ctx.font = "6px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.properties.keys[i], x + keyWidth/2, startY + keyHeight - 3);
    }
};