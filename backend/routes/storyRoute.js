const express = require('express');
const { newStory, getStories, viewStory, getStoryViewers, deleteStory } = require('../controllers/storyController');
const { isAuthenticated } = require('../middlewares/auth');
// stories reuse the post upload config so they land in the same (already public) S3 folder
const { uploadPost } = require('../utils/awsFunctions');

const router = express();

router.route("/story/new").post(isAuthenticated, uploadPost.single('story'), newStory);

router.route("/stories").get(isAuthenticated, getStories);

router.route("/story/:id/view").put(isAuthenticated, viewStory);

router.route("/story/:id/viewers").get(isAuthenticated, getStoryViewers);

router.route("/story/:id").delete(isAuthenticated, deleteStory);

module.exports = router;
