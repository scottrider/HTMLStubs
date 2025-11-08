/**
 * BaseControl - Foundation class for all HTML Controls Library components
 * Provides common functionality, logging integration, and best practices
 * 
 * Best Practices Implemented:
 * - Centralized logging with performance monitoring
 * - Event-driven architecture with loose coupling
 * - Consistent error handling and recovery
 * - Memory management and cleanup
 * - Accessibility and responsive design support
 */

class BaseControl {
    constructor(options = {}) {
        this.options = {
            // Default options that all controls should support
            logging: true,
            performance: true,
            accessibility: true,
            responsive: true,
            debug: false,
            ...options
        };

        // Core properties
        this.id = this.generateId();
        this.type = this.constructor.name;
        this.container = null;
        this.isInitialized = false;
        this.isDestroyed = false;
        this.eventListeners = new Map();
        this.childControls = new Set();
        this.parentControl = null;

        // Performance tracking
        this.performanceMarkers = new Map();
        this.renderCount = 0;
        this.lastRenderTime = null;

        // Initialize logging
        this.initializeLogging();

        // Start initialization
        this.logger.debug(`${this.type} constructor called`, {
            id: this.id,
            options: this.options
        });
    }

    // ========================================
    // CORE LIFECYCLE METHODS
    // ========================================

    /**
     * Initialize the control - must be implemented by derived classes
     */
    init() {
        if (this.isInitialized) {
            this.logger.warn('Control already initialized', { id: this.id });
            return this;
        }

        this.logger.info(`Initializing ${this.type}`, { id: this.id });
        
        const timer = this.startPerformanceTimer('initialization');
        
        try {
            // Find and validate container
            this.initializeContainer();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize accessibility features
            if (this.options.accessibility) {
                this.initializeAccessibility();
            }
            
            // Initialize responsive features
            if (this.options.responsive) {
                this.initializeResponsive();
            }
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Trigger initialization event
            this.trigger('initialized', { id: this.id, type: this.type });
            
            this.logger.info(`${this.type} initialized successfully`, { id: this.id });
            
            return this;
        } catch (error) {
            this.logger.error(`Failed to initialize ${this.type}`, {
                id: this.id,
                error: error.message,
                stack: error.stack
            });
            throw error;
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    /**
     * Render the control - must be implemented by derived classes
     */
    render() {
        if (!this.isInitialized) {
            this.logger.warn('Attempting to render uninitialized control', { id: this.id });
            return this;
        }

        const timer = this.startPerformanceTimer('render');
        
        try {
            this.renderCount++;
            this.lastRenderTime = Date.now();
            
            // Derived classes should override this method
            this.logger.debug('Base render method called', { 
                id: this.id, 
                renderCount: this.renderCount 
            });
            
            // Trigger render event
            this.trigger('rendered', { 
                id: this.id, 
                renderCount: this.renderCount,
                timestamp: this.lastRenderTime
            });
            
            return this;
        } catch (error) {
            this.logger.error('Render failed', {
                id: this.id,
                error: error.message,
                stack: error.stack
            });
            throw error;
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    /**
     * Update the control with new data or options
     */
    update(newOptions = {}) {
        this.logger.debug('Updating control', { id: this.id, newOptions });
        
        const timer = this.startPerformanceTimer('update');
        
        try {
            // Merge new options
            Object.assign(this.options, newOptions);
            
            // Re-render with new options
            this.render();
            
            // Trigger update event
            this.trigger('updated', { id: this.id, options: newOptions });
            
            return this;
        } catch (error) {
            this.logger.error('Update failed', {
                id: this.id,
                error: error.message,
                newOptions
            });
            throw error;
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    /**
     * Destroy the control and clean up resources
     */
    destroy() {
        if (this.isDestroyed) {
            this.logger.warn('Control already destroyed', { id: this.id });
            return;
        }

        this.logger.info(`Destroying ${this.type}`, { id: this.id });
        
        try {
            // Clean up event listeners
            this.removeAllEventListeners();
            
            // Destroy child controls
            this.destroyChildControls();
            
            // Remove from parent
            if (this.parentControl) {
                this.parentControl.removeChildControl(this);
            }
            
            // Clean up DOM
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
            
            // Mark as destroyed
            this.isDestroyed = true;
            this.isInitialized = false;
            
            // Trigger destroy event
            this.trigger('destroyed', { id: this.id, type: this.type });
            
            this.logger.info(`${this.type} destroyed successfully`, { id: this.id });
            
        } catch (error) {
            this.logger.error('Destroy failed', {
                id: this.id,
                error: error.message,
                stack: error.stack
            });
        }
    }

    // ========================================
    // LOGGING INTEGRATION
    // ========================================

    /**
     * Initialize logging for this control
     */
    initializeLogging() {
        if (this.options.logging && typeof HTMLControlsLogger !== 'undefined') {
            // Create child logger with control context
            this.logger = new HTMLControlsLogger({
                name: `HTMLControls:${this.type}`,
                level: this.options.debug ? 'debug' : 'info',
                performance: this.options.performance
            });
            
            this.logger.setContext({
                controlType: this.type,
                controlId: this.id,
                version: '1.0.0'
            });
        } else {
            // Fallback to console logging
            this.logger = {
                error: (...args) => console.error(`[${this.type}:${this.id}]`, ...args),
                warn: (...args) => console.warn(`[${this.type}:${this.id}]`, ...args),
                info: (...args) => console.info(`[${this.type}:${this.id}]`, ...args),
                debug: (...args) => this.options.debug && console.log(`[${this.type}:${this.id}]`, ...args),
                startTimer: () => {},
                endTimer: () => {}
            };
        }
    }

    /**
     * Log performance timing
     */
    startPerformanceTimer(operation) {
        if (!this.options.performance) return null;
        
        const label = `${this.type}:${this.id}:${operation}`;
        if (this.logger.startTimer) {
            return this.logger.startTimer(label, { 
                controlType: this.type,
                controlId: this.id,
                operation 
            });
        }
        return null;
    }

    endPerformanceTimer(timer) {
        if (!this.options.performance || !timer) return;
        
        if (this.logger.endTimer) {
            this.logger.endTimer(timer);
        }
    }

    // ========================================
    // EVENT MANAGEMENT
    // ========================================

    /**
     * Set up base event listeners
     */
    setupEventListeners() {
        // Window resize handling for responsive controls
        if (this.options.responsive) {
            this.addEventListener(window, 'resize', this.handleResize.bind(this));
        }
        
        // Global error handling
        this.addEventListener(window, 'error', this.handleGlobalError.bind(this));
    }

    /**
     * Add event listener with automatic cleanup tracking
     */
    addEventListener(element, event, handler, options = {}) {
        const key = `${element === window ? 'window' : element.id || 'element'}:${event}`;
        
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        
        this.eventListeners.get(key).push({ element, event, handler, options });
        element.addEventListener(event, handler, options);
        
        this.logger.debug('Event listener added', { 
            id: this.id, 
            event, 
            element: element.tagName || 'window' 
        });
    }

    /**
     * Remove specific event listener
     */
    removeEventListener(element, event, handler) {
        const key = `${element === window ? 'window' : element.id || 'element'}:${event}`;
        const listeners = this.eventListeners.get(key);
        
        if (listeners) {
            const index = listeners.findIndex(l => l.handler === handler);
            if (index !== -1) {
                element.removeEventListener(event, handler);
                listeners.splice(index, 1);
                
                if (listeners.length === 0) {
                    this.eventListeners.delete(key);
                }
                
                this.logger.debug('Event listener removed', { 
                    id: this.id, 
                    event, 
                    element: element.tagName || 'window' 
                });
            }
        }
    }

    /**
     * Remove all event listeners for cleanup
     */
    removeAllEventListeners() {
        for (const [key, listeners] of this.eventListeners.entries()) {
            for (const { element, event, handler } of listeners) {
                element.removeEventListener(event, handler);
            }
        }
        this.eventListeners.clear();
        
        this.logger.debug('All event listeners removed', { id: this.id });
    }

    /**
     * Trigger custom events
     */
    trigger(eventName, data = {}) {
        const event = new CustomEvent(`htmlcontrols:${eventName}`, {
            detail: {
                ...data,
                source: this.type,
                sourceId: this.id,
                timestamp: new Date().toISOString()
            }
        });

        // Trigger on container if available
        if (this.container) {
            this.container.dispatchEvent(event);
        }

        // Trigger on document for global listeners
        document.dispatchEvent(event);

        this.logger.debug('Event triggered', { 
            id: this.id, 
            eventName, 
            data 
        });
    }

    // ========================================
    // ACCESSIBILITY FEATURES
    // ========================================

    /**
     * Initialize accessibility features
     */
    initializeAccessibility() {
        if (!this.container) return;

        // Set basic ARIA attributes
        this.container.setAttribute('role', this.getAriaRole());
        this.container.setAttribute('aria-label', this.getAriaLabel());
        
        // Add tabindex if needed
        if (this.isInteractive()) {
            this.container.setAttribute('tabindex', '0');
        }

        // Set up keyboard navigation
        this.setupKeyboardNavigation();

        this.logger.debug('Accessibility initialized', { id: this.id });
    }

    /**
     * Get ARIA role for this control - should be overridden by derived classes
     */
    getAriaRole() {
        return 'region';
    }

    /**
     * Get ARIA label for this control - should be overridden by derived classes
     */
    getAriaLabel() {
        return `${this.type} Control`;
    }

    /**
     * Determine if this control is interactive
     */
    isInteractive() {
        return true; // Override in derived classes
    }

    /**
     * Set up keyboard navigation
     */
    setupKeyboardNavigation() {
        if (!this.container) return;

        this.addEventListener(this.container, 'keydown', (event) => {
            this.handleKeyDown(event);
        });
    }

    /**
     * Handle keyboard events - override in derived classes
     */
    handleKeyDown(event) {
        // Default keyboard handling
        switch (event.key) {
            case 'Escape':
                this.handleEscape(event);
                break;
            case 'Enter':
                this.handleEnter(event);
                break;
        }
    }

    handleEscape(event) {
        // Default: lose focus
        if (this.container) {
            this.container.blur();
        }
    }

    handleEnter(event) {
        // Default: trigger click
        this.trigger('activated', { source: 'keyboard' });
    }

    // ========================================
    // RESPONSIVE FEATURES
    // ========================================

    /**
     * Initialize responsive features
     */
    initializeResponsive() {
        this.updateResponsiveState();
        this.logger.debug('Responsive features initialized', { id: this.id });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.options.responsive) {
            this.updateResponsiveState();
            this.trigger('resized', { 
                id: this.id,
                viewport: this.getViewportSize()
            });
        }
    }

    /**
     * Update responsive state based on viewport
     */
    updateResponsiveState() {
        if (!this.container) return;

        const viewport = this.getViewportSize();
        const breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        };

        // Remove existing responsive classes
        this.container.classList.remove('mobile', 'tablet', 'desktop');

        // Add appropriate responsive class
        if (viewport.width < breakpoints.mobile) {
            this.container.classList.add('mobile');
        } else if (viewport.width < breakpoints.tablet) {
            this.container.classList.add('tablet');
        } else {
            this.container.classList.add('desktop');
        }
    }

    /**
     * Get current viewport size
     */
    getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    // ========================================
    // CONTAINER MANAGEMENT
    // ========================================

    /**
     * Initialize container element
     */
    initializeContainer() {
        if (this.options.container) {
            if (typeof this.options.container === 'string') {
                this.container = document.querySelector(this.options.container);
                if (!this.container) {
                    throw new Error(`Container not found: ${this.options.container}`);
                }
            } else if (this.options.container instanceof HTMLElement) {
                this.container = this.options.container;
            } else {
                throw new Error('Invalid container option');
            }
        } else {
            // Create default container
            this.container = document.createElement('div');
            document.body.appendChild(this.container);
        }

        // Set container attributes
        this.container.classList.add('html-control', this.type.toLowerCase());
        this.container.setAttribute('data-control-id', this.id);
        this.container.setAttribute('data-control-type', this.type);

        this.logger.debug('Container initialized', { 
            id: this.id, 
            container: this.container.tagName 
        });
    }

    // ========================================
    // CHILD CONTROL MANAGEMENT
    // ========================================

    /**
     * Add child control
     */
    addChildControl(childControl) {
        if (!(childControl instanceof BaseControl)) {
            throw new Error('Child must be an instance of BaseControl');
        }

        this.childControls.add(childControl);
        childControl.parentControl = this;

        this.logger.debug('Child control added', { 
            id: this.id, 
            childId: childControl.id,
            childType: childControl.type
        });
    }

    /**
     * Remove child control
     */
    removeChildControl(childControl) {
        if (this.childControls.has(childControl)) {
            this.childControls.delete(childControl);
            childControl.parentControl = null;

            this.logger.debug('Child control removed', { 
                id: this.id, 
                childId: childControl.id,
                childType: childControl.type
            });
        }
    }

    /**
     * Destroy all child controls
     */
    destroyChildControls() {
        for (const childControl of this.childControls) {
            childControl.destroy();
        }
        this.childControls.clear();

        this.logger.debug('All child controls destroyed', { id: this.id });
    }

    // ========================================
    // ERROR HANDLING
    // ========================================

    /**
     * Handle global errors
     */
    handleGlobalError(event) {
        this.logger.error('Global error occurred', {
            id: this.id,
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error ? event.error.stack : null
        });
    }

    /**
     * Handle control-specific errors
     */
    handleError(error, context = {}) {
        this.logger.error('Control error occurred', {
            id: this.id,
            type: this.type,
            error: error.message,
            stack: error.stack,
            context
        });

        // Trigger error event
        this.trigger('error', {
            error: error.message,
            context
        });

        // Attempt graceful degradation
        this.attemptRecovery(error, context);
    }

    /**
     * Attempt to recover from errors
     */
    attemptRecovery(error, context) {
        this.logger.info('Attempting error recovery', {
            id: this.id,
            error: error.message,
            context
        });

        try {
            // Basic recovery: re-render the control
            if (this.isInitialized && !this.isDestroyed) {
                this.render();
                this.trigger('recovered', { error: error.message });
            }
        } catch (recoveryError) {
            this.logger.error('Recovery failed', {
                id: this.id,
                originalError: error.message,
                recoveryError: recoveryError.message
            });
        }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Generate unique ID for control instance
     */
    generateId() {
        return `${this.constructor.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get control information for debugging
     */
    getInfo() {
        return {
            id: this.id,
            type: this.type,
            isInitialized: this.isInitialized,
            isDestroyed: this.isDestroyed,
            renderCount: this.renderCount,
            lastRenderTime: this.lastRenderTime,
            childControlCount: this.childControls.size,
            eventListenerCount: Array.from(this.eventListeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
            options: { ...this.options }
        };
    }

    /**
     * Validate control state
     */
    validateState() {
        const issues = [];

        if (!this.container) {
            issues.push('Container not initialized');
        }

        if (this.isDestroyed && this.isInitialized) {
            issues.push('Invalid state: destroyed but still marked as initialized');
        }

        if (this.childControls.size > 0) {
            for (const child of this.childControls) {
                if (child.isDestroyed) {
                    issues.push(`Child control ${child.id} is destroyed but not removed`);
                }
            }
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Export control state for debugging or persistence
     */
    exportState() {
        return {
            info: this.getInfo(),
            validation: this.validateState(),
            performance: {
                markers: Array.from(this.performanceMarkers.entries()),
                renderCount: this.renderCount,
                lastRenderTime: this.lastRenderTime
            }
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseControl;
} else if (typeof window !== 'undefined') {
    window.BaseControl = BaseControl;
}