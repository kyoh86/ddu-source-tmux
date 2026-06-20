import { TextLineStream } from "@std/streams/text-line-stream";

export async function* iterLine(
  r: ReadableStream<Uint8Array>,
): AsyncIterable<string> {
  const lines = r
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());
  for await (const line of lines) {
    yield line;
  }
}
