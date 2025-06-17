import { useState, useEffect } from 'react';
import {
  Paperclip,
  User,
  Mail,
  Clock,
  X,
  File,
  FileText,
  Image,
  Video,
  Loader2,
  Projector,
  Edit2,
  ChevronDown,
  ChevronUp,
  DownloadCloud
} from 'lucide-react';
import { serverTimestamp, updateDoc, doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
 
function AdminTickets() {
  const [tickets, setTickets] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: '',
    priority: '',
    category: '',
    subject: '',
    description: ''
  });
 
  const priorities = [
    { value: 'Low', color: 'text-green-600', description: 'Non-urgent, can wait' },
    { value: 'Medium', color: 'text-yellow-600', description: 'Normal priority' },
    { value: 'High', color: 'text-red-600', description: 'Urgent, needs immediate attention' }
  ];
 
  const categories = [
    'Technical Issue',
    'Bug Report',
    'Feature Request',
    'Account Problem',
    'Billing Issue',
    'General Inquiry',
    'Complaint',
    'Feedback'
  ];
 
  const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
 
  useEffect(() => {
    // Subscribe to real-time updates for tickets
    const unsubscribe = onSnapshot(
      query(collection(db, 'tickets'), orderBy('created', 'desc')),
      (snapshot) => {
        const ticketsByProject = {};
        snapshot.forEach((doc) => {
          const ticket = { id: doc.id, ...doc.data() };
          const project = ticket.project || 'General';
          if (!ticketsByProject[project]) {
            ticketsByProject[project] = [];
          }
          ticketsByProject[project].push(ticket);
        });
        setTickets(ticketsByProject);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching tickets:', error);
        setLoading(false);
      }
    );
 
    return () => unsubscribe();
  }, []);
 
  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setEditFormData({
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      subject: ticket.subject,
      description: ticket.description
    });
    setShowEditModal(true);
  };
 
  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
 
    try {
      await updateDoc(doc(db, 'tickets', selectedTicket.id), {
        ...editFormData,
        lastUpdated: serverTimestamp()
      });
      setShowEditModal(false);
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };
 
  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'text-gray-600';
  };
 
  const getFileIcon = (file) => {
    const type = file.type.split('/')[0];
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'application':
        if (file.type.includes('pdf')) {
          return <FileText className="w-4 h-4" />;
        }
        return <File className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };
 
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
 
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ticket Management</h1>
     
      {/* Projects and Tickets List */}
      <div className="space-y-4">
        {Object.entries(tickets).map(([project, projectTickets]) => (
          <div key={project} className="bg-white rounded-lg shadow">
            <div
              className="p-4 flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedProject(expandedProject === project ? null : project)}
            >
              <div className="flex items-center space-x-3">
                <Projector className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">{project}</h2>
                <span className="text-sm text-gray-500">({projectTickets.length} tickets)</span>
              </div>
              {expandedProject === project ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
 
            {expandedProject === project && (
              <div className="border-t border-gray-200">
                {projectTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-md font-medium text-gray-900">{ticket.subject}</h3>
                          <span className={`text-sm ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className="text-sm text-gray-500">
                            #{ticket.ticketNumber}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{ticket.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {ticket.customer}
                          </span>
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {ticket.email}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(ticket.created?.toDate()).toLocaleDateString()}
                          </span>
                        </div>
                        {ticket.attachments && ticket.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium text-gray-700 flex items-center">
                              <Paperclip className="w-4 h-4 mr-1" /> Attachments:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {ticket.attachments.map((attachment, idx) => (
                                <div key={idx} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors justify-between">
                                  <a
                                    href={attachment.data}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 flex-grow"
                                  >
                                    {getFileIcon(attachment)}
                                    <div>
                                      <p className="text-sm font-medium text-blue-600 hover:underline">
                                        {attachment.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatFileSize(attachment.size)}
                                      </p>
                                    </div>
                                  </a>
                                  <a
                                    href={attachment.data}
                                    download={attachment.name}
                                    className="p-1 text-gray-500 hover:text-blue-600"
                                    title="Download file"
                                  >
                                    <DownloadCloud className="w-4 h-4" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditTicket(ticket)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
 
      {/* Edit Ticket Modal */}
      {showEditModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Ticket</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
           
            <form onSubmit={handleUpdateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
 
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={editFormData.priority}
                  onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.value}</option>
                  ))}
                </select>
              </div>
 
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
 
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={editFormData.subject}
                  onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
 
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="4"
                />
              </div>
 
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
 
export default AdminTickets;
 