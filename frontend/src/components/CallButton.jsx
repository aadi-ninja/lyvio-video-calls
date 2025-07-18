import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall }) {
  return (
    <button
      onClick={handleVideoCall}
      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white p-3 rounded-full shadow-lg transition-all"
    >
      <VideoIcon className="w-6 h-6" />
    </button>
  );
}

export default CallButton;
