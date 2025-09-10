import React, { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
  const [prediction, setPrediction] = useState(null);

  const fetchPrediction = async () => {
    try {
      const res = await axios.get("/api/predict");
      setPrediction(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial" }}>
      <h1>ASTARK Digit Prediction</h1>
      {prediction ? (
        <div>
          <p><strong>Symbol:</strong> {prediction.symbol}</p>
          <p><strong>Predicted Digit:</strong> {prediction.predicted_digit}</p>
          <p><strong>Confidence:</strong> {prediction.confidence}%</p>
          <p><strong>Trade Window:</strong> {prediction.trade_window_seconds} sec</p>
        </div>
      ) : (
        <p>Loading prediction...</p>
      )}
    </div>
  );
    }
