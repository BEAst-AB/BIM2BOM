# 🎓 IFC Loading Learnings & Solutions

## 📋 Problem Summary

We experienced recurring IFC loading errors with That Open Engine 3.x that required systematic debugging to resolve. This document captures the complete journey from problem identification to final solution.

## 🔍 Errors Encountered

### 1. `callbacks.shift(...) is not a function`
**Frequency**: Most common error
**Context**: Occurred during IFC file loading, specifically in WASM initialization
**Stack Trace**: `web-ifc-api.js` → `callRuntimeCallbacks` → `initRuntime`

### 2. `Missing field: "tolerancePlaneIntersection"`
**Frequency**: Intermittent
**Context**: Related to incomplete web-ifc configuration
**Cause**: WASM setup not applying all required defaults

### 3. `Fragments: Unsupported input type`
**Frequency**: Occasional
**Context**: Fragment processing stage
**Cause**: Initialization order conflicts between FragmentsManager and IfcLoader

### 4. `BindingError: _emval_take_value has unknown type`
**Frequency**: Rare
**Context**: Version mismatch between JavaScript bindings and WASM
**Cause**: Inconsistent web-ifc versions between package.json and WASM path

## 🎯 Root Cause Analysis

### **Primary Issue: Double WASM Initialization**

The core problem was **double WASM initialization**:

1. **First initialization**: During `ifcLoader.setup()` - ✅ Works fine
2. **Second initialization**: During `ifcLoader.load()` - ❌ Conflicts with existing WASM

**Evidence from Debug Logs**:
```
✅ IfcLoader setup with auto-detection successful
...
[During load() call]
GET https://unpkg.com/@thatopen/components@2.4.3/package.json  ← Problem!
autoSetWasm @ load()  ← Double initialization causes crash
```

### **Secondary Issues**:
- **Version mismatches**: Different web-ifc versions in package.json vs WASM URLs
- **Initialization order**: FragmentsManager vs IfcLoader setup sequence
- **Configuration conflicts**: Auto-detection vs manual WASM configuration

## 🛠️ Solution Development Process

### Phase 1: Trial-and-Error (❌ Ineffective)
- Tried various configuration combinations
- Switched between auto-detection and manual WASM paths
- Changed initialization orders
- **Result**: Recurring errors, no systematic understanding

### Phase 2: Systematic Debugging (✅ Effective)
- Created `MinimalViewer.ts` - isolated testing environment
- Built `debug.html` - comprehensive diagnostic interface
- Implemented step-by-step logging and error tracking
- **Result**: Clear identification of double initialization issue

## ✅ Final Solution

### **Working Configuration**
```typescript
// Prevent double WASM initialization
await this.ifcLoader.setup({
  autoSetWasm: false,  // ← Key: Disable auto-detection
  wasm: {
    path: "https://unpkg.com/web-ifc@0.0.71/",  // ← Explicit version
    absolute: true,
  },
});

// Use local worker for FragmentsManager
const workerUrl = `${window.location.origin}/worker.mjs`;
await this.fragments.init(workerUrl);
```

### **Why This Works**:
1. **Prevents double initialization**: `autoSetWasm: false` stops load() from re-initializing WASM
2. **Version consistency**: Explicit web-ifc@0.0.71 matches package.json
3. **Proper sequence**: IfcLoader setup → FragmentsManager init → Event handlers
4. **Local resources**: Uses local worker.mjs for better reliability

## 📊 Configuration Matrix (Tested)

| Configuration | Setup Success | Load Success | Notes |
|--------------|---------------|--------------|-------|
| **Auto + Auto** | ✅ | ❌ | Double initialization conflict |
| **Auto + Manual** | ✅ | ❌ | Mixed configuration issues |
| **Manual + Auto** | ✅ | ❌ | Inconsistent WASM handling |
| **Manual + Manual** | ✅ | ✅ | **WORKING SOLUTION** |

**Legend**: Setup = ifcLoader.setup(), Load = ifcLoader.load()

## 🔧 Debug Tools Created

### 1. MinimalViewer.ts
**Purpose**: Isolated IFC loading environment
**Features**:
- Step-by-step initialization logging
- Multiple fallback configurations
- Built-in diagnostics (`diagnose()` method)
- Progress tracking with callbacks
- Error isolation and detailed reporting

### 2. debug.html
**Purpose**: Interactive testing interface
**Features**:
- Visual status indicators
- Real-time console logging with export
- File upload testing (small.ifc + custom files)
- System state inspection
- Configuration switching capabilities

### 3. Diagnostic Methods
```typescript
// System state check
const diagnosis = viewer.diagnose();

// Known-good file test
await viewer.testWithSmallIfc();

// Progress tracking
progressCallback: (progress) => console.log(`Loading: ${progress}%`)
```

## 📈 Success Metrics

### Before Fix:
- ❌ 0% IFC loading success rate
- ❌ Recurring `callbacks.shift(...)` errors
- ❌ Inconsistent behavior across attempts
- ❌ No clear error patterns

### After Fix:
- ✅ 100% IFC loading success rate (tested with small.ifc)
- ✅ No WASM initialization conflicts
- ✅ Consistent behavior
- ✅ Clear progress tracking (0% → 100%)

## 🎓 Key Learnings

### 1. **Systematic Debugging > Trial-and-Error**
Creating isolated test environments and comprehensive logging reveals root causes much faster than random configuration changes.

### 2. **Double Initialization is a Common Pattern**
Many JavaScript libraries that use WASM can suffer from double initialization when both setup and runtime methods trigger resource loading.

### 3. **Version Consistency is Critical**
Even minor version mismatches between package.json dependencies and CDN URLs can cause binding errors in WASM-based libraries.

### 4. **Official Examples May Not Cover All Cases**
Official tutorials often use auto-detection which works in simple cases but fails in more complex applications with multiple initialization phases.

### 5. **Debug Tools Are Invaluable**
Purpose-built debug environments catch issues that are invisible in production environments.

## 🔄 Reusable Patterns

### For Future IFC Loading Issues:
1. **Always disable autoSetWasm** in production environments
2. **Use explicit WASM paths** with version numbers
3. **Initialize IfcLoader before FragmentsManager**
4. **Test with small.ifc first** before trying large files
5. **Add progress callbacks** for visibility into loading process

### For Any WASM-based Library:
1. **Avoid double initialization** by disabling auto-detection
2. **Match versions exactly** between JS packages and WASM files
3. **Use systematic debugging** with isolated test environments
4. **Log initialization steps** to identify conflict points

## 📚 References & Resources

### Working Examples:
- `MinimalViewer.ts` - Proven working implementation
- `debug.html` - Comprehensive testing environment
- That Open Engine IfcLoader Tutorial: https://docs.thatopen.com/Tutorials/Components/Core/IfcLoader

### Package Versions Used:
```json
{
  "@thatopen/components": "^3.1.3",
  "@thatopen/components-front": "^3.1.7", 
  "@thatopen/fragments": "^3.1.7",
  "web-ifc": "^0.0.71"
}
```

### WASM Configuration:
```typescript
wasm: {
  path: "https://unpkg.com/web-ifc@0.0.71/",
  absolute: true
}
```

## 🚀 Implementation Checklist

For implementing IFC loading in new projects:

- [ ] Install exact package versions listed above
- [ ] Copy working configuration from this document
- [ ] Set `autoSetWasm: false` in IfcLoader setup
- [ ] Use explicit WASM path with version number
- [ ] Initialize IfcLoader before FragmentsManager
- [ ] Add progress callbacks for user feedback
- [ ] Test with small.ifc before large files
- [ ] Keep MinimalViewer.ts for future debugging

## 🎯 Success Indicators

Your IFC loading is working correctly when you see:

```
✅ IfcLoader setup with manual configuration successful
🔍 WASM settings: {path: 'https://unpkg.com/web-ifc@0.0.71/', absolute: true}
🔍 AutoSetWasm disabled: true
📊 Loading progress: 0% → 100%
📦 Model added to scene
✅ IFC loading completed successfully
```

**No more `callbacks.shift(...)` errors!** 🎉

---

*This document represents the complete solution to recurring IFC loading issues in That Open Engine 3.x applications. The systematic debugging approach and working configuration should prevent similar issues in future projects.*

