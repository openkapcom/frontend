import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoService } from '@/services/videoService';
import type { Video, EditorItem } from '@/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Scissors,
  Type,
  Square,
  Layers,
  Merge,
  Loader2,
  Check,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  GripVertical,
  Upload,
  X,
} from 'lucide-react';

// --- Helpers ---

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

type Tool = 'blur' | 'text' | 'overlay' | 'trim' | 'merge';

// --- Main Component ---

export default function VideoEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoId = Number(id);

  // Data
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [items, setItems] = useState<EditorItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('blur');

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Trim
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  // Timeline
  const [timelineZoom, setTimelineZoom] = useState(1);

  // Canvas drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);

  // Merge dialog
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeVideos, setMergeVideos] = useState<File[]>([]);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // Processing
  const [processing, setProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [processProgress, setProcessProgress] = useState(0);

  // Overlay upload
  const overlayInputRef = useRef<HTMLInputElement>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const selectedItem = items.find((i) => i.id === selectedItemId) || null;

  // --- Data Loading ---

  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    videoService
      .getVideo(videoId)
      .then((v) => {
        setVideo(v);
        setTrimEnd(v.duration);
        setDuration(v.duration);
      })
      .catch((err) => console.error('Failed to load video:', err))
      .finally(() => setLoading(false));
  }, [videoId]);

  // --- Video Setup ---

  useEffect(() => {
    if (!video || !videoRef.current) return;
    const videoEl = videoRef.current;
    videoEl.src = videoService.getStreamUrl(video.id);

    const handleLoadedMetadata = () => {
      setDuration(videoEl.duration);
      if (trimEnd === 0 || trimEnd > videoEl.duration) {
        setTrimEnd(videoEl.duration);
      }
    };
    const handleTimeUpdate = () => {
      setCurrentTime(videoEl.currentTime);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('play', handlePlay);
    videoEl.addEventListener('pause', handlePause);
    videoEl.addEventListener('ended', handleEnded);

    return () => {
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      videoEl.removeEventListener('play', handlePlay);
      videoEl.removeEventListener('pause', handlePause);
      videoEl.removeEventListener('ended', handleEnded);
    };
  }, [video, trimEnd]);

  // --- Canvas Rendering ---

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const videoEl = videoRef.current;
    if (!canvas || !videoEl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video display size
    const rect = videoEl.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const time = videoEl.currentTime;
    const scaleX = canvas.width / (videoEl.videoWidth || canvas.width);
    const scaleY = canvas.height / (videoEl.videoHeight || canvas.height);

    for (const item of items) {
      if (time < item.startTime || time > item.endTime) continue;

      const x = item.x * scaleX;
      const y = item.y * scaleY;
      const w = item.width * scaleX;
      const h = item.height * scaleY;

      if (item.type === 'blur') {
        // Draw blur region indicator
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = item.id === selectedItemId ? '#fff' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = item.id === selectedItemId ? 2 : 1;
        ctx.setLineDash(item.id === selectedItemId ? [] : [4, 4]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);

        // Draw blur label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, 40, 18);
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText('BLUR', x + 4, y + 13);
      }

      if (item.type === 'text' && item.text) {
        const fontSize = (item.fontSize || 24) * scaleX;
        ctx.font = `${fontSize}px sans-serif`;

        if (item.backgroundColor) {
          const metrics = ctx.measureText(item.text);
          const pad = 4 * scaleX;
          ctx.fillStyle = item.backgroundColor;
          ctx.fillRect(x - pad, y - fontSize - pad, metrics.width + pad * 2, fontSize + pad * 2);
        }

        ctx.fillStyle = item.color || '#ffffff';
        ctx.fillText(item.text, x, y);

        if (item.id === selectedItemId) {
          const metrics = ctx.measureText(item.text);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(x - 2, y - fontSize - 2, metrics.width + 4, fontSize + 8);
          ctx.setLineDash([]);
        }
      }

      if (item.type === 'overlay') {
        ctx.strokeStyle = item.id === selectedItemId ? '#fff' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = item.id === selectedItemId ? 2 : 1;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = 'rgba(100, 100, 255, 0.15)';
        ctx.fillRect(x, y, w, h);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, 60, 18);
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText('OVERLAY', x + 4, y + 13);
      }
    }

    // Draw drawing preview
    if (isDrawing && drawStart && activeTool === 'blur') {
      // This is handled in mouse move
    }

    animationRef.current = requestAnimationFrame(renderCanvas);
  }, [items, selectedItemId, isDrawing, drawStart, activeTool]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(renderCanvas);
    return () => cancelAnimationFrame(animationRef.current);
  }, [renderCanvas]);

  // --- Canvas Interaction ---

  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const videoEl = videoRef.current;
    if (!canvas || !videoEl) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = (videoEl.videoWidth || canvas.width) / rect.width;
    const scaleY = (videoEl.videoHeight || canvas.height) / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'blur' && activeTool !== 'text') return;

    const coords = getCanvasCoords(e);

    if (activeTool === 'blur') {
      setIsDrawing(true);
      setDrawStart(coords);
    }

    if (activeTool === 'text') {
      const newItem: EditorItem = {
        id: generateId(),
        type: 'text',
        x: coords.x,
        y: coords.y,
        width: 200,
        height: 30,
        startTime: currentTime,
        endTime: Math.min(currentTime + 5, duration),
        text: 'Text',
        fontSize: 24,
        color: '#ffffff',
        backgroundColor: '',
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;

    const canvas = canvasRef.current;
    const videoEl = videoRef.current;
    if (!canvas || !videoEl) return;

    const coords = getCanvasCoords(e);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw preview rectangle on next render cycle
    const rect = canvas.getBoundingClientRect();
    const sx = drawStart.x * (rect.width / (videoEl.videoWidth || rect.width));
    const sy = drawStart.y * (rect.height / (videoEl.videoHeight || rect.height));
    const ex = (coords.x - drawStart.x) * (rect.width / (videoEl.videoWidth || rect.width));
    const ey = (coords.y - drawStart.y) * (rect.height / (videoEl.videoHeight || rect.height));

    // The live preview is drawn as part of the animation loop
    // We can store temporary draw state if needed
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart) return;

    const coords = getCanvasCoords(e);
    const width = Math.abs(coords.x - drawStart.x);
    const height = Math.abs(coords.y - drawStart.y);

    if (width > 5 && height > 5) {
      const newItem: EditorItem = {
        id: generateId(),
        type: 'blur',
        x: Math.min(drawStart.x, coords.x),
        y: Math.min(drawStart.y, coords.y),
        width,
        height,
        startTime: currentTime,
        endTime: Math.min(currentTime + 5, duration),
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
    }

    setIsDrawing(false);
    setDrawStart(null);
  };

  // --- Playback Controls ---

  const togglePlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
    }
  };

  const handleSeek = (value: number | readonly number[]) => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const v = Array.isArray(value) ? value[0] : value;
    videoEl.currentTime = v;
    setCurrentTime(v);
  };

  const toggleMute = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
    setIsMuted(videoEl.muted);
  };

  const handleVolumeChange = (value: number | readonly number[]) => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const v = Array.isArray(value) ? value[0] : value;
    videoEl.volume = v;
    setVolume(v);
    if (v === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  // --- Item Management ---

  const updateItem = (id: string, updates: Partial<EditorItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const addOverlayItem = () => {
    overlayInputRef.current?.click();
  };

  const handleOverlayFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const newItem: EditorItem = {
      id: generateId(),
      type: 'overlay',
      x: 50,
      y: 50,
      width: 320,
      height: 240,
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, duration),
      overlayFile: file,
      overlayUrl: url,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);

    // Reset input
    e.target.value = '';
  };

  // --- Merge ---

  const handleMergeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setMergeVideos((prev) => [...prev, ...Array.from(files)]);
    e.target.value = '';
  };

  const removeMergeVideo = (index: number) => {
    setMergeVideos((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Apply Edits ---

  const handleApplyEdits = async () => {
    if (!video) return;
    setProcessing(true);
    setProcessStatus('Submitting edits...');
    setProcessProgress(0);

    try {
      const edits: Record<string, unknown> = {
        items: items.map((item) => ({
          ...item,
          overlayFile: undefined,
          overlayUrl: undefined,
        })),
        trim: activeTool === 'trim' || trimStart > 0 || trimEnd < duration
          ? { start: trimStart, end: trimEnd }
          : undefined,
        merge: mergeVideos.length > 0
          ? mergeVideos.map((f) => f.name)
          : undefined,
      };

      await videoService.applyEdits(video.id, edits);
      setProcessStatus('Processing...');

      // Poll for status
      const poll = async () => {
        try {
          const status = await videoService.getEditStatus(video.id);
          if (status.progress !== undefined) {
            setProcessProgress(status.progress);
          }
          if (status.status === 'completed') {
            setProcessStatus('Complete!');
            setProcessProgress(100);
            setTimeout(() => {
              setProcessing(false);
              navigate(`/video/${video.id}`);
            }, 1500);
            return;
          }
          if (status.status === 'failed') {
            setProcessStatus('Processing failed. Please try again.');
            setTimeout(() => setProcessing(false), 3000);
            return;
          }
          setTimeout(poll, 2000);
        } catch {
          setProcessStatus('Error checking status.');
          setTimeout(() => setProcessing(false), 3000);
        }
      };

      setTimeout(poll, 1000);
    } catch (err) {
      console.error('Failed to apply edits:', err);
      setProcessStatus('Failed to submit edits.');
      setTimeout(() => setProcessing(false), 3000);
    }
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-3 p-3 border-b">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex flex-1">
          <Skeleton className="w-14 h-full" />
          <Skeleton className="flex-1 m-4" />
          <Skeleton className="w-72 h-full" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Video not found</h2>
          <p className="text-muted-foreground mt-1">The video you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => navigate('/videos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  const toolConfig: { key: Tool; icon: React.ReactNode; label: string }[] = [
    { key: 'blur', icon: <Square className="h-4 w-4" />, label: 'Blur' },
    { key: 'text', icon: <Type className="h-4 w-4" />, label: 'Text' },
    { key: 'overlay', icon: <Layers className="h-4 w-4" />, label: 'Overlay' },
    { key: 'trim', icon: <Scissors className="h-4 w-4" />, label: 'Trim' },
    { key: 'merge', icon: <Merge className="h-4 w-4" />, label: 'Merge' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden h-screen">
      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="w-96">
            <CardContent className="p-6 text-center space-y-4">
              {processStatus === 'Complete!' ? (
                <Check className="h-12 w-12 mx-auto text-green-500" />
              ) : processStatus.includes('failed') || processStatus.includes('Failed') || processStatus.includes('Error') ? (
                <X className="h-12 w-12 mx-auto text-destructive" />
              ) : (
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-muted-foreground" />
              )}
              <p className="font-medium">{processStatus}</p>
              {processProgress > 0 && processProgress < 100 && (
                <Progress value={processProgress} className="w-full" />
              )}
              {(processStatus.includes('failed') || processStatus.includes('Failed') || processStatus.includes('Error')) && (
                <Button variant="outline" onClick={() => setProcessing(false)}>
                  Dismiss
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between p-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/video/${video.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-medium truncate max-w-xs">{video.title}</span>
          <Badge variant="secondary" className="text-xs font-mono">
            {formatTime(duration)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {items.length} edit{items.length !== 1 ? 's' : ''}
          </Badge>
          <Button
            onClick={handleApplyEdits}
            disabled={items.length === 0 && trimStart === 0 && trimEnd >= duration && mergeVideos.length === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Apply Edits
          </Button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tool Panel (Left) */}
        <div className="w-14 border-r flex flex-col items-center py-3 gap-1 shrink-0">
          {toolConfig.map((tool) => (
            <button
              key={tool.key}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-md transition-colors w-12',
                activeTool === tool.key
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
              onClick={() => {
                setActiveTool(tool.key);
                if (tool.key === 'merge') setMergeDialogOpen(true);
                if (tool.key === 'overlay') addOverlayItem();
              }}
              title={tool.label}
            >
              {tool.icon}
              <span className="text-[9px] leading-none">{tool.label}</span>
            </button>
          ))}

          <Separator className="my-2 w-8" />

          {/* Items List */}
          <div className="flex-1 overflow-auto w-full px-1 space-y-1">
            {items.map((item, index) => (
              <button
                key={item.id}
                className={cn(
                  'w-full px-1.5 py-1 rounded text-[9px] text-left truncate transition-colors',
                  selectedItemId === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                )}
                onClick={() => setSelectedItemId(item.id)}
                title={`${item.type} ${index + 1}`}
              >
                {item.type === 'blur' && <Square className="h-2.5 w-2.5 inline mr-1" />}
                {item.type === 'text' && <Type className="h-2.5 w-2.5 inline mr-1" />}
                {item.type === 'overlay' && <Layers className="h-2.5 w-2.5 inline mr-1" />}
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Video Preview (Center) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            ref={containerRef}
            className="flex-1 relative bg-black flex items-center justify-center overflow-hidden"
          >
            <video
              ref={videoRef}
              className="max-w-full max-h-full"
              playsInline
            />
            <canvas
              ref={canvasRef}
              className={cn(
                'absolute inset-0 w-full h-full',
                (activeTool === 'blur' || activeTool === 'text')
                  ? 'cursor-crosshair'
                  : 'cursor-default pointer-events-none'
              )}
              style={{ pointerEvents: activeTool === 'blur' || activeTool === 'text' ? 'auto' : 'none' }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={() => {
                if (isDrawing) {
                  setIsDrawing(false);
                  setDrawStart(null);
                }
              }}
            />
          </div>

          {/* Playback Controls */}
          <div className="border-t p-3 flex items-center gap-3 shrink-0">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <span className="text-xs font-mono min-w-[80px]">
              {formatTime(currentTime)}
            </span>

            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 1}
              step={0.01}
              onValueChange={handleSeek}
              className="flex-1"
            />

            <span className="text-xs font-mono min-w-[80px] text-right">
              {formatTime(duration)}
            </span>

            <div className="flex items-center gap-1 ml-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="border-t shrink-0">
            {/* Timeline Controls */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b">
              <span className="text-xs text-muted-foreground">Timeline</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setTimelineZoom((z) => Math.max(0.5, z - 0.25))}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <span className="text-[10px] text-muted-foreground w-8 text-center">
                  {timelineZoom}x
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setTimelineZoom((z) => Math.min(4, z + 0.25))}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setTimelineZoom(1)}
                >
                  <Maximize className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Timeline Tracks */}
            <div
              ref={timelineRef}
              className="relative overflow-x-auto"
              style={{ height: Math.max(80, items.length * 28 + 40) }}
            >
              <div
                className="relative h-full"
                style={{ width: `${100 * timelineZoom}%`, minWidth: '100%' }}
              >
                {/* Time ruler */}
                <div className="h-5 border-b relative">
                  {duration > 0 &&
                    Array.from({ length: Math.ceil(duration / 5) + 1 }).map((_, i) => {
                      const time = i * 5;
                      const left = (time / duration) * 100;
                      if (left > 100) return null;
                      return (
                        <span
                          key={i}
                          className="absolute text-[9px] text-muted-foreground top-0.5"
                          style={{ left: `${left}%` }}
                        >
                          {formatTime(time).split('.')[0]}
                        </span>
                      );
                    })}
                </div>

                {/* Trim handles */}
                {activeTool === 'trim' && duration > 0 && (
                  <>
                    {/* Trimmed-out regions */}
                    <div
                      className="absolute top-5 bottom-0 bg-muted/50 z-10"
                      style={{
                        left: 0,
                        width: `${(trimStart / duration) * 100}%`,
                      }}
                    />
                    <div
                      className="absolute top-5 bottom-0 bg-muted/50 z-10"
                      style={{
                        left: `${(trimEnd / duration) * 100}%`,
                        right: 0,
                      }}
                    />
                    {/* Trim start handle */}
                    <div
                      className="absolute top-5 bottom-0 w-1 bg-primary cursor-col-resize z-20"
                      style={{ left: `${(trimStart / duration) * 100}%` }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const startX = e.clientX;
                        const startTrim = trimStart;
                        const timelineWidth = timelineRef.current?.scrollWidth || 1;
                        const handleMouseMove = (me: MouseEvent) => {
                          const dx = me.clientX - startX;
                          const dt = (dx / timelineWidth) * duration;
                          setTrimStart(Math.max(0, Math.min(trimEnd - 0.1, startTrim + dt)));
                        };
                        const handleMouseUp = () => {
                          window.removeEventListener('mousemove', handleMouseMove);
                          window.removeEventListener('mouseup', handleMouseUp);
                        };
                        window.addEventListener('mousemove', handleMouseMove);
                        window.addEventListener('mouseup', handleMouseUp);
                      }}
                    >
                      <div className="absolute -left-1.5 top-0 w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                        <GripVertical className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    </div>
                    {/* Trim end handle */}
                    <div
                      className="absolute top-5 bottom-0 w-1 bg-primary cursor-col-resize z-20"
                      style={{ left: `${(trimEnd / duration) * 100}%` }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const startX = e.clientX;
                        const startTrimEnd = trimEnd;
                        const timelineWidth = timelineRef.current?.scrollWidth || 1;
                        const handleMouseMove = (me: MouseEvent) => {
                          const dx = me.clientX - startX;
                          const dt = (dx / timelineWidth) * duration;
                          setTrimEnd(Math.max(trimStart + 0.1, Math.min(duration, startTrimEnd + dt)));
                        };
                        const handleMouseUp = () => {
                          window.removeEventListener('mousemove', handleMouseMove);
                          window.removeEventListener('mouseup', handleMouseUp);
                        };
                        window.addEventListener('mousemove', handleMouseMove);
                        window.addEventListener('mouseup', handleMouseUp);
                      }}
                    >
                      <div className="absolute -left-1.5 top-0 w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                        <GripVertical className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    </div>
                  </>
                )}

                {/* Editor item bars */}
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      'absolute h-5 rounded-sm cursor-pointer text-[9px] flex items-center px-1.5 truncate transition-colors',
                      selectedItemId === item.id
                        ? 'bg-primary text-primary-foreground ring-1 ring-primary'
                        : item.type === 'blur'
                          ? 'bg-muted-foreground/20 text-foreground hover:bg-muted-foreground/30'
                          : item.type === 'text'
                            ? 'bg-blue-500/20 text-foreground hover:bg-blue-500/30'
                            : 'bg-purple-500/20 text-foreground hover:bg-purple-500/30'
                    )}
                    style={{
                      left: `${(item.startTime / duration) * 100}%`,
                      width: `${((item.endTime - item.startTime) / duration) * 100}%`,
                      top: 24 + index * 28,
                    }}
                    onClick={() => setSelectedItemId(item.id)}
                    onMouseDown={(e) => {
                      // Allow dragging to reposition in time
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startStart = item.startTime;
                      const startEnd = item.endTime;
                      const itemDuration = startEnd - startStart;
                      const timelineWidth = timelineRef.current?.scrollWidth || 1;

                      const handleMouseMove = (me: MouseEvent) => {
                        const dx = me.clientX - startX;
                        const dt = (dx / timelineWidth) * duration;
                        const newStart = Math.max(0, Math.min(duration - itemDuration, startStart + dt));
                        updateItem(item.id, {
                          startTime: newStart,
                          endTime: newStart + itemDuration,
                        });
                      };
                      const handleMouseUp = () => {
                        window.removeEventListener('mousemove', handleMouseMove);
                        window.removeEventListener('mouseup', handleMouseUp);
                      };
                      window.addEventListener('mousemove', handleMouseMove);
                      window.addEventListener('mouseup', handleMouseUp);
                    }}
                  >
                    {item.type === 'blur' && 'Blur'}
                    {item.type === 'text' && (item.text || 'Text')}
                    {item.type === 'overlay' && 'Overlay'}
                  </div>
                ))}

                {/* Playhead */}
                {duration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute -top-0.5 -left-1.5 w-3.5 h-3 bg-red-500 rounded-sm" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel (Right) */}
        <div className="w-72 border-l shrink-0 overflow-auto">
          <div className="p-3">
            <h3 className="text-sm font-semibold mb-3">Properties</h3>

            {/* Tool-specific properties */}
            {activeTool === 'trim' && (
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <Scissors className="h-3.5 w-3.5" />
                    Trim
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Start</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[trimStart]}
                        min={0}
                        max={duration}
                        step={0.01}
                        onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val; setTrimStart(Math.min(v, trimEnd - 0.1)); }}
                        className="flex-1"
                      />
                      <span className="text-[10px] font-mono w-14 text-right">
                        {formatTime(trimStart).split('.')[0]}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[trimEnd]}
                        min={0}
                        max={duration}
                        step={0.01}
                        onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val; setTrimEnd(Math.max(v, trimStart + 0.1)); }}
                        className="flex-1"
                      />
                      <span className="text-[10px] font-mono w-14 text-right">
                        {formatTime(trimEnd).split('.')[0]}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="text-xs text-muted-foreground">
                    Duration: {formatTime(trimEnd - trimStart).split('.')[0]}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTool === 'merge' && (
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <Merge className="h-3.5 w-3.5" />
                    Merge
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Add videos to concatenate with the current video.
                  </p>
                  {mergeVideos.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="truncate flex-1">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeMergeVideo(i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setMergeDialogOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Video
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Selected item properties */}
            {selectedItem ? (
              <Card className={activeTool === 'trim' || activeTool === 'merge' ? 'mt-3' : ''}>
                <CardHeader className="py-2 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs capitalize flex items-center gap-2">
                      {selectedItem.type === 'blur' && <Square className="h-3.5 w-3.5" />}
                      {selectedItem.type === 'text' && <Type className="h-3.5 w-3.5" />}
                      {selectedItem.type === 'overlay' && <Layers className="h-3.5 w-3.5" />}
                      {selectedItem.type}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => removeItem(selectedItem.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-3">
                  {/* Time range */}
                  <div className="space-y-1">
                    <Label className="text-xs">Start Time</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[selectedItem.startTime]}
                        min={0}
                        max={duration}
                        step={0.01}
                        onValueChange={(val) => {
                          const v = Array.isArray(val) ? val[0] : val;
                          updateItem(selectedItem.id, { startTime: Math.min(v, selectedItem.endTime - 0.1) });
                        }}
                        className="flex-1"
                      />
                      <span className="text-[10px] font-mono w-14 text-right">
                        {formatTime(selectedItem.startTime).split('.')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">End Time</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[selectedItem.endTime]}
                        min={0}
                        max={duration}
                        step={0.01}
                        onValueChange={(val) => {
                          const v = Array.isArray(val) ? val[0] : val;
                          updateItem(selectedItem.id, { endTime: Math.max(v, selectedItem.startTime + 0.1) });
                        }}
                        className="flex-1"
                      />
                      <span className="text-[10px] font-mono w-14 text-right">
                        {formatTime(selectedItem.endTime).split('.')[0]}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Position */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">X</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedItem.x)}
                        onChange={(e) => updateItem(selectedItem.id, { x: Number(e.target.value) })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Y</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedItem.y)}
                        onChange={(e) => updateItem(selectedItem.id, { y: Number(e.target.value) })}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Width</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedItem.width)}
                        onChange={(e) => updateItem(selectedItem.id, { width: Number(e.target.value) })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Height</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedItem.height)}
                        onChange={(e) => updateItem(selectedItem.id, { height: Number(e.target.value) })}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>

                  {/* Text-specific properties */}
                  {selectedItem.type === 'text' && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <Label className="text-xs">Text</Label>
                        <Textarea
                          value={selectedItem.text || ''}
                          onChange={(e) => updateItem(selectedItem.id, { text: e.target.value })}
                          className="text-xs"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Font Size</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[selectedItem.fontSize || 24]}
                            min={8}
                            max={120}
                            step={1}
                            onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val; updateItem(selectedItem.id, { fontSize: v }); }}
                            className="flex-1"
                          />
                          <span className="text-[10px] font-mono w-8 text-right">
                            {selectedItem.fontSize || 24}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Color</Label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={selectedItem.color || '#ffffff'}
                              onChange={(e) => updateItem(selectedItem.id, { color: e.target.value })}
                              className="h-7 w-7 rounded border cursor-pointer"
                            />
                            <Input
                              value={selectedItem.color || '#ffffff'}
                              onChange={(e) => updateItem(selectedItem.id, { color: e.target.value })}
                              className="h-7 text-[10px] font-mono flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Background</Label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={selectedItem.backgroundColor || '#000000'}
                              onChange={(e) => updateItem(selectedItem.id, { backgroundColor: e.target.value })}
                              className="h-7 w-7 rounded border cursor-pointer"
                            />
                            <Input
                              value={selectedItem.backgroundColor || ''}
                              onChange={(e) => updateItem(selectedItem.id, { backgroundColor: e.target.value })}
                              className="h-7 text-[10px] font-mono flex-1"
                              placeholder="none"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Overlay-specific properties */}
                  {selectedItem.type === 'overlay' && selectedItem.overlayUrl && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <Label className="text-xs">Overlay Preview</Label>
                        <div className="bg-muted rounded aspect-video flex items-center justify-center overflow-hidden">
                          <video
                            src={selectedItem.overlayUrl}
                            className="max-w-full max-h-full"
                            muted
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className={cn(
                'text-center py-8',
                activeTool === 'trim' || activeTool === 'merge' ? 'mt-3' : ''
              )}>
                {activeTool === 'blur' && (
                  <>
                    <Square className="h-8 w-8 mx-auto text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Click and drag on the video to create a blur region.
                    </p>
                  </>
                )}
                {activeTool === 'text' && (
                  <>
                    <Type className="h-8 w-8 mx-auto text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Click on the video to add a text overlay.
                    </p>
                  </>
                )}
                {activeTool === 'overlay' && (
                  <>
                    <Layers className="h-8 w-8 mx-auto text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Upload a video to overlay on top.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={addOverlayItem}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      Upload
                    </Button>
                  </>
                )}
                {activeTool !== 'blur' && activeTool !== 'text' && activeTool !== 'overlay' && activeTool !== 'trim' && activeTool !== 'merge' && (
                  <p className="text-xs text-muted-foreground">
                    Select an item to edit its properties.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={overlayInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleOverlayFileChange}
      />

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Videos</DialogTitle>
            <DialogDescription>
              Add videos to concatenate with the current video. They will be appended in order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {mergeVideos.length === 0 ? (
              <div className="text-center py-4">
                <Merge className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground mt-2">No videos added yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mergeVideos.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Badge variant="secondary" className="text-[10px]">{i + 1}</Badge>
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1048576).toFixed(1)} MB
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeMergeVideo(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => mergeInputRef.current?.click()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Video File
            </Button>
            <input
              ref={mergeInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={handleMergeFileChange}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setMergeDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
