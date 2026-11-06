import RiskBadge from "./RiskBadge.jsx";

export default function BubbleDetailPanel({ community, onClose }) {
  if (!community) return null;

  const { display_name, url, subscribers, score, risk_level, opposing_articles } = community;
  const showOpposing = risk_level === "medium" || risk_level === "high";

  return (
    <div className="detail-panel">
      <button type="button" className="detail-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      <div className="community-card-top">
        <div className="community-name">
          <a href={url} target="_blank" rel="noreferrer">
            r/{display_name}
          </a>
          {typeof subscribers === "number" && (
            <span className="community-subs">{subscribers.toLocaleString()} members</span>
          )}
        </div>
        <RiskBadge level={risk_level} />
      </div>

      <div className="score-meter">
        <div className="score-meter-fill" style={{ width: `${Math.round(score * 100)}%` }} />
      </div>
      <p className="score-caption">
        bubble score {score.toFixed(2)}
        <span className="placeholder-tag">placeholder scoring</span>
      </p>

      {showOpposing && (
        <div className="opposing">
          <p className="opposing-label">Other side of the argument</p>
          <ul>
            {opposing_articles.map((a, i) =>
              a.url ? (
                <li key={i}>
                  <a href={a.url} target="_blank" rel="noreferrer">
                    {a.title}
                  </a>
                </li>
              ) : (
                <li key={i}>
                  <span>{a.title}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
