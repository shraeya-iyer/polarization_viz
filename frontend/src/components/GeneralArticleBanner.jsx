export default function GeneralArticleBanner({ article }) {
  if (!article) {
    return (
      <div className="general-article">
        <span className="icon" aria-hidden="true">
          📖
        </span>
        <div>
          <p className="label">Why Pop?</p>
          <span>
            Polarization, based on political lines or otherwise, have significant effects on democratic processes, personal health, and more. Social media algorithms push increasingly polarizing content at users, which incentivizes their repeated platform use. Meanwhile, news cycles run so quickly that details are hard to miss - not to mention having to sort through what media outlets are polarized in themselves. All in all, it's a tough world to develop an informed opinion in. Pop is trying to help you take the first step.
            <code>GENERAL_ARTICLE_URL</code> in the backend .env.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="general-article">
      <span className="icon" aria-hidden="true">
        📖
      </span>
      <div>
        <p className="label">Start here</p>
        <a href={article.url} target="_blank" rel="noreferrer">
          {article.title}
        </a>
      </div>
    </div>
  );
}
