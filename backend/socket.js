const SeatLock      = require("./models/SeatLock");
const EventSeatLock = require("./models/EventSeatLock");

const room      = (showId, slotId)     => `show:${showId}:slot:${slotId}`;
const eventRoom = (scheduleId, slotId) => `event:${scheduleId}:slot:${slotId}`;

module.exports = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId || socket.id;

    socket.on("join:show", ({ showId, slotId }) => {
      socket.join(room(showId, slotId));
    });

    socket.on("leave:show", ({ showId, slotId }) => {
      socket.leave(room(showId, slotId));
    });

    /* Optimistic broadcast: another user is hovering/selecting this seat */
    socket.on("seat:select", ({ showId, slotId, seatId }) => {
      socket.to(room(showId, slotId)).emit("seat:locked", { seatId, userId });
    });

    socket.on("seat:deselect", ({ showId, slotId, seatId }) => {
      socket.to(room(showId, slotId)).emit("seat:released", { seatId, userId });
    });

    /* After confirmed booking — seat is permanently taken */
    socket.on("booking:confirmed", ({ showId, slotId, seatIds }) => {
      socket.to(room(showId, slotId)).emit("seats:booked", { seatIds });
    });

    /* ── Event seat-selection (seated events only) ── */
    socket.on("join:event", ({ scheduleId, slotId }) => {
      socket.join(eventRoom(scheduleId, slotId));
    });

    socket.on("leave:event", ({ scheduleId, slotId }) => {
      socket.leave(eventRoom(scheduleId, slotId));
    });

    socket.on("event-seat:select", ({ scheduleId, slotId, seatId }) => {
      socket.to(eventRoom(scheduleId, slotId)).emit("event-seat:locked", { seatId, userId });
    });

    socket.on("event-seat:deselect", ({ scheduleId, slotId, seatId }) => {
      socket.to(eventRoom(scheduleId, slotId)).emit("event-seat:released", { seatId, userId });
    });

    socket.on("event-booking:confirmed", ({ scheduleId, slotId, seatIds }) => {
      socket.to(eventRoom(scheduleId, slotId)).emit("event-seats:booked", { seatIds });
    });

    /* NOTE: we intentionally do NOT delete seat locks on socket disconnect.
     * A disconnect fires on every normal page transition (e.g. leaving
     * SeatSelection for BookingReview reconnects with a fresh socket), so
     * treating it as "user abandoned their seats" was wiping out locks the
     * same user had just created seconds earlier — surfacing as "Some seat
     * locks have expired" on order creation every time. Locks are already
     * bounded by their own TTL (expiresAt) and are released explicitly when
     * the user actually reselects seats or their countdown runs out, so no
     * disconnect-based cleanup is needed here. */
  });
};