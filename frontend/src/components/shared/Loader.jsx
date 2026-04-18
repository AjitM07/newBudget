export default function Loader({ text = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 48 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent-lt)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ color: 'var(--text2)', fontSize: 13 }}>{text}</span>
    </div>
  )
}