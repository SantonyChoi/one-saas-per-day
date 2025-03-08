'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { notesAPI, collaboratorsAPI } from '@/lib/api';
import { Note, Collaborator } from '@/types';
import Navbar from '@/components/Navbar';
import { FiSave, FiShare2, FiUsers, FiEye, FiEyeOff, FiEdit } from 'react-icons/fi';
import { 
  initializeSocket, 
  joinNote, 
  leaveNote, 
  updateNoteContent, 
  onContentUpdated, 
  onUserJoined, 
  onUserLeft, 
  removeEventListeners 
} from '@/lib/socket';
import ReactMarkdown from 'react-markdown';

const NoteDetailPage: React.FC = () => {
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activeUsers, setActiveUsers] = useState<{ userId: number; email: string; name?: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaboratorPermission, setCollaboratorPermission] = useState<'read' | 'write' | 'admin'>('read');
  const [hasAccess, setHasAccess] = useState(false);
  const [userPermission, setUserPermission] = useState<'read' | 'write' | 'admin' | 'owner' | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  
  const noteId = Number(params.id);
  
  // Fetch note data
  useEffect(() => {
    const fetchNote = async () => {
      if (authLoading) return;
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      if (isNaN(noteId)) {
        setError('Invalid note ID');
        return;
      }
      
      try {
        const response = await notesAPI.getNoteById(noteId);
        
        if (response.error) {
          setError(response.error);
          return;
        }
        
        if (response.note) {
          setNote(response.note);
          setTitle(response.note.title);
          setContent(response.note.content || '');
          setCategory(response.note.category || '');
          setIsPublic(response.note.is_public);
          
          // Determine user permissions and access
          let userHasAccess = false;
          let permission: 'read' | 'write' | 'admin' | 'owner' | null = null;
          
          // Check if user is the owner
          if (response.note.user_id === user.id) {
            userHasAccess = true;
            permission = 'owner';
          } 
          // Check if user is a collaborator
          else if (response.collaborators) {
            const userCollaborator = response.collaborators.find((c: Collaborator) => c.user_id === user.id);
            if (userCollaborator) {
              userHasAccess = true;
              permission = userCollaborator.permission;
            }
          }
          
          // Check if note is public (read-only access for non-collaborators)
          if (!userHasAccess && response.note.is_public) {
            userHasAccess = true;
            permission = 'read';
          }
          
          setHasAccess(userHasAccess);
          setUserPermission(permission);
          
          // Force preview mode for read-only users
          if (permission === 'read') {
            setShowPreview(true);
          }
          
          if (response.collaborators) {
            setCollaborators(response.collaborators);
          }
          
          // Initialize socket connection
          if (user) {
            const socket = initializeSocket(user.id.toString());
            
            // Join the note room
            joinNote(noteId);
            
            // Listen for content updates
            onContentUpdated((data) => {
              if (data.userId !== user.id) {
                setContent(data.content);
                if (data.title) setTitle(data.title);
              }
            });
            
            // Listen for user joined/left events
            onUserJoined((data) => {
              setActiveUsers((prev) => {
                if (!prev.some((u) => u.userId === data.userId)) {
                  return [...prev, data];
                }
                return prev;
              });
            });
            
            onUserLeft((data) => {
              setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
            });
          }
        }
      } catch (err) {
        console.error('Error fetching note:', err);
        setError('Failed to fetch note');
      }
    };
    
    fetchNote();
    
    // Cleanup socket connection
    return () => {
      if (noteId) {
        leaveNote(noteId);
        removeEventListeners();
      }
    };
  }, [user, authLoading, router, noteId]);
  
  // Handle content change with debounce
  useEffect(() => {
    if (!note || !user) return;
    
    const timer = setTimeout(() => {
      updateNoteContent(noteId, content, title);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [content, title, noteId, note, user]);
  
  // Force preview mode for read-only users
  useEffect(() => {
    if (userPermission === 'read') {
      setShowPreview(true);
    }
  }, [userPermission]);
  
  // Save note
  const handleSave = async () => {
    if (!title) {
      setError('Title is required');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await notesAPI.updateNote(noteId, {
        title,
        content,
        category: category || undefined,
        is_public: isPublic
      });
      
      if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Add collaborator
  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!collaboratorEmail) {
      setError('Email is required');
      return;
    }
    
    setIsAddingCollaborator(true);
    setError(null);
    
    try {
      const response = await collaboratorsAPI.addCollaborator(
        noteId,
        collaboratorEmail,
        collaboratorPermission
      );
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      // Refresh collaborators list
      const collabResponse = await collaboratorsAPI.getNoteCollaborators(noteId);
      
      if (!collabResponse.error && collabResponse.collaborators) {
        setCollaborators(collabResponse.collaborators);
      }
      
      // Reset form
      setCollaboratorEmail('');
      setCollaboratorPermission('read');
      setIsAddingCollaborator(false);
    } catch (err) {
      console.error('Error adding collaborator:', err);
      setError('Failed to add collaborator');
      setIsAddingCollaborator(false);
    }
  };
  
  // Remove collaborator
  const handleRemoveCollaborator = async (userId: number) => {
    if (window.confirm('Are you sure you want to remove this collaborator?')) {
      try {
        const response = await collaboratorsAPI.removeCollaborator(noteId, userId);
        
        if (response.error) {
          setError(response.error);
          return;
        }
        
        // Update collaborators list
        setCollaborators(collaborators.filter((c) => c.user_id !== userId));
      } catch (err) {
        console.error('Error removing collaborator:', err);
        setError('Failed to remove collaborator');
      }
    }
  };
  
  // Update collaborator permission
  const handleUpdatePermission = async (userId: number, permission: 'read' | 'write' | 'admin') => {
    try {
      const response = await collaboratorsAPI.updateCollaboratorPermission(noteId, userId, permission);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      // Update collaborators list
      setCollaborators(
        collaborators.map((c) =>
          c.user_id === userId ? { ...c, permission } : c
        )
      );
    } catch (err) {
      console.error('Error updating permission:', err);
      setError('Failed to update permission');
    }
  };
  
  if (authLoading || !note) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show access denied page if user doesn't have access
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center py-12">
                  <svg 
                    className="mx-auto h-16 w-16 text-red-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V7a3 3 0 00-3-3H6a3 3 0 00-3 3v7m14-7a3 3 0 00-3-3h-3a3 3 0 00-3 3v7m14 0h-3" 
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    You don't have permission to access this note.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => router.push('/notes')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Go to My Notes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  const isOwner = user && note.user_id === user.id;
  const canEdit = userPermission === 'owner' || userPermission === 'admin' || userPermission === 'write';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
              {showPreview ? 'Preview' : 'Edit Note'}
            </h1>
            
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {showPreview ? (
                    <>
                      <FiEdit className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
                      Edit
                    </>
                  ) : (
                    <>
                      <FiEye className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
                      Preview
                    </>
                  )}
                </button>
              )}
              
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isPublic ? (
                    <>
                      <FiEyeOff className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
                      Make Private
                    </>
                  ) : (
                    <>
                      <FiEye className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
                      Make Public
                    </>
                  )}
                </button>
              )}
              
              {canEdit && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSaving ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  <FiSave className="mr-2 -ml-1 h-5 w-5" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              {showPreview || !canEdit ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
                    <div className="prose max-w-none">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          placeholder="Note title"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                          Category (optional)
                        </label>
                        <input
                          type="text"
                          name="category"
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          placeholder="e.g. Work, Personal, Ideas"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                          Content (Markdown supported)
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="content"
                            name="content"
                            rows={20}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="# Your markdown content here"
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Write your note content using Markdown syntax.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="lg:col-span-1">
              {/* Active users */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Active Users
                  </h3>
                </div>
                <div className="border-t border-gray-200">
                  <div className="px-4 py-5 sm:p-6">
                    {activeUsers.length === 0 ? (
                      <p className="text-sm text-gray-500">No active users</p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {activeUsers.map((activeUser) => (
                          <li key={activeUser.userId} className="py-2">
                            <div className="flex items-center">
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">
                                  {activeUser.name || activeUser.email}
                                </p>
                                {activeUser.name && (
                                  <p className="text-sm text-gray-500">{activeUser.email}</p>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Collaborators */}
              {isOwner && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Collaborators
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Share this note with others
                    </p>
                  </div>
                  <div className="border-t border-gray-200">
                    <div className="px-4 py-5 sm:p-6">
                      <form onSubmit={handleAddCollaborator} className="space-y-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={collaboratorEmail}
                            onChange={(e) => setCollaboratorEmail(e.target.value)}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            placeholder="user@example.com"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="permission" className="block text-sm font-medium text-gray-700">
                            Permission
                          </label>
                          <select
                            id="permission"
                            name="permission"
                            value={collaboratorPermission}
                            onChange={(e) => setCollaboratorPermission(e.target.value as any)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          >
                            <option value="read">Read only</option>
                            <option value="write">Can edit</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        
                        <div>
                          <button
                            type="submit"
                            disabled={isAddingCollaborator}
                            className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                              isAddingCollaborator ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                          >
                            <FiShare2 className="mr-2 -ml-1 h-5 w-5" />
                            {isAddingCollaborator ? 'Adding...' : 'Add Collaborator'}
                          </button>
                        </div>
                      </form>
                      
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900">Current Collaborators</h4>
                        {collaborators.length === 0 ? (
                          <p className="mt-2 text-sm text-gray-500">No collaborators yet</p>
                        ) : (
                          <ul className="mt-2 divide-y divide-gray-200">
                            {collaborators.map((collaborator) => (
                              <li key={collaborator.id} className="py-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {collaborator.name || collaborator.email}
                                    </p>
                                    {collaborator.name && (
                                      <p className="text-sm text-gray-500">{collaborator.email}</p>
                                    )}
                                    <div className="mt-1">
                                      <select
                                        value={collaborator.permission}
                                        onChange={(e) =>
                                          handleUpdatePermission(
                                            collaborator.user_id,
                                            e.target.value as 'read' | 'write' | 'admin'
                                          )
                                        }
                                        className="block w-full pl-3 pr-10 py-1 text-xs border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                                      >
                                        <option value="read">Read only</option>
                                        <option value="write">Can edit</option>
                                        <option value="admin">Admin</option>
                                      </select>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCollaborator(collaborator.user_id)}
                                    className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    <svg
                                      className="h-4 w-4"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NoteDetailPage; 