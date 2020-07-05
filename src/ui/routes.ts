// @material-ui/icons
import Dashboard from '@material-ui/icons/Dashboard';
import Person from '@material-ui/icons/Person';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import BubbleChart from '@material-ui/icons/BubbleChart';
import Notifications from '@material-ui/icons/Notifications';
import Unarchive from '@material-ui/icons/Unarchive';
import Language from '@material-ui/icons/Language';
// core components/views for Admin layout
import DashboardPage from './views/Dashboard/Dashboard';
import SetupPage from './views/Setup/SetupScreen';
import DisplaysPage from './views/Displays/Displays';
import ScreenPage from './views/Screen/Screen';
import UserProfile from './views/UserProfile/UserProfile';
import TableList from './views/TableList/TableList';
import Typography from './views/Typography/Typography';
import Icons from './views/Icons/Icons';
import NotificationsPage from './views/Notifications/Notifications';
import UpgradeToPro from './views/UpgradeToPro/UpgradeToPro';
// core components/views for RTL layout
import RTLPage from './views/RTLPage/RTLPage';
import { Settings } from '@material-ui/icons';

const dashboardRoutes = [
    {
        path: '/dashboard',
        name: 'Dashboard',
        rtlName: 'لوحة القيادة',
        icon: Dashboard,
        component: DashboardPage,
        layout: '/admin'
    },
    {
        path: '/setup',
        name: 'Setup',
        rtlName: 'لوحة القيادة',
        icon: Settings,
        component: SetupPage,
        layout: '/admin'
    },
    {
        path: '/displays',
        name: 'Displays',
        rtlName: 'لوحة القيادة',
        icon: Dashboard,
        component: DisplaysPage,
        layout: '/admin'
    },
    {
        path: '/screen',
        name: 'Screen',
        rtlName: 'لوحة القيادة',
        icon: Dashboard,
        component: ScreenPage,
        layout: '/admin'
    },
    {
        path: '/user',
        name: 'User Profile',
        rtlName: 'ملف تعريفي للمستخدم',
        icon: Person,
        component: UserProfile,
        layout: '/admin'
    },
    {
        path: '/table',
        name: 'Table List',
        rtlName: 'قائمة الجدول',
        icon: 'content_paste',
        component: TableList,
        layout: '/admin'
    },
    {
        path: '/typography',
        name: 'Typography',
        rtlName: 'طباعة',
        icon: LibraryBooks,
        component: Typography,
        layout: '/admin'
    },
    {
        path: '/icons',
        name: 'Icons',
        rtlName: 'الرموز',
        icon: BubbleChart,
        component: Icons,
        layout: '/admin'
    },
    {
        path: '/notifications',
        name: 'Notifications',
        rtlName: 'إخطارات',
        icon: Notifications,
        component: NotificationsPage,
        layout: '/admin'
    },
    {
        path: '/upgrade-to-pro',
        name: 'Upgrade To PRO',
        rtlName: 'التطور للاحترافية',
        icon: Unarchive,
        component: UpgradeToPro,
        layout: '/admin'
    },
    {
        path: '/rtl-page',
        name: 'RTL Support',
        rtlName: 'پشتیبانی از راست به چپ',
        icon: Language,
        component: RTLPage,
        layout: '/rtl'
    }
];

export default dashboardRoutes;
