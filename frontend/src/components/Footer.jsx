import { ArrowRight, ArrowUpRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import nowLogo from "../assets/now-logo-mark.png";

const groups = [
  {
    title: "Watch",
    links: [["Now showing", "/now-showing"], ["Coming soon", "/coming-soon"], ["Web shows", "/web-shows"]],
  },
  {
    title: "Go out",
    links: [["Live events", "/events"], ["Play venues", "/play/venues"], ["Offers", "/offers"]],
  },
];

export default function Footer() {
  return (
    <footer className="now-footer">
      <div className="now-footer-inner">
        <div>
          <Link to="/" aria-label="NOW home" className="now-footer-brand">
            <img className="now-brand-mark" src={nowLogo} alt="NOW" width="150" height="40" />
            <span>Your World of <em>Entertainment</em></span>
          </Link>
        </div>
        <nav aria-label="Footer navigation" className="now-footer-links">
          {groups.map(({ title, links }) => (
            <div key={title}>
              <p className="now-footer-heading">{title}</p>
              <ul>
                {links.map(([label, to]) => (
                  <li key={to}><Link className="now-footer-link" to={to}>{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="now-footer-support">
          <MessageCircle size={19} aria-hidden="true" />
          <p className="now-footer-heading">Need help?</p>
          <Link className="now-footer-contact" to="/contact">Contact us <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="now-footer-bottom">
          <p>&copy; {new Date().getFullYear()} NOW. All rights reserved.</p>
          <Link className="now-footer-link" to="/about">About NOW <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </div>
    </footer>
  );
}
