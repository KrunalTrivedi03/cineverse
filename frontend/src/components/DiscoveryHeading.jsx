import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function DiscoveryHeading({ title, detail, to, action = "View all" }) {
  return (
    <div className="now-rail-heading">
      <div>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      {to && <Link className="now-rail-link" to={to}>{action}<ArrowUpRight size={15} aria-hidden="true" /></Link>}
    </div>
  );
}
