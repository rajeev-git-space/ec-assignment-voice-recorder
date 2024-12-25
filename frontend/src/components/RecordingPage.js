import React, { useState, useRef } from 'react';
import Recorder from 'recorder-js';
import './RecordingPage.css';

const RecordingPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [chunkDuration, setChunkDuration] = useState(10);
  const [chunkCount, setChunkCount] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [savedRecordings, setSavedRecordings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const recorderRef = useRef(null);
  const intervalRef = useRef(null);

  // Initialize recorder
  const initializeRecorder = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    recorderRef.current = new Recorder(audioContext, { onAnalysed: null });
    recorderRef.current.init(stream);
  };

  const startRecording = async () => {
    if (!recorderRef.current) await initializeRecorder();
    setIsRecording(true);
    setChunkCount(0);
    setTotalDuration(0);
    setRecordedChunks([]);

    recorderRef.current.start();

    intervalRef.current = setInterval(async () => {
      const { blob } = await recorderRef.current.stop();

      // Save the blob for later use
      setRecordedChunks((prev) => [...prev, blob]);

      recorderRef.current.start();
      setChunkCount((prev) => prev + 1);
      setTotalDuration((prev) => prev + chunkDuration);
    }, chunkDuration * 1000);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    clearInterval(intervalRef.current);
    if (recorderRef.current) {
      const { blob } = await recorderRef.current.stop();

      // Save the blob for the last partial chunk
      setRecordedChunks((prev) => [...prev, blob]);

      const recordedTime = Math.floor(performance.now() / 1000) % chunkDuration;
      setChunkCount((prev) => prev + 1);
      setTotalDuration((prev) => prev + recordedTime);

      // Save the recording
      saveRecording(blob);
    }
  };

  const saveRecording = (audioBlob) => {
    const newRecording = {
      id: Date.now(),
      name: `Recording ${savedRecordings.length + 1}`,
      chunkCount,
      totalDuration,
      recordedAt: new Date().toLocaleString(),
      audioBlob,
    };
    setSavedRecordings((prev) => [...prev, newRecording]);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleChunkDurationChange = (e) => {
    const value = Math.min(Math.max(Number(e.target.value), 1), 60); // Ensure 1-60 range
    setChunkDuration(value);
  };

  const handlePlayAudio = () => {
    if (recordedChunks.length === 0) {
      alert('No audio chunks recorded yet!');
      return;
    }

    const audioURL = URL.createObjectURL(new Blob(recordedChunks));
    const audio = new Audio(audioURL);
    audio.play();
  };

  const handleMerge = () => {
    alert('Merging chunks and sending to the backend (placeholder for API integration)');
  };

  const handlePlaySavedRecording = (audioBlob) => {
    const audioURL = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioURL);
    audio.play();
  };

  const nextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const prevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = savedRecordings.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="recording-page">
      <div className="recording-left">
        <h2>Saved Recordings</h2>
        <table className="recordings-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Chunks</th>
              <th>Total Duration</th>
              <th>Recorded At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((recording) => (
                <tr key={recording.id}>
                  <td>{recording.name}</td>
                  <td>{recording.chunkCount}</td>
                  <td>{recording.totalDuration}s</td>
                  <td>{recording.recordedAt}</td>
                  <td>
                    <button
                      onClick={() => handlePlaySavedRecording(recording.audioBlob)}
                      className="play-button"
                    >
                      Play
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No recordings found.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="pagination-controls">
          <button onClick={prevPage} disabled={currentPage === 1}>
            Previous
          </button>
          <button
            onClick={nextPage}
            disabled={currentPage * itemsPerPage >= savedRecordings.length}
          >
            Next
          </button>
        </div>
      </div>

      <div className="recording-right">
        <div className="recording-status">
          <h3>{isRecording ? 'Recording...' : 'Recording Stopped'}</h3>
          <p>Total Duration: {totalDuration}s</p>
          <p>Chunks Recorded: {chunkCount}</p>
        </div>

        <div className="recording-controls">
          <button onClick={toggleRecording} className={isRecording ? 'stop-button' : 'record-button'}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button
            onClick={handlePlayAudio}
            className="play-button"
            disabled={recordedChunks.length === 0}
          >
            Play All
          </button>
          <div className="chunk-duration">
            <label>Chunk Duration (seconds): </label>
            <input
              type="number"
              value={chunkDuration}
              onChange={handleChunkDurationChange}
              min="1"
              max="60"
            />
          </div>
          <button onClick={handleMerge} className="merge-button">
            Merge and Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordingPage;