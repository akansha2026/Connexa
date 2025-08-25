import { useRef, useState } from "react";
import { toast } from "sonner";

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        // Handle voice message file here
        toast.success("Voice message recorded!");
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Update recording time
      recordingTimeoutRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success("Recording started...");
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingTimeoutRef.current) {
        clearInterval(recordingTimeoutRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingTimeoutRef.current) {
        clearInterval(recordingTimeoutRef.current);
      }
      
      toast.info("Recording cancelled");
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    recordingTime: formatRecordingTime(recordingTime),
    startRecording,
    stopRecording,
    cancelRecording,
  };
};