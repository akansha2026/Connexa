import { StopCircle, X } from "lucide-react";
import { Button } from "./ui/button";

interface VoiceRecordingProps {
  recordingTime: string;
  onStop: () => void;
  onCancel: () => void;
}

export const VoiceRecordingInterface = ({
  recordingTime,
  onStop,
  onCancel,
}: VoiceRecordingProps) => {
  return (
    <div className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-950/20 rounded-xl px-4 py-2 shadow-sm">
      
      {/* Recording indicator */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-xs font-mono text-red-600 dark:text-red-400">
          {recordingTime}
        </span>
      </div>

      {/* Status text */}
      <div className="flex-1 text-center">
        <span className="text-sm text-muted-foreground">
          Recording...
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 w-8 p-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
        >
          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onStop}
          className="h-8 w-8 p-0 rounded-full bg-red-600 hover:bg-red-700"
        >
          <StopCircle className="h-4 w-4 text-white" />
        </Button>
      </div>
    </div>
  );
};