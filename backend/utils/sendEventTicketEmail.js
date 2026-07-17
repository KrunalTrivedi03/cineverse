const { sendEmail }      = require("../services/emailService");
const buildEmailTemplate = require("./emailTemplateBuilder");

/**
 * Sends a booking-confirmed ticket email for an Event booking.
 * Works for both "seated" (per-seat rows) and "general" (single quantity row) bookings.
 *
 * @param {object} params
 * @param {string} params.toEmail
 * @param {string} params.toName
 * @param {object} params.booking     — populated EventBooking doc
 * @param {string} params.eventTitle
 * @param {string} params.venueName
 * @param {string} params.category
 */
async function sendEventTicketEmail({ toEmail, toName, booking, eventTitle, venueName, category }) {
  const eventDate = new Date(booking.eventDate).toLocaleDateString("en-IN", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });

  let ticketsLabel, ticketRows;

  if (booking.bookingType === "seated") {
    ticketsLabel = booking.seats.map((s) => s.seatId).join(", ");
    ticketRows = booking.seats
      .map(
        (s) => `
<tr>
  <td style="font-family:Arial,Helvetica,sans-serif; font-size:13px;
             color:#2e2a25; padding:7px 0; border-bottom:1px solid #ede8df;">
    ${s.seatId}
  </td>
  <td style="font-family:'Courier New',Courier,monospace; font-size:11px;
             color:#9a9184; text-transform:uppercase; letter-spacing:1px;
             padding:7px 12px; border-bottom:1px solid #ede8df;">
    ${s.category}
  </td>
  <td align="right"
    style="font-family:Arial,Helvetica,sans-serif; font-size:13px;
           font-weight:600; color:#181816; padding:7px 0;
           border-bottom:1px solid #ede8df;">
    &#8377;${s.price}
  </td>
</tr>`
      )
      .join("");
  } else {
    ticketsLabel = `${booking.quantity} x ${booking.ticketType?.name || "General"}`;
    ticketRows = `
<tr>
  <td style="font-family:Arial,Helvetica,sans-serif; font-size:13px;
             color:#2e2a25; padding:7px 0; border-bottom:1px solid #ede8df;">
    ${booking.ticketType?.name || "General"} &times; ${booking.quantity}
  </td>
  <td style="font-family:'Courier New',Courier,monospace; font-size:11px;
             color:#9a9184; text-transform:uppercase; letter-spacing:1px;
             padding:7px 12px; border-bottom:1px solid #ede8df;">
    ${booking.bookingType}
  </td>
  <td align="right"
    style="font-family:Arial,Helvetica,sans-serif; font-size:13px;
           font-weight:600; color:#181816; padding:7px 0;
           border-bottom:1px solid #ede8df;">
    &#8377;${(booking.ticketType?.price || 0) * booking.quantity}
  </td>
</tr>`;
  }

  const paymentLabel =
    booking.paymentMethod === "wallet"   ? "Encore Wallet" :
    booking.paymentMethod === "razorpay" ? "Card / UPI (Razorpay)" :
    booking.paymentMethod || "Online";

  const html = buildEmailTemplate({
    template: "eventTicketConfirmation.html",
    title:    `Your Tickets — ${eventTitle}`,
    subtitle: "BOOKING CONFIRMED",
    heading:  `See you there, ${toName}!`,
    replacements: {
      USERNAME:       toName,
      EVENT_TITLE:    eventTitle,
      BOOKING_REF:    booking.bookingRef,
      VENUE_NAME:     venueName,
      EVENT_CATEGORY: category || "Event",
      EVENT_DATE:     eventDate,
      EVENT_TIME:     booking.eventTime,
      TICKETS:        ticketsLabel,
      TICKET_ROWS:    ticketRows,
      PAYMENT_METHOD: paymentLabel,
      GRAND_TOTAL:    booking.grandTotal.toFixed(2),
    },
  });

  await sendEmail({
    to:      toEmail,
    subject: `🎟️ Your tickets for ${eventTitle} — ${booking.bookingRef}`,
    html,
  });
}

module.exports = sendEventTicketEmail;