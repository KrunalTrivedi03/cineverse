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

    /* On disconnect, release all locks (movie + event) this socket held */
    socket.on("disconnect", async () => {
      try {
        const [locks, eventLocks] = await Promise.all([
          SeatLock.find({ userId }),
          EventSeatLock.find({ userId }),
        ]);

        if (locks.length) {
          const grouped = {};
          locks.forEach((l) => {
            const key = room(l.showId.toString(), l.slotId);
            (grouped[key] = grouped[key] || []).push(l.seatId);
          });
          await SeatLock.deleteMany({ userId });
          Object.entries(grouped).forEach(([r, seatIds]) => {
            io.to(r).emit("seats:released_bulk", { seatIds, userId });
          });
        }

        if (eventLocks.length) {
          const grouped = {};
          eventLocks.forEach((l) => {
            const key = eventRoom(l.eventScheduleId.toString(), l.slotId);
            (grouped[key] = grouped[key] || []).push(l.seatId);
          });
          await EventSeatLock.deleteMany({ userId });
          Object.entries(grouped).forEach(([r, seatIds]) => {
            io.to(r).emit("event-seats:released_bulk", { seatIds, userId });
          });
        }
      } catch (err) {
        console.error("Socket disconnect cleanup:", err.message);
      }
    });
  });
};