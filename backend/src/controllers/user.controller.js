import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";


export async function getRecommendedUsers(req, res) {
  try{
    const currentUserId = req.user._id;
    const currentUser = req.user;
    const recommendedUsers = await User.find({
        $and: [
            { _id: { $ne: currentUserId } },
            { _id: { $nin: currentUser.friends } },
            { isOnboarded: true }
        ]
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error fetching recommended users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getMyFriends(req, res) {
    try{
        const user = await User.findById(req.user._id).select("friends").populate("friends", "fullName profilePic nativeLanguage learningLanguage ");

        res.status(200).json(user.friends);
    } catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function sendFriendRequest(req, res) {
    try{
        const myId = req.user._id;
        const {id : recipientId} = req.params;
        if (myId === recipientId) {
            return res.status(400).json({ error: "You cannot send a friend request to yourself." });
        }
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ error: "Recipient not found." });
        }

        if (recipient.friends.includes(myId)) {
            return res.status(400).json({ error: "You are already friends with this user." });
        }
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: myId, recipient: recipientId },
                { sender: recipientId, recipient: myId }
            ]
        });
        if (existingRequest) {
            return res.status(400).json({ error: "Friend request already sent." });
        }

        const friendRequest = await FriendRequest.create({
            sender: myId,
            recipient: recipientId
        });
    

        res.status(201).json(friendRequest);
    } catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function acceptFriendRequest(req, res) {
    try {
        const { id: requestId } = req.params;
        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ error: "Friend request not found." });
        }

        if (friendRequest.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "You can only accept requests sent to you." });
        }

        friendRequest.status = "accepted";
        await friendRequest.save();

        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: { friends: friendRequest.recipient }
        });

        await User.findByIdAndUpdate(friendRequest.recipient, {
            $addToSet: { friends: friendRequest.sender }
        });

        res.status(200).json({ message: "Friend request accepted." });
    } catch (error) {
        console.error("Error accepting friend request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


export async function getFriendRequests(req, res) {
    try {
        const incomingRequests = await FriendRequest.find({
            recipient: req.user._id,
            status: "pending"
        }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

        const acceptedReqs = await FriendRequest.find({
            sender: req.user._id,
            status: "accepted"
        }).populate("recipient", "fullName profilePic ");

        res.status(200).json({
            incomingReqs: incomingRequests,  // <-- ✅ FIXED THIS
            acceptedReqs
        });
    } catch (error) {
        console.error("Error fetching friend requests:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


export async function getOutgoingFriendReqs(req, res) {
    try{
        const outgoingRequests = await FriendRequest.find({
            sender: req.user._id,
            status: "pending"
        }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

        res.status(200).json(outgoingRequests);
    } catch (error) {
        console.error("Error fetching outgoing friend requests:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}