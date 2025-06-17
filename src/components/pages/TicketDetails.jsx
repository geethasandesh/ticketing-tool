import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import {
  ArrowLeft,
  Mail,
  User,
  Tag,
  Clock,
  Calendar,
  Hash,
  Info,
  Briefcase,
  Send,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  FileText
} from 'lucide-react';
 
const TicketDetails = ({ ticketId, onBack }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newResponse, setNewResponse] = useState(''); // New state for comment input
  const [isSendingResponse, setIsSendingResponse] = useState(false);
 
  useEffect(() => {
    const fetchTicketDetails = async () => {
      if (!ticketId) {
        setError('No ticket ID provided.');
        setLoading(false);
        return;
      }
 
      try {
        const ticketRef = doc(db, 'tickets', ticketId);
        const ticketSnap = await getDoc(ticketRef);
 
        if (ticketSnap.exists()) {
          setTicket({ id: ticketSnap.id, ...ticketSnap.data() });
          setError(null);
        } else {
          setError('Ticket not found.');
        }
      } catch (err) {
        console.error('Error fetching ticket details:', err);
        setError('Failed to load ticket details.');
      } finally {
        setLoading(false);
      }
    };
 
    fetchTicketDetails();
  }, [ticketId]);
 
  const handleAddResponse = async () => {
    if (!newResponse.trim() || !ticketId || !auth.currentUser) return;
 
    setIsSendingResponse(true);
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      const response = {
        message: newResponse.trim(),
        timestamp: serverTimestamp(),
        authorEmail: auth.currentUser.email, // Store the email of the responder
        authorRole: 'client', // Assuming client is responding
      };
 
      await updateDoc(ticketRef, {
        customerResponses: arrayUnion(response), // Add new response to customerResponses array
        lastUpdated: serverTimestamp() // Update last updated timestamp
      });
 
      setNewResponse(''); // Clear input
      // Re-fetch ticket to update UI with new response, or manually add to state
      // For simplicity, let's re-fetch the ticket details to update the UI
      const updatedTicketSnap = await getDoc(ticketRef);
      if (updatedTicketSnap.exists()) {
        setTicket({ id: updatedTicketSnap.id, ...updatedTicketSnap.data() });
      }
    } catch (err) {
      console.error('Error adding response:', err);
      // Optionally, show an error to the user
    } finally {
      setIsSendingResponse(false);
    }
  };
 
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
 
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={onBack}
            className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-200 hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
 
  if (!ticket) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md">
          <strong className="font-bold">Information: </strong>
          <span className="block sm:inline">Ticket data is not available.</span>
          <button
            onClick={onBack}
            className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-200 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="bg-white shadow-lg rounded-xl p-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Tickets
      </button>
 
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4 flex items-center">
        <FileText className="h-8 w-8 mr-3 text-blue-600" />
        {ticket.subject}
      </h1>
      <p className="text-gray-600 text-lg mb-8">Ticket ID: {ticket.id}</p>
 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex items-center text-gray-700">
          <User className="h-5 w-5 mr-3 text-gray-500" />
          <span className="font-medium">Customer:</span> {ticket.customer || 'N/A'}
        </div>
        <div className="flex items-center text-gray-700">
          <Mail className="h-5 w-5 mr-3 text-gray-500" />
          <span className="font-medium">Email:</span> {ticket.email || 'N/A'}
        </div>
        <div className="flex items-center text-gray-700">
          <Tag className="h-5 w-5 mr-3 text-gray-500" />
          <span className="font-medium">Category:</span> {ticket.category || 'N/A'}
        </div>
        <div className="flex items-center text-gray-700">
          <Briefcase className="h-5 w-5 mr-3 text-gray-500" />
          <span className="font-medium">Project:</span> {ticket.project || 'N/A'}
        </div>
        <div className="flex items-center text-gray-700">
          <Clock className="h-5 w-5 mr-3 text-gray-500" />
          <span className="font-medium">Priority:</span> {ticket.priority || 'N/A'}
        </div>
        <div className="flex items-center text-gray-700">
          <Info className="h-5 w-5 mr-3 text-gray-500" />
          <span className="font-medium">Status:</span>
          <span className={`ml-2 inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(ticket.status)}`}>
            {ticket.status || 'N/A'}
          </span>
        </div>
        <div className="flex items-center text-gray-700">
          <Calendar className="h-5 w-5 mr-3 text-gray-500" />
          <span className="font-medium">Created:</span> {ticket.created ? new Date(ticket.created.toDate()).toLocaleString() : 'N/A'}
        </div>
        <div className="flex items-center text-gray-700">
          <User className="h-5 w-5 mr-3 text-gray-500" />
          <span className="font-medium">Assigned To:</span> {ticket.assignedTo || 'Not Assigned'}
        </div>
      </div>
 
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Description</h3>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800 leading-relaxed">
          <p>{ticket.description || 'No description provided.'}</p>
        </div>
      </div>
 
      {/* Add a section for responses/attachments if needed */}
 
      {/* Example: Responses section */}
      {ticket.adminResponses && ticket.adminResponses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Admin Responses</h3>
          <div className="space-y-4">
            {ticket.adminResponses.map((response, index) => (
              <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-semibold mb-1">Admin - {new Date(response.timestamp.toDate()).toLocaleString()}</p>
                <p className="text-gray-800">{response.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {ticket.customerResponses && ticket.customerResponses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Customer Responses</h3>
          <div className="space-y-4">
            {ticket.customerResponses.map((response, index) => (
              <div key={index} className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-semibold mb-1">You - {response.timestamp ? new Date(response.timestamp.toDate()).toLocaleString() : 'N/A'}</p>
                <p className="text-gray-800">{response.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* Comment/Response Input Box */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Add a Response</h3>
        <div className="flex items-center space-x-3">
          <textarea
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[60px]"
            placeholder="Type your response here..."
            value={newResponse}
            onChange={(e) => setNewResponse(e.target.value)}
            rows="3"
          ></textarea>
          <button
            onClick={handleAddResponse}
            disabled={!newResponse.trim() || isSendingResponse}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSendingResponse ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="ml-2 hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
 
    </div>
  );
};
 
export default TicketDetails;