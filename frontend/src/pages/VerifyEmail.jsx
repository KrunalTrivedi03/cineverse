import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axios.get(
          `${import.meta.env.VITE_API_URL}/api/auth/verify-email/${token}`
        );

        setStatus("success");

        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {status === "verifying" && <h2>🔄 Verifying your email...</h2>}
      {status === "success" && (
        <div>
          <h2>✅ Email verified successfully!</h2>
          <p>Redirecting to login...</p>
        </div>
      )}
      {status === "error" && (
        <div>
          <h2>❌ Verification failed</h2>
          <p>The link may be expired or invalid.</p>
        </div>
      )}
    </div>
  );
}

