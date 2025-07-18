import { Phone, PhoneOff, Video, User } from "lucide-react";
import { MessageSimple } from "stream-chat-react";

const CustomMessage = (props) => {
  const { message } = props;

  if (!message) return <MessageSimple {...props} />;

  const callInvitation = message.attachments?.find(
    (a) => a.type === "call_invitation"
  );

  const callResponse = message.attachments?.find(
    (a) => a.type === "call_response"
  );

  if (callInvitation || (message.text && message.text.includes("is calling you"))) {
    const callerName =
      callInvitation?.caller_name ||
      message.user?.name ||
      "Unknown";

    const callerImage =
      callInvitation?.caller_image || message.user?.image;

    return (
      <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-500 text-white shadow-md my-2 max-w-xs">
        <div className="relative">
          {callerImage ? (
            <img
              src={callerImage}
              alt={callerName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="text-white w-5 h-5" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
            <Video className="text-blue-600 w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="font-semibold">{callerName}</p>
          <p className="text-sm">Video Call Invitation</p>
        </div>
      </div>
    );
  }

  if (callResponse || (message.text && /Call accepted|Call declined/i.test(message.text))) {
    const isAccepted =
      callResponse?.status === "accepted" || message.text?.toLowerCase().includes("accepted");

    const isDeclined =
      callResponse?.status === "declined" || message.text?.toLowerCase().includes("declined");

    const responderName = message.user?.name || "Someone";
    const responderImage = message.user?.image;

    return (
      <div
        className={`flex items-center gap-4 p-4 rounded-lg ${
          isAccepted ? "bg-green-500" : "bg-red-500"
        } text-white shadow-md my-2 max-w-xs`}
      >
        <div className="relative">
          {responderImage ? (
            <img
              src={responderImage}
              alt={responderName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="text-white w-5 h-5" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
            {isAccepted ? (
              <Phone className="text-green-600 w-4 h-4" />
            ) : (
              <PhoneOff className="text-red-600 w-4 h-4" />
            )}
          </div>
        </div>
        <div>
          <p className="font-semibold">{responderName}</p>
          <p className="text-sm">
            {isAccepted ? "Joined the Call" : "Declined the Call"}
          </p>
        </div>
      </div>
    );
  }

  return <MessageSimple {...props} />;
};

export default CustomMessage;