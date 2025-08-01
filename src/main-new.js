/**
 * New main entry point without LiteGraph
 */

import { AmyNodeApp } from './AmyNodeApp.js';

// Initialize app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    console.log('Starting AmyNode without LiteGraph...');
    window.amyApp = new AmyNodeApp();
});