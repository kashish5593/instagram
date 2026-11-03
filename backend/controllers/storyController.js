const Story = require('../models/storyModel');
const User = require('../models/userModel');
const catchAsync = require('../middlewares/catchAsync');
const ErrorHandler = require('../utils/errorHandler');
const { deleteFile } = require('../utils/awsFunctions');

const DAY = 24 * 60 * 60 * 1000;

// Create New Story
exports.newStory = catchAsync(async (req, res, next) => {

    if (!req.file) {
        return next(new ErrorHandler("Please select an image", 400));
    }

    const story = await Story.create({
        image: req.file.location,
        postedBy: req.user._id,
    });

    res.status(201).json({
        success: true,
        story,
    });
});

// Get Stories -- of logged in user + users they follow, grouped by user
exports.getStories = catchAsync(async (req, res, next) => {

    const me = await User.findById(req.user._id);

    const stories = await Story.find({
        postedBy: { $in: [...me.following, me._id] },
        createdAt: { $gte: new Date(Date.now() - DAY) },
    }).populate("postedBy", "username name avatar").sort({ createdAt: 1 });

    const groups = new Map();

    stories.forEach((s) => {
        if (!s.postedBy) return;
        const key = s.postedBy._id.toString();
        if (!groups.has(key)) {
            groups.set(key, { user: s.postedBy, stories: [] });
        }
        groups.get(key).stories.push({
            _id: s._id,
            image: s.image,
            createdAt: s.createdAt,
            viewed: s.viewers.some((id) => id.toString() === req.user._id.toString()),
            // only the owner can see who viewed
            viewers: key === req.user._id.toString() ? s.viewers.length : undefined,
        });
    });

    const result = [...groups.values()].map((g) => ({
        ...g,
        allViewed: g.stories.every((s) => s.viewed),
        latest: g.stories[g.stories.length - 1].createdAt,
    }));

    // own stories first, then unseen, then seen (newest first inside each bucket)
    const myId = req.user._id.toString();
    result.sort((a, b) => {
        const aMine = a.user._id.toString() === myId;
        const bMine = b.user._id.toString() === myId;
        if (aMine !== bMine) return aMine ? -1 : 1;
        if (a.allViewed !== b.allViewed) return a.allViewed ? 1 : -1;
        return new Date(b.latest) - new Date(a.latest);
    });

    res.status(200).json({
        success: true,
        stories: result,
    });
});

// Mark Story As Viewed
exports.viewStory = catchAsync(async (req, res, next) => {

    const story = await Story.findById(req.params.id);

    if (!story) {
        return next(new ErrorHandler("Story Not Found", 404));
    }

    if (story.postedBy.toString() !== req.user._id.toString() &&
        !story.viewers.some((id) => id.toString() === req.user._id.toString())) {
        story.viewers.push(req.user._id);
        await story.save();
    }

    res.status(200).json({
        success: true,
    });
});

// Get Viewers Of A Story -- owner only
exports.getStoryViewers = catchAsync(async (req, res, next) => {

    const story = await Story.findById(req.params.id).populate("viewers", "username name avatar");

    if (!story) {
        return next(new ErrorHandler("Story Not Found", 404));
    }

    if (story.postedBy.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized", 401));
    }

    res.status(200).json({
        success: true,
        viewers: story.viewers,
    });
});

// Delete Story
exports.deleteStory = catchAsync(async (req, res, next) => {

    const story = await Story.findById(req.params.id);

    if (!story) {
        return next(new ErrorHandler("Story Not Found", 404));
    }

    if (story.postedBy.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized", 401));
    }

    try {
        await deleteFile(story.image);
    } catch (err) {
        // file may already be gone from storage, still remove the story
    }

    await story.remove();

    res.status(200).json({
        success: true,
        message: "Story Deleted"
    });
});
