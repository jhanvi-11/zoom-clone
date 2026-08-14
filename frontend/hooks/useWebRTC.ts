import { useEffect, useRef, useState } from "react";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useWebRTC(
  localStream: MediaStream | null,
  meetingId: string,
  participantId: number,
  sendMessage: (msg: any) => void,
  lastMessage: any
) {
  const peersRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<number, RTCIceCandidateInit[]>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>({});

  const addStreamToState = (id: number, stream: MediaStream) => {
    setRemoteStreams((prev) => ({ ...prev, [id]: stream }));
  };

  const removeStreamFromState = (id: number) => {
    setRemoteStreams((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const getOrCreatePeer = (remoteId: number) => {
    if (peersRef.current.has(remoteId)) {
      return peersRef.current.get(remoteId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(remoteId, pc);
    pendingCandidatesRef.current.set(remoteId, []);

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: "ice-candidate",
          candidate: event.candidate,
          to: remoteId,
          from: participantId,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        addStreamToState(remoteId, event.streams[0]);
      }
    };

    return pc;
  };

  useEffect(() => {
    if (!lastMessage) return;

    const handleMessage = async () => {
      const { type, participant_id, from, to, sdp, candidate } = lastMessage;

      // Ensure the message is directed to us (if it's a directed message)
      if (to && to !== participantId) return;

      if (type === "participant-joined") {
        const remoteId = participant_id;
        if (remoteId === participantId) return;

        const pc = getOrCreatePeer(remoteId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendMessage({
          type: "offer",
          sdp: offer,
          to: remoteId,
          from: participantId,
        });
      } else if (type === "offer") {
        const remoteId = from;
        const pc = getOrCreatePeer(remoteId);
        
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        sendMessage({
          type: "answer",
          sdp: answer,
          to: remoteId,
          from: participantId,
        });

        // Flush pending candidates
        const pending = pendingCandidatesRef.current.get(remoteId) || [];
        for (const c of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidatesRef.current.set(remoteId, []);

      } else if (type === "answer") {
        const remoteId = from;
        const pc = getOrCreatePeer(remoteId);
        
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        
        // Flush pending candidates
        const pending = pendingCandidatesRef.current.get(remoteId) || [];
        for (const c of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidatesRef.current.set(remoteId, []);

      } else if (type === "ice-candidate") {
        const remoteId = from;
        const pc = getOrCreatePeer(remoteId);
        
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // Queue candidate
          const pending = pendingCandidatesRef.current.get(remoteId) || [];
          pending.push(candidate);
          pendingCandidatesRef.current.set(remoteId, pending);
        }
      } else if (type === "participant-left") {
        const remoteId = participant_id;
        const pc = peersRef.current.get(remoteId);
        if (pc) {
          pc.close();
          peersRef.current.delete(remoteId);
          pendingCandidatesRef.current.delete(remoteId);
        }
        removeStreamFromState(remoteId);
      }
    };

    handleMessage().catch(console.error);
  }, [lastMessage, participantId]); // intentionally omitting localStream to avoid re-triggering on stream state updates

  const cleanup = () => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();
    setRemoteStreams({});
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return { remoteStreams, cleanup };
}
