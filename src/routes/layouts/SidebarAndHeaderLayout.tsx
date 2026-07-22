import { PreferencesDialog } from '@/components/preferences';
import Sidenav from '@/components/Sidenav';
import { Outlet } from 'react-router-dom';

/**
 * App layout (contains the static components like the sidebar)
 */
const SidebarAndHeaderLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidenav />
      <Outlet />

      <PreferencesDialog />
    </div>
  );
};

export default SidebarAndHeaderLayout;
