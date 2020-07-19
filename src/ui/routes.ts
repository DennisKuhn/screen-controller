// @material-ui/icons
import Dashboard from '@material-ui/icons/Dashboard';
// core components/views for Admin layout
import DashboardPage from './views/Dashboard/Dashboard';
import SetupPage from './views/Setup/SetupScreen';
// core components/views for RTL layout
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
];

export default dashboardRoutes;
