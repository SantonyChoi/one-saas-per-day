'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { notesAPI, collaboratorsAPI } from '@/lib/api';
import { Note } from '@/types';
import Navbar from '@/components/Navbar';
import { FiPlus, FiSearch, FiFilter, FiEdit, FiTrash2, FiShare2 } from 'react-icons/fi';

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showShared, setShowShared] = useState(false);
  
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Fetch notes
  useEffect(() => {
    const fetchNotes = async () => {
      if (authLoading) return;
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user's notes
        const response = await notesAPI.getAllNotes(selectedCategory || undefined, searchQuery || undefined);
        
        if (response.error) {
          setError(response.error);
          return;
        }
        
        if (response.notes) {
          setNotes(response.notes);
          
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(
              response.notes
                .map((note: Note) => note.category)
                .filter((category: string | null) => category !== null)
            )
          ) as string[];
          
          setCategories(uniqueCategories);
        }
        
        // Fetch shared notes
        const sharedResponse = await collaboratorsAPI.getCollaborativeNotes();
        
        if (!sharedResponse.error && sharedResponse.notes) {
          setSharedNotes(sharedResponse.notes);
        }
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError('Failed to fetch notes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, [user, authLoading, router, selectedCategory, searchQuery]);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The effect will trigger the search
  };
  
  // Handle delete note
  const handleDeleteNote = async (noteId: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        const response = await notesAPI.deleteNote(noteId);
        
        if (response.error) {
          setError(response.error);
          return;
        }
        
        // Remove the deleted note from the list
        setNotes(notes.filter(note => note.id !== noteId));
      } catch (err) {
        console.error('Error deleting note:', err);
        setError('Failed to delete note');
      }
    }
  };
  
  // Filter notes based on the selected view
  const displayedNotes = showShared ? sharedNotes : notes;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
              {showShared ? 'Shared with Me' : 'My Notes'}
            </h1>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setShowShared(!showShared)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiShare2 className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
                {showShared ? 'Show My Notes' : 'Show Shared Notes'}
              </button>
              
              <Link
                href="/notes/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="mr-2 -ml-1 h-5 w-5" />
                New Note
              </Link>
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <form onSubmit={handleSearch} className="w-full md:w-1/2">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Search notes..."
                    />
                    <button type="submit" className="sr-only">Search</button>
                  </div>
                </form>
                
                <div className="w-full md:w-auto">
                  <div className="relative inline-block text-left w-full md:w-auto">
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => setSelectedCategory(e.target.value || null)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
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
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading notes...</p>
            </div>
          ) : displayedNotes.length === 0 ? (
            <div className="text-center py-12 bg-white shadow overflow-hidden sm:rounded-lg">
              <p className="text-gray-500 mb-4">
                {showShared
                  ? "You don't have any notes shared with you yet."
                  : searchQuery || selectedCategory
                  ? "No notes match your search criteria."
                  : "You don't have any notes yet."}
              </p>
              {!showShared && !searchQuery && !selectedCategory && (
                <Link
                  href="/notes/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiPlus className="mr-2 -ml-1 h-5 w-5" />
                  Create your first note
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedNotes.map((note: any) => (
                <div
                  key={note.id}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {note.title}
                      </h3>
                      {note.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {note.category}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-3">
                      {note.content || 'No content'}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/notes/${note.id}`}
                          className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiEdit className="h-4 w-4" />
                        </Link>
                        {!showShared && (
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotesPage; 