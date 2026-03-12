import { useState, useRef, useCallback, useEffect } from 'react';
import { streamService } from '@/services/streamService';

export type RecordingSource = 'screen' | 'window' | 'tab';

interface UseRecordingReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  startRecording: (source: RecordingSource) => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<number | null>;
  discardRecording: () => Promise<void>;
}

export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const chunkIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Duration timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    sessionIdRef.current = null;
    chunkIndexRef.current = 0;
    chunksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
  }, []);

  const uploadPendingChunks = useCallback(async () => {
    if (!sessionIdRef.current || chunksRef.current.length === 0) return;

    const pendingChunks = [...chunksRef.current];
    chunksRef.current = [];

    for (const chunk of pendingChunks) {
      try {
        await streamService.uploadChunk(
          sessionIdRef.current!,
          chunk,
          chunkIndexRef.current
        );
        chunkIndexRef.current += 1;
      } catch (error) {
        console.error('Failed to upload chunk:', error);
      }
    }
  }, []);

  const startRecording = useCallback(
    async (source: RecordingSource) => {
      try {
        // Get display media based on source
        const displayMediaOptions: DisplayMediaStreamOptions = {
          video: true,
          audio: true,
        };

        // Different browsers may handle source hints differently
        // Chrome supports displaySurface preference
        if (source === 'window') {
          (displayMediaOptions.video as MediaTrackConstraints) = {
            displaySurface: 'window' as unknown as ConstrainDOMString,
          };
        } else if (source === 'tab') {
          (displayMediaOptions.video as MediaTrackConstraints) = {
            displaySurface: 'browser' as unknown as ConstrainDOMString,
          };
        } else {
          (displayMediaOptions.video as MediaTrackConstraints) = {
            displaySurface: 'monitor' as unknown as ConstrainDOMString,
          };
        }

        const stream =
          await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        streamRef.current = stream;

        // Handle user stopping via browser UI
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          if (mediaRecorderRef.current?.state !== 'inactive') {
            stopRecording();
          }
        });

        // Start backend session
        const { session_id } = await streamService.startSession();
        sessionIdRef.current = session_id;

        // Determine codec
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
            ? 'video/webm;codecs=vp8'
            : 'video/webm';

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 2500000,
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        // Start recording with 1-second timeslice for chunked data
        mediaRecorder.start(1000);

        // Upload chunks every second
        uploadIntervalRef.current = setInterval(uploadPendingChunks, 1000);

        setIsRecording(true);
        setIsPaused(false);
        setDuration(0);
        chunkIndexRef.current = 0;
      } catch (error) {
        console.error('Failed to start recording:', error);
        cleanup();
        throw error;
      }
    },
    [cleanup, uploadPendingChunks]
  );

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<number | null> => {
    if (!mediaRecorderRef.current || !sessionIdRef.current) return null;

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current!;
      const sessionId = sessionIdRef.current!;

      recorder.onstop = async () => {
        // Upload any remaining chunks
        await uploadPendingChunks();

        try {
          const { video_id } = await streamService.completeSession(sessionId);
          cleanup();
          resolve(video_id);
        } catch (error) {
          console.error('Failed to complete session:', error);
          cleanup();
          resolve(null);
        }
      };

      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    });
  }, [cleanup, uploadPendingChunks]);

  const discardRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (sessionIdRef.current) {
      try {
        await streamService.cancelSession(sessionIdRef.current);
      } catch (error) {
        console.error('Failed to cancel session:', error);
      }
    }

    cleanup();
  }, [cleanup]);

  return {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
  };
}
