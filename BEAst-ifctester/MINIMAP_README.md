# 🗺️ Minimap Implementation for BEAst Modelleringskrav

## Overview

This project now includes a **custom minimap implementation** that provides a 2D top-down view of your 3D BIM model. The minimap automatically appears when you load an IFC file and helps users understand their position and orientation in the 3D scene.

## ✨ Features

- **Automatic Creation**: Minimap appears automatically when the first IFC model is loaded
- **Real-time Updates**: Updates when the camera moves or new models are added
- **Top-down View**: Orthographic camera positioned above the scene for clear overview
- **Responsive Design**: Automatically adjusts to scene bounds and model size
- **Clean Styling**: Rounded corners, subtle border, and semi-transparent background
- **Performance Optimized**: Separate renderer and scene for efficient rendering

## 🚀 How It Works

### 1. **SimpleMiniMap Class**
The minimap is implemented as a custom `SimpleMiniMap` class that:
- Creates a separate Three.js scene and renderer
- Uses an orthographic camera for top-down perspective
- Automatically calculates scene bounds and positions camera
- Clones scene objects for rendering in the minimap

### 2. **Integration with Viewer**
The minimap is integrated into the `Viewer` class:
- Automatically created when first fragment is added
- Updates when camera moves (camera "rest" event)
- Updates when new models are loaded
- Updates when fragments are fully processed

### 3. **Automatic Positioning**
The minimap:
- Appears in the bottom-right corner of the screen
- Automatically calculates the optimal camera position based on scene bounds
- Maintains proper aspect ratio and zoom level

## 📁 File Structure

```
src/components/
├── Viewer.ts          # Main viewer with minimap integration
└── ...                # Other components

minimap-test.html      # Test file to demonstrate minimap functionality
MINIMAP_README.md      # This documentation file
```

## 🧪 Testing the Minimap

### Option 1: Use the Test File
1. Open `minimap-test.html` in your browser
2. Click "Choose File" and select an IFC file
3. Click "Load IFC" to load the model
4. The minimap will automatically appear in the bottom-right corner

### Option 2: Use in Your Main App
The minimap is automatically integrated into the `Viewer` class and will appear whenever you load an IFC file through the normal loading process.

## 🔧 Customization

### Changing Minimap Position
Modify the CSS in the `createMiniMap()` method:

```typescript
minimapContainer.style.cssText = `
  position: fixed;
  bottom: 1rem;        // Change from bottom
  right: 1rem;         // Change from right
  z-index: 1000;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 8px;
`;
```

### Changing Minimap Size
Modify the size in the `SimpleMiniMap` constructor:

```typescript
private size = new THREE.Vector2(320, 160); // Width, Height
```

### Changing Minimap Style
Modify the renderer settings in the `SimpleMiniMap` constructor:

```typescript
this.renderer.setClearColor(0x06080a, 0.8); // Color, Alpha
```

## 🎯 How It Differs from Official Example

The official `@thatopen/components` package includes `MiniMaps` and `MiniMap` classes, but these are not exported in the current version (3.1.3). This implementation:

1. **Provides the same functionality** using custom code
2. **Integrates seamlessly** with your existing Viewer class
3. **Uses the same approach** as the official example (orthographic camera, separate renderer)
4. **Maintains compatibility** with your current setup

## 🔍 Technical Details

### Camera Setup
- **Type**: Orthographic camera for true top-down view
- **Positioning**: Automatically calculated above scene center
- **Frustum**: Adjusts based on scene bounds and aspect ratio

### Rendering
- **Separate Scene**: Minimap has its own Three.js scene
- **Object Cloning**: Models are cloned to avoid affecting the main scene
- **Performance**: Only renders when needed (camera moves, models change)

### Event Handling
- **Camera Events**: Listens to camera "rest" events for updates
- **Model Events**: Updates when fragments are added or loaded
- **Automatic Cleanup**: Properly disposes resources when viewer is disposed

## 🐛 Troubleshooting

### Minimap Not Appearing
1. Check browser console for errors
2. Verify that an IFC file was successfully loaded
3. Check that the `createMiniMap()` method is being called
4. Verify that the minimap container is being added to the DOM

### Performance Issues
1. The minimap only updates when necessary (camera moves, models change)
2. If you experience lag, consider reducing the minimap size
3. The minimap uses a separate renderer to avoid affecting main scene performance

### Visual Issues
1. Check that the minimap container is positioned correctly
2. Verify that the Three.js renderer is working properly
3. Check browser console for WebGL errors

## 🚀 Future Enhancements

Potential improvements that could be added:
- **Interactive Controls**: Zoom, pan, and rotate controls for the minimap
- **Custom Materials**: Different rendering styles (wireframe, x-ray, etc.)
- **Multiple Views**: Front, side, and isometric views
- **Annotations**: Markers and labels on the minimap
- **Synchronization**: Click on minimap to move main camera

## 📚 References

- **Three.js Documentation**: https://threejs.org/docs/
- **Orthographic Camera**: https://threejs.org/docs/#api/en/cameras/OrthographicCamera
- **WebGL Renderer**: https://threejs.org/docs/#api/en/renderers/WebGLRenderer
- **Scene Management**: https://threejs.org/docs/#api/en/scenes/Scene

## 🤝 Contributing

If you want to improve the minimap implementation:
1. Test your changes thoroughly
2. Ensure the build passes without errors
3. Update this documentation if needed
4. Consider adding new features mentioned in "Future Enhancements"

---

**Note**: This minimap implementation is designed to be simple, efficient, and maintainable. It provides the core functionality needed for BIM model navigation while keeping the codebase clean and focused.
