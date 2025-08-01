// Notification and Error Handling System for AmyNode

export class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.nextId = 1;
        
        this.createContainer();
        this.setupErrorHandling();
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-width: 400px;
            }
            
            .notification {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius);
                padding: 12px 16px;
                box-shadow: var(--shadow-md);
                pointer-events: auto;
                transform: translateX(420px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: flex-start;
                gap: 12px;
                position: relative;
                overflow: hidden;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification.hide {
                transform: translateX(420px);
                opacity: 0;
            }
            
            .notification::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background: var(--accent-color);
            }
            
            .notification.success::before {
                background: #4CAF50;
            }
            
            .notification.warning::before {
                background: #FF9800;
            }
            
            .notification.error::before {
                background: #F44336;
            }
            
            .notification.info::before {
                background: #2196F3;
            }
            
            .notification-icon {
                font-size: 18px;
                line-height: 1;
                flex-shrink: 0;
                margin-top: 1px;
            }
            
            .notification-content {
                flex: 1;
                min-width: 0;
            }
            
            .notification-title {
                font-weight: 600;
                font-size: 14px;
                color: var(--text-primary);
                margin-bottom: 4px;
                line-height: 1.2;
            }
            
            .notification-message {
                font-size: 13px;
                color: var(--text-secondary);
                line-height: 1.3;
                word-wrap: break-word;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                font-size: 16px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 2px;
                transition: background-color 0.2s;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                background: var(--bg-primary);
            }
            
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: rgba(255, 255, 255, 0.1);
                overflow: hidden;
            }
            
            .notification-progress-bar {
                height: 100%;
                background: var(--accent-color);
                transition: width 0.1s linear;
                transform-origin: left;
            }
            
            .notification.success .notification-progress-bar {
                background: #4CAF50;
            }
            
            .notification.warning .notification-progress-bar {
                background: #FF9800;
            }
            
            .notification.error .notification-progress-bar {
                background: #F44336;
            }
            
            .notification.info .notification-progress-bar {
                background: #2196F3;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.container);
    }
    
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.error('Script Error', event.message, {
                persistent: true,
                details: `File: ${event.filename}:${event.lineno}:${event.colno}`
            });
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Promise Rejection', event.reason?.message || 'Unhandled promise rejection', {
                persistent: true,
                details: event.reason?.stack
            });
        });
        
        // Console error interceptor
        const originalError = console.error;
        console.error = (...args) => {
            originalError.apply(console, args);
            
            // Only show notification for non-warning errors
            const message = args.join(' ');
            if (!message.includes('Warning:') && !message.includes('closeAllContextMenus')) {
                this.warning('Console Error', message.substring(0, 100));
            }
        };
    }
    
    // Main notification method
    show(type, title, message, options = {}) {
        const id = this.nextId++;
        
        const notification = this.createNotification(id, type, title, message, options);
        this.notifications.set(id, notification);
        
        this.container.appendChild(notification.element);
        
        // Trigger show animation
        requestAnimationFrame(() => {
            notification.element.classList.add('show');
        });
        
        // Auto-dismiss if not persistent
        if (!options.persistent) {
            const duration = options.duration || this.getDefaultDuration(type);
            this.startDismissTimer(id, duration);
        }
        
        return id;
    }
    
    createNotification(id, type, title, message, options) {
        const element = document.createElement('div');
        element.className = `notification ${type}`;
        element.dataset.id = id;
        
        const icon = this.getIcon(type);
        const hasProgress = !options.persistent;
        
        element.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${this.escapeHtml(title)}</div>
                <div class="notification-message">${this.escapeHtml(message)}</div>
                ${options.details ? `<div class="notification-message" style="margin-top: 4px; font-size: 11px; opacity: 0.7;">${this.escapeHtml(options.details)}</div>` : ''}
            </div>
            <button class="notification-close" onclick="window.notificationSystem.dismiss(${id})">&times;</button>
            ${hasProgress ? '<div class="notification-progress"><div class="notification-progress-bar"></div></div>' : ''}
        `;
        
        return {
            element,
            type,
            title,
            message,
            options,
            startTime: Date.now()
        };
    }
    
    getIcon(type) {
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }
    
    getDefaultDuration(type) {
        const durations = {
            success: 3000,
            warning: 5000,
            error: 7000,
            info: 4000
        };
        return durations[type] || 4000;
    }
    
    startDismissTimer(id, duration) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        const progressBar = notification.element.querySelector('.notification-progress-bar');
        
        if (progressBar) {
            // Animate progress bar
            let progress = 0;
            const interval = 50;
            const step = (interval / duration) * 100;
            
            const timer = setInterval(() => {
                progress += step;
                progressBar.style.width = `${Math.min(progress, 100)}%`;
                
                if (progress >= 100) {
                    clearInterval(timer);
                    this.dismiss(id);
                }
            }, interval);
            
            notification.timer = timer;
        } else {
            // Simple timeout
            notification.timer = setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }
    }
    
    dismiss(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        // Clear timer
        if (notification.timer) {
            clearTimeout(notification.timer);
            clearInterval(notification.timer);
        }
        
        // Animate out
        notification.element.classList.add('hide');
        
        // Remove after animation
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
        }, 300);
    }
    
    dismissAll() {
        Array.from(this.notifications.keys()).forEach(id => {
            this.dismiss(id);
        });
    }
    
    // Convenience methods
    success(title, message, options) {
        return this.show('success', title, message, options);
    }
    
    warning(title, message, options) {
        return this.show('warning', title, message, options);
    }
    
    error(title, message, options) {
        return this.show('error', title, message, { persistent: true, ...options });
    }
    
    info(title, message, options) {
        return this.show('info', title, message, options);
    }
    
    // Loading notifications
    showLoading(title, message) {
        return this.show('info', title, message, { persistent: true });
    }
    
    updateLoading(id, title, message) {
        const notification = this.notifications.get(id);
        if (notification) {
            const titleEl = notification.element.querySelector('.notification-title');
            const messageEl = notification.element.querySelector('.notification-message');
            if (titleEl) titleEl.textContent = title;
            if (messageEl) messageEl.textContent = message;
        }
    }
    
    finishLoading(id, success = true, finalTitle, finalMessage) {
        const notification = this.notifications.get(id);
        if (notification) {
            const type = success ? 'success' : 'error';
            notification.element.className = `notification ${type} show`;
            
            const icon = notification.element.querySelector('.notification-icon');
            if (icon) icon.textContent = this.getIcon(type);
            
            if (finalTitle || finalMessage) {
                this.updateLoading(id, finalTitle || notification.title, finalMessage || notification.message);
            }
            
            // Auto-dismiss after short delay
            setTimeout(() => {
                this.startDismissTimer(id, success ? 2000 : 4000);
            }, 500);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.notificationSystem = new NotificationSystem();
export const notifications = window.notificationSystem;