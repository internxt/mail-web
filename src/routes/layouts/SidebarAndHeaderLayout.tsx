import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';

/**
 * App layout (contains the static components like the sidebar)
 */
const SidebarAndHeaderLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-64 border-r bg-gray-50">
        {/* TODO: Sidenav here */}
        <nav className="p-4">
          <h1 className="text-xl font-bold mb-4">Mail</h1>
        </nav>
      </aside>

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
