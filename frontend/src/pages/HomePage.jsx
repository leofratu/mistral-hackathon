import { useState, useCallback } from 'react';
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
    const navigate = useNavigate();

    const handleGenerate = useCallback(async () => {
        if (!topic.trim()) return;
        setIsGenerating(true);
        setEvents([]);
        setProgress(0);

        try {
            const resp = await fetch(`${API_BASE}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic.trim(), llm_config: llmConfig }),
            });

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
                            case 'agent_start':
                                setCurrentAgent(event.data.agent);
                                setAgentMessage(event.data.message);
                                break;
                            case 'iteration_start':
                                setProgress((event.data.iteration / event.data.max) * 80);
                                break;
                            case 'iteration_done':
                                setProgress(80 + (event.data.iteration / 3) * 15);
                                break;
                            case 'complete':
                                setProgress(100);
                                setPaperState(event.data);
                                setSessionId(event.data.session_id);
                                setCurrentAgent('');
                                setAgentMessage('Complete');
                                setTimeout(() => navigate('/editor'), 400);
                                break;
                        }
                    } catch (e) { /* skip */ }
                }
            }
        } catch (err) {
            setAgentMessage(`Error: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    }, [topic, setPaperState, setSessionId, navigate]);

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

            {!isGenerating && events.length === 0 && (
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

            {isGenerating && (
                <div className="slide-down" style={{ marginTop: 32, border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>

                    <div style={{ padding: '16px' }}>
                        <AgentStatus agent={currentAgent} message={agentMessage} inline={true} />

                        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16, maxHeight: 200, overflowY: 'auto' }}>
                            {events.slice(-5).map((ev, i) => (
                                <div key={i} style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.75rem',
                                    color: ev.event === 'complete' ? 'var(--success)' : 'var(--text-muted)',
                                    marginBottom: 4,
                                    display: 'flex',
                                    gap: 8
                                }}>
                                    <span style={{ opacity: 0.5 }}>{new Date().toISOString().split('T')[1].slice(0, 8)}</span>
                                    <span>[{ev.event}]</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{ev.data?.message || ev.data?.agent || ''}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
