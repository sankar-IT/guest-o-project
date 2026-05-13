import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';

const WaiterLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="dashboard-main-container">
        {/* Pass state and handlers if needed, or use a context */}
        {/* Most components use their own header for now, so we just wrap with the sidebar layout */}
        <Outlet context={{ setIsSidebarOpen }} />
      </div>
    </div>
  );
};

export default WaiterLayout;
