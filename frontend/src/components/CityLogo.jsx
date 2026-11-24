import { useState } from "react";
import { MapPin } from "lucide-react";

export default function CityLogo({ src }) {
  const [failedSrc, setFailedSrc] = useState("");
  return (
    <span className="now-city-logo" aria-hidden="true">
      {src && src !== failedSrc
        ? <img src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)} />
        : <MapPin size={19} />}
    </span>
  );
}
