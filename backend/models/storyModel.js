const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    viewers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
    // stories disappear after 24 hours (MongoDB TTL index removes the document)
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24,
    }
});

module.exports = mongoose.model("Story", storySchema);
