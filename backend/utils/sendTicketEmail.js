const { sendEmail }      = require("../services/emailService");
const buildEmailTemplate = require("./emailTemplateBuilder");

/**
 * Sends a booking-confirmed ticket email to the user.
 *
 * @param {object} params
 * @param {string} params.toEmail
 * @param {string} params.toName
 * @param {object} params.booking
 * @param {string} params.movieTitle
 * @param {string} params.theatreName
 */
async function sendTicketEmail({ toEmail, toName, booking, movieTitle, theatreName }) {
  const showDate = new Date(booking.showDate).toLocaleDateString("en-IN", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });

  const seatList = booking.seats.map((s) => s.seatId).join(", ");

  const seatRows = booking.seats
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

  const paymentLabel =
    booking.paymentMethod === "wallet"   ? "Encore Wallet" :
    booking.paymentMethod === "razorpay" ? "Card / UPI (Razorpay)" :
    booking.paymentMethod || "Online";

  const html = buildEmailTemplate({
    template: "ticketConfirmation.html",
    title:    `Your Tickets — ${movieTitle}`,
    subtitle: "BOOKING CONFIRMED",
    heading:  `Enjoy the show, ${toName}!`,
    replacements: {
      USERNAME:       toName,
      MOVIE_TITLE:    movieTitle,
      BOOKING_REF:    booking.bookingRef,
      THEATRE_NAME:   theatreName,
      SCREEN:         booking.screen,
      SHOW_DATE:      showDate,
      SHOW_TIME:      booking.showTime,
      SEATS:          seatList,
      SEAT_ROWS:      seatRows,
      PAYMENT_METHOD: paymentLabel,
      GRAND_TOTAL:    booking.grandTotal.toFixed(2),
    },
  });

  await sendEmail({
    to:      toEmail,
    subject: `🎬 Your tickets for ${movieTitle} — ${booking.bookingRef}`,
    html,
  });
}

module.exports = sendTicketEmail;