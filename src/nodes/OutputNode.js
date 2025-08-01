import { LiteGraph } from 'litegraph.js';

export function OutputNode() {
    this.addInput("audio", "audio");
    this.addInput("left", "audio");
    this.addInput("right", "audio");
    
    this.properties = {
        // AMY DAC parameters
        master_volume: 1.0,
        pan: 0.0,  // -1.0 (left) to 1.0 (right)
        
        // Output routing
        output_channel: 0,  // AMY output channel
        stereo_mode: false,  // true for stereo, false for mono
        
        // Limiting/protection
        limiter_enabled: true,
        limiter_threshold: 0.95
    };
    
    this.size = [140, 80];
    this.title = "Audio Output";
    
    // Visual properties
    this.color = "#ff6600";
    this.bgcolor = "#2d2d2d";
    
    // Initialize flags to prevent errors
    this.flags = this.flags || {};
}

OutputNode.title = "Audio Output";
OutputNode.desc = "AMY Audio Output/DAC";
OutputNode.type = "amy/output";

OutputNode.prototype.onExecute = function() {
    // Audio output node - processes incoming audio and sends to DAC
    const audioInput = this.getInputData(0); // Main audio input
    const leftInput = this.getInputData(1);  // Left channel
    const rightInput = this.getInputData(2); // Right channel
    
    // Process stereo or mono output
    if (this.properties.stereo_mode && leftInput !== undefined && rightInput !== undefined) {
        // Stereo mode - use separate left/right inputs
        this.processedAudio = {
            type: "stereo_output",
            left: leftInput,
            right: rightInput,
            volume: this.properties.master_volume,
            channel: this.properties.output_channel
        };
    } else if (audioInput !== undefined) {
        // Mono mode - use main audio input
        this.processedAudio = {
            type: "mono_output", 
            audio: audioInput,
            volume: this.properties.master_volume,
            pan: this.properties.pan,
            channel: this.properties.output_channel
        };
    }
    
    // Apply limiting if enabled
    if (this.properties.limiter_enabled && this.processedAudio) {
        this.processedAudio.limiter_threshold = this.properties.limiter_threshold;
    }
};

OutputNode.prototype.onDrawBackground = function(ctx) {
    if (this.flags.collapsed) return;
    
    // Draw volume meter visualization
    const volume = this.properties.master_volume;
    const meterHeight = 20;
    const meterWidth = this.size[0] - 20;
    const meterX = 10;
    const meterY = this.size[1] - 35;
    
    // Background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    
    // Volume bar
    const volumeWidth = meterWidth * volume;
    const volumeColor = volume > 0.95 ? "#ff4444" : volume > 0.7 ? "#ffaa00" : "#44ff44";
    ctx.fillStyle = volumeColor;
    ctx.fillRect(meterX, meterY, volumeWidth, meterHeight);
    
    // Border
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    
    // Volume text
    ctx.fillStyle = "#fff";
    ctx.font = "8px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(volume * 100)}%`, meterX + meterWidth/2, meterY + 12);
    
    // Stereo/Mono indicator
    const modeText = this.properties.stereo_mode ? "STEREO" : "MONO";
    ctx.fillStyle = "#aaa";
    ctx.font = "7px Arial";
    ctx.textAlign = "left";
    ctx.fillText(modeText, 10, this.size[1] - 8);
    
    // Channel indicator
    ctx.textAlign = "right";
    ctx.fillText(`CH${this.properties.output_channel}`, this.size[0] - 10, this.size[1] - 8);
};