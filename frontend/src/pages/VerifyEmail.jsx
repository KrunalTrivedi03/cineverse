import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import StatusPanel from "../components/StatusPanel";
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

  if (status === "verifying") {
    return <StatusPanel auth icon={LoaderCircle} title="Verifying your email" busy><p>Please wait a moment.</p></StatusPanel>;
  }

  if (status === "success") {
    return <StatusPanel auth icon={CircleCheck} title="Email verified"><p>Taking you to sign in.</p></StatusPanel>;
  }

  return <StatusPanel auth icon={CircleAlert} title="Verification failed"><p>The link may have expired or is invalid.</p></StatusPanel>;
}
