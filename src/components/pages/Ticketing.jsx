import React, { useState, useRef } from 'react';
import {
  Send,
  Paperclip,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Phone,
  Building,
  MessageSquare,
  Star,
  Clock,
  X,
  File,
  FileText,
  Image,
  Video,
  Loader2,
  Projector
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

function Client() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    project: 'General',
    subject: '',
    priority: 'Medium',
    description: '',
    category: 'Technical Issue'
  });
 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [ticketId, setTicketId] = useState(null);
  const fileInputRef = useRef(null);

  const projects = [
    "Daikin",
    "VMM",
    "Danfoss"
  ];

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

  const validateForm = async () => {
    const newErrors = {};
   
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    else if (formData.description.trim().length < 10) newErrors.description = 'Description must be at least 10 characters';

    // Check for duplicate tickets
    if (formData.subject.trim() && formData.email.trim()) {
      const isDuplicate = await checkDuplicateTicket(formData.subject, formData.email);
      if (isDuplicate) {
        newErrors.submit = 'A similar ticket was submitted in the last 24 hours. Please check your email for updates.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!await validateForm()) return;
   
    setIsSubmitting(true);
    setErrors({});
   
    try {
      // Process attachments
      const processedFiles = await Promise.all(
        attachments.map(async (file) => {
          const reader = new FileReader();
          return new Promise((resolve) => {
            reader.onload = (e) => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );
     
      // Create the ticket document in Firestore
      const ticketData = {
        subject: formData.subject,
        customer: formData.name,
        email: formData.email,
        phone: formData.phone,
        project: formData.project,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
        status: 'Open',
        created: serverTimestamp(),
        starred: false,
        attachments: processedFiles,
        ticketNumber: `TKT-${Date.now()}`,
        lastUpdated: serverTimestamp()
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'tickets'), ticketData);
      setTicketId(docRef.id);
     
      // Update the ticket with its ID
      await updateDoc(docRef, {
        ticketId: docRef.id
      });
     
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setAttachments([]);
     
      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          project: '',
          subject: '',
          priority: 'Medium',
          description: '',
          category: 'Technical Issue'
        });
        setSubmitSuccess(false);
        setTicketId(null);
      }, 3000);
    } catch (error) {
      console.error('Error adding ticket:', error);
      setIsSubmitting(false);
      setErrors({ submit: error.message || 'Failed to submit ticket. Please try again.' });
    }
  };

  // Add a function to check for duplicate tickets
  const checkDuplicateTicket = async (subject, email) => {
    const q = query(
      collection(db, 'tickets'),
      where('email', '==', email)
    );
   
    const querySnapshot = await getDocs(q);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return querySnapshot.docs.some(doc => {
      const data = doc.data();
      const createdTime = data.created?.toDate?.() || new Date(data.created);
      return data.subject === subject && createdTime >= last24Hours;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
   
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Submitted Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your support ticket has been created and our team will get back to you soon.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">Ticket ID</p>
            <p className="font-mono text-lg font-semibold text-blue-600">{ticketId}</p>
          </div>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
              <p className="text-gray-600">Submit a support ticket and we'll help you out</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Support Ticket</h2>
             
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email address"
                    />
                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="w-4 h-4 inline mr-2" />
                      Project
                    </label>
                    <select
                      name="project"
                      value={formData.project}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {projects.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ticket Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.value} - {priority.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Brief summary of your issue"
                  />
                  {errors.subject && <p className="text-red-600 text-sm mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Please provide detailed information about your issue..."
                  />
                  {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
                  <p className="text-gray-500 text-sm mt-2">
                    Character count: {formData.description.length} (minimum 10 characters)
                  </p>
                </div>

                {/* Attachments Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-sm">Attachments (Optional)</span>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Add Files
                    </button>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            {getFileIcon(file)}
                            <div>
                              <p className="text-sm font-medium text-gray-700">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-6">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span className="text-sm">
                      {attachments.length} file{attachments.length !== 1 ? 's' : ''} attached
                    </span>
                  </div>
                 
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                    } text-white`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Tips */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                Quick Tips
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Be specific about your issue to get faster resolution</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Include error messages or screenshots if applicable</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Choose the correct priority level for your issue</span>
                </li>
              </ul>
            </div>

            {/* Priority Guide */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                Priority Guide
              </h3>
              <div className="space-y-3">
                {priorities.map(priority => (
                  <div key={priority.value} className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      priority.value === 'High' ? 'bg-red-500' :
                      priority.value === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className={`font-medium ${priority.color}`}>{priority.value}</p>
                      <p className="text-xs text-gray-500">{priority.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 text-green-600 mr-2" />
                Support Hours
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM</p>
                <p><strong>Saturday:</strong> 10:00 AM - 4:00 PM</p>
                <p><strong>Sunday:</strong> Closed</p>
                <p className="text-xs text-gray-500 mt-3">
                  Response time: Within 24 hours for normal priority tickets
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Client;