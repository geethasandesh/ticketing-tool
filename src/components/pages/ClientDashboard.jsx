import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Plus,
  MessageSquare,
  Send,
  User,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  Paperclip,
  Trash2,
  RefreshCw,
  Calendar,
  Tag,
  ChevronRight,
  LogOut,
  Home,
  FileText,
  Settings,
  Bell,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  Flag,
  Edit,
  ChevronLeft
} from 'lucide-react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { auth } from '../../firebase/config';
import Ticketing from './Ticketing'; // Import the Ticketing component

function ClientDashboard() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [error, setError] = useState(null);
  const [newResponse, setNewResponse] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clientName, setClientName] = useState('');
  const [requesterNameFilter, setRequesterNameFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const unsubscribeRef = useRef(null);
  
  // Mock data for demonstration
  const mockTickets = [
    {
      id: '1',
      subject: 'Login Issues with Account',
      description: 'I am unable to log into my account. The password reset link is not working.',
      status: 'Open',
      created: new Date('2024-01-15T10:00:00'),
      ticketNumber: 'TKT-001',
      adminResponses: [
        {
          message: 'Thank you for contacting support. We are looking into your login issue.',
          timestamp: new Date('2024-01-15T11:00:00')
        }
      ],
      customerResponses: [],
      customer: 'John Doe',
      project: 'Technical Support'
    },
    {
      id: '2',
      subject: 'Billing Question',
      description: 'I have a question about my recent invoice. The charges seem higher than expected.',
      status: 'In Progress',
      created: new Date('2024-01-14T14:30:00'),
      ticketNumber: 'TKT-002',
      adminResponses: [
        {
          message: 'We have received your billing inquiry and are reviewing your account.',
          timestamp: new Date('2024-01-14T15:00:00')
        }
      ],
      customerResponses: [
        {
          message: 'Thank you for the quick response. I look forward to hearing back.',
          timestamp: new Date('2024-01-14T15:30:00')
        }
      ],
      customer: 'Jane Smith',
      project: 'Billing'
    },
    {
      id: '3',
      subject: 'Feature Request',
      description: 'It would be great to have a dark mode option in the application.',
      status: 'Resolved',
      created: new Date('2024-01-13T09:15:00'),
      ticketNumber: 'TKT-003',
      adminResponses: [
        {
          message: 'Thank you for the feature request. We will consider this for future updates.',
          timestamp: new Date('2024-01-13T10:00:00')
        },
        {
          message: 'Good news! Dark mode has been added to our roadmap for the next release.',
          timestamp: new Date('2024-01-13T16:00:00')
        }
      ],
      customerResponses: [],
      customer: 'Mike Johnson',
      project: 'Product'
    }
  ];

  const setupTicketListener = () => {
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        setError('Please sign in to view tickets');
        setIsLoading(false);
        return;
      }

      // Set client name from email
      const email = auth.currentUser.email;
      const name = email.split('@')[0];
      setClientName(name.charAt(0).toUpperCase() + name.slice(1));

      // Query tickets for the current user
      const q = query(
        collection(db, 'tickets'),
        where('email', '==', auth.currentUser.email)
      );
      
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          try {
            const ticketsData = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              ticketsData.push({ 
                id: doc.id,
                subject: data.subject || 'No Subject',
                description: data.description || 'No Description',
                status: data.status || 'Open',
                created: data.created || null,
                dueDate: data.dueDate || null,
                ticketNumber: data.ticketNumber || `TKT-${doc.id}`,
                adminResponses: data.adminResponses || [],
                customerResponses: data.customerResponses || [],
                customer: data.customer || 'Unknown',
                project: data.project || 'General'
              });
            });
            
            // Sort tickets by created date
            ticketsData.sort((a, b) => {
              const dateA = a.created?.toDate?.() || new Date(a.created);
              const dateB = b.created?.toDate?.() || new Date(b.created);
              return dateB - dateA;
            });
            
            setTickets(ticketsData);
            setError(null);
            setIsLoading(false);
          } catch (err) {
            console.error('Error processing tickets:', err);
            setError('Error processing tickets. Please try again.');
            setIsLoading(false);
          }
        },
        (error) => {
          console.error('Firestore error:', error);
          setError('Error connecting to the server. Please try again.');
          setIsLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.error('Connection error:', err);
      setError('Unable to connect to the server. Please check your internet connection and try again.');
      setIsLoading(false);
    }
  };

  // Enhanced scroll to bottom function
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (selectedTicket) {
      // Use setTimeout to ensure messages are rendered
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [selectedTicket?.adminResponses, selectedTicket?.customerResponses, selectedTicket?.id]);

  useEffect(() => {
    setupTicketListener();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sendResponse = async (ticketId, message) => {
    if (!message.trim()) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticket = tickets.find(t => t.id === ticketId);
      
      const newResponse = {
        message: message.trim(),
        timestamp: new Date(),
        sender: 'customer'
      };
      
      await updateDoc(ticketRef, {
        customerResponses: [...(ticket.customerResponses || []), newResponse],
        lastUpdated: serverTimestamp()
      });
      
      setSelectedTicket(prev => ({
        ...prev,
        customerResponses: [...(prev.customerResponses || []), newResponse]
      }));
      
      setNewResponse('');
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom();
      }, 150);
      
    } catch (error) {
      console.error('Error sending response:', error);
      setError('Failed to send response. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'Resolved': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'Closed': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'Open': 
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'In Progress': 
        return `${baseClasses} bg-amber-100 text-amber-800`;
      case 'Resolved': 
        return `${baseClasses} bg-emerald-100 text-emerald-800`;
      case 'Closed': 
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default: 
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    if (date.toDateString() === now.toDateString()) {
      return timeStr;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${timeStr}`;
    } else if (date.getFullYear() === now.getFullYear()) {
      return `${date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })} ${timeStr}`;
    } else {
      return `${date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric' 
      })} ${timeStr}`;
    }
  };

  // New function to format date and time for table display
  const formatTableDateTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRequester = requesterNameFilter === '' || ticket.customer.toLowerCase().includes(requesterNameFilter.toLowerCase());
    const matchesTechnician = technicianFilter === '' || (ticket.adminResponses.length > 0 && ticket.adminResponses[0].message.toLowerCase().includes(technicianFilter.toLowerCase())); // This is a placeholder, will need proper technician field
    const matchesDueDate = dueDateFilter === '' || (ticket.dueDate && new Date(ticket.dueDate).toDateString() === new Date(dueDateFilter).toDateString());
    const matchesCreatedDate = createdDateFilter === '' || (ticket.created && new Date(ticket.created.toDate()).toDateString() === new Date(createdDateFilter).toDateString());

    if (filterStatus === 'All') {
      return matchesSearch && matchesRequester && matchesTechnician && matchesDueDate && matchesCreatedDate;
    }
    return matchesSearch && matchesRequester && matchesTechnician && matchesDueDate && matchesCreatedDate && ticket.status === filterStatus;
  });

  const handleSearch = () => {
    setHasSearched(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('All');
    setRequesterNameFilter('');
    setTechnicianFilter('');
    setDueDateFilter('');
    setCreatedDateFilter('');
    setHasSearched(false);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, active: activeTab === 'dashboard' },
    { id: 'tickets', label: 'My Tickets', icon: FileText, active: activeTab === 'tickets' },
    { id: 'create', label: 'Create Ticket', icon: Plus, active: activeTab === 'create' },
    { id: 'notifications', label: 'Notifications', icon: Bell, active: activeTab === 'notifications' },
    { id: 'settings', label: 'Settings', icon: Settings, active: activeTab === 'settings' }
  ];

  const renderSidebarItem = (item) => {
    const IconComponent = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => {
          setActiveTab(item.id);
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
          item.active
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
        title={sidebarCollapsed ? item.label : ''}
      >
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <IconComponent className={`w-5 h-5 ${item.active ? 'text-white' : 'text-gray-600'}`} />
        </div>
        {!sidebarCollapsed && <span>{item.label}</span>}
      </button>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connection Error</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-200">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Loading Dashboard</h2>
          <p className="text-gray-600 leading-relaxed">Please wait while we connect to the server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out ${ sidebarCollapsed ? 'w-20' : 'w-64' } bg-white shadow-xl lg:translate-x-0 lg:static ${ sidebarOpen ? 'translate-x-0' : '-translate-x-full' }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-l font-bold text-gray-900">Support Hub</h1>
                  <p className="text-sm text-gray-500">Client Portal</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              {sidebarCollapsed ? (
                <ChevronsRight className="w-6 h-6" />
              ) : (
                <ChevronsLeft className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            {sidebarItems.map(renderSidebarItem)}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-gray-200">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{clientName}</p>
                  <p className="text-xs text-gray-500">Client</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200`}
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span className="text-sm font-medium">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {clientName}!</h1>
                <p className="text-gray-600">Manage your support tickets and communications</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                      <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                      <p className="text-2xl font-bold text-blue-600">{tickets.filter(t => t.status === 'Open').length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-amber-600">{tickets.filter(t => t.status === 'In Progress').length}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Resolved</p>
                      <p className="text-2xl font-bold text-emerald-600">{tickets.filter(t => t.status === 'Resolved').length}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/ticketing')}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {/* Removed Plus icon */}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Create New Ticket</p>
                      <p className="text-sm text-gray-500">Submit a new support request</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('tickets')}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">View My Tickets</p>
                      <p className="text-sm text-gray-500">Check status of existing tickets</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between py-4">
                {/* Left side: SAP EWM and Filter */}
                <div className="flex items-center space-x-4">
                  {/* SAP EWM Dropdown (Placeholder) */}
                  <div className="relative">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-800 hover:bg-gray-200 transition-colors">
                      <span className="font-semibold">SAP EWM</span>
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    </button>
                    {/* Dropdown content would go here */}
                  </div>
                  {/* Filter Icon */}
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <Filter className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Right side: Last 30 days and View Options */}
                <div className="flex items-center space-x-4">
                  {/* Last 30 days Dropdown (Placeholder) */}
                  <div className="relative">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Last 30 days</span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                    {/* Dropdown content would go here */}
                  </div>
                  {/* View Options (Placeholder for grid/list icons) */}
                  <div className="flex space-x-2">
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-300">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600"><path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/></svg>
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600"><path d="M4 7h16v2H4zm0 4h16v2H4zm0 4h16v2H4z"/></svg>
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600"><path d="M4 7h16v2H4zm0 4h16v2H4zm0 4h10v2H4z"/></svg>
                    </button>
                  </div>
                  {/* Pagination Controls */}
                  <div className="flex items-center space-x-2 text-gray-600 text-sm">
                    <span>1-7 of 7</span>
                    <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Search className="w-4 h-4" />
                  <span>New Incident</span>
                </button>
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Edit</button>
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Delete</button>
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Pick Up</button>
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Close</button>
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Merge</button>
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Link Requests</button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  <span>Assign</span>
                </button>
              </div>

              {/* Filters Section - Moved and styled as a standalone card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Tickets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search subject or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-gray-800 placeholder-gray-500 shadow-sm"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-gray-800 appearance-none shadow-sm"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Requester Name..."
                      value={requesterNameFilter}
                      onChange={(e) => setRequesterNameFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-gray-800 placeholder-gray-500 shadow-sm"
                    />
                  </div>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Technician Name..."
                      value={technicianFilter}
                      onChange={(e) => setTechnicianFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-gray-800 placeholder-gray-500 shadow-sm"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="date"
                      value={dueDateFilter}
                      onChange={(e) => setDueDateFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-gray-800 placeholder-gray-500 shadow-sm"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="date"
                      value={createdDateFilter}
                      onChange={(e) => setCreatedDateFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 text-gray-800 placeholder-gray-500 shadow-sm"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-all duration-200 font-medium"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={handleSearch}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl"
                  >
                    <Search className="w-5 h-5" />
                    <span>Search Tickets</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-8">
                {/* Ticket List / Filters */}
                <div className="col-span-12 lg:col-span-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Ticket Table / Placeholder */}
                    <div className="max-h-[calc(100vh-24rem)] overflow-y-auto">
                      {hasSearched ? (
                        filteredTickets.length === 0 ? (
                          <div className="p-8 text-center">
                            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No tickets found with the applied filters.</p>
                            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria.</p>
                          </div>
                        ) : (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left"><input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out" /></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                                <th scope="col" className="relative px-6 py-3"></th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredTickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                                    <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out" />
                                    <Edit className="w-4 h-4 text-gray-400" />
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <FileText className="w-4 h-4 text-gray-400" />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center space-x-2">
                                    {/* Conditionally render Paperclip icon */}
                                    {ticket.hasAttachments && <Paperclip className="w-4 h-4 text-gray-400" />}
                                    <span>{ticket.ticketNumber}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs flex items-center space-x-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{ticket.subject}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center space-x-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>{ticket.customer}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center space-x-2">
                                    <span className={`w-2 h-2 rounded-full ${ticket.adminResponses.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                    <span>{ticket.adminResponses.length > 0 ? 'Nikihleswar Red...' : 'Mohamed Suhail'}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center space-x-2">
                                    {ticket.status === 'In Progress' && <Flag className="w-4 h-4 text-amber-500" />}
                                    <span className={`w-2 h-2 rounded-full ${ticket.status === 'Open' ? 'bg-blue-500' : ticket.status === 'In Progress' ? 'bg-amber-500' : ticket.status === 'Resolved' ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
                                    <span>{ticket.status}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTableDateTime(ticket.dueDate)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTableDateTime(ticket.created)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.customer === 'Unknown' ? 'System' : ticket.customer}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {/* No actions needed for this column as per image */}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )
                      ) : (
                        <div className="p-8 text-center">
                          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">Use the filters above to search for tickets.</p>
                          <p className="text-gray-400 text-sm mt-1">Your tickets will appear here after you click "Search Tickets".</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="col-span-12 lg:col-span-6">
                  {selectedTicket ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
                      {/* Ticket Header */}
                      <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex-shrink-0">
                        <div className="text-center">
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTicket.subject}</h2>
                          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Created {formatMessageTime(selectedTicket.created)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Tag className="w-4 h-4" />
                              <span>{selectedTicket.project}</span>
                            </span>
                            <span className={getStatusBadge(selectedTicket.status)}>{selectedTicket.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Communication Thread */}
                      <div className="flex-1 flex flex-col min-h-0">
                        <div 
                          ref={messagesContainerRef}
                          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white"
                          style={{ 
                            scrollBehavior: 'smooth',
                            maxHeight: 'calc(100vh - 32rem)' 
                          }}
                        >
                          {(() => {
                            const allMessages = [
                              {
                                type: 'customer',
                                message: selectedTicket.description,
                                timestamp: selectedTicket.created,
                                isInitial: true
                              },
                              ...(selectedTicket.adminResponses || []).map(response => ({
                                type: 'admin',
                                message: response.message,
                                timestamp: response.timestamp
                              })),
                              ...(selectedTicket.customerResponses || []).map(response => ({
                                type: 'customer',
                                message: response.message,
                                timestamp: response.timestamp
                              }))
                            ].sort((a, b) => {
                              const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
                              const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
                              return timeA - timeB;
                            });

                            return allMessages.map((msg, index) => (
                              <div 
                                key={index} 
                                className={`flex ${msg.type === 'customer' ? 'justify-end' : 'justify-start'} mb-4`}
                              >
                                <div className={`max-w-[75%] ${msg.type === 'customer' ? 'order-2' : 'order-1'}`}>
                                  <div className={`rounded-2xl px-4 py-3 shadow-lg ${
                                    msg.type === 'customer' 
                                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                                      : 'bg-white border border-gray-200 text-gray-800'
                                  }`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className={`text-xs font-semibold ${
                                        msg.type === 'customer' ? 'text-blue-100' : 'text-gray-500'
                                      }`}>
                                        {msg.type === 'customer' 
                                          ? (msg.isInitial ? 'Initial Request' : 'Your Response')
                                          : 'Support Team'
                                        }
                                      </span>
                                      <span className={`text-xs ${
                                        msg.type === 'customer' ? 'text-blue-100' : 'text-gray-400'
                                      }`}>
                                        {formatMessageTime(msg.timestamp)}
                                      </span>
                                    </div>
                                    <p className={`text-sm leading-relaxed ${
                                      msg.type === 'customer' ? 'text-white' : 'text-gray-700'
                                    }`}>
                                      {msg.message}
                                    </p>
                                  </div>
                                </div>
                                {msg.type === 'customer' ? (
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center ml-3 order-1 flex-shrink-0">
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center mr-3 order-2 flex-shrink-0">
                                    <MessageSquare className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </div>
                            ));
                          })()}
                          <div ref={messagesEndRef} />
                        </div>
                      </div>

                      {/* Response Input */}
                      <div className="p-6 border-t border-gray-200 bg-white flex-shrink-0">
                        <div className="space-y-4">
                          <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                            rows="3"
                            placeholder="Type your response here..."
                            value={newResponse}
                            onChange={(e) => setNewResponse(e.target.value)}
                            disabled={isSending}
                          />
                          {error && (
                            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span>{error}</span>
                            </div>
                          )}
                          <button
                            onClick={() => sendResponse(selectedTicket.id, newResponse)}
                            disabled={isSending || !newResponse.trim()}
                            className={`w-full py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 font-medium ${
                              isSending || !newResponse.trim()
                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                            }`}
                          >
                            {isSending ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-5 h-5" />
                                <span>Send Response</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    null
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="p-6">
              <Ticketing />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h2>
              <p className="text-gray-600">No new notifications at this time.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-600">Settings page coming soon.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ClientDashboard;