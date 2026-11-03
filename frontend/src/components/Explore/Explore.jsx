import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import axios from 'axios'
import InfiniteScroll from 'react-infinite-scroll-component'
import MetaData from '../Layouts/MetaData'
import SpinLoader from '../Layouts/SpinLoader'
import PostItem from '../User/Posts/PostItem'
import { clearErrors } from '../../actions/postAction'
import { LIKE_UNLIKE_POST_RESET, NEW_COMMENT_RESET, SAVE_UNSAVE_POST_RESET } from '../../constants/postConstants'

const Explore = () => {

    const dispatch = useDispatch();

    const [posts, setPosts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const page = useRef(1);

    const { error: likeError, message, success } = useSelector((state) => state.likePost)
    const { error: commentError, success: commentSuccess } = useSelector((state) => state.newComment)
    const { error: saveError, success: saveSuccess, message: saveMessage } = useSelector((state) => state.savePost)

    const loadPosts = useCallback(async () => {
        try {
            const { data } = await axios.get(`/api/v1/posts/explore?page=${page.current}`);
            page.current += 1;
            setPosts((prev) => {
                const seen = new Set(prev.map((p) => p._id));
                return [...prev, ...data.posts.filter((p) => !seen.has(p._id))];
            });
            setTotal(data.totalPosts);
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Could not load posts");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        page.current = 1;
        loadPosts();
    }, [loadPosts]);

    // toasts for like / comment / save, same as the rest of the app
    useEffect(() => {
        if (likeError) {
            toast.error(likeError);
            dispatch(clearErrors());
        }
        if (success) {
            toast.success(message)
            dispatch({ type: LIKE_UNLIKE_POST_RESET });
        }
        if (commentError) {
            toast.error(commentError);
            dispatch(clearErrors());
        }
        if (commentSuccess) {
            toast.success("Comment Added")
            dispatch({ type: NEW_COMMENT_RESET });
        }
        if (saveError) {
            toast.error(saveError);
            dispatch(clearErrors());
        }
        if (saveSuccess) {
            toast.success(saveMessage)
            dispatch({ type: SAVE_UNSAVE_POST_RESET });
        }
    }, [dispatch, success, likeError, message, commentError, commentSuccess, saveError, saveSuccess, saveMessage]);

    return (
        <>
            <MetaData title="Explore • Instagram" />

            <div className="mt-16 sm:mt-20 mb-8 mx-auto w-full xl:w-2/3 px-0.5 sm:px-8">

                {loading && <SpinLoader />}

                {!loading && error && posts.length === 0 &&
                    <div className="bg-white border rounded p-8 text-center">
                        <p className="text-red-500 mb-3">{error}</p>
                        <button onClick={() => { setLoading(true); loadPosts(); }} className="bg-primary-blue text-white text-sm font-medium px-5 py-1.5 rounded">Try again</button>
                    </div>
                }

                {!loading && !error && posts.length === 0 &&
                    <div className="bg-white border rounded p-10 text-center">
                        <h4 className="font-medium text-lg">Nothing to explore yet</h4>
                        <p className="text-gray-500 text-sm mt-1">Posts shared by other people will show up here.</p>
                    </div>
                }

                {posts.length > 0 &&
                    <InfiniteScroll
                        dataLength={posts.length}
                        next={loadPosts}
                        hasMore={posts.length < total}
                        loader={<SpinLoader />}
                        style={{ overflow: 'visible' }}
                    >
                        <div className="grid grid-cols-3 gap-1 sm:gap-6">
                            {posts.map((post) => (
                                <PostItem {...post} key={post._id} />
                            ))}
                        </div>
                    </InfiniteScroll>
                }

            </div>
        </>
    )
}

export default Explore
