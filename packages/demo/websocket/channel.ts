import { Channel, ChannelBuffer } from "@channel/channel";

export function messageEvents(
  socket: WebSocket,
  buffer?: ChannelBuffer<MessageEvent>,
): Channel<MessageEvent> {
  return new Channel(async (push, close, stop) => {
    socket.onmessage = (ev) => push(ev);
    socket.onerror = (err) => close(err);
    socket.onclose = () => close();
    await stop;
    socket.close();
  }, buffer);
}
