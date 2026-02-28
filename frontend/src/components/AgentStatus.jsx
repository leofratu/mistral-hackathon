export default function AgentStatus({ agent, message, inline = false }) {
    if (!agent && !message) return null;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--text-primary)',
        }}>
            {agent && (
                <span style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    background: 'var(--text-primary)',
                    borderRadius: '1px',
                }} />
            )}
            <span style={{ fontWeight: 500 }}>{agent || 'System'}</span>
            <span style={{ color: 'var(--text-secondary)' }}>— {message || 'Running task...'}</span>
        </div>
    );
}
