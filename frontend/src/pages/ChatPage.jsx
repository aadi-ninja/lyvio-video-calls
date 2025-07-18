import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import CallInvitation from "../components/CallInvitation";
import CustomChannelHeader from "../components/CustomChannelHeader";
import CustomMessage from "../components/CustomMessage";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const navigate = useNavigate();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [incomingCall, setIncomingCall] = useState(null);

  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        console.log("Initializing stream chat client...");
        const client = StreamChat.getInstance(STREAM_API_KEY);

        if (!client.user || client.user.id !== authUser._id) {
          await client.connectUser(
            {
              id: authUser._id,
              name: authUser.fullName,
              image: authUser.profilePic,
            },
            tokenData.token
          );
        }

        const channelId = [authUser._id, targetUserId].sort().join("-");
        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();
        currChannel.off("message.new");

        currChannel.on("message.new", (event) => {
          const message = event.message;
          if (message?.attachments?.length > 0) {
            const attachment = message.attachments[0];
            if (attachment.type === "call_invitation") {
              if (
                attachment.receiver_id === authUser._id &&
                attachment.caller_id !== authUser._id
              ) {
                setIncomingCall({
                  callId: attachment.call_id,
                  callerName: attachment.caller_name,
                  callerImage: attachment.caller_image,
                  messageId: message.id,
                  channel: currChannel,
                });
              }
            }
          }
        });

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (channel) {
        channel.off("message.new");
      }
    };
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = async () => {
    if (channel) {
      const callId = [authUser._id, targetUserId].sort().join("-");
      try {
        await channel.sendMessage({
          text: `${authUser.fullName} is calling you...`,
          attachments: [
            {
              type: "call_invitation",
              call_id: callId,
              caller_id: authUser._id,
              caller_name: authUser.fullName,
              caller_image: authUser.profilePic,
              receiver_id: targetUserId,
              status: "pending",
            },
          ],
        });

        toast.success("Call invitation sent!");
        navigate(`/call/${callId}`);
      } catch (error) {
        console.error("Error sending call invitation:", error);
        toast.error("Failed to send call invitation");
      }
    }
  };

  const handleAcceptCall = async () => {
    if (incomingCall) {
      try {
        await incomingCall.channel.sendMessage({
          text: "Call accepted",
          attachments: [
            {
              type: "call_response",
              call_id: incomingCall.callId,
              responder_id: authUser._id,
              status: "accepted",
            },
          ],
        });
        navigate(`/call/${incomingCall.callId}`);
        setIncomingCall(null);
      } catch (error) {
        console.error("Error accepting call:", error);
        toast.error("Failed to accept call");
      }
    }
  };

  const handleDeclineCall = async () => {
    if (incomingCall) {
      try {
        await incomingCall.channel.sendMessage({
          text: "Call declined",
          attachments: [
            {
              type: "call_response",
              call_id: incomingCall.callId,
              responder_id: authUser._id,
              status: "declined",
            },
          ],
        });
        setIncomingCall(null);
        toast.info("Call declined");
      } catch (error) {
        console.error("Error declining call:", error);
        toast.error("Failed to decline call");
      }
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel} Message={CustomMessage}>
          <Window>
            <div className="relative">
              <CustomChannelHeader />
              <div className="absolute right-5 top-4">
                <CallButton handleVideoCall={handleVideoCall} />
              </div>
            </div>
            <MessageList Message={CustomMessage} />
            <MessageInput focus />
          </Window>
          <Thread />
        </Channel>
      </Chat>

      {incomingCall && (
        <CallInvitation
          callerName={incomingCall.callerName}
          callerImage={incomingCall.callerImage}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}
    </div>
  );
};

export default ChatPage;