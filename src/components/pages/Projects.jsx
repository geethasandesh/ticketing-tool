import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db, auth } from '../../firebase/config';
import { Plus, Users, X, Edit2, Trash2, UserPlus, CheckCircle2, User, Briefcase, ChevronDown, ChevronUp, FolderOpen, AlertTriangle } from 'lucide-react';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    password: '',
    role: 'client',
    userType: 'client'
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [editingMember, setEditingMember] = useState(null);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      const projectsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        name: formData.name,
        description: formData.description,
        members: [],
        createdAt: new Date().toISOString()
      });
      
      setProjects([...projects, { id: docRef.id, ...formData, members: [] }]);
      setShowAddProjectModal(false);
      setFormData({ name: '', description: '', email: '', password: '', role: 'client', userType: 'client' });
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      // Store current admin user
      const currentAdmin = auth.currentUser;
      if (!currentAdmin) {
        showNotification('Admin session expired. Please log in again.', 'error');
        return;
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Determine the role based on user type and role
      let finalRole;
      if (formData.userType === 'client') {
        finalRole = formData.role === 'head' ? 'client_head' : 'client';
      } else {
        finalRole = formData.role === 'manager' ? 'project_manager' : 'employee';
      }

      // Add user to project members
      const updatedMembers = [...(selectedProject.members || []), {
        email: formData.email,
        role: finalRole,
        uid: userCredential.user.uid,
        userType: formData.userType
      }];

      await updateDoc(doc(db, 'projects', selectedProject.id), {
        members: updatedMembers
      });

      // Update local state
      const updatedProjects = projects.map(p => 
        p.id === selectedProject.id 
          ? { ...p, members: updatedMembers }
          : p
      );
      setProjects(updatedProjects);
      setShowAddPersonModal(false);
      setFormData({ 
        name: '', 
        description: '', 
        email: '', 
        password: '', 
        role: 'client',
        userType: 'client'
      });
      
      // Show success notification
      showNotification(`${formData.email} has been successfully added as ${finalRole.replace('_', ' ')}`);

      // Force a page reload to reset the auth state
      window.location.reload();
    } catch (error) {
      console.error('Error adding person:', error);
      showNotification('Failed to add member. Please try again.', 'error');
    }
  };

  const handleDeleteClick = (projectId, e) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'projects', projectToDelete));
      setProjects(projects.filter(p => p.id !== projectToDelete));
      showNotification('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      showNotification('Failed to delete project', 'error');
    } finally {
      setShowDeleteConfirmModal(false);
      setProjectToDelete(null);
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setFormData({
      ...formData,
      email: member.email,
      role: member.role === 'client_head' ? 'head' : 
            member.role === 'project_manager' ? 'manager' : 
            member.role === 'client' ? 'client' : 'employee',
      userType: member.userType
    });
    setShowEditMemberModal(true);
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    if (!selectedProject || !editingMember) return;

    try {
      const updatedMembers = selectedProject.members.map(member => {
        if (member.uid === editingMember.uid) {
          let newRole;
          if (formData.userType === 'client') {
            newRole = formData.role === 'head' ? 'client_head' : 'client';
          } else {
            newRole = formData.role === 'manager' ? 'project_manager' : 'employee';
          }
          return {
            ...member,
            role: newRole,
            userType: formData.userType
          };
        }
        return member;
      });

      await updateDoc(doc(db, 'projects', selectedProject.id), {
        members: updatedMembers
      });

      // Update local state
      const updatedProjects = projects.map(p => 
        p.id === selectedProject.id 
          ? { ...p, members: updatedMembers }
          : p
      );
      setProjects(updatedProjects);
      setShowEditMemberModal(false);
      setEditingMember(null);
      setFormData({
        name: '',
        description: '',
        email: '',
        password: '',
        role: 'client',
        userType: 'client'
      });
      
      showNotification('Member role updated successfully');
    } catch (error) {
      console.error('Error updating member:', error);
      showNotification('Failed to update member role', 'error');
    }
  };

  const renderProjectDetailsModal = () => {
    if (!selectedProject) return null;

    const clients = selectedProject.members?.filter(m => m.userType === 'client') || [];
    const employees = selectedProject.members?.filter(m => m.userType === 'employee') || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
            <button
              onClick={() => {
                setShowProjectDetailsModal(false);
                setSelectedProject(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Clients Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Clients</h3>
                <button
                  onClick={() => {
                    setFormData({ ...formData, userType: 'client' });
                    setShowAddPersonModal(true);
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <UserPlus size={20} />
                  Add Client
                </button>
              </div>
              <div className="space-y-3">
                {clients.map((member) => (
                  <div key={member.uid} className="bg-white p-3 rounded shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-medium">{member.email}</p>
                      <p className="text-sm text-gray-600">{member.role.replace('_', ' ')}</p>
                    </div>
                    <button
                      onClick={() => handleEditMember(member)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                ))}
                {clients.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No clients added yet</p>
                )}
              </div>
            </div>

            {/* Employees Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Employees</h3>
                <button
                  onClick={() => {
                    setFormData({ ...formData, userType: 'employee' });
                    setShowAddPersonModal(true);
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <UserPlus size={20} />
                  Add Employee
                </button>
              </div>
              <div className="space-y-3">
                {employees.map((member) => (
                  <div key={member.uid} className="bg-white p-3 rounded shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-medium">{member.email}</p>
                      <p className="text-sm text-gray-600">{member.role.replace('_', ' ')}</p>
                    </div>
                    <button
                      onClick={() => handleEditMember(member)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                ))}
                {employees.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No employees added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEditMemberModal = () => {
    if (!editingMember) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Edit Member Role</h2>
            <button
              onClick={() => {
                setShowEditMemberModal(false);
                setEditingMember(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleUpdateMember} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Type
              </label>
              <select
                value={formData.userType}
                onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="client">Client</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {formData.userType === 'client' ? (
                  <>
                    <option value="client">Client</option>
                    <option value="head">Client Head</option>
                  </>
                ) : (
                  <>
                    <option value="employee">Employee</option>
                    <option value="manager">Project Manager</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditMemberModal(false);
                  setEditingMember(null);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Role
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          <CheckCircle2 className="w-5 h-5 mr-2" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header with Add Project Button */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
        <button
          onClick={() => setShowAddProjectModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Project
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Project Header */}
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                 onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {project.members?.length || 0} members
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProject(project);
                    setShowProjectDetailsModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(project.id, e)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                {expandedProject === project.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {expandedProject === project.id && (
              <div className="border-t border-gray-200 p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members</h4>
                  <div className="space-y-2">
                    {project.members?.map((member, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{member.email}</p>
                            <p className="text-xs text-gray-500 capitalize">{member.role.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Create New Project</h3>
                <button
                  onClick={() => setShowAddProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter project description"
                    rows="3"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddProjectModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Person Modal */}
      {showAddPersonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Add Team Member to {selectedProject?.name}</h3>
                <button
                  onClick={() => setShowAddPersonModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddPerson} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter password"
                    required
                  />
                </div>
                
                {/* User Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, userType: 'client', role: 'client' })}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                        formData.userType === 'client'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      <User className="w-5 h-5 mr-2" />
                      <span>Client</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, userType: 'employee', role: 'employee' })}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                        formData.userType === 'employee'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      <Briefcase className="w-5 h-5 mr-2" />
                      <span>Employee</span>
                    </button>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    {formData.userType === 'client' ? (
                      <>
                        <option value="client">Client</option>
                        <option value="head">Client Head</option>
                      </>
                    ) : (
                      <>
                        <option value="employee">Employee</option>
                        <option value="manager">Project Manager</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddPersonModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">Delete Project</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this project? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setProjectToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProjectDetailsModal && renderProjectDetailsModal()}
      {showEditMemberModal && renderEditMemberModal()}
    </div>
  );
}

export default Projects; 