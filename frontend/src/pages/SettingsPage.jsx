import React from 'react';

export default function SettingsPage({ llmConfig, setLlmConfig }) {
    const handleChange = (field, value) => {
        const newConfig = { ...llmConfig, [field]: value };
        setLlmConfig(newConfig);
        localStorage.setItem('llmConfig', JSON.stringify(newConfig));
    };

    const providers = [
        { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o' },
        { id: 'gemini', name: 'Google Gemini', defaultModel: 'gemini-1.5-pro' },
        { id: 'mistral', name: 'Mistral AI', defaultModel: 'mistral-large-latest' },
    ];

    return (
        <div className="page fade-in" style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 500, margin: 0 }}>Model Configuration</h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Select your preferred LLM provider. Keys defined here override the backend .env file.
                </p>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Provider Selection */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>
                        PROVIDER
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {providers.map(p => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    handleChange('provider', p.id);
                                    if (!llmConfig.model || providers.find(x => x.id === llmConfig.provider)?.defaultModel === llmConfig.model) {
                                        handleChange('model', p.defaultModel);
                                    }
                                }}
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

                {/* Custom Model Input */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>
                        MODEL NAME <span style={{ color: 'var(--text-muted)' }}>(optional override)</span>
                    </label>
                    <input
                        className="input"
                        style={{ width: '100%' }}
                        value={llmConfig.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                        placeholder={`e.g. ${providers.find(p => p.id === llmConfig.provider)?.defaultModel}`}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Leave blank to use the backend default.
                    </div>
                </div>

                {/* Custom API Key Input */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>
                        API KEY <span style={{ color: 'var(--text-muted)' }}>(optional override)</span>
                    </label>
                    <input
                        className="input"
                        type="password"
                        style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                        value={llmConfig.api_key}
                        onChange={(e) => handleChange('api_key', e.target.value)}
                        placeholder={`sk-... (${llmConfig.provider.toUpperCase()}_API_KEY)`}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Saved only in your browser's local storage.
                    </div>
                </div>

            </div>

        </div>
    );
}
