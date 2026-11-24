import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clapperboard } from "lucide-react";
import StatusPanel from "../components/StatusPanel";

export default function NotFound() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    let seconds = 10;
    const interval = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);
    }, 1000);
    const redirect = setTimeout(() => navigate("/"), 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <StatusPanel icon={Clapperboard} title="Page not found" actions={
      <>
        <Link to="/" className="now-primary">Back to home <ArrowRight size={16} /></Link>
        <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold hover:bg-gray-50">
          <ArrowLeft size={16} /> Go back
        </button>
      </>
    }>
      <p>This page is unavailable. We’ll take you back to the home page shortly.</p>
      <p aria-hidden="true" className="mt-2 font-medium tabular-nums">Returning home in {countdown}s</p>
    </StatusPanel>
  );
}
