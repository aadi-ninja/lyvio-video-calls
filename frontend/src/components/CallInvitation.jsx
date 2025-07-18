import { Phone, PhoneOff, Video } from "lucide-react";

const CallInvitation = ({ callerName, callerImage, onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="mb-4">
            <img
              src={callerImage || "/default-avatar.png"}
              alt={callerName}
              className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-blue-500"
            />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
            {callerName}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Incoming video call...
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onDecline}
              className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors duration-200 shadow-lg"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={onAccept}
              className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-colors duration-200 shadow-lg"
            >
              <Video size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallInvitation;
