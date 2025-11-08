/**
 * DataGrid Namespace Manager
 * Eliminates global variable pollution by providing centralized instance management
 * 
 * @version 1.0.0
 * @author HTMLStubs Development Team
 * @license MIT
 */

window.DataGridNamespace = (function() {
    'use strict';
    
    // Private storage for all DataGrid instances
    const instances = {
        searches: new Map(),
        grids: new Map(),
        components: new Map()
    };
    
    // Logging configuration
    const logger = {
        debug: (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') 
            ? console.log.bind(console, '[DataGrid Debug]:')
            : () => {},
        info: console.info.bind(console, '[DataGrid Info]:'),
        warn: console.warn.bind(console, '[DataGrid Warning]:'),
        error: console.error.bind(console, '[DataGrid Error]:')
    };
    
    return {
        // Search instance management
        search: {
            register(id, instance) {
                if (instances.searches.has(id)) {
                    logger.warn(`Search instance '${id}' already exists. Destroying existing instance.`);
                    instances.searches.get(id)?.destroy?.();
                }
                instances.searches.set(id, instance);
                logger.debug(`Search instance '${id}' registered.`);
                return instance;
            },
            
            get(id) {
                return instances.searches.get(id);
            },
            
            destroy(id) {
                const instance = instances.searches.get(id);
                if (instance) {
                    try {
                        instance.destroy?.();
                        instances.searches.delete(id);
                        logger.debug(`Search instance '${id}' destroyed.`);
                        return true;
                    } catch (error) {
                        logger.error(`Error destroying search instance '${id}':`, error);
                        return false;
                    }
                }
                return false;
            },
            
            destroyAll() {
                let destroyed = 0;
                instances.searches.forEach((instance, id) => {
                    if (this.destroy(id)) destroyed++;
                });
                logger.info(`Destroyed ${destroyed} search instances.`);
                return destroyed;
            }
        },
        
        // Grid instance management
        grid: {
            register(id, instance) {
                if (instances.grids.has(id)) {
                    logger.warn(`Grid instance '${id}' already exists. Replacing.`);
                }
                instances.grids.set(id, instance);
                logger.debug(`Grid instance '${id}' registered.`);
                return instance;
            },
            
            get(id) {
                return instances.grids.get(id);
            },
            
            destroy(id) {
                const instance = instances.grids.get(id);
                if (instance) {
                    try {
                        instance.destroy?.();
                        instances.grids.delete(id);
                        logger.debug(`Grid instance '${id}' destroyed.`);
                        return true;
                    } catch (error) {
                        logger.error(`Error destroying grid instance '${id}':`, error);
                        return false;
                    }
                }
                return false;
            }
        },
        
        // Generic component management
        component: {
            register(id, instance) {
                instances.components.set(id, instance);
                logger.debug(`Component '${id}' registered.`);
                return instance;
            },
            
            get(id) {
                return instances.components.get(id);
            },
            
            destroy(id) {
                const instance = instances.components.get(id);
                if (instance) {
                    try {
                        instance.destroy?.();
                        instances.components.delete(id);
                        logger.debug(`Component '${id}' destroyed.`);
                        return true;
                    } catch (error) {
                        logger.error(`Error destroying component '${id}':`, error);
                        return false;
                    }
                }
                return false;
            }
        },
        
        // Utility methods
        utils: {
            // Get all registered instances
            getAllInstances() {
                return {
                    searches: Array.from(instances.searches.keys()),
                    grids: Array.from(instances.grids.keys()),
                    components: Array.from(instances.components.keys())
                };
            },
            
            // Cleanup all instances (useful for page unload)
            cleanup() {
                const total = instances.searches.size + instances.grids.size + instances.components.size;
                
                // Destroy all instances
                instances.searches.forEach((instance, id) => {
                    try { instance.destroy?.(); } catch (e) { logger.error('Cleanup error:', e); }
                });
                instances.grids.forEach((instance, id) => {
                    try { instance.destroy?.(); } catch (e) { logger.error('Cleanup error:', e); }
                });
                instances.components.forEach((instance, id) => {
                    try { instance.destroy?.(); } catch (e) { logger.error('Cleanup error:', e); }
                });
                
                // Clear maps
                instances.searches.clear();
                instances.grids.clear();
                instances.components.clear();
                
                logger.info(`Cleaned up ${total} instances.`);
                return total;
            }
        },
        
        // Logger access
        logger
    };
})();

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
    window.DataGridNamespace.utils.cleanup();
});