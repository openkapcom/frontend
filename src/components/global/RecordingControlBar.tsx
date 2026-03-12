import { Button } from '@/components/ui/button';
import { Pause, Play, Square, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { useState } from 'react';

interface RecordingControlBarProps {
  duration: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDiscard: () => void;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function RecordingControlBar({
  duration,
  isPaused,
  onPause,
  onResume,
  onStop,
  onDiscard,
}: RecordingControlBarProps) {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-lg">
          {/* Recording indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                isPaused ? 'bg-muted-foreground' : 'bg-red-500 animate-pulse'
              }`}
            />
            <span className="font-mono text-sm font-medium tabular-nums">
              {formatDuration(duration)}
            </span>
          </div>

          <div className="h-5 w-px bg-border" />

          {/* Pause / Resume */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={isPaused ? onResume : onPause}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </Button>

          {/* Stop */}
          <Button
            variant="default"
            size="icon-sm"
            onClick={onStop}
            title="Stop recording"
          >
            <Square className="size-3.5" />
          </Button>

          {/* Discard */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowDiscardConfirm(true)}
            title="Discard recording"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title="Discard recording?"
        description="This will permanently discard the current recording. This action cannot be undone."
        confirmLabel="Discard"
        cancelLabel="Keep recording"
        onConfirm={onDiscard}
        variant="destructive"
      />
    </>
  );
}
