import React, { useEffect, useState } from "react";
import { useRecorder } from "../hooks/useRecorder";
import { listFiles, removeFile } from "../utils/apiService";
import { FaPlay, FaDownload, FaTrashAlt } from "react-icons/fa";
import "./RecordingPage.css";
import { toast } from "react-toastify";

const RecordingPage = () => {
  const {
    isRecording,
    chunkCount,
    totalDuration,
    recordingName,
    setRecordingName,
    startRecording,
    stopRecording,
    mergeRecording,
    chunkDuration,
    setChunkDuration,
  } = useRecorder();

  const [savedRecordings, setSavedRecordings] = useState([]);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const response = await listFiles();
      setSavedRecordings(response.files || []);
    } catch (error) {
      console.error("Error fetching recordings:", error);
    }
  };

  const handleChunkDurationChange = (e) => {
    const duration = parseInt(e.target.value, 10);
    if (duration > 40) {
      toast.error("Chunk duration cannot exceed 40 seconds.", {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }
    setChunkDuration(duration);
  };

  const handleStartRecording = () => {
    if (!chunkDuration || chunkDuration > 40) {
      toast.error("Please provide a valid chunk duration (<= 40 seconds).", {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }
    startRecording();
  };

  const handleMerge = async () => {
    if (totalDuration > 40) {
      toast.error("Total recording duration must be 40 seconds to merge.", {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }

    try {
      const message = await mergeRecording();
      toast.success(message, { autoClose: 1000 });
      fetchRecordings(); // Refresh the recordings list
    } catch (error) {
      toast.error(error.message, {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  return (
    <div className="recording-page">
      <div className="recording-left">
        <h2>Saved Recordings</h2>
        <table className="recordings-table">
          <thead>
            <tr>
              <th>Sl No.</th>
              <th>Name</th>
              <th>Size</th>
              <th>Recorded At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {savedRecordings.length > 0 ? (
              savedRecordings.map((recording, index) => (
                <tr key={recording.recording_name}>
                  <td>{index + 1}</td>
                  <td>{recording.recording_name}</td>
                  <td>{(recording.size / 1024).toFixed(2)} KB</td>
                  <td>{new Date(recording.lastModified).toLocaleString()}</td>
                  <td>
                    <FaPlay
                      onClick={() => window.open(recording.url, "_blank")}
                      title="Play"
                      className="action-icon play"
                    />
                    <FaDownload
                      onClick={() => window.open(recording.url, "_blank")}
                      className="action-icon download"
                    />
                    <FaTrashAlt
                      onClick={async () => {
                        try {
                          await removeFile(recording.recording_name);
                          await fetchRecordings(); // Refresh the recordings list
                          toast.success("Recording Deleted Successfully!", { autoClose: 2000 });
                        } catch (error) {
                          toast.error(error.message, {
                            position: "top-right",
                            autoClose: 2000,
                          });
                        }
                      }
                      }
                      title="Delete"
                      className="action-icon delete"
                    />
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
      </div>

      <div className="recording-right">
        <div className="recording-status">
          <h3>{isRecording ? "Recording..." : "Recording Stopped"}</h3>
          <p>Total Duration: {totalDuration}s</p>
          <p>Chunks Recorded: {chunkCount}</p>
        </div>

        <div className="recording-controls">
          <div className="input-group">
            <label htmlFor="chunk-duration">Chunk Duration (seconds):</label>
            <input
              type="number"
              id="chunk-duration"
              value={chunkDuration}
              onChange={handleChunkDurationChange}
              disabled={isRecording}
            />
          </div>
          <button
            onClick={isRecording ? stopRecording : handleStartRecording}
            className={isRecording ? "stop-button" : "record-button"}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>
          <input
            type="text"
            placeholder="Recording Name"
            value={recordingName}
            onChange={(e) => setRecordingName(e.target.value)}
            disabled={isRecording}
          />
          <button
            onClick={handleMerge}
            className="merge-button"
            disabled={
              isRecording || // Disable if recording is in progress
              !recordingName || // Disable if recording name is empty
              totalDuration === 0 || // Disable if no recording has occurred
              totalDuration > 40 // Ensure merge is only possible if within the 40s limit
            }
          >
            Merge
          </button>

        </div>
      </div>
    </div>
  );
};

export default RecordingPage;
