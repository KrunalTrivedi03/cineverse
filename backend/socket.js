const SeatLock = require("./models/SeatLock");

const room = (showId, slotId) => `show:${showId}:slot:${slotId}`;

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

    /* On disconnect, release all locks this socket held */
    socket.on("disconnect", async () => {
      try {
        const locks = await SeatLock.find({ userId });
        if (!locks.length) return;

        const grouped = {};
        locks.forEach((l) => {
          const key = room(l.showId.toString(), l.slotId);
          (grouped[key] = grouped[key] || []).push(l.seatId);
        });

        await SeatLock.deleteMany({ userId });

        Object.entries(grouped).forEach(([r, seatIds]) => {
          io.to(r).emit("seats:released_bulk", { seatIds, userId });
        });
      } catch (err) {
        console.error("Socket disconnect cleanup:", err.message);
      }
    });
  });
};