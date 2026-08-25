const SeatLock      = require("./models/SeatLock");
const EventSeatLock = require("./models/EventSeatLock");
const PlaySlotLock  = require("./models/PlaySlotLock");

const room      = (showId, slotId)     => `show:${showId}:slot:${slotId}`;
const eventRoom = (scheduleId, slotId) => `event:${scheduleId}:slot:${slotId}`;
const playRoom  = (venueId, date)      => `play:${venueId}:date:${date}`;

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

    /* ── Play (sports/activity slot booking) ── */
    socket.on("join:play", ({ venueId, date }) => {
      socket.join(playRoom(venueId, date));
    });

    socket.on("leave:play", ({ venueId, date }) => {
      socket.leave(playRoom(venueId, date));
    });

    socket.on("play-slot:select", ({ venueId, date, courtId, slotId }) => {
      socket.to(playRoom(venueId, date)).emit("play-slot:locked", { courtId, slotId, userId });
    });

    socket.on("play-slot:deselect", ({ venueId, date, courtId, slotId }) => {
      socket.to(playRoom(venueId, date)).emit("play-slot:released", { courtId, slotId, userId });
    });

    socket.on("play-booking:confirmed", ({ venueId, date, courtId, slotIds }) => {
      socket.to(playRoom(venueId, date)).emit("play-slots:booked", { courtId, slotIds });
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