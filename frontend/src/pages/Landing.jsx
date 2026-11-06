import { redditLoginUrl } from "../api.js";
import LandingScene from "../three/LandingScene.jsx";

export default function Landing() {
  return (
    <>
      <div className="canvas-wrap">
        <LandingScene />
      </div>
      <div className="wrap landing-overlay">
        <p className="wordmark">pop</p>
        <div className="landing-hero">
          <h1>See the bubble you're in.</h1>
          <p>
            With the speed of the news cycle and personalization of social media algorithms, most of the time we're not aware of other points of view that we're missing. Pop connects to your Reddit account, looks at what communities you're part of, and tells you which communities are giving you a polarized view of an issue. Then, it'll suggest some articles that capture other POVs. Pop's goal isn't to change your opinion - just help you form a more substantiated one!
          </p>
          <a className="btn btn-primary" href={redditLoginUrl()}>
            Connect your Reddit
          </a>
          <p className="fine-print">
            This provides read-only access to your subscribed communities. Pop will never post anything on your behalf.
          </p>
        </div>
      </div>
    </>
  );
}
