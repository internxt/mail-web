import { AppLoader } from '@/components/AppLoader';
import { PreferencesDialog } from '@/components/preferences';
import Sidenav from '@/components/Sidenav';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

/**
 * App layout (contains the static components like the sidebar)
 */
const SidebarAndHeaderLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidenav />

      <main className="flex-1 overflow-auto">
        <AppLoader />
        <Suspense fallback={<AppLoader />}>
          <Outlet />
        </Suspense>
      </main>

      <PreferencesDialog />
    </div>
  );
};

export default SidebarAndHeaderLayout;
