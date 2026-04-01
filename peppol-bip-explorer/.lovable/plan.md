
# Multi-File Catalogue Tester Enhancement

## Overview
Enhance the Catalogue Tester to support uploading multiple XML catalogue files, with a file selector to choose which file to visualize. The visualization remains the same (parsed data + XML structure with hover highlighting), but now users can switch between uploaded files.

## User Experience Flow
1. User navigates to the "Catalogue Tester" tab
2. User uploads one or more XML files (drag-and-drop or file picker)
3. Files appear as selectable chips/cards showing filename
4. User clicks on a file chip to select it for visualization
5. The selected file's catalogue lines are displayed with the existing parsed data + XML view
6. User can add more files, remove files, or clear all

## Changes Required

### File: `src/components/CatalogueTester.tsx`

**State Changes:**
- Add `files: UploadedFile[]` to store multiple uploaded files
- Add `selectedFileId: string | null` to track which file is selected for viewing
- Keep existing `parsedLines`, `rawXml`, `hoveredElement` for the currently selected file
- Remove single `fileName` state (replaced by files array)

**New Interface:**
```typescript
interface UploadedFile {
  id: string;
  name: string;
  content: string;
  parsedLines: ParsedCatalogueLine[];
  error: string | null;
}
```

**UI Updates:**

1. **Upload Area** - Modify to accept multiple files:
   - Add `multiple` attribute to the file input
   - Update drop handler to accept multiple files
   - Keep the upload zone always visible (not replaced by file info)

2. **File List Section** - Add new section below upload area:
   - Horizontal list of file chips (similar to CatalogueDiff)
   - Each chip shows: filename, catalogue line count, remove button
   - Selected file has visual highlight (border/background)
   - Click to select a file for viewing

3. **Visualization Area** - Keep existing visualization:
   - Shows parsed data and XML structure for selected file only
   - All hover highlighting logic remains unchanged
   - Empty state when no file is selected

**Handler Updates:**
- `handleFileUpload`: Process multiple files, parse each, add to files array
- `handleDrop`: Handle multiple dropped files
- `selectFile(id)`: Set selectedFileId and update current visualization
- `removeFile(id)`: Remove specific file, clear selection if it was selected
- `clearAllFiles()`: Reset to initial state

### Implementation Details

**Multi-file Upload Logic:**
```typescript
const handleFileUpload = useCallback((uploadedFiles: FileList | null) => {
  if (!uploadedFiles) return;
  
  Array.from(uploadedFiles).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const parsed = parseXmlCatalogue(content);
        const newFile: UploadedFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          content,
          parsedLines: parsed,
          error: parsed.length === 0 ? 'No CatalogueLine elements found' : null
        };
        setFiles(prev => [...prev, newFile]);
        // Auto-select first file
        if (files.length === 0) {
          setSelectedFileId(newFile.id);
        }
      } catch (err) {
        // Handle parse error
      }
    };
    reader.readAsText(file);
  });
}, [files.length, parseXmlCatalogue]);
```

**File Selection UI:**
```text
+-- Upload Zone (always visible, accepts multiple)
+-- File List (horizontal chips with selection)
|   +-- [chip: file1.xml (3 lines) X] [selected]
|   +-- [chip: file2.xml (1 line) X]
|   +-- [Clear All button]
+-- Selected File Visualization
    +-- Error Alert (if selected file has error)
    +-- Parsed Catalogue Lines (existing cards)
```

**Visual States:**
- Selected file chip: Primary border, subtle background highlight
- Non-selected file chip: Muted/outline style
- File with error: Destructive variant badge or icon
- Empty state: "Select a file to view its contents" message

### Dependencies
No new dependencies required. Uses existing UI components (Badge, Button, Card, etc.) and patterns from CatalogueDiff.
