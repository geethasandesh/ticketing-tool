import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FolderOpen, Ticket, LogOut, Users, User, UserCheck, FolderKanban, Monitor, Bell } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { collection, query, getDocs, where } from 'firebase/firestore';
import Projects from './Projects';

function Admin() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalEmployees: 0,
    clientHeads: 0,
    projectManagers: 0,
    totalProjects: 0,
    totalTickets: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutDropdown, setShowLogoutDropdown] = useState(false);
  const dropdownRef = useRef(null); // Ref for the dropdown container

  useEffect(() => {
    fetchStats();

    // Handle clicks outside the dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLogoutDropdown(false);
      }
    };

    if (showLogoutDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLogoutDropdown]); // Re-run effect when dropdown visibility changes

  const fetchStats = async () => {
    try {
      // Fetch total clients
      const clientsQuery = query(collection(db, 'users'), where('role', '==', 'client'));
      const clientsSnapshot = await getDocs(clientsQuery);
      
      // Fetch total employees
      const employeesQuery = query(collection(db, 'users'), where('role', '==', 'employee'));
      const employeesSnapshot = await getDocs(employeesQuery);
      
      // Fetch client heads
      const clientHeadsQuery = query(collection(db, 'users'), where('role', '==', 'client_head'));
      const clientHeadsSnapshot = await getDocs(clientHeadsQuery);
      
      // Fetch project managers
      const projectManagersQuery = query(collection(db, 'users'), where('role', '==', 'project_manager'));
      const projectManagersSnapshot = await getDocs(projectManagersQuery);
      
      // Fetch total projects
      const projectsQuery = query(collection(db, 'projects'));
      const projectsSnapshot = await getDocs(projectsQuery);
      
      // Fetch total tickets
      const ticketsQuery = query(collection(db, 'tickets'));
      const ticketsSnapshot = await getDocs(ticketsQuery);

      setStats({
        totalClients: clientsSnapshot.size,
        totalEmployees: employeesSnapshot.size,
        clientHeads: clientHeadsSnapshot.size,
        projectManagers: projectManagersSnapshot.size,
        totalProjects: projectsSnapshot.size,
        totalTickets: ticketsSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (tab) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return <Projects />;
      case 'tickets':
        return <div>Tickets Content</div>;
      default:
        return (
          <div className="flex-1 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Admin Dashboard</h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                  {/* Total Clients */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Clients</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* Total Employees */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* Client Heads */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Client Heads</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.clientHeads}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* Project Managers */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Project Managers</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.projectManagers}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Second Row Stats */}
                <div className="grid grid-cols-4 gap-6">
                  {/* Total Projects */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Projects</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FolderKanban className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* Total Tickets */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalTickets}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Monitor className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* Empty slots for layout consistency */}
                  <div></div>
                  <div></div>
                </div>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-slate-700 text-white flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-80'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-600">
          {!isSidebarCollapsed && <h1 className="text-xl font-semibold">Admin Panel</h1>}
          <button className="p-1 hover:bg-slate-600 rounded" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            {isSidebarCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          <ul>
            <li
              className={`flex items-center p-4 cursor-pointer hover:bg-slate-600 ${activeTab === 'dashboard' ? 'bg-slate-600' : ''} ${isSidebarCollapsed ? 'justify-center' : ''}`}
              onClick={() => handleNavigation('dashboard')}
            >
              <Home className={`w-5 h-5 ${isSidebarCollapsed ? 'mr-0' : 'mr-3'}`} />
              {!isSidebarCollapsed && "Dashboard"}
            </li>
            <li
              className={`flex items-center p-4 cursor-pointer hover:bg-slate-600 ${activeTab === 'projects' ? 'bg-slate-600' : ''} ${isSidebarCollapsed ? 'justify-center' : ''}`}
              onClick={() => handleNavigation('projects')}
            >
              <FolderOpen className={`w-5 h-5 ${isSidebarCollapsed ? 'mr-0' : 'mr-3'}`} />
              {!isSidebarCollapsed && "Projects"}
            </li>
            <li
              className={`flex items-center p-4 cursor-pointer hover:bg-slate-600 ${activeTab === 'tickets' ? 'bg-slate-600' : ''} ${isSidebarCollapsed ? 'justify-center' : ''}`}
              onClick={() => handleNavigation('tickets')}
            >
              <Ticket className={`w-5 h-5 ${isSidebarCollapsed ? 'mr-0' : 'mr-3'}`} />
              {!isSidebarCollapsed && "Tickets"}
            </li>
            <li
              className={`flex items-center p-4 cursor-pointer hover:bg-slate-600 ${isSidebarCollapsed ? 'justify-center' : ''}`}
              onClick={handleLogout}
            >
              <LogOut className={`w-5 h-5 ${isSidebarCollapsed ? 'mr-0' : 'mr-3'}`} />
              {!isSidebarCollapsed && "Logout"}
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </div>
              {/* User Icon for Logout */}
              <div className="relative">
                <button
                  onClick={() => setShowLogoutDropdown(!showLogoutDropdown)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
                >
                  <User className="w-6 h-6" />
                  {/* Optional: Display user email/name */}
                  {/* <span>{auth.currentUser?.email || 'Admin'}</span> */}
                </button>

                {/* Logout Dropdown */}
                {showLogoutDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10" ref={dropdownRef}>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        {renderContent()}
      </div>
    </div>
  );
}

export default Admin;