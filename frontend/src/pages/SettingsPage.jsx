import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

export default function SettingsPage({ llmConfig, setLlmConfig }) {
    const [streamerMode, setStreamerMode] = useState(() => {
        return localStorage.getItem('streamerMode') === 'true';
    });
    const [models, setModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);

    const handleChange = (updates) => {
        const newConfig = { ...llmConfig, ...updates };
        setLlmConfig(newConfig);
        localStorage.setItem('llmConfig', JSON.stringify(newConfig));
    };

    const toggleStreamerMode = () => {
        const next = !streamerMode;
        setStreamerMode(next);
        localStorage.setItem('streamerMode', String(next));
    };

    const providers = [
        { id: 'openai', name: 'OpenAI' },
        { id: 'gemini', name: 'Google Gemini' },
        { id: 'mistral', name: 'Mistral AI' },
    ];

    // Fetch available models whenever provider changes
    useEffect(() => {
        const fetchModels = async () => {
            setLoadingModels(true);
            try {
                const resp = await fetch(`${API_BASE}/api/models/${llmConfig.provider}`);
                const data = await resp.json();
                setModels(data.models || []);
            } catch {
                setModels([]);
            } finally {
                setLoadingModels(false);
            }
        };
        fetchModels();
    }, [llmConfig.provider]);

    return (
        <div className="page fade-in" style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 500, margin: 0 }}>Model Configuration</h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Select your preferred LLM provider and model.
                </p>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Streamer Mode Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>STREAMER MODE</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Hides API key field entirely for safe screen sharing
                        </div>
                    </div>
                    <button
                        onClick={toggleStreamerMode}
                        style={{
                            width: 48,
                            height: 26,
                            borderRadius: 13,
                            border: 'none',
                            background: streamerMode ? '#22c55e' : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background 0.2s ease',
                            flexShrink: 0,
                        }}
                    >
                        <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: 3,
                            left: streamerMode ? 25 : 3,
                            transition: 'left 0.2s ease',
                        }} />
                    </button>
                </div>

                {/* Provider Selection */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>
                        PROVIDER
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {providers.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleChange({ provider: p.id, model: '' })}
                                style={{
                                    padding: '12px',
                                    background: llmConfig.provider === p.id ? 'var(--text-primary)' : 'var(--bg-secondary)',
                                    color: llmConfig.provider === p.id ? 'var(--bg-primary)' : 'var(--text-primary)',
                                    border: `1px solid ${llmConfig.provider === p.id ? 'var(--text-primary)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-mono)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Model Selector */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>
                        MODEL
                    </label>
                    {loadingModels ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '12px 0' }}>
                            Loading models...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {models.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => handleChange({ model: m.id })}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: llmConfig.model === m.id ? 'var(--bg-secondary)' : 'transparent',
                                        color: 'var(--text-primary)',
                                        border: `1px solid ${llmConfig.model === m.id ? 'var(--text-muted)' : 'var(--border)'}`,
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <div>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 500 }}>
                                            {m.name}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 10 }}>
                                            {m.description}
                                        </span>
                                    </div>
                                    {llmConfig.model === m.id && (
                                        <span style={{ color: '#22c55e', fontSize: '0.85rem', flexShrink: 0 }}>✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        {llmConfig.model
                            ? <span>Selected: <code style={{ color: 'var(--text-secondary)' }}>{llmConfig.model}</code></span>
                            : 'No model selected — backend default will be used.'
                        }
                    </div>
                </div>

                {/* API Key Input — hidden entirely in streamer mode */}
                {!streamerMode ? (
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>
                            API KEY <span style={{ color: 'var(--text-muted)' }}>(optional override)</span>
                        </label>
                        <input
                            className="input"
                            type="password"
                            style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                            value={llmConfig.api_key}
                            onChange={(e) => handleChange({ api_key: e.target.value })}
                            placeholder={`${llmConfig.provider.toUpperCase()}_API_KEY`}
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Saved only in your browser's local storage.
                        </div>
                    </div>
                ) : (
                    <div style={{
                        padding: '12px 16px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <span style={{ fontSize: '0.85rem' }}>🔒</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            API key field hidden — streamer mode is active
                            {llmConfig.api_key && (
                                <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
                                    (key configured ✓)
                                </span>
                            )}
                        </span>
                    </div>
                )}

            </div>

        </div>
    );
}
