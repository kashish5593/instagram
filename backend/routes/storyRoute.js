const express = require('express');
const { newStory, getStories, viewStory, getStoryViewers, deleteStory } = require('../controllers/storyController');
const { isAuthenticated } = require('../middlewares/auth');
const { uploadStory } = require('../utils/awsFunctions');

const router = express();

router.route("/story/new").post(isAuthenticated, uploadStory.single('story'), newStory);

router.route("/stories").get(isAuthenticated, getStories);

router.route("/story/:id/view").put(isAuthenticated, viewStory);

router.route("/story/:id/viewers").get(isAuthenticated, getStoryViewers);

router.route("/story/:id").delete(isAuthenticated, deleteStory);

module.exports = router;
