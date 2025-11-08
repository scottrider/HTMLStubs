/**
 * HTML Controls Library Manager
 * Central coordination point for all controls in the library
 * Provides single point of failure management for logging, error handling, and resource management
 */

class HTMLControlsLibrary {
    constructor(options = {}) {
        this.options = {
            name: 'HTMLControlsLibrary',
            version: '1.0.0',
            debug: false,
            globalLogging: true,
            autoCleanup: true,
            performance: true,
            ...options
        };

        // Central registries
        this.controls = new Map();
        this.controlTypes = new Map();
        this.eventBus = new EventTarget();
        this.globalLogger = null;
        this.performanceMonitor = null;
        this.resourceManager = null;

        // Initialize core systems
        this.initializeLogging();
        this.initializePerformanceMonitoring();
        this.initializeResourceManagement();
        this.initializeGlobalErrorHandling();

        // Library state
        this.isInitialized = false;
        this.startTime = Date.now();

        this.globalLogger.info('HTML Controls Library created', {
            version: this.options.version,
            options: this.options
        });
    }

    // ========================================
    // LIBRARY INITIALIZATION
    // ========================================

    /**
     * Initialize the library and all its core systems
     */
    init() {
        if (this.isInitialized) {
            this.globalLogger.warn('Library already initialized');
            return this;
        }

        this.globalLogger.info('Initializing HTML Controls Library');
        
        const timer = this.performanceMonitor.startTimer('library_initialization');

        try {
            // Register built-in control types
            this.registerBuiltInControls();

            // Set up global event listeners
            this.setupGlobalEventListeners();

            // Initialize auto-cleanup if enabled
            if (this.options.autoCleanup) {
                this.initializeAutoCleanup();
            }

            this.isInitialized = true;
            
            // Trigger library ready event
            this.trigger('library:ready', {
                version: this.options.version,
                initTime: Date.now() - this.startTime
            });

            this.globalLogger.info('HTML Controls Library initialized successfully', {
                controlTypesRegistered: this.controlTypes.size,
                initTime: Date.now() - this.startTime
            });

        } catch (error) {
            this.globalLogger.error('Failed to initialize library', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        } finally {
            this.performanceMonitor.endTimer(timer);
        }

        return this;
    }

    /**
     * Initialize centralized logging system
     */
    initializeLogging() {
        if (this.options.globalLogging && typeof HTMLControlsLogger !== 'undefined') {
            this.globalLogger = new HTMLControlsLogger({
                name: this.options.name,
                level: this.options.debug ? 'debug' : 'info',
                performance: this.options.performance,
                console: true
            });
            
            this.globalLogger.setContext({
                library: this.options.name,
                version: this.options.version,
                environment: typeof window !== 'undefined' ? 'browser' : 'node'
            });
        } else {
            // Fallback logging
            this.globalLogger = {
                error: (...args) => console.error('[HTMLControlsLibrary]', ...args),
                warn: (...args) => console.warn('[HTMLControlsLibrary]', ...args),
                info: (...args) => console.info('[HTMLControlsLibrary]', ...args),
                debug: (...args) => this.options.debug && console.log('[HTMLControlsLibrary]', ...args)
            };
        }
    }

    /**
     * Initialize performance monitoring
     */
    initializePerformanceMonitoring() {
        this.performanceMonitor = {
            timers: new Map(),
            metrics: new Map(),
            
            startTimer: (label) => {
                const startTime = performance.now();
                this.performanceMonitor.timers.set(label, startTime);
                return label;
            },
            
            endTimer: (label) => {
                const startTime = this.performanceMonitor.timers.get(label);
                if (startTime) {
                    const duration = performance.now() - startTime;
                    this.performanceMonitor.timers.delete(label);
                    this.recordMetric(label, duration);
                    return duration;
                }
                return null;
            }
        };
    }

    /**
     * Initialize resource management
     */
    initializeResourceManagement() {
        this.resourceManager = {
            memoryUsage: new Map(),
            cleanupTasks: new Set(),
            
            trackMemory: (controlId, size) => {
                this.resourceManager.memoryUsage.set(controlId, size);
            },
            
            releaseMemory: (controlId) => {
                this.resourceManager.memoryUsage.delete(controlId);
            },
            
            addCleanupTask: (task) => {
                this.resourceManager.cleanupTasks.add(task);
            },
            
            executeCleanupTasks: () => {
                for (const task of this.resourceManager.cleanupTasks) {
                    try {
                        task();
                    } catch (error) {
                        this.globalLogger.error('Cleanup task failed', { error: error.message });
                    }
                }
                this.resourceManager.cleanupTasks.clear();
            }
        };
    }

    /**
     * Initialize global error handling
     */
    initializeGlobalErrorHandling() {
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.handleGlobalError({
                    type: 'javascript',
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.handleGlobalError({
                    type: 'promise',
                    reason: event.reason,
                    promise: event.promise
                });
            });
        }
    }

    // ========================================
    // CONTROL MANAGEMENT
    // ========================================

    /**
     * Register a control type with the library
     */
    registerControlType(name, controlClass) {
        if (!controlClass || typeof controlClass !== 'function') {
            throw new Error('Control class must be a constructor function');
        }

        if (this.controlTypes.has(name)) {
            this.globalLogger.warn(`Control type ${name} already registered, overwriting`);
        }

        this.controlTypes.set(name, controlClass);
        
        this.globalLogger.debug(`Control type registered: ${name}`, {
            className: controlClass.name
        });

        // Trigger registration event
        this.trigger('control:registered', {
            name,
            className: controlClass.name
        });
    }

    /**
     * Create a new control instance
     */
    createControl(type, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Library not initialized. Call init() first.');
        }

        const ControlClass = this.controlTypes.get(type);
        if (!ControlClass) {
            throw new Error(`Unknown control type: ${type}`);
        }

        this.globalLogger.debug(`Creating control: ${type}`, { options });

        const timer = this.performanceMonitor.startTimer(`create_${type}`);

        try {
            // Create control with library context
            const control = new ControlClass({
                ...options,
                library: this,
                globalLogger: this.globalLogger
            });

            // Register the control
            this.registerControl(control);

            // Initialize the control
            control.init();

            this.globalLogger.info(`Control created: ${type}`, {
                controlId: control.id,
                totalControls: this.controls.size
            });

            // Trigger creation event
            this.trigger('control:created', {
                type,
                controlId: control.id,
                totalControls: this.controls.size
            });

            return control;

        } catch (error) {
            this.globalLogger.error(`Failed to create control: ${type}`, {
                error: error.message,
                stack: error.stack,
                options
            });
            throw error;
        } finally {
            this.performanceMonitor.endTimer(timer);
        }
    }

    /**
     * Register a control instance with the library
     */
    registerControl(control) {
        if (!control || !control.id) {
            throw new Error('Invalid control instance');
        }

        this.controls.set(control.id, {
            instance: control,
            type: control.type || control.constructor.name,
            createdAt: Date.now(),
            lastAccessed: Date.now()
        });

        // Track memory usage
        this.resourceManager.trackMemory(control.id, this.estimateControlMemoryUsage(control));
    }

    /**
     * Unregister a control instance
     */
    unregisterControl(controlId) {
        const controlData = this.controls.get(controlId);
        if (controlData) {
            this.controls.delete(controlId);
            this.resourceManager.releaseMemory(controlId);
            
            this.globalLogger.debug(`Control unregistered: ${controlId}`, {
                type: controlData.type,
                totalControls: this.controls.size
            });

            // Trigger unregistration event
            this.trigger('control:unregistered', {
                controlId,
                type: controlData.type,
                totalControls: this.controls.size
            });
        }
    }

    /**
     * Get control instance by ID
     */
    getControl(controlId) {
        const controlData = this.controls.get(controlId);
        if (controlData) {
            controlData.lastAccessed = Date.now();
            return controlData.instance;
        }
        return null;
    }

    /**
     * Get all controls of a specific type
     */
    getControlsByType(type) {
        const controls = [];
        for (const [id, data] of this.controls.entries()) {
            if (data.type === type) {
                data.lastAccessed = Date.now();
                controls.push(data.instance);
            }
        }
        return controls;
    }

    /**
     * Destroy a control instance
     */
    destroyControl(controlId) {
        const control = this.getControl(controlId);
        if (control) {
            this.globalLogger.debug(`Destroying control: ${controlId}`);
            
            try {
                control.destroy();
                this.unregisterControl(controlId);
                
                this.trigger('control:destroyed', {
                    controlId,
                    totalControls: this.controls.size
                });
                
            } catch (error) {
                this.globalLogger.error(`Failed to destroy control: ${controlId}`, {
                    error: error.message,
                    stack: error.stack
                });
            }
        }
    }

    /**
     * Destroy all controls
     */
    destroyAllControls() {
        this.globalLogger.info('Destroying all controls', {
            totalControls: this.controls.size
        });

        const controlIds = Array.from(this.controls.keys());
        for (const controlId of controlIds) {
            this.destroyControl(controlId);
        }
    }

    // ========================================
    // EVENT MANAGEMENT
    // ========================================

    /**
     * Set up global event listeners
     */
    setupGlobalEventListeners() {
        // Page unload cleanup
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.performCleanup();
            });

            // Visibility change handling
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.trigger('library:hidden');
                } else {
                    this.trigger('library:visible');
                }
            });
        }
    }

    /**
     * Trigger library-wide events
     */
    trigger(eventName, data = {}) {
        const event = new CustomEvent(`htmlcontrols:${eventName}`, {
            detail: {
                ...data,
                timestamp: new Date().toISOString(),
                source: 'HTMLControlsLibrary'
            }
        });

        this.eventBus.dispatchEvent(event);

        // Also dispatch on document for global listeners
        if (typeof document !== 'undefined') {
            document.dispatchEvent(event);
        }

        this.globalLogger.debug(`Library event triggered: ${eventName}`, data);
    }

    /**
     * Listen to library events
     */
    on(eventName, handler) {
        this.eventBus.addEventListener(`htmlcontrols:${eventName}`, handler);
    }

    /**
     * Remove library event listener
     */
    off(eventName, handler) {
        this.eventBus.removeEventListener(`htmlcontrols:${eventName}`, handler);
    }

    // ========================================
    // ERROR HANDLING
    // ========================================

    /**
     * Handle global errors
     */
    handleGlobalError(errorInfo) {
        this.globalLogger.error('Global error occurred', errorInfo);
        
        // Trigger global error event
        this.trigger('library:error', errorInfo);
        
        // Attempt library recovery if needed
        this.attemptRecovery(errorInfo);
    }

    /**
     * Attempt recovery from errors
     */
    attemptRecovery(errorInfo) {
        this.globalLogger.info('Attempting library recovery', errorInfo);
        
        try {
            // Validate all controls
            this.validateAllControls();
            
            // Clean up any corrupted state
            this.performMaintenance();
            
            this.trigger('library:recovered', errorInfo);
            
        } catch (recoveryError) {
            this.globalLogger.error('Library recovery failed', {
                originalError: errorInfo,
                recoveryError: recoveryError.message
            });
        }
    }

    // ========================================
    // MAINTENANCE AND CLEANUP
    // ========================================

    /**
     * Initialize auto-cleanup
     */
    initializeAutoCleanup() {
        // Periodic cleanup every 5 minutes
        setInterval(() => {
            this.performMaintenance();
        }, 5 * 60 * 1000);

        this.globalLogger.debug('Auto-cleanup initialized');
    }

    /**
     * Perform maintenance tasks
     */
    performMaintenance() {
        this.globalLogger.debug('Performing library maintenance');
        
        const timer = this.performanceMonitor.startTimer('maintenance');
        
        try {
            // Clean up destroyed controls
            this.cleanupDestroyedControls();
            
            // Validate control states
            this.validateAllControls();
            
            // Execute cleanup tasks
            this.resourceManager.executeCleanupTasks();
            
            // Log maintenance metrics
            this.logMaintenanceMetrics();
            
        } catch (error) {
            this.globalLogger.error('Maintenance failed', {
                error: error.message,
                stack: error.stack
            });
        } finally {
            this.performanceMonitor.endTimer(timer);
        }
    }

    /**
     * Clean up destroyed controls
     */
    cleanupDestroyedControls() {
        const toRemove = [];
        
        for (const [id, data] of this.controls.entries()) {
            if (data.instance.isDestroyed) {
                toRemove.push(id);
            }
        }
        
        for (const id of toRemove) {
            this.unregisterControl(id);
        }
        
        if (toRemove.length > 0) {
            this.globalLogger.debug(`Cleaned up ${toRemove.length} destroyed controls`);
        }
    }

    /**
     * Validate all controls
     */
    validateAllControls() {
        let issues = 0;
        
        for (const [id, data] of this.controls.entries()) {
            try {
                const validation = data.instance.validateState ? data.instance.validateState() : { isValid: true };
                if (!validation.isValid) {
                    issues++;
                    this.globalLogger.warn(`Control validation failed: ${id}`, {
                        type: data.type,
                        issues: validation.issues
                    });
                }
            } catch (error) {
                issues++;
                this.globalLogger.error(`Control validation error: ${id}`, {
                    error: error.message
                });
            }
        }
        
        return issues;
    }

    /**
     * Perform cleanup on library shutdown
     */
    performCleanup() {
        this.globalLogger.info('Performing library cleanup');
        
        try {
            // Destroy all controls
            this.destroyAllControls();
            
            // Execute cleanup tasks
            this.resourceManager.executeCleanupTasks();
            
            // Clear performance data
            this.performanceMonitor.timers.clear();
            this.performanceMonitor.metrics.clear();
            
            this.globalLogger.info('Library cleanup completed');
            
        } catch (error) {
            this.globalLogger.error('Cleanup failed', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    // ========================================
    // PERFORMANCE AND METRICS
    // ========================================

    /**
     * Record performance metric
     */
    recordMetric(name, value) {
        if (!this.performanceMonitor.metrics.has(name)) {
            this.performanceMonitor.metrics.set(name, []);
        }
        
        this.performanceMonitor.metrics.get(name).push({
            value,
            timestamp: Date.now()
        });
        
        // Keep only last 100 measurements
        const measurements = this.performanceMonitor.metrics.get(name);
        if (measurements.length > 100) {
            measurements.splice(0, measurements.length - 100);
        }
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        const stats = {};
        
        for (const [name, measurements] of this.performanceMonitor.metrics.entries()) {
            const values = measurements.map(m => m.value);
            stats[name] = {
                count: values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                avg: values.reduce((sum, val) => sum + val, 0) / values.length,
                recent: values.slice(-10)
            };
        }
        
        return stats;
    }

    /**
     * Estimate control memory usage
     */
    estimateControlMemoryUsage(control) {
        // Simple estimation based on control properties
        let size = 1024; // Base size
        
        if (control.container) {
            size += control.container.innerHTML.length * 2;
        }
        
        if (control.options) {
            size += JSON.stringify(control.options).length;
        }
        
        return size;
    }

    /**
     * Log maintenance metrics
     */
    logMaintenanceMetrics() {
        const totalMemory = Array.from(this.resourceManager.memoryUsage.values())
            .reduce((sum, size) => sum + size, 0);
            
        this.globalLogger.debug('Maintenance metrics', {
            totalControls: this.controls.size,
            totalMemoryUsage: totalMemory,
            performanceStats: this.getPerformanceStats(),
            uptime: Date.now() - this.startTime
        });
    }

    // ========================================
    // BUILT-IN CONTROLS REGISTRATION
    // ========================================

    /**
     * Register built-in control types
     */
    registerBuiltInControls() {
        // DataGrid control
        if (typeof DataGrid !== 'undefined') {
            this.registerControlType('DataGrid', DataGrid);
        }
        
        // Additional controls will be registered here as they're created
        this.globalLogger.debug('Built-in controls registered');
    }

    // ========================================
    // LIBRARY INFO AND DIAGNOSTICS
    // ========================================

    /**
     * Get library information
     */
    getInfo() {
        return {
            name: this.options.name,
            version: this.options.version,
            isInitialized: this.isInitialized,
            uptime: Date.now() - this.startTime,
            controlsCount: this.controls.size,
            controlTypesCount: this.controlTypes.size,
            memoryUsage: Array.from(this.resourceManager.memoryUsage.values())
                .reduce((sum, size) => sum + size, 0),
            performanceStats: this.getPerformanceStats()
        };
    }

    /**
     * Export diagnostic information
     */
    exportDiagnostics() {
        return {
            info: this.getInfo(),
            controls: Array.from(this.controls.entries()).map(([id, data]) => ({
                id,
                type: data.type,
                createdAt: data.createdAt,
                lastAccessed: data.lastAccessed,
                isDestroyed: data.instance.isDestroyed,
                state: data.instance.exportState ? data.instance.exportState() : null
            })),
            controlTypes: Array.from(this.controlTypes.keys()),
            performance: this.getPerformanceStats(),
            memory: {
                totalUsage: Array.from(this.resourceManager.memoryUsage.values())
                    .reduce((sum, size) => sum + size, 0),
                byControl: Array.from(this.resourceManager.memoryUsage.entries())
            }
        };
    }
}

// Create global library instance
const htmlControlsLibrary = new HTMLControlsLibrary();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HTMLControlsLibrary,
        library: htmlControlsLibrary
    };
} else if (typeof window !== 'undefined') {
    window.HTMLControlsLibrary = HTMLControlsLibrary;
    window.htmlControlsLibrary = htmlControlsLibrary;
}