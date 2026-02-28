import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';
import ReviewPage from './pages/ReviewPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  const [paperState, setPaperState] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [llmConfig, setLlmConfig] = useState(() => {
    const saved = localStorage.getItem('llmConfig');
    return saved ? JSON.parse(saved) : { provider: 'openai', model: '', api_key: '' };
  });

  return (
    <BrowserRouter>
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand">
          <span className="icon">📝</span>
          Research Paper AI
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            Home
          </NavLink>
          <NavLink to="/editor" className={({ isActive }) => isActive ? 'active' : ''}>
            Editor
          </NavLink>
          <NavLink to="/review" className={({ isActive }) => isActive ? 'active' : ''}>
            Review
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
            Settings
          </NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={
          <HomePage
            setPaperState={setPaperState}
            setSessionId={setSessionId}
            llmConfig={llmConfig}
          />
        } />
        <Route path="/editor" element={
          <EditorPage
            paperState={paperState}
            setPaperState={setPaperState}
            sessionId={sessionId}
            llmConfig={llmConfig}
          />
        } />
        <Route path="/review" element={
          <ReviewPage paperState={paperState} />
        } />
        <Route path="/settings" element={
          <SettingsPage llmConfig={llmConfig} setLlmConfig={setLlmConfig} />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
