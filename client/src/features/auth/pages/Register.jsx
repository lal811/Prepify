import React, { useState } from 'react';
import '../auth.form.scss';
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth.js";

const Register = () => {
  const navigate = useNavigate();
  const { handleRegister } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || !cleanEmail || !password) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMessage("Username must be at least 3 characters long.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await handleRegister({ username: cleanUsername, email: cleanEmail, password });
      navigate("/");
    } catch (error) {
      setErrorMessage(error.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        
        <div className="auth-brand">
          <Link to="/" className="auth-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="gradient-text">Prepify</span>
          </Link>
          <h1>Create an account</h1>
          <p>Start your AI-powered interview preparation journey today</p>
        </div>

        {errorMessage && (
          <div className="auth-alert" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <input 
                id="username"
                name="username"
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Choose a username (min 3 chars)" 
                required 
                minLength={3}
                autoComplete="username"
              />
            </div>
            <span className="field-hint">Must be 3-30 characters</span>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <input 
                id="email"
                name="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@example.com" 
                required 
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input 
                id="password"
                name="password"
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}  
                placeholder="Create a password (min 6 chars)" 
                required 
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <span className="field-hint">At least 6 characters required</span>
          </div>

          <button 
            type="submit" 
            className="auth-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Creating account...
              </>
            ) : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
