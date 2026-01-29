import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type BloodRequest = Database["public"]["Tables"]["blood_requests"]["Row"];

interface UseRealtimeNotificationsProps {
  profileId: string | null;
  isDonor: boolean;
  onNewRequest?: (request: BloodRequest) => void;
  onRequestUpdate?: (request: BloodRequest) => void;
}

// Create a buzzer sound using Web Audio API
const playBuzzerSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator for buzzer effect
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Buzzer-like sound - alternating frequencies
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Clean up
    setTimeout(() => {
      audioContext.close();
    }, 600);
  } catch (error) {
    console.warn("Could not play notification sound:", error);
  }
};

// Play a more urgent alarm for critical requests
const playUrgentAlarm = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playBeep = (startTime: number, frequency: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      
      gainNode.gain.setValueAtTime(0.4, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    };
    
    // Three urgent beeps
    playBeep(audioContext.currentTime, 1000);
    playBeep(audioContext.currentTime + 0.2, 1200);
    playBeep(audioContext.currentTime + 0.4, 1400);
    playBeep(audioContext.currentTime + 0.7, 1000);
    playBeep(audioContext.currentTime + 0.9, 1200);
    playBeep(audioContext.currentTime + 1.1, 1400);
    
    setTimeout(() => {
      audioContext.close();
    }, 1500);
  } catch (error) {
    console.warn("Could not play urgent alarm:", error);
  }
};

export const useRealtimeNotifications = ({
  profileId,
  isDonor,
  onNewRequest,
  onRequestUpdate,
}: UseRealtimeNotificationsProps) => {
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const handleNewRequest = useCallback(
    async (payload: { new: BloodRequest }) => {
      const request = payload.new;
      
      // For donors: notify when they receive a new request
      if (isDonor && request.donor_id === profileId && request.status === "pending") {
        // Play sound based on urgency
        if (request.urgency === "critical") {
          playUrgentAlarm();
        } else {
          playBuzzerSound();
        }
        
        toast.error(
          `🩸 New ${request.urgency?.toUpperCase()} Blood Request!`,
          {
            description: `Someone needs ${request.blood_group} blood urgently!`,
            duration: 10000,
            action: {
              label: "View",
              onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
            },
          }
        );
        
        onNewRequest?.(request);
      }
    },
    [profileId, isDonor, onNewRequest]
  );

  const handleRequestUpdate = useCallback(
    async (payload: { new: BloodRequest; old: BloodRequest }) => {
      const newRequest = payload.new;
      const oldRequest = payload.old;
      
      // For patients: notify when their request status changes
      if (!isDonor && newRequest.patient_id === profileId) {
        if (oldRequest.status === "pending" && newRequest.status === "accepted") {
          playBuzzerSound();
          toast.success("🎉 Your blood request has been ACCEPTED!", {
            description: "The donor has agreed to help. Contact details are now available.",
            duration: 10000,
          });
        } else if (oldRequest.status === "pending" && newRequest.status === "declined") {
          toast.info("A donor has declined your request", {
            description: "Don't worry, we're still looking for other donors.",
            duration: 5000,
          });
        }
        
        onRequestUpdate?.(newRequest);
      }
      
      // For donors: notify about their own actions
      if (isDonor && newRequest.donor_id === profileId) {
        if (oldRequest.status !== newRequest.status) {
          onRequestUpdate?.(newRequest);
        }
      }
    },
    [profileId, isDonor, onRequestUpdate]
  );

  useEffect(() => {
    if (!profileId) return;

    // Subscribe to blood_requests changes
    const channel = supabase
      .channel(`blood-requests-${profileId}`)
      .on<BloodRequest>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "blood_requests",
        },
        (payload) => handleNewRequest({ new: payload.new as BloodRequest })
      )
      .on<BloodRequest>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "blood_requests",
        },
        (payload) => handleRequestUpdate({ 
          new: payload.new as BloodRequest, 
          old: payload.old as BloodRequest 
        })
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime notifications active");
        }
      });

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [profileId, handleNewRequest, handleRequestUpdate]);

  return {
    playBuzzerSound,
    playUrgentAlarm,
  };
};
