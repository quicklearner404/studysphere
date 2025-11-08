// Location: src/components/Header.tsx

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import {
  ChartBarIcon,
  UserIcon,
  ChatBubbleLeftEllipsisIcon,
  UserGroupIcon,
  ClockIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HeaderProps {
  studentName?: string;
}

export default function Header({ studentName }: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActive = (path: string) => router.pathname === path;
  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Profile', path: '/profile' },
    { name: 'Quizzes', path: '/quizzes' },
    { name: 'Discussions', path: '/discussion' },
    { name: 'Study Sessions', path: '/study-sessions' },
    { name: 'Pomodoro', path: '/pomodoro' },
  ];

  const getIconFor = (name: string) => {
    switch (name) {
      case 'Dashboard':
        return <ChartBarIcon className="w-5 h-5 inline-block mr-2" />;
      case 'Profile':
        return <UserIcon className="w-5 h-5 inline-block mr-2" />;
      case 'Quizzes':
        return <BookOpenIcon className="w-5 h-5 inline-block mr-2" />;
      case 'Discussions':
        return <ChatBubbleLeftEllipsisIcon className="w-5 h-5 inline-block mr-2" />;
      case 'Study Sessions':
        return <UserGroupIcon className="w-5 h-5 inline-block mr-2" />;
      case 'Pomodoro':
        return <ClockIcon className="w-5 h-5 inline-block mr-2" />;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b-2 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-bold text-xl">
                S
              </div>
              <span className="text-xl font-bold text-black hidden sm:block">
                StudySphere
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  isActive(link.path)
                    ? 'bg-black text-white'
                    : 'text-black hover:bg-gray-100'
                }`}
              >
                {getIconFor(link.name)}
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Desktop User Menu */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {studentName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="font-medium text-black">{studentName || 'User'}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-black rounded-lg shadow-lg">
                  <Link
                    href="/profile"
                    className="block px-4 py-3 text-black hover:bg-gray-100 border-b border-gray-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    👤 My Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-3 text-black hover:bg-gray-100 border-b border-gray-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ⚙️ Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-b-lg"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border-2 border-black hover:bg-gray-100"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t-2 border-black">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-4 py-3 rounded-lg font-medium transition ${
                    isActive(link.path)
                      ? 'bg-black text-white'
                      : 'text-black hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {getIconFor(link.name)}
                  {link.name}
                </Link>
              ))}
              
              {/* Mobile User Section */}
              <div className="pt-4 border-t-2 border-black mt-4">
                <div className="px-4 py-2 text-sm text-gray-600">
                  Logged in as <span className="font-bold text-black">{studentName || 'User'}</span>
                </div>
                <Link
                  href="/settings"
                  className="block px-4 py-3 text-black hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ⚙️ Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  🚪 Logout
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}