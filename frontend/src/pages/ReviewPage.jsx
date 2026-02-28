import { useNavigate } from 'react-router-dom';
import RadarChart from '../components/RadarChart';
import QualityGauge from '../components/QualityGauge';

export default function ReviewPage({ paperState }) {
    const navigate = useNavigate();

    if (!paperState || !paperState.review) {
        return (
            <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
                <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: 24 }}>[ Metrics unavailable ]</p>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>
                    Initialize Workspace
                </button>
            </div>
        );
    }

    const { review, score_history } = paperState;
    const { scores, overall_score, publication_readiness, summary, before_snapshot, after_snapshot } = review;

    return (
        <div className="page fade-in">
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 500, margin: 0 }}>Analytics Dashboard</h1>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                        SESSION_{paperState.session_id.slice(0, 6)} / METRICS
                    </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/editor')}>
                    Return to Editor
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: 24, marginBottom: 24 }}>

                {/* Core Metrics Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 24, letterSpacing: '0.05em' }}>
                            OVERALL QUALITY SCORE
                        </div>
                        <QualityGauge score={overall_score} size={160} />
                    </div>

                    <div className="card">
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16, letterSpacing: '0.05em' }}>
                            READINESS PROBABILITY
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontSize: '2rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {Math.round(publication_readiness * 100)}%
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>threshold met</span>
                        </div>
                        <div className="progress-bar" style={{ marginTop: 12, height: 4 }}>
                            <div
                                className="progress-fill"
                                style={{ width: `${Math.round(publication_readiness * 100)}%`, background: publication_readiness >= 0.7 ? 'var(--success)' : 'var(--warning)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Detailed Metrics & Radar */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                            DIMENSIONAL ANALYSIS
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 32 }}>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <RadarChart scores={scores} size={240} />
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
                            {Object.entries(scores).map(([key, val]) => (
                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: val >= 80 ? 'var(--success)' : 'var(--text-primary)' }}>
                                        {val}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trajectory & Diff */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>

                <div className="card">
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 20, letterSpacing: '0.05em' }}>
                        SCORE TRAJECTORY
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100, borderBottom: '1px solid var(--border)' }}>
                        {score_history.map((score, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{score}</div>
                                <div style={{
                                    width: '100%',
                                    height: `${score}%`,
                                    background: 'var(--text-muted)',
                                    opacity: i === score_history.length - 1 ? 0.8 : 0.3
                                }} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.05em' }}>
                        ASSEMBLY LOG
                    </div>
                    <div className="code-block" style={{ maxHeight: 120, whiteSpace: 'pre-wrap', border: 'none', background: 'transparent', padding: 0 }}>
                        <span style={{ color: 'var(--info)' }}>[analyzer]</span> Generating assessment...<br />
                        {summary}
                    </div>
                </div>

            </div>

        </div>
    );
}
