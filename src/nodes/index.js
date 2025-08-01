import { LiteGraph } from 'litegraph.js';
import { OscillatorNode } from './OscillatorNode.js';
import { LFONode } from './LFONode.js';
import { FilterNode } from './FilterNode.js';
import { ReverbNode } from './ReverbNode.js';
import { ChorusNode } from './ChorusNode.js';
import { EchoNode } from './EchoNode.js';
import { SequencerNode } from './SequencerNode.js';
import { ClockNode } from './ClockNode.js';
import { SamplePlayerNode } from './SamplePlayerNode.js';
import { DrumMachineNode } from './DrumMachineNode.js';
import { KeyboardNode } from './KeyboardNode.js';
import { ADCNode } from './ADCNode.js';
import { MapNode } from './MapNode.js';
import { EnvelopeNode } from './EnvelopeNode.js';
import { ModMatrixNode } from './ModMatrixNode.js';
import { MixerNode } from './MixerNode.js';
import { GPIONode } from './GPIONode.js';
import { OutputNode } from './OutputNode.js';

export function registerCustomNodes() {
    // Generators
    LiteGraph.registerNodeType("amy/oscillator", OscillatorNode);
    LiteGraph.registerNodeType("amy/sampleplayer", SamplePlayerNode);
    
    // Processors
    LiteGraph.registerNodeType("amy/filter", FilterNode);
    LiteGraph.registerNodeType("amy/mixer", MixerNode);
    
    // Effects
    LiteGraph.registerNodeType("amy/reverb", ReverbNode);
    LiteGraph.registerNodeType("amy/chorus", ChorusNode);
    LiteGraph.registerNodeType("amy/echo", EchoNode);
    
    // Modulation
    LiteGraph.registerNodeType("amy/envelope", EnvelopeNode);
    LiteGraph.registerNodeType("amy/lfo", LFONode);
    LiteGraph.registerNodeType("amy/modmatrix", ModMatrixNode);
    
    // Sequencing
    LiteGraph.registerNodeType("amy/sequencer", SequencerNode);
    LiteGraph.registerNodeType("amy/clock", ClockNode);
    LiteGraph.registerNodeType("amy/drums", DrumMachineNode);
    LiteGraph.registerNodeType("amy/keyboard", KeyboardNode);
    
    // Input/Output
    LiteGraph.registerNodeType("amy/adc", ADCNode);
    LiteGraph.registerNodeType("amy/gpio", GPIONode);
    LiteGraph.registerNodeType("amy/output", OutputNode);
    
    // Utility
    LiteGraph.registerNodeType("amy/map", MapNode);
}