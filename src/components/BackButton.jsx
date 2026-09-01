import { useNavigate } from "react-router-dom";

function BackButton() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        .global-back-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;

          padding: 9px 14px;

          border: 1px solid #0b2946;
          border-radius: 6px;

          background: white;
          color: #0b2946;

          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          font-weight: 700;

          cursor: pointer;

          transition: 0.2s;
        }

        .global-back-button:hover {
          background: #0b2946;
          color: white;
        }
      `}</style>

      <button
        type="button"
        className="global-back-button"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
    </>
  );
}

export default BackButton;