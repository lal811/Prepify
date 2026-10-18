import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import './header.scss';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();

  const usernameInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !avatarRef.current?.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSignOut = async () => {
    await handleLogout();
    setIsDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Brand Logo */}
        <Link to="/" className="header-logo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="logo-text">Prepify</span>
          <span className="logo-badge">AI</span>
        </Link>

        {/* Profile Avatar & Dropdown */}
        <div className="header-profile">
          <button
            ref={avatarRef}
            className="avatar-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Toggle user menu"
            aria-expanded={isDropdownOpen}
          >
            {usernameInitial}
          </button>

          {isDropdownOpen && (
            <div ref={dropdownRef} className="profile-dropdown">
              <div className="dropdown-user-info">
                <div className="user-name">{user?.username || 'Candidate'}</div>
                <div className="user-email">{user?.email || ''}</div>
              </div>

              <div className="dropdown-divider"></div>

              <button
                className="dropdown-signout-button"
                onClick={handleSignOut}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
