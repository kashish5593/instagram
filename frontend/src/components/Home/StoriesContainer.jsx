import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import StoryViewer from "./StoryViewer";

const MAX_SIZE = 5 * 1024 * 1024;

const StoriesContainer = () => {

    const { user } = useSelector((state) => state.user);

    const [groups, setGroups] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(null);
    const fileInput = useRef(null);

    const loadStories = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/v1/stories');
            setGroups(data.stories);
        } catch (err) {
            // stories are optional, the feed still works without them
        }
    }, []);

    useEffect(() => {
        loadStories();
    }, [loadStories]);

    const handleFile = async (e) => {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image");
            return;
        }
        if (file.size > MAX_SIZE) {
            toast.error("Image must be smaller than 5MB");
            return;
        }

        const formData = new FormData();
        formData.set("story", file);

        setUploading(true);
        try {
            await axios.post('/api/v1/story/new', formData);
            toast.success("Story Added");
            await loadStories();
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not add story");
        } finally {
            setUploading(false);
        }
    }

    // flag a story as seen locally so the ring turns grey right away
    const handleViewed = useCallback((storyId) => {
        setGroups((prev) => prev.map((g) => {
            const stories = g.stories.map((s) => s._id === storyId ? { ...s, viewed: true } : s);
            return { ...g, stories, allViewed: stories.every((s) => s.viewed) };
        }));
    }, []);

    const handleDeleted = () => {
        setViewerIndex(null);
        loadStories();
    }

    const myIndex = groups.findIndex((g) => g.user._id === user._id);
    const myGroup = myIndex === -1 ? null : groups[myIndex];

    const settings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 7.5,
        slidesToScroll: 3,
        responsive: [
            {
                breakpoint: 1050,
                settings: {
                    slidesToShow: 5,
                    slidesToScroll: 3
                }
            },
            {
                breakpoint: 400,
                settings: {
                    slidesToShow: 4,
                    slidesToScroll: 2
                }
            }
        ]
    };

    const ring = (viewed) => viewed ? "border-gray-300" : "border-red-500";

    return (
        <>
            <input type="file" accept="image/*" ref={fileInput} onChange={handleFile} className="hidden" />

            <Slider {...settings} className="w-full bg-white pt-2.5 pb-1 px-2.5 flex overflow-hidden border rounded">

                {/* your story: view it, or add one */}
                <div className="flex flex-col text-center justify-center items-center p-2 cursor-pointer">
                    <div className="relative">
                        <button
                            onClick={() => myGroup ? setViewerIndex(myIndex) : fileInput.current.click()}
                            className={`w-16 h-16 p-[1px] rounded-full border-2 ${myGroup ? ring(myGroup.allViewed) : 'border-transparent'}`}
                            aria-label="Your story"
                        >
                            <img loading="lazy" className="rounded-full h-full w-full border border-gray-300 object-cover" src={user.avatar} draggable="false" alt="your story" />
                        </button>
                        <button
                            onClick={() => fileInput.current.click()}
                            disabled={uploading}
                            aria-label="Add to your story"
                            className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary-blue text-white text-sm leading-none flex items-center justify-center border-2 border-white disabled:opacity-60"
                        >
                            {uploading ? '…' : '+'}
                        </button>
                    </div>
                    <span className="text-xs mt-0.5">{uploading ? 'Uploading...' : 'Your story'}</span>
                </div>

                {/* stories of the people you follow */}
                {groups.map((g, i) => ({ g, i })).filter(({ g }) => g.user._id !== user._id).map(({ g, i }) => (
                    <div onClick={() => setViewerIndex(i)} className="flex flex-col text-center justify-center items-center p-2 cursor-pointer" key={g.user._id}>
                        <div className={`w-16 p-[1px] h-16 rounded-full border-2 ${ring(g.allViewed)}`}>
                            <img loading="lazy" className="rounded-full h-full w-full border border-gray-300 object-cover" src={g.user.avatar} draggable="false" alt="story" />
                        </div>
                        <span className="text-xs max-w-[4rem] truncate">{g.user.username}</span>
                    </div>
                ))}

            </Slider>

            {viewerIndex !== null && groups[viewerIndex] &&
                <StoryViewer
                    groups={groups}
                    startGroup={viewerIndex}
                    onClose={() => setViewerIndex(null)}
                    onViewed={handleViewed}
                    onDeleted={handleDeleted}
                />
            }
        </>
    )
}

export default StoriesContainer
