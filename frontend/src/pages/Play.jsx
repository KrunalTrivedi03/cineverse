import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, MapPin } from "lucide-react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import DistrictSelector, { getSelectedDistrict } from "../components/DistrictSelector";
import { IMG, OUTFIT_IMPORT } from "../utils/eventHelpers";

export default function Play() {
  const navigate = useNavigate();
  const [district, setDistrict] = useState(getSelectedDistrict());
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onChange = () => setDistrict(getSelectedDistrict());

    window.addEventListener("districtChanged", onChange);

    return () => {
      window.removeEventListener("districtChanged", onChange);
    };
  }, []);

  useEffect(() => {
    setLoading(true);

    api
      .get("/play/activities")
      .then((r) => setActivities(r.data))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  const openActivity = (activity) => {
    if (!district.id) return;

    navigate(
      `/play/venues?activity=${activity._id}&activityName=${encodeURIComponent(
        activity.name
      )}`
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f7",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <style>{OUTFIT_IMPORT}</style>

      <Navbar />
      <BottomNav />

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "20px 16px 32px",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">
              Play
            </h1>

            <p className="text-[12.5px] text-gray-400 mt-0.5">
              Book courts &amp; turfs near you
            </p>
          </div>

          <DistrictSelector compact />
        </div>

        {/* No District */}
        {!district.id ? (
          <div
            className="bg-white flex flex-col items-center text-center px-6 py-14"
            style={{
              borderRadius: 20,
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "rgba(240,84,92,0.08)",
              }}
            >
              <MapPin
                size={24}
                style={{
                  color: "#f0545c",
                }}
              />
            </div>

            <p className="text-[15px] font-bold text-gray-900 mb-1">
              Select a district to get started
            </p>

            <p className="text-[13px] text-gray-400 max-w-[260px] mb-5">
              We'll show you badminton courts, turfs, and more near you.
            </p>

            <DistrictSelector />
          </div>
        ) : loading ? (
          /* Loading */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 animate-pulse"
                style={{
                  aspectRatio: "1/0.85",
                  borderRadius: 16,
                }}
              />
            ))}
          </div>
        ) : activities.length === 0 ? (
          /* Empty State */
          <div
            className="bg-white flex flex-col items-center text-center px-6 py-14"
            style={{
              borderRadius: 20,
            }}
          >
            <Trophy
              size={28}
              style={{
                color: "#d1d5db",
              }}
              className="mb-3"
            />

            <p className="text-[14px] font-semibold text-gray-400">
              No activities available yet
            </p>

            <p className="text-[12px] text-gray-400 mt-1">
              Check back soon — we're adding venues.
            </p>
          </div>
        ) : (
          /* Sports */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {activities.map((a) => {
              return (
                <button
                  key={a._id}
                  onClick={() => openActivity(a)}
                  className="
                    relative
                    overflow-hidden
                    text-left
                    group
                    active:scale-[0.97]
                    transition-transform
                    focus:outline-none
                  "
                  style={{
                    border: "none",
                    padding: 0,
                    margin: 0,
                    background: "transparent",
                    borderRadius: 16,
                    aspectRatio: "1/0.85",
                  }}
                >
                  {/* Image */}
                  {a.image ? (
                    <img
                      src={IMG(a.image)}
                      alt={a.name}
                      className="
                        absolute
                        inset-0
                        w-full
                        h-full
                        object-cover
                        transition-transform
                        duration-500
                        group-hover:scale-105
                      "
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%)",
                      }}
                    />
                  )}

                  {/* Bottom gradient only */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-1/2"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))",
                    }}
                  />

                  {/* Activity Name */}
                  <div className="absolute inset-x-0 bottom-0 p-3.5">
                    <p className="text-[14px] font-extrabold text-white leading-tight drop-shadow-md">
                      {a.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}