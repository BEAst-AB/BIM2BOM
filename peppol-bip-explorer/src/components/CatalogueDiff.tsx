import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, GripVertical, FileText, Plus, Minus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { diffXmlLines, formatXml, getDiffSummary, type DiffResult, type DiffLine } from '@/utils/xmlDiff';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  name: string;
  content: string;
  formattedContent: string;
}

interface FilePairDiff {
  leftFile: UploadedFile;
  rightFile: UploadedFile;
  diff: DiffResult;
  summary: { added: number; removed: number; modified: number };
}

export function CatalogueDiff() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [diffs, setDiffs] = useState<FilePairDiff[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeDiffIndex, setActiveDiffIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for synchronized scrolling - using native divs
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // Compute diffs whenever files change
  useEffect(() => {
    if (files.length < 2) {
      setDiffs([]);
      return;
    }

    const newDiffs: FilePairDiff[] = [];
    for (let i = 0; i < files.length - 1; i++) {
      const leftFile = files[i];
      const rightFile = files[i + 1];
      const diff = diffXmlLines(leftFile.formattedContent, rightFile.formattedContent);
      const summary = getDiffSummary(diff);
      newDiffs.push({ leftFile, rightFile, diff, summary });
    }
    setDiffs(newDiffs);
    setActiveDiffIndex(Math.min(activeDiffIndex, Math.max(0, newDiffs.length - 1)));
  }, [files]);

  // Synchronized scrolling using native scroll events
  useEffect(() => {
    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;
    
    if (!leftPanel || !rightPanel) return;

    const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
      if (isScrolling.current) return;
      isScrolling.current = true;
      
      // Calculate scroll percentage
      const scrollPercentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
      const targetScrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight);
      
      target.scrollTop = targetScrollTop;
      
      requestAnimationFrame(() => {
        isScrolling.current = false;
      });
    };

    const handleLeftScroll = () => syncScroll(leftPanel, rightPanel);
    const handleRightScroll = () => syncScroll(rightPanel, leftPanel);

    leftPanel.addEventListener('scroll', handleLeftScroll);
    rightPanel.addEventListener('scroll', handleRightScroll);

    return () => {
      leftPanel.removeEventListener('scroll', handleLeftScroll);
      rightPanel.removeEventListener('scroll', handleRightScroll);
    };
  }, [diffs, activeDiffIndex]);

  const handleFileUpload = useCallback((uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;

    const filePromises = Array.from(uploadedFiles).map((file) => {
      return new Promise<UploadedFile>((resolve, reject) => {
        if (!file.name.toLowerCase().endsWith('.xml')) {
          reject(new Error(`${file.name} is not an XML file`));
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            content,
            formattedContent: formatXml(content)
          });
        };
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsText(file);
      });
    });

    Promise.all(filePromises)
      .then((newFiles) => {
        setFiles((prev) => [...prev, ...newFiles]);
      })
      .catch((error) => {
        console.error('Error uploading files:', error);
      });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Drag and drop reordering
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      setFiles((prev) => {
        const newFiles = [...prev];
        const [removed] = newFiles.splice(draggedIndex, 1);
        newFiles.splice(dragOverIndex, 0, removed);
        return newFiles;
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex]);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setDiffs([]);
    setActiveDiffIndex(0);
  }, []);

  const currentDiff = diffs[activeDiffIndex];

  const renderDiffLine = (line: DiffLine, idx: number, side: 'left' | 'right') => {
    const isEmpty = line.lineNumber === -1;
    const content = side === 'left' ? (line.leftContent || line.content) : (line.rightContent || line.content);
    
    return (
      <div
        key={idx}
        className={cn(
          "flex min-h-[24px] font-mono text-xs border-b border-border/30",
          line.type === 'added' && "bg-emerald-100 dark:bg-emerald-950/40",
          line.type === 'removed' && "bg-red-100 dark:bg-red-950/40",
          line.type === 'modified' && "bg-amber-100 dark:bg-amber-950/40",
          isEmpty && "bg-muted/30"
        )}
      >
        {/* Line number */}
        <span className={cn(
          "w-10 px-2 py-1 text-right select-none border-r border-border/50 flex-shrink-0",
          line.type === 'added' && "bg-emerald-200/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
          line.type === 'removed' && "bg-red-200/50 dark:bg-red-900/30 text-red-700 dark:text-red-400",
          line.type === 'modified' && "bg-amber-200/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
          isEmpty && "text-muted-foreground/30"
        )}>
          {line.lineNumber > 0 ? line.lineNumber : ''}
        </span>
        
        {/* Change indicator */}
        <span className={cn(
          "w-6 px-1 py-1 text-center select-none flex-shrink-0",
          line.type === 'added' && "text-emerald-600 dark:text-emerald-400",
          line.type === 'removed' && "text-red-600 dark:text-red-400",
          line.type === 'modified' && "text-amber-600 dark:text-amber-400"
        )}>
          {line.type === 'added' && '+'}
          {line.type === 'removed' && '−'}
          {line.type === 'modified' && '~'}
        </span>
        
        {/* Content */}
        <pre className={cn(
          "flex-1 py-1 pr-2 whitespace-pre overflow-x-auto",
          isEmpty && "text-transparent"
        )}>
          {content || ' '}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Catalogue Diff
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Drop XML files here or click to upload</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upload 2 or more XML catalogues to compare them
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  Uploaded Files ({files.length})
                  {files.length >= 2 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      Drag to reorder
                    </span>
                  )}
                </h3>
                <Button variant="outline" size="sm" onClick={clearAllFiles}>
                  Clear All
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border cursor-move transition-all",
                      draggedIndex === index && "opacity-50 scale-95",
                      dragOverIndex === index && draggedIndex !== index && "border-primary border-2"
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="font-mono">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {file.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diff View */}
      {diffs.length > 0 && currentDiff && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Comparison {activeDiffIndex + 1} of {diffs.length}
              </CardTitle>
              
              {/* Diff Navigation */}
              {diffs.length > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeDiffIndex === 0}
                    onClick={() => setActiveDiffIndex((prev) => prev - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {activeDiffIndex + 1} / {diffs.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeDiffIndex === diffs.length - 1}
                    onClick={() => setActiveDiffIndex((prev) => prev + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Summary */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  <Plus className="h-3 w-3 mr-1" />
                  {currentDiff.summary.added} added
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">
                  <Minus className="h-3 w-3 mr-1" />
                  {currentDiff.summary.removed} removed
                </Badge>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {currentDiff.summary.modified} modified
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 gap-0 border rounded-lg overflow-hidden">
              {/* Left Panel */}
              <div className="border-r">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted border-b">
                  <Badge variant="secondary">{files.indexOf(currentDiff.leftFile) + 1}</Badge>
                  <span className="font-medium text-sm truncate">
                    {currentDiff.leftFile.name}
                  </span>
                </div>
                <div 
                  ref={leftPanelRef}
                  className="h-[600px] overflow-auto"
                >
                  <div className="min-w-max">
                    {currentDiff.diff.leftLines.map((line, idx) => renderDiffLine(line, idx, 'left'))}
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted border-b">
                  <Badge variant="secondary">{files.indexOf(currentDiff.rightFile) + 1}</Badge>
                  <span className="font-medium text-sm truncate">
                    {currentDiff.rightFile.name}
                  </span>
                </div>
                <div 
                  ref={rightPanelRef}
                  className="h-[600px] overflow-auto"
                >
                  <div className="min-w-max">
                    {currentDiff.diff.rightLines.map((line, idx) => renderDiffLine(line, idx, 'right'))}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700" />
                <span className="text-sm text-muted-foreground">Added</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-700" />
                <span className="text-sm text-muted-foreground">Removed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700" />
                <span className="text-sm text-muted-foreground">Modified</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {files.length > 0 && files.length < 2 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Upload at least one more XML file to compare
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
