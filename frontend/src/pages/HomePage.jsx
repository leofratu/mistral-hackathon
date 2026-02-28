import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentStatus from '../components/AgentStatus';

const API_BASE = 'http://localhost:8000';

const SAMPLE_TOPICS = [
    "Impact of LLMs on scientific discovery",
    "Quantum computing in drug discovery",
    "AI-optimized urban planning",
];

export default function HomePage({ setPaperState, setSessionId, llmConfig }) {
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [events, setEvents] = useState([]);
    const [progress, setProgress] = useState(0);
    const [currentAgent, setCurrentAgent] = useState('');
    const [agentMessage, setAgentMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    // Use a ref so the async callback always gets the latest llmConfig
    const llmConfigRef = useRef(llmConfig);
    llmConfigRef.current = llmConfig;

    const handleGenerate = async () => {
        if (!topic.trim() || isGenerating) return;
        setIsGenerating(true);
        setEvents([]);
        setProgress(5); // Start visible immediately
        setCurrentAgent('init');
        setAgentMessage('Connecting to pipeline...');
        setErrorMsg('');

        try {
            const resp = await fetch(`${API_BASE}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic.trim(), llm_config: llmConfigRef.current }),
            });

            if (!resp.ok) {
                throw new Error(`Server error: ${resp.status}`);
            }

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const event = JSON.parse(line.slice(6));
                        setEvents(prev => [...prev, event]);

                        switch (event.event) {
                            case 'session_start':
                                setProgress(8);
                                setAgentMessage('Session started');
                                break;
                            case 'agent_start':
                                setCurrentAgent(event.data.agent);
                                setAgentMessage(event.data.message);
                                setProgress(prev => Math.min(prev + 5, 90));
                                break;
                            case 'agent_done':
                                setProgress(prev => Math.min(prev + 8, 90));
                                break;
                            case 'iteration_start':
                                setProgress(30 + (event.data.iteration / event.data.max) * 50);
                                break;
                            case 'iteration_done':
                                setProgress(30 + (event.data.iteration / event.data.max) * 60);
                                break;
                            case 'error':
                                setCurrentAgent('error');
                                setAgentMessage(event.data.message);
                                setErrorMsg(event.data.message);
                                setIsGenerating(false);
                                return;
                            case 'complete':
                                setProgress(100);
                                setPaperState(event.data);
                                setSessionId(event.data.session_id);
                                setCurrentAgent('done');
                                setAgentMessage('Paper generated — redirecting to editor...');
                                setTimeout(() => navigate('/editor'), 600);
                                return;
                        }
                    } catch (parseErr) {
                        console.warn('SSE parse error:', parseErr, line);
                    }
                }
            }
        } catch (err) {
            setErrorMsg(`Connection error: ${err.message}`);
            setCurrentAgent('error');
            setAgentMessage(`Failed: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="page fade-in" style={{ maxWidth: 640, marginTop: '10vh' }}>

            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: 8, letterSpacing: '-0.02em' }}>
                    Research Paper Intelligence
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Multi-agent orchestration for academic synthesis and refinement.
                </p>
            </div>

            <div style={{ marginBottom: 24, position: 'relative' }}>
                <input
                    className="input"
                    style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Enter research topic..."
                    disabled={isGenerating}
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    autoFocus
                />
                <div style={{ position: 'absolute', right: 8, top: 8 }}>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleGenerate}
                        disabled={isGenerating || !topic.trim()}
                    >
                        {isGenerating ? 'Running...' : 'Generate ↵'}
                    </button>
                </div>
            </div>

            {!isGenerating && events.length === 0 && !errorMsg && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {SAMPLE_TOPICS.map((t, i) => (
                        <button
                            key={i}
                            className="btn btn-ghost btn-sm"
                            onClick={() => setTopic(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}

            {/* Error display */}
            {errorMsg && !isGenerating && (
                <div style={{
                    marginTop: 16,
                    padding: '12px 16px',
                    background: 'var(--error-soft)',
                    border: '1px solid var(--error)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--error)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    wordBreak: 'break-word',
                }}>
                    {errorMsg}
                </div>
            )}

            {/* Progress panel — always visible during generation */}
            {(isGenerating || events.length > 0) && (
                <div style={{ marginTop: 32, border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>

                    <div style={{ padding: '16px' }}>
                        <AgentStatus agent={currentAgent} message={agentMessage} inline={true} />

                        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12, maxHeight: 220, overflowY: 'auto' }}>
                            {events.length === 0 && (
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Waiting for events...
                                </div>
                            )}
                            {events.slice(-8).map((ev, i) => (
                                <div key={i} style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.75rem',
                                    color: ev.event === 'complete' ? 'var(--success)'
                                        : ev.event === 'error' ? 'var(--error)'
                                            : 'var(--text-muted)',
                                    marginBottom: 4,
                                    display: 'flex',
                                    gap: 8
                                }}>
                                    <span style={{ color: 'var(--text-muted)', opacity: 0.6, flexShrink: 0 }}>
                                        {ev.event === 'agent_start' ? '→' : ev.event === 'agent_done' ? '✓' : '·'}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        [{ev.event}]
                                    </span>
                                    <span style={{ color: 'var(--text-primary)' }}>
                                        {ev.data?.message || ev.data?.agent || ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
