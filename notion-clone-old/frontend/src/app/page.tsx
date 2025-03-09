'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { FiEdit, FiUsers, FiLock, FiSearch } from 'react-icons/fi';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        {/* Hero section */}
        <div className="relative">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="pt-16 pb-20 px-4 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Your ideas, organized.</span>
                  <span className="block text-blue-600">Collaborative and beautiful.</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  A powerful note-taking app with Markdown support and real-time collaboration.
                  Create, share, and collaborate on notes with your team.
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                  {!loading && (
                    <>
                      {user ? (
                        <div className="rounded-md shadow">
                          <Link
                            href="/notes"
                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                          >
                            Go to My Notes
                          </Link>
                        </div>
                      ) : (
                        <>
                          <div className="rounded-md shadow">
                            <Link
                              href="/auth/register"
                              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                            >
                              Get Started
                            </Link>
                          </div>
                          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                            <Link
                              href="/auth/login"
                              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                            >
                              Sign In
                            </Link>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature section */}
        <div className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                A better way to take notes
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Everything you need to capture your ideas, organize your thoughts, and collaborate with others.
              </p>
            </div>

            <div className="mt-10">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <FiEdit className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Markdown Support</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Write in Markdown and see your formatting in real-time. Support for headings, lists, code blocks, and more.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <FiUsers className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Real-time Collaboration</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Work together with your team in real-time. See changes as they happen and never worry about conflicts.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <FiLock className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Secure Sharing</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Control who can view or edit your notes with fine-grained permissions. Keep your private notes private.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <FiSearch className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Powerful Search</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Find what you need quickly with full-text search across all your notes. Filter by categories for better organization.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:mt-0">
            <p className="text-center text-base text-gray-400">
              &copy; 2025 Notion Clone. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 