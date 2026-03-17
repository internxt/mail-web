import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import SidenavComponent from '@/components/Sidenav';

/**
 * App layout (contains the static components like the sidebar)
 */
const SidebarAndHeaderLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <SidenavComponent />

      <main className="flex-1 overflow-auto">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}

export default SidebarAndHeaderLayout;
