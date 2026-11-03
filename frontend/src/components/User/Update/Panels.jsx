import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Dialog } from '@mui/material'
import { toast } from 'react-toastify'
import axios from 'axios'
import moment from 'moment'
import MetaData from '../../Layouts/MetaData'
import UserListItem from '../../Layouts/UserListItem'
import SpinLoader from '../../Layouts/SpinLoader'
import { loadUser, logoutUser } from '../../../actions/userAction'

const Panel = ({ title, description, children }) => (
    <div className="flex flex-col gap-4 py-6 px-4 sm:py-10 sm:px-12 sm:w-3/4">
        <MetaData title={`${title} • Instagram`} />
        <div>
            <h2 className="text-xl font-medium">{title}</h2>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        {children}
    </div>
)

// ---------- Apps and Websites ----------
export const AppsPanel = () => (
    <Panel title="Apps and Websites" description="Apps and websites you have connected to your account.">
        <div className="border rounded p-6 text-center text-sm text-gray-500">
            No apps or websites are connected to your account.
        </div>
    </Panel>
)

// ---------- Email and SMS ----------
export const EmailPanel = () => {
    const { user } = useSelector((state) => state.user);
    return (
        <Panel title="Email and SMS" description="Where we send account and security messages.">
            <div className="border rounded divide-y text-sm">
                <div className="flex items-center justify-between p-4">
                    <div>
                        <p className="font-medium">Email address</p>
                        <p className="text-gray-500 break-all">{user.email}</p>
                    </div>
                    <Link to="/accounts/edit" className="text-primary-blue font-medium">Change</Link>
                </div>
                <div className="p-4">
                    <p className="font-medium">Phone number</p>
                    <p className="text-gray-500">SMS is not available for this account.</p>
                </div>
            </div>
        </Panel>
    )
}

// ---------- Push Notifications ----------
const Toggle = ({ label, hint, checked, onChange, disabled }) => (
    <label className="flex items-center justify-between gap-4 p-4 cursor-pointer">
        <span>
            <span className="block font-medium text-sm">{label}</span>
            <span className="block text-xs text-gray-500">{hint}</span>
        </span>
        <input type="checkbox" className="h-4 w-4 accent-blue-500" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </label>
)

export const PushPanel = () => {

    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.user);

    const saved = user.notificationSettings || {};
    const [settings, setSettings] = useState({
        likes: saved.likes !== false,
        comments: saved.comments !== false,
        follows: saved.follows !== false,
    });
    const [saving, setSaving] = useState(false);

    const update = async (key, value) => {
        const previous = settings;
        setSettings({ ...settings, [key]: value });
        setSaving(true);
        try {
            await axios.put('/api/v1/update/notifications', { [key]: value });
            dispatch(loadUser());
            toast.success("Notification settings saved");
        } catch (err) {
            setSettings(previous);
            toast.error(err.response?.data?.message || "Could not save settings");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Panel title="Push Notifications" description="Choose what shows up in your activity feed (the heart icon).">
            <div className="border rounded divide-y">
                <Toggle label="Likes" hint="When someone likes your post" checked={settings.likes} disabled={saving} onChange={(v) => update('likes', v)} />
                <Toggle label="Comments" hint="When someone comments on your post" checked={settings.comments} disabled={saving} onChange={(v) => update('comments', v)} />
                <Toggle label="New followers" hint="When someone starts following you" checked={settings.follows} disabled={saving} onChange={(v) => update('follows', v)} />
            </div>
        </Panel>
    )
}

// ---------- Manage Contacts ----------
export const ContactsPanel = () => {
    const { user } = useSelector((state) => state.user);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState([]);

    useEffect(() => {
        let active = true;
        axios.get(`/api/v1/user/${user.username}`)
            .then(({ data }) => active && setFollowing(data.user?.following || []))
            .catch((err) => active && toast.error(err.response?.data?.message || "Could not load contacts"))
            .finally(() => active && setLoading(false));
        return () => { active = false };
    }, [user.username]);

    return (
        <Panel title="Manage Contacts" description="People you follow. You can unfollow them from here.">
            {loading && <SpinLoader />}
            {!loading && following.length === 0 &&
                <div className="border rounded p-6 text-center text-sm text-gray-500">
                    You are not following anyone yet. Find people on the <Link to="/explore" className="text-primary-blue font-medium">Explore</Link> page.
                </div>
            }
            {!loading && following.length > 0 &&
                <div className="border rounded p-4">
                    {following.map((u) => <UserListItem {...u} key={u._id} />)}
                </div>
            }
        </Panel>
    )
}

// ---------- Privacy and Security ----------
export const PrivacyPanel = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.user);

    const [open, setOpen] = useState(false);
    const [confirm, setConfirm] = useState("");
    const [deleting, setDeleting] = useState(false);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/login");
        toast.success("Logout Successfully");
    }

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await axios.delete('/api/v1/me');
            await dispatch(logoutUser());
            toast.success("Account deleted");
            navigate("/login");
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not delete account");
            setDeleting(false);
        }
    }

    return (
        <Panel title="Privacy and Security" description="Keep your account safe.">
            <div className="border rounded divide-y text-sm">
                <div className="flex items-center justify-between p-4">
                    <div>
                        <p className="font-medium">Password</p>
                        <p className="text-gray-500">Change it regularly and don't reuse it elsewhere.</p>
                    </div>
                    <Link to="/accounts/password/change" className="text-primary-blue font-medium">Change</Link>
                </div>
                <div className="flex items-center justify-between p-4">
                    <div>
                        <p className="font-medium">Login activity</p>
                        <p className="text-gray-500">See where your account was recently used.</p>
                    </div>
                    <Link to="/accounts/login-activity" className="text-primary-blue font-medium">View</Link>
                </div>
                <div className="flex items-center justify-between p-4">
                    <div>
                        <p className="font-medium">Log out</p>
                        <p className="text-gray-500">Sign out on this device.</p>
                    </div>
                    <button onClick={handleLogout} className="text-primary-blue font-medium">Log out</button>
                </div>
                <div className="flex items-center justify-between p-4">
                    <div>
                        <p className="font-medium text-red-600">Delete account</p>
                        <p className="text-gray-500">Permanently remove your profile and posts. This cannot be undone.</p>
                    </div>
                    <button onClick={() => setOpen(true)} className="text-red-600 font-medium">Delete</button>
                </div>
            </div>

            <Dialog open={open} onClose={() => !deleting && setOpen(false)}>
                <div className="flex flex-col gap-3 p-5 w-80 sm:w-96 text-sm">
                    <h3 className="font-medium text-base">Delete your account?</h3>
                    <p className="text-gray-600">Your profile, posts and followers will be removed permanently. Type <b>{user.username}</b> to confirm.</p>
                    <input className="border rounded p-1.5 outline-none" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Username" />
                    <div className="flex justify-end gap-3 mt-1">
                        <button onClick={() => setOpen(false)} disabled={deleting} className="px-3 py-1.5 rounded hover:bg-gray-100">Cancel</button>
                        <button onClick={handleDelete} disabled={deleting || confirm !== user.username} className="px-3 py-1.5 rounded bg-red-600 text-white font-medium disabled:opacity-40">
                            {deleting ? "Deleting..." : "Delete account"}
                        </button>
                    </div>
                </div>
            </Dialog>
        </Panel>
    )
}

// ---------- Login Activity ----------
const describeDevice = (ua = "") => {
    const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
    const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Unknown device";
    return `${browser} on ${os}`;
}

export const LoginActivityPanel = () => {
    const [loading, setLoading] = useState(true);
    const [activity, setActivity] = useState([]);

    useEffect(() => {
        let active = true;
        axios.get('/api/v1/login/activity')
            .then(({ data }) => active && setActivity(data.activity))
            .catch((err) => active && toast.error(err.response?.data?.message || "Could not load login activity"))
            .finally(() => active && setLoading(false));
        return () => { active = false };
    }, []);

    return (
        <Panel title="Login Activity" description="Your most recent logins. Logins before this feature was added are not listed.">
            {loading && <SpinLoader />}
            {!loading && activity.length === 0 &&
                <div className="border rounded p-6 text-center text-sm text-gray-500">No login activity recorded yet. Log out and back in to see it here.</div>
            }
            {activity.length > 0 &&
                <div className="border rounded divide-y text-sm">
                    {activity.map((a, i) => (
                        <div key={a._id || i} className="flex items-center justify-between gap-4 p-4">
                            <div className="min-w-0">
                                <p className="font-medium">{describeDevice(a.device)}{i === 0 && <span className="ml-2 text-xs text-green-600">Most recent</span>}</p>
                                <p className="text-gray-500 truncate">IP {String(a.ip).split(',')[0].replace('::ffff:', '')}</p>
                            </div>
                            <span className="text-gray-500 whitespace-nowrap" title={moment(a.date).format('LLL')}>{moment(a.date).fromNow()}</span>
                        </div>
                    ))}
                </div>
            }
        </Panel>
    )
}

// ---------- Emails from Instagram ----------
export const EmailsFromPanel = () => {
    const { user } = useSelector((state) => state.user);
    return (
        <Panel title="Emails from Instagram" description="The emails this app sends you.">
            <div className="border rounded divide-y text-sm">
                <div className="p-4">
                    <p className="font-medium">Password reset</p>
                    <p className="text-gray-500">Sent to {user.email} when you use "Forgot password". These are security emails and are always on.</p>
                </div>
                <div className="p-4">
                    <p className="font-medium">Marketing emails</p>
                    <p className="text-gray-500">This app doesn't send marketing or promotional emails.</p>
                </div>
            </div>
        </Panel>
    )
}

// ---------- Help ----------
const faqs = [
    { q: "How do I post a photo?", a: "Click the + icon in the top bar, choose an image, write a caption and press Share." },
    { q: "How do stories work?", a: "Use the + on your avatar in the stories bar on the home page to add a photo. Stories are visible to you and your followers and disappear after 24 hours." },
    { q: "How do I find people to follow?", a: "Open Explore (the compass icon) to browse posts from other people, then visit their profile and press Follow." },
    { q: "Where are the posts I saved?", a: "Open your profile and choose the Saved tab. Only you can see it." },
    { q: "I forgot my password", a: "Use \"Forgot password\" on the login page and follow the link we email you. If you're signed in you can change it under Change Password." },
]

export const HelpPanel = () => {
    const [open, setOpen] = useState(0);
    return (
        <Panel title="Help" description="Answers to common questions.">
            <div className="border rounded divide-y text-sm">
                {faqs.map((f, i) => (
                    <div key={f.q}>
                        <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between text-left p-4 font-medium hover:bg-gray-50">
                            {f.q}
                            <span className="text-gray-400 ml-3">{open === i ? '−' : '+'}</span>
                        </button>
                        {open === i && <p className="px-4 pb-4 text-gray-600">{f.a}</p>}
                    </div>
                ))}
            </div>
        </Panel>
    )
}
