import { useParams } from 'react-router-dom'
import Update from './Update'
import NotFound from '../../Errors/NotFound'
import { tabs } from './Sidebar'
import { AppsPanel, ContactsPanel, EmailPanel, EmailsFromPanel, HelpPanel, LoginActivityPanel, PrivacyPanel, PushPanel } from './Panels'

const sections = {
    "apps": AppsPanel,
    "emails": EmailPanel,
    "push": PushPanel,
    "contacts": ContactsPanel,
    "privacy": PrivacyPanel,
    "login-activity": LoginActivityPanel,
    "emails-from-instagram": EmailsFromPanel,
    "help": HelpPanel,
}

const AccountSettings = () => {

    const { section } = useParams();
    const Panel = sections[section];

    if (!Panel) return <NotFound />;

    const activeTab = tabs.findIndex((t) => t.nav === `/accounts/${section}`);

    return (
        <Update activeTab={activeTab}>
            <Panel />
        </Update>
    )
}

export default AccountSettings
