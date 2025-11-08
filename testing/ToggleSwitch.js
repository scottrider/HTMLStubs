/**
 * ToggleSwitch - Master Level Web Standard Component
 * JavaScript Implementation
 * 
 * Provides enhanced functionality and accessibility for the ToggleSwitch component.
 * 
 * @version 1.0.0
 * @author FormMock Development Team
 * @license MIT
 */

class ToggleSwitch {
  /**
   * Initialize ToggleSwitch component
   * @param {HTMLElement|string} element - The ToggleSwitch container element or selector
   * @param {Object} options - Configuration options
   */
  constructor(element, options = {}) {
    // Find the element
    this.container = typeof element === 'string' 
      ? document.querySelector(element) 
      : element;
    
    if (!this.container || !this.container.classList.contains('ToggleSwitch')) {
      throw new Error('ToggleSwitch: Invalid container element');
    }
    
    // Default options
    this.options = {
      onChange: null,
      onEnable: null,
      onDisable: null,
      ariaLabel: null,
      ariaDescribedBy: null,
      ...options
    };
    
    // Find child elements
    this.input = this.container.querySelector('.ToggleSwitch__input');
    this.label = this.container.querySelector('.ToggleSwitch__label');
    this.control = this.container.querySelector('.ToggleSwitch__control');
    this.slider = this.container.querySelector('.ToggleSwitch__slider');
    
    if (!this.input) {
      throw new Error('ToggleSwitch: Input element not found');
    }
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    // Set up accessibility
    this.setupAccessibility();
    
    // Bind events
    this.bindEvents();
    
    // Set initial state
    this.updateState();
    
    // Mark as initialized
    this.container.setAttribute('data-toggle-switch-initialized', 'true');
  }
  
  /**
   * Set up accessibility attributes
   */
  setupAccessibility() {
    // Set role if not already set
    if (!this.input.getAttribute('role')) {
      this.input.setAttribute('role', 'switch');
    }
    
    // Set aria-checked
    this.input.setAttribute('aria-checked', this.input.checked.toString());
    
    // Set custom aria-label if provided
    if (this.options.ariaLabel) {
      this.input.setAttribute('aria-label', this.options.ariaLabel);
    }
    
    // Set aria-describedby if provided
    if (this.options.ariaDescribedBy) {
      this.input.setAttribute('aria-describedby', this.options.ariaDescribedBy);
    }
    
    // Connect label to input if not already connected
    if (this.label && !this.input.id) {
      const id = 'toggle-switch-' + Math.random().toString(36).substr(2, 9);
      this.input.id = id;
      this.label.setAttribute('for', id);
    }
  }
  
  /**
   * Bind event listeners
   */
  bindEvents() {
    this.input.addEventListener('change', this.handleChange.bind(this));
    this.input.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Optional: Handle label click for better UX
    if (this.label) {
      this.label.addEventListener('click', this.handleLabelClick.bind(this));
    }
  }
  
  /**
   * Handle input change event
   * @param {Event} event - Change event
   */
  handleChange(event) {
    this.updateState();
    
    // Call callbacks
    if (this.options.onChange) {
      this.options.onChange(this.input.checked, this);
    }
    
    if (this.input.checked && this.options.onEnable) {
      this.options.onEnable(this);
    } else if (!this.input.checked && this.options.onDisable) {
      this.options.onDisable(this);
    }
    
    // Dispatch custom event
    this.container.dispatchEvent(new CustomEvent('toggleswitch:change', {
      detail: {
        checked: this.input.checked,
        instance: this
      },
      bubbles: true
    }));
  }
  
  /**
   * Handle keydown for enhanced accessibility
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeydown(event) {
    // Space or Enter should toggle the switch
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggle();
    }
  }
  
  /**
   * Handle label click (prevent double-toggle)
   * @param {Event} event - Click event
   */
  handleLabelClick(event) {
    // Prevent the default behavior since we want the input to handle the change
    // This prevents double-toggling when clicking the label
    event.preventDefault();
    this.toggle();
  }
  
  /**
   * Update component state
   */
  updateState() {
    // Update aria-checked
    this.input.setAttribute('aria-checked', this.input.checked.toString());
    
    // Update container data attribute for CSS styling
    this.container.setAttribute('data-checked', this.input.checked.toString());
    
    // Update label text if it has data attributes for different states
    if (this.label) {
      const enabledText = this.label.getAttribute('data-enabled-text');
      const disabledText = this.label.getAttribute('data-disabled-text');
      
      if (enabledText && disabledText) {
        this.label.textContent = this.input.checked ? enabledText : disabledText;
      }
    }
  }
  
  /**
   * Toggle the switch state
   */
  toggle() {
    if (!this.input.disabled) {
      this.input.checked = !this.input.checked;
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  
  /**
   * Set the switch state
   * @param {boolean} checked - Whether the switch should be checked
   */
  setChecked(checked) {
    if (this.input.checked !== checked) {
      this.input.checked = checked;
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  
  /**
   * Get the current checked state
   * @returns {boolean} Current checked state
   */
  isChecked() {
    return this.input.checked;
  }
  
  /**
   * Enable the switch
   */
  enable() {
    this.input.disabled = false;
    this.container.classList.remove('ToggleSwitch--disabled');
    if (this.label) {
      this.label.classList.remove('ToggleSwitch__label--disabled');
    }
    if (this.control) {
      this.control.classList.remove('ToggleSwitch__control--disabled');
    }
  }
  
  /**
   * Disable the switch
   */
  disable() {
    this.input.disabled = true;
    this.container.classList.add('ToggleSwitch--disabled');
    if (this.label) {
      this.label.classList.add('ToggleSwitch__label--disabled');
    }
    if (this.control) {
      this.control.classList.add('ToggleSwitch__control--disabled');
    }
  }
  
  /**
   * Check if the switch is disabled
   * @returns {boolean} Whether the switch is disabled
   */
  isDisabled() {
    return this.input.disabled;
  }
  
  /**
   * Destroy the component
   */
  destroy() {
    // Remove event listeners
    this.input.removeEventListener('change', this.handleChange.bind(this));
    this.input.removeEventListener('keydown', this.handleKeydown.bind(this));
    
    if (this.label) {
      this.label.removeEventListener('click', this.handleLabelClick.bind(this));
    }
    
    // Remove initialization marker
    this.container.removeAttribute('data-toggle-switch-initialized');
  }
  
  /**
   * Static method to initialize all ToggleSwitch components on the page
   * @param {Object} options - Default options for all instances
   */
  static initAll(options = {}) {
    const toggles = document.querySelectorAll('.ToggleSwitch:not([data-toggle-switch-initialized])');
    const instances = [];
    
    toggles.forEach(toggle => {
      try {
        const instance = new ToggleSwitch(toggle, options);
        instances.push(instance);
      } catch (error) {
        console.error('Failed to initialize ToggleSwitch:', error);
      }
    });
    
    return instances;
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ToggleSwitch.initAll());
} else {
  ToggleSwitch.initAll();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToggleSwitch;
}

// Global export
if (typeof window !== 'undefined') {
  window.ToggleSwitch = ToggleSwitch;
}