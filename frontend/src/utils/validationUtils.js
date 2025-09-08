export const validateChunkDuration = (duration) => {
  if (isNaN(duration) || duration < 1 || duration > 40) {
    throw new Error('Chunk duration must be between 1 and 40 seconds.');
  }
};

export const isValidRecordingName = (name) => {
  const regex = /^[a-zA-Z_-]+$/; // Only letters, underscores, and dashes allowed
  return regex.test(name);
};
