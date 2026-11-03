import React, { useEffect, useState } from 'react'
import { exploreFill, exploreOutline, homeFill, homeOutline, likeFill, likeOutline, messageFill, messageOutline, postUploadOutline } from './SvgIcons'
import { Link, useLocation } from 'react-router-dom';
import ProfileDetails from './ProfileDetails';
import NewPost from './NewPost';
import Notifications from './Notifications';
import { useSelector } from 'react-redux';
import SearchBox from './SearchBar/SearchBox';

const Header = () => {

    const { user } = useSelector((state) => state.user);

    const [profileToggle, setProfileToggle] = useState(false)
    const [activityToggle, setActivityToggle] = useState(false)
    const [newPost, setNewPost] = useState(false);

    const location = useLocation();
    const [onHome, setOnHome] = useState(false);
    const [onChat, setOnChat] = useState(false);
    const [onExplore, setOnExplore] = useState(false);

    useEffect(() => {
        setOnHome(location.pathname === "/")
        setOnChat(location.pathname.split('/').includes("direct"))
        setOnExplore(location.pathname === "/explore")
        // close any open dropdown when the route changes
        setProfileToggle(false);
        setActivityToggle(false);
    }, [location]);

    const toggleProfile = () => {
        setActivityToggle(false);
        setProfileToggle(!profileToggle);
    }

    const toggleActivity = () => {
        setProfileToggle(false);
        setActivityToggle(!activityToggle);
    }

    const profileActive = profileToggle || (!onHome && !onChat && !onExplore && !activityToggle);

    return (
        <nav className="fixed top-0 w-full border-b bg-white z-10">
            {/* <!-- navbar container --> */}
            <div className="flex flex-row justify-between items-center py-2 px-3.5 sm:w-full sm:py-2 sm:px-4 md:w-full md:py-2 md:px-6 xl:w-4/6 xl:py-3 xl:px-8 mx-auto">

                {/* <!-- logo --> */}
                <Link to="/"><img draggable="false" className="mt-1.5 w-full h-full object-contain" src="https://www.instagram.com/static/images/web/mobile_nav_type_logo.png/735145cfe0a4.png" alt="" /></Link>

                <SearchBox />

                {/* <!-- icons container  --> */}
                <div className="flex items-center space-x-4 sm:space-x-6 sm:mr-5">
                    <Link to="/">{profileToggle || activityToggle || !onHome ? homeOutline : homeFill}</Link>

                    <Link to="/direct/inbox">{onChat ? messageFill : messageOutline}</Link>

                    <div onClick={() => setNewPost(true)} className="cursor-pointer">{postUploadOutline}</div>

                    <Link to="/explore" title="Explore">{onExplore ? exploreFill : exploreOutline}</Link>

                    <button onClick={toggleActivity} title="Activity">{activityToggle ? likeFill : likeOutline}</button>

                    <div onClick={toggleProfile} className={`${profileActive && 'border-black border'} rounded-full cursor-pointer h-7 w-7 p-[0.5px]`}><img draggable="false" loading="lazy" className="w-full h-full rounded-full object-cover" src={user.avatar} alt="" /></div>
                </div>

                {profileToggle &&
                    <ProfileDetails setProfileToggle={setProfileToggle} />
                }

                {activityToggle &&
                    <Notifications setActivityToggle={setActivityToggle} />
                }

                <NewPost newPost={newPost} setNewPost={setNewPost} />

            </div>
        </nav>
    )
}

export default Header
