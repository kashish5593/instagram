import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'
import moment from 'moment'
import UsersDialog from '../Layouts/UsersDialog'

const DURATION = 5000; // ms each story stays on screen

const StoryViewer = ({ groups, startGroup, onClose, onViewed, onDeleted }) => {

    const { user: me } = useSelector((state) => state.user);

    const [gi, setGi] = useState(startGroup);
    const [si, setSi] = useState(() => {
        // start on the first unseen story of the group (or the first one)
        const idx = groups[startGroup].stories.findIndex((s) => !s.viewed);
        return idx === -1 ? 0 : idx;
    });
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [loadedId, setLoadedId] = useState(null);
    const [failedId, setFailedId] = useState(null);
    const [viewersOpen, setViewersOpen] = useState(false);
    const [viewers, setViewers] = useState([]);
    const [deleting, setDeleting] = useState(false);

    const progressRef = useRef(0);
    const holdRef = useRef(0);

    const group = groups[gi];
    const story = group?.stories[si];
    const isMine = group?.user._id === me._id;
    const loaded = !!story && loadedId === story._id;

    const goNext = useCallback(() => {
        const g = groups[gi];
        if (si < g.stories.length - 1) {
            setSi(si + 1);
        } else if (gi < groups.length - 1) {
            setGi(gi + 1);
            const next = groups[gi + 1].stories.findIndex((s) => !s.viewed);
            setSi(next === -1 ? 0 : next);
        } else {
            onClose();
        }
    }, [groups, gi, si, onClose]);

    const goPrev = useCallback(() => {
        if (si > 0) {
            setSi(si - 1);
        } else if (gi > 0) {
            setGi(gi - 1);
            setSi(0);
        } else {
            // restart the first story
            progressRef.current = 0;
            setProgress(0);
        }
    }, [gi, si]);

    // reset the bar whenever the story changes
    useEffect(() => {
        progressRef.current = 0;
        setProgress(0);
    }, [gi, si]);

    // mark as viewed
    useEffect(() => {
        if (!story || isMine || story.viewed) return;
        axios.put(`/api/v1/story/${story._id}/view`).catch(() => { });
        onViewed(story._id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [story?._id]);

    // progress timer
    useEffect(() => {
        if (paused || !loaded || viewersOpen || !story) return;
        const startedAt = Date.now() - (progressRef.current / 100) * DURATION;
        const id = setInterval(() => {
            const p = Math.min(100, ((Date.now() - startedAt) / DURATION) * 100);
            progressRef.current = p;
            setProgress(p);
            if (p >= 100) {
                clearInterval(id);
                goNext();
            }
        }, 40);
        return () => clearInterval(id);
    }, [paused, loaded, viewersOpen, story, goNext]);

    // keyboard controls
    useEffect(() => {
        const onKey = (e) => {
            if (viewersOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goNext, goPrev, onClose, viewersOpen]);

    // lock page scroll while open
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    const holdStart = () => {
        holdRef.current = Date.now();
        setPaused(true);
    }

    const holdEnd = () => {
        setPaused(false);
    }

    // a long press only pauses, it should not skip to another story
    const tap = (fn) => () => {
        if (Date.now() - holdRef.current > 250) return;
        fn();
    }

    const openViewers = async () => {
        setViewersOpen(true);
        try {
            const { data } = await axios.get(`/api/v1/story/${story._id}/viewers`);
            setViewers(data.viewers);
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not load viewers");
        }
    }

    const handleDelete = async () => {
        setDeleting(true);
        setPaused(true);
        try {
            await axios.delete(`/api/v1/story/${story._id}`);
            toast.success("Story Deleted");
            onDeleted();
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not delete story");
            setDeleting(false);
            setPaused(false);
        }
    }

    if (!group || !story) return null;

    return (
        <div className="fixed inset-0 z-[1200] bg-black/90 flex items-center justify-center">

            <button onClick={onClose} aria-label="Close" className="absolute top-3 right-4 text-white text-3xl leading-none z-20 hover:opacity-70">&times;</button>

            {/* previous / next arrows for large screens */}
            <button onClick={goPrev} aria-label="Previous story" className="hidden sm:flex absolute left-[calc(50%-14rem)] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white items-center justify-center text-lg z-20">&#8249;</button>
            <button onClick={goNext} aria-label="Next story" className="hidden sm:flex absolute right-[calc(50%-14rem)] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white items-center justify-center text-lg z-20">&#8250;</button>

            <div
                className="relative w-full max-w-sm h-full sm:h-[92vh] sm:rounded-lg overflow-hidden bg-black select-none"
                onMouseDown={holdStart}
                onMouseUp={holdEnd}
                onMouseLeave={holdEnd}
                onTouchStart={holdStart}
                onTouchEnd={holdEnd}
            >
                <img
                    key={story._id}
                    draggable="false"
                    src={story.image}
                    alt="story"
                    onLoad={() => setLoadedId(story._id)}
                    onError={() => { setFailedId(story._id); setLoadedId(story._id); }}
                    className={`w-full h-full object-contain ${failedId === story._id ? 'invisible' : ''}`}
                />

                {failedId === story._id &&
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white text-sm px-8 text-center">
                        <span>This story's image couldn't be loaded.</span>
                        <span className="text-white/60 text-xs">Check that your storage bucket allows public read access for uploaded images.</span>
                    </div>
                }

                {!loaded &&
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm">Loading...</div>
                }

                {/* top shade + progress + header */}
                <div className="absolute top-0 inset-x-0 p-3 pt-3 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none">
                    <div className="flex gap-1">
                        {group.stories.map((s, i) => (
                            <div key={s._id} className="h-[3px] flex-1 bg-white/40 rounded overflow-hidden">
                                <div className="h-full bg-white" style={{ width: i < si ? '100%' : i === si ? `${progress}%` : '0%' }}></div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2.5 mt-3 pointer-events-auto">
                        <Link to={`/${group.user.username}`} onClick={onClose}>
                            <img draggable="false" className="w-8 h-8 rounded-full object-cover border border-white/60" src={group.user.avatar} alt="" />
                        </Link>
                        <Link to={`/${group.user.username}`} onClick={onClose} className="text-white text-sm font-semibold">{isMine ? 'Your story' : group.user.username}</Link>
                        <span className="text-white/70 text-xs">{moment(story.createdAt).fromNow(true)}</span>
                    </div>
                </div>

                {/* tap zones */}
                <div className="absolute inset-0 flex z-[5]">
                    <div className="w-1/3 h-full cursor-pointer" onClick={tap(goPrev)}></div>
                    <div className="w-2/3 h-full cursor-pointer" onClick={tap(goNext)}></div>
                </div>

                {/* owner actions */}
                {isMine &&
                    <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent z-10">
                        <button onClick={openViewers} className="text-white text-sm font-medium hover:underline">
                            {story.viewers || 0} {story.viewers === 1 ? 'viewer' : 'viewers'}
                        </button>
                        <button onClick={handleDelete} disabled={deleting} className="text-white text-sm font-medium bg-red-600/90 hover:bg-red-600 rounded px-3 py-1 disabled:opacity-50">
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                }
            </div>

            <UsersDialog title="Viewers" open={viewersOpen} onClose={() => setViewersOpen(false)} usersList={viewers} />
        </div>
    )
}

export default StoryViewer
