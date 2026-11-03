import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClickAwayListener } from '@mui/material'
import axios from 'axios'
import moment from 'moment'

const messages = {
    like: "liked your post.",
    comment: "commented:",
    follow: "started following you.",
}

const Notifications = ({ setActivityToggle }) => {

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activity, setActivity] = useState([]);

    useEffect(() => {
        let active = true;
        axios.get('/api/v1/activity')
            .then(({ data }) => active && setActivity(data.activity))
            .catch((err) => active && setError(err.response?.data?.message || "Could not load activity"))
            .finally(() => active && setLoading(false));
        return () => { active = false };
    }, []);

    return (
        <ClickAwayListener onClickAway={() => setActivityToggle(false)}>
            <div className="absolute w-80 max-w-[92vw] bg-white rounded drop-shadow-xl right-2 md:right-60 top-14 border">
                <div className="absolute right-12 -top-2 rotate-45 h-4 w-4 bg-white rounded-sm border-l border-t"></div>

                <div className="flex flex-col w-full max-h-96 overflow-y-auto rounded">
                    <div className="px-4 py-2.5 font-semibold border-b text-sm">Activity</div>

                    {loading && <p className="p-4 text-sm text-gray-500">Loading...</p>}
                    {!loading && error && <p className="p-4 text-sm text-red-500">{error}</p>}
                    {!loading && !error && activity.length === 0 &&
                        <p className="p-4 text-sm text-gray-500">No activity yet. Likes, comments and new followers will show up here.</p>
                    }

                    {activity.map((a, i) => (
                        <div key={`${a.type}-${a.user._id}-${a.post?._id || ''}-${i}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                            <Link to={`/${a.user.username}`} onClick={() => setActivityToggle(false)}>
                                <img draggable="false" className="w-9 h-9 rounded-full object-cover" src={a.user.avatar} alt="" />
                            </Link>
                            <p className="flex-1 min-w-0 leading-snug">
                                <Link to={`/${a.user.username}`} onClick={() => setActivityToggle(false)} className="font-semibold hover:underline">{a.user.username}</Link>{' '}
                                <span>{messages[a.type]}</span>
                                {a.type === 'comment' && <span className="text-gray-700 break-words"> {a.comment}</span>}
                                <span className="text-gray-400 text-xs ml-1.5">{moment(a.createdAt).fromNow(true)}</span>
                            </p>
                            {a.post &&
                                <img draggable="false" className="w-10 h-10 object-cover rounded-sm" src={a.post.image} alt="post" />
                            }
                        </div>
                    ))}
                </div>
            </div>
        </ClickAwayListener>
    )
}

export default Notifications
