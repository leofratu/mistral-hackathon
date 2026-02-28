import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000';

export default function EditorPage({ paperState, setPaperState, sessionId, llmConfig }) {
    const [refinementInput, setRefinementInput] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [activeSection, setActiveSection] = useState(0);
    const navigate = useNavigate();

    if (!paperState || !paperState.draft) {
        return (
            <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontFamily: 'var(--font-mono)' }}>[ No active session ]</p>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>
                    Return to Prompt
                </button>
            </div>
        );
    }

    const { draft, critiques, graphs, review, score_history } = paperState;
    const latestCritique = critiques?.[critiques.length - 1];
    const sections = draft?.sections || [];

    const handleRefine = useCallback(async () => {
        if (!refinementInput.trim() || !sessionId) return;
        setIsRefining(true);

        try {
            const resp = await fetch(`${API_BASE} /api/refine / ${sessionId} `, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instruction: refinementInput.trim(), llm_config: llmConfig }),
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
                        if (event.event === 'complete') {
                            setPaperState(event.data);
                        }
                    } catch (e) { /* skip */ }
                }
            }
            setRefinementInput('');
        } catch (err) {
            console.error('Refine error:', err);
        } finally {
            setIsRefining(false);
        }
    }, [refinementInput, sessionId, setPaperState]);

    // Underline citations like lint errors instead of badges
    const renderContent = (text) => {
        if (!text) return null;
        const parts = text.split(/(\[REF\d+\])/g);
        return parts.map((part, i) =>
            /\[REF\d+\]/.test(part) ? (
                <span key={i} style={{
                    color: 'var(--info)',
                    cursor: 'help',
                    borderBottom: '1px dotted var(--info)',
                    paddingBottom: '2px'
                }} title="Citation missing/placeholder">{part}</span>
            ) : <span key={i}>{part}</span>
        );
    };

    return (
        <div className="page-full fade-in">
            {/* Top Bar Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        ~/workspace/{paperState.session_id.slice(0, 8)}/
                    </span>
                    <h1 style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>
                        {paperState.outline?.title || paperState.topic}
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>v{draft.version}.0</span>
                    {review && <span className="badge badge-success" style={{ marginLeft: 8 }}>Score {review.overall_score}</span>}
                    <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 8px' }} />
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/review')}>
                        View Analytics
                    </button>
                </div>
            </div>

            <div className="editor-grid">
                {/* Explorer Sidebar */}
                <div style={{ borderRight: '1px solid var(--border)', paddingRight: 16 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>
                        EXPLORER
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {sections.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveSection(i)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '6px 8px',
                                    background: activeSection === i ? 'var(--bg-hover)' : 'transparent',
                                    color: activeSection === i ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    border: '1px solid',
                                    borderColor: activeSection === i ? 'var(--border)' : 'transparent',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font)',
                                }}
                            >
                                <span style={{ width: 16, color: 'var(--text-muted)' }}>{activeSection === i ? '▾' : '▸'}</span>
                                {s.title}
                            </button>
                        ))}
                    </div>

                    {/* Validation Problems */}
                    {latestCritique && latestCritique.issues.length > 0 && (
                        <div style={{ marginTop: 32 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                                PROBLEMS <span className="badge badge-warning">{latestCritique.issues.length}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
                                {latestCritique.issues.map((issue, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                                        <span style={{ color: issue.severity === 'high' ? 'var(--error)' : 'var(--warning)', fontFamily: 'var(--font-mono)' }}>x</span>
                                        <div style={{ color: 'var(--text-secondary)' }}>
                                            <div style={{ color: 'var(--text-primary)', marginBottom: 2 }}>{issue.type.replace(/_/g, ' ')}</div>
                                            {issue.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Editor Main Canvas */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: 16 }}>
                        {/* Editor Tabs (fake) */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                            <div style={{
                                padding: '8px 16px',
                                borderBottom: '2px solid var(--text-primary)',
                                color: 'var(--text-primary)',
                                fontSize: '0.85rem'
                            }}>
                                {sections[activeSection]?.title}.md
                            </div>
                        </div>

                        {sections[activeSection] && (
                            <div className="prose">
                                {renderContent(sections[activeSection].content)}
                            </div>
                        )}

                        {/* Graphs render in Results section */}
                        {graphs && graphs.length > 0 && activeSection === sections.findIndex(s => s.title.toLowerCase().includes('result')) && (
                            <div style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                                <h3 style={{ fontSize: '0.9rem', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>// generated_visuals</h3>
                                <div style={{ display: 'grid', gap: 24 }}>
                                    {graphs.map((g, i) => (
                                        <div key={i} style={{ background: 'var(--bg-secondary)', padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 12 }}>{g.title}</div>
                                            <img
                                                src={`${API_BASE} /graphs/${g.filename} `}
                                                alt={g.title}
                                                style={{ width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                            />
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 12 }}>{g.explanation}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Refinement Panel (Terminal style) */}
                    <div style={{
                        marginTop: 16,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 12
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>~/agent/refine</div>
                        <div className="input-group">
                            <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>$</span>
                            <input
                                className="input"
                                style={{ border: 'none', background: 'transparent', padding: '6px 0' }}
                                value={refinementInput}
                                onChange={e => setRefinementInput(e.target.value)}
                                placeholder="Instruct the agent (e.g. 'Make it more technical')..."
                                disabled={isRefining}
                                onKeyDown={e => e.key === 'Enter' && handleRefine()}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
