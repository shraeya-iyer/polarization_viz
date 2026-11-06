import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, getGeneralArticle, getCommunities, logout } from "../api.js";
import GeneralArticleBanner from "../components/GeneralArticleBanner.jsx";
import BubbleDetailPanel from "../components/BubbleDetailPanel.jsx";
import DashboardScene from "../three/DashboardScene.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [username, setUsername] = useState(null);
  const [generalArticle, setGeneralArticle] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [overlaps, setOverlaps] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const me = await getMe();
        const [article, data] = await Promise.all([getGeneralArticle(), getCommunities()]);
        if (cancelled) return;
        setUsername(me.reddit_username);
        setGeneralArticle(article);
        setCommunities(data.communities);
        setOverlaps(data.overlaps ?? []);
        setSummary(data.summary);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        if (err.status === 401) {
          navigate("/");
        } else {
          setStatus("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  if (status === "loading") {
    return (
      <div className="wrap">
        <p className="state-msg">Loading your communities…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="wrap">
        <p className="state-msg">
          Something went wrong talking to the backend. Check that the API server is running.
        </p>
      </div>
    );
  }

  const selectedCommunity = communities.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      <div className="canvas-wrap">
        <DashboardScene
          summary={summary}
          communities={communities}
          overlaps={overlaps}
          onSelect={setSelectedId}
          selectedId={selectedId}
        />
      </div>

      <div className="dashboard-overlay">
        <div className="dash-top">
          <div className="dash-header">
            <p className="wordmark">pop</p>
            <span className="who">
              u/{username}
              <button type="button" onClick={handleLogout}>
                disconnect
              </button>
            </span>
          </div>
          <GeneralArticleBanner article={generalArticle} />
        </div>
      </div>

      {communities.length === 0 && (
        <p className="state-msg empty-overlay">No subscribed communities found.</p>
      )}

      {communities.length > 0 && (
        <p className="hint">Drag to look around · click a bubble to inspect it</p>
      )}

      <BubbleDetailPanel community={selectedCommunity} onClose={() => setSelectedId(null)} />
    </>
  );
}
