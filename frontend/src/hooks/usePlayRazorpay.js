// src/hooks/usePlayRazorpay.js — mirrors useEventRazorpay.js for the Play module
import { useState, useCallback } from "react";
import api from "../api/axiosInstance";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script   = document.createElement("script");
    script.src     = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function usePlayRazorpay() {
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState(null);

  const initiatePayment = useCallback(async ({
    existingOrder,          // pre-created order from /play-payment/create-order
    userDetails   = {},     // { name, email, contact }
    onSuccess,               // (bookingRef, booking) => void
    onFailure,                // (reason) => void
  }) => {
    setLoading(true);
    setError(null);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      if (!existingOrder) throw new Error("No order to pay for.");

      const {
        orderId, amount, currency, keyId, bookingId,
        activity, venue, bookingRef,
      } = existingOrder;

      const options = {
        key:         keyId,
        amount,
        currency:    currency || "INR",
        name:        "CineVerse Play",
        description: activity && venue ? `${activity} — ${venue}` : "Play Slot Booking",
        order_id:    orderId,

        prefill: {
          name:    userDetails.name    || "",
          email:   userDetails.email   || "",
          contact: userDetails.contact || "",
        },

        notes: { bookingRef: bookingRef || "" },
        theme: { color: "#f0545c" },

        handler: async (response) => {
          try {
            const { data: verified } = await api.post("/play-payment/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              bookingId,
            });

            setLoading(false);
            onSuccess?.(verified.bookingRef, verified.booking);
          } catch (verifyErr) {
            const msg = verifyErr.response?.data?.message || "Payment verification failed";
            setError(msg);
            setLoading(false);
            onFailure?.(msg);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            onFailure?.("Payment cancelled by user");
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        const reason = response.error?.description || "Payment failed";
        setError(reason);
        setLoading(false);
        onFailure?.(reason);
      });

      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Something went wrong";
      setError(msg);
      setLoading(false);
      onFailure?.(msg);
    }
  }, []);

  return { initiatePayment, loading, error };
}