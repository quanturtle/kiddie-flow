const MAX_OUTPUT_CHARS = 60; // keep the terminal preview within the node's standard width

export const previewOutput = (value: string): string =>
  value.length > MAX_OUTPUT_CHARS ? `${value.slice(0, MAX_OUTPUT_CHARS)}…` : value;
