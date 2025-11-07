# ToggleSwitch - Master Level Web Standard Component

## 🎯 Master Level Component Declaration

This is a **MASTER LEVEL EDICT** establishing the ToggleSwitch as the **definitive web standard** for toggle switch controls across all projects and platforms.

## 📜 Component Specification

### Core Requirements
- **Class Name**: `ToggleSwitch` (PascalCase, non-negotiable)
- **Self-Contained**: Zero external dependencies
- **Accessibility First**: Full WCAG 2.1 AA compliance
- **Framework Agnostic**: Works with any or no framework
- **Production Ready**: Enterprise-grade quality and performance

### File Structure
```
ToggleSwitch/
├── ToggleSwitch.css          # Complete styles with all variants
├── ToggleSwitch.js           # Optional JavaScript enhancement
├── ToggleSwitch-demo.html    # Complete documentation and examples
└── TOGGLESWITCH_STANDARD.md  # This specification document
```

## 🏗️ HTML Structure (MANDATORY)

```html
<div class="ToggleSwitch">
  <label for="uniqueId" class="ToggleSwitch__label">Label Text</label>
  <label class="ToggleSwitch__control">
    <input type="checkbox" id="uniqueId" class="ToggleSwitch__input" checked>
    <span class="ToggleSwitch__slider"></span>
  </label>
</div>
```

## 🎨 CSS Architecture

### BEM Methodology (REQUIRED)
- **Block**: `ToggleSwitch`
- **Elements**: `__label`, `__control`, `__input`, `__slider`
- **Modifiers**: `--small`, `--large`, `--success`, `--warning`, `--danger`, `--info`

### Color Standards
- **Primary Blue**: `#007bff` (matches Bootstrap primary)
- **Disabled Gray**: `#ccc` 
- **Border Gray**: `#999`
- **Text Color**: `#333`

### Size Standards
- **Standard**: 50px × 24px
- **Small**: 40px × 20px  
- **Large**: 60px × 28px

## ⚡ Features (NON-NEGOTIABLE)

### ✅ Accessibility
- Full ARIA support (`role="switch"`, `aria-checked`)
- Keyboard navigation (Space/Enter)
- Screen reader compatibility
- High contrast mode support
- Focus indicators

### ✅ Responsive Design
- Works on all screen sizes
- Touch-friendly (minimum 44px touch target)
- Retina display optimized

### ✅ Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11+ graceful degradation
- Mobile browsers (iOS Safari, Chrome Mobile)

### ✅ Performance
- CSS-only base functionality
- GPU-accelerated animations
- Minimal DOM footprint
- No JavaScript required for basic operation

### ✅ Customization
- Size variants (small, standard, large)
- Color themes (primary, success, warning, danger, info)
- Dark mode support
- Reduced motion support

## 🔧 JavaScript API (OPTIONAL)

### Initialization
```javascript
// Single instance
const toggle = new ToggleSwitch('#my-toggle');

// Bulk initialization
ToggleSwitch.initAll();
```

### Methods
```javascript
toggle.setChecked(true);     // Set state
toggle.isChecked();          // Get state
toggle.toggle();             // Toggle state
toggle.enable();             // Enable switch
toggle.disable();            // Disable switch
toggle.destroy();            // Clean up
```

### Events
```javascript
// Instance events
new ToggleSwitch('#toggle', {
  onChange: (checked, instance) => {},
  onEnable: (instance) => {},
  onDisable: (instance) => {}
});

// Global events
document.addEventListener('toggleswitch:change', (event) => {
  console.log(event.detail.checked);
});
```

## 📋 Implementation Checklist

### ✅ Pre-Implementation
- [ ] Download all ToggleSwitch files
- [ ] Include ToggleSwitch.css in your project
- [ ] (Optional) Include ToggleSwitch.js for enhanced functionality
- [ ] Review the demo.html for implementation examples

### ✅ HTML Implementation
- [ ] Use exact HTML structure as specified
- [ ] Ensure unique IDs for each toggle
- [ ] Connect labels properly (`for` attribute)
- [ ] Add appropriate modifiers for size/color variants

### ✅ CSS Integration
- [ ] Include ToggleSwitch.css before any custom styles
- [ ] Do NOT modify core ToggleSwitch classes
- [ ] Use CSS custom properties for theme customization
- [ ] Test in all target browsers

### ✅ JavaScript Integration (Optional)
- [ ] Initialize ToggleSwitch instances
- [ ] Implement required event handlers
- [ ] Test all API methods
- [ ] Handle error cases properly

### ✅ Quality Assurance
- [ ] Test with screen readers
- [ ] Verify keyboard navigation
- [ ] Check focus indicators
- [ ] Test on mobile devices
- [ ] Validate in high contrast mode
- [ ] Verify dark mode compatibility

## 🚫 FORBIDDEN PRACTICES

### ❌ DO NOT:
- Modify core CSS classes directly
- Use inline styles on ToggleSwitch elements
- Create custom toggle implementations
- Ignore accessibility requirements
- Skip proper HTML structure
- Use non-standard naming conventions

### ✅ DO:
- Use CSS custom properties for theming
- Extend with additional modifier classes
- Follow the established naming pattern
- Test thoroughly across all platforms
- Maintain backward compatibility
- Document any customizations

## 🔐 Version Control

### Current Version: 1.0.0
- Initial master level implementation
- Full accessibility compliance
- Complete browser support
- Production-ready quality

### Upgrade Path
- Minor updates: Bug fixes, performance improvements
- Major updates: New features, breaking changes (rare)
- All updates maintain backward compatibility

## 📞 Support & Maintenance

### Issues
- Document any issues with specific browser/device combinations
- Provide minimal reproduction cases
- Include accessibility testing results

### Contributions
- All contributions must maintain master level quality
- No breaking changes without major version bump
- Full test coverage required
- Accessibility compliance mandatory

## 📊 Success Metrics

### Performance Targets
- **Load Time**: < 50ms initial render
- **Animation**: 60fps smooth transitions  
- **Bundle Size**: < 5KB CSS + JS combined
- **Accessibility**: 100% WCAG 2.1 AA compliance

### Quality Gates
- ✅ Works without JavaScript
- ✅ Passes automated accessibility tests
- ✅ Compatible with all modern frameworks
- ✅ Zero console errors in any browser
- ✅ Perfect visual rendering across devices

---

## 🎖️ MASTER LEVEL DECLARATION

This ToggleSwitch component is hereby declared the **OFFICIAL WEB STANDARD** for toggle switch implementations. Any project requiring toggle functionality MUST use this component or provide compelling technical justification for deviation.

**Effective immediately. No exceptions.**

---

*Last Updated: November 6, 2025*  
*Version: 1.0.0*  
*Authority: FormMock Development Team*