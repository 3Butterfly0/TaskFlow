import { io } from "socket.io-client";

/**
 * Socket.io client singleton.
 * autoConnect is false so we control when to connect (after auth).
 */
const socket = io("/", {
  autoConnect: false,
  withCredentials: true,
});

export default socket;
