import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Monitor, AppWindow, Globe, Mic, Video, X } from 'lucide-react';
import { useRecording, type RecordingSource } from '@/hooks/useRecording';
import { RecordingControlBar } from '@/components/global/RecordingControlBar';

interface RecordingSetupPanelProps {
  open: boolean;
  onClose: () => void;
}

type SourceOption = {
  id: RecordingSource;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const SOURCE_OPTIONS: SourceOption[] = [
  {
    id: 'screen',
    label: 'Screen',
    description: 'Record your entire screen',
    icon: <Monitor className="size-6" />,
  },
  {
    id: 'window',
    label: 'Window',
    description: 'Record a specific window',
    icon: <AppWindow className="size-6" />,
  },
  {
    id: 'tab',
    label: 'Tab',
    description: 'Record a browser tab',
    icon: <Globe className="size-6" />,
  },
];

export function RecordingSetupPanel({ open, onClose }: RecordingSetupPanelProps) {
  const [selectedSource, setSelectedSource] = useState<RecordingSource>('screen');
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');

  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
  } = useRecording();

  // Fetch audio input devices
  useEffect(() => {
    async function fetchDevices() {
      try {
        // Request permission first to get labeled devices
        await navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
          s.getTracks().forEach((t) => t.stop());
        });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        setAudioDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedMic) {
          setSelectedMic(audioInputs[0].deviceId);
        }
      } catch {
        // Permission denied or not available
      }
    }

    if (open && micEnabled) {
      fetchDevices();
    }
  }, [open, micEnabled, selectedMic]);

  const handleStartRecording = async () => {
    try {
      await startRecording(selectedSource);
      onClose();
    } catch {
      // User cancelled or error - stay on setup panel
    }
  };

  const handleStop = async () => {
    await stopRecording();
  };

  const handleDiscard = async () => {
    await discardRecording();
  };

  // Show control bar if recording (even when panel is closed)
  if (isRecording) {
    return (
      <RecordingControlBar
        duration={duration}
        isPaused={isPaused}
        onPause={pauseRecording}
        onResume={resumeRecording}
        onStop={handleStop}
        onDiscard={handleDiscard}
      />
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-3 top-3"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold">New Recording</h2>
          <p className="text-sm text-muted-foreground">
            Choose what you want to record
          </p>
        </div>

        {/* Source selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">Source</label>
          <div className="grid grid-cols-3 gap-3">
            {SOURCE_OPTIONS.map((source) => (
              <Card
                key={source.id}
                className={`cursor-pointer transition-colors ${
                  selectedSource === source.id
                    ? 'ring-2 ring-primary'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedSource(source.id)}
              >
                <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
                  <span
                    className={
                      selectedSource === source.id
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }
                  >
                    {source.icon}
                  </span>
                  <span className="text-sm font-medium">{source.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {source.description}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Audio settings */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Microphone</span>
            </div>
            <Switch
              checked={micEnabled}
              onCheckedChange={setMicEnabled}
            />
          </div>

          {micEnabled && audioDevices.length > 0 && (
            <Select value={selectedMic} onValueChange={(val) => setSelectedMic(val ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {audioDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Camera</span>
            </div>
            <Switch
              checked={cameraEnabled}
              onCheckedChange={setCameraEnabled}
            />
          </div>
        </div>

        {/* Start button */}
        <Button className="w-full" size="lg" onClick={handleStartRecording}>
          Start Recording
        </Button>
      </div>
    </div>
  );
}
