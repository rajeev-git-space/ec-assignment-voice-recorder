import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import RecordingPage from './components/RecordingPage';
import './styles/Navbar.css';

function App() {
  return (
    <Router>
      <div className="navbar">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/recording" className="nav-link">Recording</Link>
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recording" element={<RecordingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
