import { useChannelStateContext, useChatContext } from "stream-chat-react";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router";

const CustomChannelHeader = () => {
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();
  const navigate = useNavigate();

  if (!channel) return null;

  const members = Object.values(channel.state.members);
  const otherMember = members.find(member => member.user.id !== client.user.id);
  
  if (!otherMember) return null;

  const isOnline = otherMember.user.online;
  const lastSeen = otherMember.user.last_active;

  const getStatusText = () => {
    if (isOnline) return "Online";
    if (lastSeen) {
      const now = new Date();
      const lastActive = new Date(lastSeen);
      const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
    return "Offline";
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate("/")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={otherMember.user.image || "/default-avatar.png"}
              alt={otherMember.user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {otherMember.user.name || "Unknown User"}
            </h3>
            <p className={`text-sm ${isOnline ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
          <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default CustomChannelHeader;
