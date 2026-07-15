import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import api from "../api/axiosInstance";

export default function OAuthSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = params.get("accessToken");

    if (!accessToken) {
      navigate("/login?error=google_auth_failed");
      return;
    }

    localStorage.setItem("accessToken", accessToken);

    api.get("/users/me")
      .then((res) => {
        localStorage.setItem("userInfo", JSON.stringify(res.data));
        toast.success("🎬 Welcome! Enjoy your show.");
        navigate("/");
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        navigate("/login?error=google_auth_failed");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#f0545c] animate-spin" />
        <p className="text-[14px] text-gray-500">Signing you in…</p>
      </div>
    </div>
  );
}