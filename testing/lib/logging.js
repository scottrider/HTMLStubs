/**
 * Enterprise Logging Solution for HTML Controls Library
 * Based on Winston logging best practices with browser compatibility
 * Supports multiple levels, transports, formatting, and performance monitoring
 */

class HTMLControlsLogger {
    constructor(options = {}) {
        this.options = {
            name: 'HTMLControls',
            level: 'info',
            console: true,
            file: false,
            performance: true,
            context: true,
            maxMemoryLogs: 1000,
            ...options
        };

        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            http: 3,
            verbose: 4,
            debug: 5,
            silly: 6
        };

        this.colors = {
            error: '#ff4757',
            warn: '#ffa502',
            info: '#3742fa',
            http: '#70a1ff',
            verbose: '#5352ed',
            debug: '#747d8c',
            silly: '#a4b0be'
        };

        this.transports = [];
        this.memoryBuffer = [];
        this.performanceMarkers = new Map();
        this.context = {};
        this.logQueue = [];
        this.isProcessing = false;

        this.initializeTransports();
        this.setupErrorHandlers();
        
        // Create instance ID for tracking
        this.instanceId = this.generateId();
        
        console.log(`🚀 HTMLControlsLogger initialized [${this.instanceId}]`);
    }

    // ========================================
    // CORE LOGGING METHODS
    // ========================================

    error(message, meta = {}) {
        return this.log('error', message, meta);
    }

    warn(message, meta = {}) {
        return this.log('warn', message, meta);
    }

    info(message, meta = {}) {
        return this.log('info', message, meta);
    }

    http(message, meta = {}) {
        return this.log('http', message, meta);
    }

    verbose(message, meta = {}) {
        return this.log('verbose', message, meta);
    }

    debug(message, meta = {}) {
        return this.log('debug', message, meta);
    }

    silly(message, meta = {}) {
        return this.log('silly', message, meta);
    }

    /**
     * Core logging method - all other methods route through here
     * Implements queuing, formatting, and transport routing
     */
    log(level, message, meta = {}) {
        const levelNum = this.levels[level];
        const configuredLevel = this.levels[this.options.level];

        // Check if this level should be logged
        if (levelNum > configuredLevel) {
            return false;
        }

        const logEntry = this.createLogEntry(level, message, meta);
        
        // Add to queue for async processing
        this.logQueue.push(logEntry);
        this.processLogQueue();

        return true;
    }

    /**
     * Creates a structured log entry with all metadata
     */
    createLogEntry(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const context = this.getContext();

        return {
            timestamp,
            level,
            levelNum: this.levels[level],
            message: this.formatMessage(message),
            meta: { ...meta },
            context,
            instanceId: this.instanceId,
            sessionId: this.getSessionId(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
            url: typeof window !== 'undefined' ? window.location.href : 'N/A',
            stackTrace: this.options.context ? this.getStackTrace() : null
        };
    }

    /**
     * Formats log messages consistently
     */
    formatMessage(message) {
        if (typeof message === 'string') {
            return message;
        } else if (message instanceof Error) {
            return `${message.name}: ${message.message}`;
        } else if (typeof message === 'object') {
            try {
                return JSON.stringify(message, null, 2);
            } catch (e) {
                return '[Object - circular reference detected]';
            }
        }
        return String(message);
    }

    // ========================================
    // TRANSPORT MANAGEMENT
    // ========================================

    /**
     * Initializes default transports based on environment
     */
    initializeTransports() {
        if (this.options.console) {
            this.addTransport(new ConsoleTransport({
                level: this.options.level,
                colors: this.colors
            }));
        }

        // Memory transport for debugging and error reporting
        this.addTransport(new MemoryTransport({
            level: 'debug',
            maxLogs: this.options.maxMemoryLogs
        }));

        // File transport for Node.js environments
        if (this.options.file && typeof window === 'undefined') {
            this.addTransport(new FileTransport({
                level: 'info',
                filename: 'htmlcontrols.log'
            }));
        }

        // Remote transport for error reporting
        if (this.options.remote) {
            this.addTransport(new RemoteTransport({
                level: 'error',
                endpoint: this.options.remote.endpoint,
                apiKey: this.options.remote.apiKey
            }));
        }
    }

    /**
     * Adds a transport to the logger
     */
    addTransport(transport) {
        if (!transport || typeof transport.write !== 'function') {
            throw new Error('Transport must have a write method');
        }
        this.transports.push(transport);
    }

    /**
     * Removes a transport from the logger
     */
    removeTransport(transportClass) {
        this.transports = this.transports.filter(t => !(t instanceof transportClass));
    }

    // ========================================
    // ASYNC LOG PROCESSING
    // ========================================

    /**
     * Processes the log queue asynchronously to prevent blocking
     */
    async processLogQueue() {
        if (this.isProcessing || this.logQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        try {
            while (this.logQueue.length > 0) {
                const logEntry = this.logQueue.shift();
                await this.writeToTransports(logEntry);
                
                // Add to memory buffer for debugging
                this.addToMemoryBuffer(logEntry);
            }
        } catch (error) {
            this.handleLoggingError(error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Writes log entry to all configured transports
     */
    async writeToTransports(logEntry) {
        const promises = this.transports.map(async (transport) => {
            try {
                if (this.shouldWriteToTransport(logEntry, transport)) {
                    await transport.write(logEntry);
                }
            } catch (error) {
                this.handleTransportError(transport, error, logEntry);
            }
        });

        await Promise.allSettled(promises);
    }

    /**
     * Determines if a log entry should be written to a specific transport
     */
    shouldWriteToTransport(logEntry, transport) {
        const transportLevel = this.levels[transport.level || 'info'];
        return logEntry.levelNum <= transportLevel;
    }

    // ========================================
    // PERFORMANCE MONITORING
    // ========================================

    /**
     * Starts a performance timer
     */
    startTimer(label, meta = {}) {
        if (!this.options.performance) return;

        const startTime = performance.now();
        this.performanceMarkers.set(label, {
            startTime,
            meta,
            timestamp: new Date().toISOString()
        });

        this.verbose(`⏱️ Timer started: ${label}`, meta);
        return label;
    }

    /**
     * Ends a performance timer and logs the duration
     */
    endTimer(label, additionalMeta = {}) {
        if (!this.options.performance || !this.performanceMarkers.has(label)) {
            return null;
        }

        const marker = this.performanceMarkers.get(label);
        const endTime = performance.now();
        const duration = endTime - marker.startTime;

        this.performanceMarkers.delete(label);

        const performanceMeta = {
            ...marker.meta,
            ...additionalMeta,
            duration: `${duration.toFixed(2)}ms`,
            startTime: marker.timestamp,
            endTime: new Date().toISOString()
        };

        this.info(`⏱️ Timer completed: ${label} (${duration.toFixed(2)}ms)`, performanceMeta);
        return duration;
    }

    /**
     * Logs performance metrics for a function
     */
    profile(fn, label, meta = {}) {
        return (...args) => {
            this.startTimer(label, meta);
            try {
                const result = fn.apply(this, args);
                
                // Handle promises
                if (result && typeof result.then === 'function') {
                    return result.finally(() => {
                        this.endTimer(label);
                    });
                }
                
                this.endTimer(label);
                return result;
            } catch (error) {
                this.endTimer(label, { error: error.message });
                throw error;
            }
        };
    }

    // ========================================
    // CONTEXT MANAGEMENT
    // ========================================

    /**
     * Sets context data that will be included in all log entries
     */
    setContext(key, value) {
        if (typeof key === 'object') {
            Object.assign(this.context, key);
        } else {
            this.context[key] = value;
        }
    }

    /**
     * Gets current context data
     */
    getContext() {
        return { ...this.context };
    }

    /**
     * Clears context data
     */
    clearContext() {
        this.context = {};
    }

    /**
     * Creates a child logger with additional context
     */
    child(context = {}) {
        const childLogger = new HTMLControlsLogger({
            ...this.options,
            name: `${this.options.name}:child`
        });
        
        childLogger.context = { ...this.context, ...context };
        childLogger.transports = [...this.transports];
        
        return childLogger;
    }

    // ========================================
    // ERROR HANDLING
    // ========================================

    /**
     * Sets up global error handlers
     */
    setupErrorHandlers() {
        // Handle unhandled errors
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.error('Unhandled JavaScript Error', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error ? event.error.stack : null
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.error('Unhandled Promise Rejection', {
                    reason: event.reason,
                    promise: String(event.promise)
                });
            });
        }
    }

    /**
     * Handles logging errors gracefully
     */
    handleLoggingError(error) {
        console.error('🚨 HTMLControlsLogger Error:', error);
        
        // Fallback to console if available
        if (typeof console !== 'undefined') {
            console.error('Failed to process log queue:', error);
        }
    }

    /**
     * Handles transport-specific errors
     */
    handleTransportError(transport, error, logEntry) {
        console.error(`🚨 Transport Error [${transport.constructor.name}]:`, error);
        
        // Remove failed transport if it's consistently failing
        if (transport.errorCount) {
            transport.errorCount++;
            if (transport.errorCount > 5) {
                this.removeTransport(transport.constructor);
                console.warn(`Removed failing transport: ${transport.constructor.name}`);
            }
        } else {
            transport.errorCount = 1;
        }
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Generates unique IDs for tracking
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Gets session ID for tracking user sessions
     */
    getSessionId() {
        if (typeof sessionStorage !== 'undefined') {
            let sessionId = sessionStorage.getItem('htmlcontrols-session');
            if (!sessionId) {
                sessionId = this.generateId();
                sessionStorage.setItem('htmlcontrols-session', sessionId);
            }
            return sessionId;
        }
        return 'unknown';
    }

    /**
     * Gets stack trace for debugging
     */
    getStackTrace() {
        try {
            throw new Error();
        } catch (e) {
            return e.stack;
        }
    }

    /**
     * Adds log entry to memory buffer for debugging
     */
    addToMemoryBuffer(logEntry) {
        this.memoryBuffer.push(logEntry);
        
        // Trim buffer if it gets too large
        if (this.memoryBuffer.length > this.options.maxMemoryLogs) {
            this.memoryBuffer.shift();
        }
    }

    /**
     * Gets recent log entries from memory buffer
     */
    getRecentLogs(count = 50) {
        return this.memoryBuffer.slice(-count);
    }

    /**
     * Exports log data for debugging or reporting
     */
    exportLogs(format = 'json') {
        const logs = this.getRecentLogs();
        
        switch (format) {
            case 'csv':
                return this.convertToCsv(logs);
            case 'text':
                return logs.map(log => 
                    `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
                ).join('\n');
            default:
                return JSON.stringify(logs, null, 2);
        }
    }

    /**
     * Converts logs to CSV format
     */
    convertToCsv(logs) {
        if (logs.length === 0) return '';
        
        const headers = ['timestamp', 'level', 'message', 'context'];
        const rows = logs.map(log => [
            log.timestamp,
            log.level,
            log.message.replace(/"/g, '""'),
            JSON.stringify(log.context).replace(/"/g, '""')
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    /**
     * Flushes all pending log entries
     */
    async flush() {
        await this.processLogQueue();
        
        // Wait for all transports to finish
        const flushPromises = this.transports
            .filter(t => typeof t.flush === 'function')
            .map(t => t.flush());
            
        await Promise.allSettled(flushPromises);
    }
}

// ========================================
// TRANSPORT CLASSES
// ========================================

/**
 * Console Transport - outputs to browser console or Node.js console
 */
class ConsoleTransport {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.colors = options.colors || {};
    }

    write(logEntry) {
        const { level, message, meta, timestamp } = logEntry;
        const color = this.colors[level] || '#000000';
        
        const formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        if (typeof window !== 'undefined' && console[level]) {
            // Browser environment
            console[level](
                `%c${formattedMessage}`, 
                `color: ${color}; font-weight: bold;`,
                meta
            );
        } else if (console[level]) {
            // Node.js environment
            console[level](formattedMessage, meta);
        } else {
            console.log(formattedMessage, meta);
        }
    }
}

/**
 * Memory Transport - stores logs in memory for debugging
 */
class MemoryTransport {
    constructor(options = {}) {
        this.level = options.level || 'debug';
        this.maxLogs = options.maxLogs || 1000;
        this.logs = [];
    }

    write(logEntry) {
        this.logs.push(logEntry);
        
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    getLogs(count = 50) {
        return this.logs.slice(-count);
    }

    clear() {
        this.logs = [];
    }
}

/**
 * File Transport - writes logs to file (Node.js only)
 */
class FileTransport {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.filename = options.filename || 'application.log';
        this.pending = [];
        this.isWriting = false;
        
        // Only initialize in Node.js environment
        if (typeof window === 'undefined') {
            this.initializeFileSystem();
        }
    }

    initializeFileSystem() {
        try {
            this.fs = require('fs');
            this.path = require('path');
        } catch (error) {
            console.warn('File system not available - FileTransport disabled');
        }
    }

    async write(logEntry) {
        if (!this.fs) return;
        
        const logLine = JSON.stringify(logEntry) + '\n';
        this.pending.push(logLine);
        
        if (!this.isWriting) {
            await this.flushToDisk();
        }
    }

    async flushToDisk() {
        if (!this.fs || this.pending.length === 0) return;
        
        this.isWriting = true;
        const toWrite = this.pending.splice(0);
        
        try {
            await this.fs.promises.appendFile(this.filename, toWrite.join(''));
        } catch (error) {
            console.error('Failed to write logs to file:', error);
            // Put the logs back in pending
            this.pending.unshift(...toWrite);
        } finally {
            this.isWriting = false;
        }
    }

    async flush() {
        await this.flushToDisk();
    }
}

/**
 * Remote Transport - sends logs to remote endpoint
 */
class RemoteTransport {
    constructor(options = {}) {
        this.level = options.level || 'error';
        this.endpoint = options.endpoint;
        this.apiKey = options.apiKey;
        this.batch = [];
        this.batchSize = options.batchSize || 10;
        this.flushInterval = options.flushInterval || 5000;
        
        if (this.endpoint) {
            this.startBatchTimer();
        }
    }

    write(logEntry) {
        if (!this.endpoint) return;
        
        this.batch.push(logEntry);
        
        if (this.batch.length >= this.batchSize) {
            this.flush();
        }
    }

    async flush() {
        if (this.batch.length === 0) return;
        
        const toSend = this.batch.splice(0);
        
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    logs: toSend,
                    timestamp: new Date().toISOString(),
                    source: 'HTMLControlsLogger'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Failed to send logs to remote endpoint:', error);
            // Put logs back in batch for retry
            this.batch.unshift(...toSend);
        }
    }

    startBatchTimer() {
        setInterval(() => {
            if (this.batch.length > 0) {
                this.flush();
            }
        }, this.flushInterval);
    }
}

// ========================================
// GLOBAL LOGGER INSTANCE
// ========================================

// Create default logger instance
const defaultLogger = new HTMLControlsLogger({
    name: 'HTMLControls',
    level: 'info',
    console: true,
    performance: true,
    context: true
});

// Export both the class and default instance
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HTMLControlsLogger,
        logger: defaultLogger,
        ConsoleTransport,
        MemoryTransport,
        FileTransport,
        RemoteTransport
    };
} else if (typeof window !== 'undefined') {
    window.HTMLControlsLogger = HTMLControlsLogger;
    window.logger = defaultLogger;
}