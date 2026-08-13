import { useState, useEffect, useRef } from "react";

export function useLocalMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track cleanup
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function setupMedia() {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(userStream);
        streamRef.current = userStream;
      } catch (err) {
        console.error("Error accessing media devices.", err);
        setError("Camera/Microphone unavailable");
      }
    }
    setupMedia();

    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const newMicState = !micOn;
        audioTracks[0].enabled = newMicState;
        setMicOn(newMicState);
      }
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const newCameraState = !cameraOn;
        videoTracks[0].enabled = newCameraState;
        setCameraOn(newCameraState);
      }
    }
  };

  const stopAllMedia = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  return { stream, cameraOn, micOn, toggleMic, toggleCamera, stopAllMedia, error };
}
