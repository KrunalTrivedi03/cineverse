// src/hooks/useRazorpay.js
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

export function useRazorpay() {
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState(null);

  const initiatePayment = useCallback(async ({
    showId,
    slotId,
    seatIds,
    existingOrder = null,  // ← pass pre-created order to skip createOrder call
    userDetails   = {},    // { name, email, contact }
    onSuccess,             // (bookingRef, booking) => void
    onFailure,             // (reason) => void
  }) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      // 2. Use existing order OR create a new one
      let orderData;

      if (existingOrder) {
        // Order already created in SeatSelection — use it directly,
        // no duplicate createOrder call
        orderData = existingOrder;
      } else {
        // Legacy path: create order here for any caller that doesn't pre-create
        // Backend reads userId from JWT — do NOT send it from frontend
        const { data } = await api.post("/payment/create-order", {
          showId,
          slotId,
          seatIds,
        });
        orderData = {
          orderId:    data.orderId,
          amount:     data.amount,
          currency:   data.currency,
          keyId:      data.keyId,
          bookingId:  data.bookingId,
          movie:      data.movie,
          theatre:    data.theatre,
          screen:     data.screen,
          bookingRef: data.bookingRef,
        };
      }

      const { orderId, amount, currency, keyId, bookingId, movie, theatre, screen, bookingRef } = orderData;

      // 3. Open Razorpay checkout modal
      const options = {
        key:         keyId,
        amount,
        currency:    currency || "INR",
        name:        "CineVerse",
        description: movie && theatre
          ? `${movie} — ${theatre}${screen ? ` | ${screen}` : ""}`
          : "Movie Ticket Booking",
        order_id:    orderId,

        prefill: {
          name:    userDetails.name    || "",
          email:   userDetails.email   || "",
          contact: userDetails.contact || "",
        },

        notes: { bookingRef: bookingRef || "" },
        theme: { color: "#f0545c" },

        // 4. On success — verify signature on backend
        handler: async (response) => {
          try {
            const { data: verified } = await api.post("/payment/verify", {
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


