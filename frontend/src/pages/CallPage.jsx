import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

let globalVideoClient = null;
let globalCallInstance = null;

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callDeclined, setCallDeclined] = useState(false);
  const isInitializedRef = useRef(false);

  const { authUser, isLoading } = useAuthUser();
  const navigate = useNavigate();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  const targetUserId = callId.split("-").find((id) => id !== authUser?._id);

  useEffect(() => {
    const initCall = async () => {
      if (
        !tokenData?.token ||
        !authUser?._id ||
        !authUser.fullName ||
        !callId ||
        isInitializedRef.current
      ) {
        return;
      }

      try {
        isInitializedRef.current = true;

        const user = {
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic,
        };

        console.log("Joining as:", user.id);
        console.log("Using token (first 10 chars):", tokenData.token?.slice(0, 10));

        if (!globalVideoClient || globalVideoClient.user?.id !== authUser._id) {
          if (globalVideoClient) {
            try {
              await globalVideoClient.disconnectUser();
            } catch (error) {
              console.log("Error disconnecting previous client:", error);
            }
          }

          globalVideoClient = new StreamVideoClient({
            apiKey: STREAM_API_KEY,
            user,
            token: tokenData.token,
          });
        }

        if (!globalCallInstance || globalCallInstance.id !== callId) {
          if (globalCallInstance) {
            try {
              await globalCallInstance.leave();
            } catch (error) {
              console.log("Error leaving previous call:", error);
            }
          }

          globalCallInstance = globalVideoClient.call("default", callId);
        }

        globalCallInstance.off("call.ended");
        globalCallInstance.off("call.rejected");
        globalCallInstance.off("call.joined");

        globalCallInstance.on("call.ended", () => {
          console.log("Call ended");
          cleanupCall();
          navigate(`/chat/${targetUserId}`);
        });

        globalCallInstance.on("call.rejected", () => {
          console.log("Call rejected");
          toast.error("Call was declined");
          setCallDeclined(true);
          setTimeout(() => {
            cleanupCall();
            navigate(`/chat/${targetUserId}`);
          }, 2000);
        });

        globalCallInstance.on("call.joined", (event) => {
          console.log("User joined the call:", event?.user?.id);
        });

        try {
          await globalCallInstance.join({ create: true });
          console.log("Joined call successfully");
        } catch (err) {
          console.error("Join failed", err);
          toast.error("Failed to join the call.");
          cleanupCall();
          navigate(`/chat/${targetUserId}`);
          return;
        }

        setClient(globalVideoClient);
        setCall(globalCallInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Could not join the call. Please try again.");
        setTimeout(() => {
          cleanupCall();
          navigate(`/chat/${targetUserId}`);
        }, 2000);
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
    return () => {};
  }, [tokenData, authUser, callId, navigate, targetUserId]);

  const cleanupCall = async () => {
    try {
      if (globalCallInstance) {
        const localParticipant = globalCallInstance.state.localParticipant;
        if (localParticipant) {
          const videoTracks = localParticipant.videoStream?.getTracks() || [];
          videoTracks.forEach((track) => track.stop());

          const audioTracks = localParticipant.audioStream?.getTracks() || [];
          audioTracks.forEach((track) => track.stop());
        }

        await globalCallInstance.leave();
        globalCallInstance = null;
      }

      if (globalVideoClient?.user?.id) {
        await globalVideoClient.disconnectUser();
        globalVideoClient = null;
      }

      isInitializedRef.current = false;
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupCall();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  if (!tokenData?.token || !authUser?._id) return null;

  if (isLoading || isConnecting) return <PageLoader />;

  if (callDeclined) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Call Declined</h2>
          <p className="text-gray-600 mb-4">The call was declined by the other party.</p>
          <p className="text-sm text-gray-500">Redirecting to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="relative w-full h-full">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent onLeave={cleanupCall} targetUserId={targetUserId} />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = ({ onLeave, targetUserId }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onLeave();
      navigate(`/chat/${targetUserId}`);
    }
  }, [callingState, navigate, onLeave, targetUserId]);

  if (callingState === CallingState.LEFT) return null;

  return (
    <StreamTheme>
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <SpeakerLayout />
        </div>
        <div className="p-4">
          <CallControls />
        </div>
      </div>
    </StreamTheme>
  );
};

export default CallPage;
