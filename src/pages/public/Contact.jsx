import { useState } from "react";

function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      <style>{`
        .contact-page {
          min-height: 100vh;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .contact-hero {
          padding: 60px 20px;
          text-align: center;
          background: #0b2946;
        }

        .contact-hero h1 {
          margin: 0 0 10px;
          color: white;
          font-size: 38px;
        }

        .contact-hero p {
          margin: 0;
          color: rgba(255,255,255,0.72);
          font-size: 13px;
        }

        .contact-content {
          width: 90%;
          max-width: 1050px;
          margin: auto;
          padding: 50px 0;
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 22px;
        }

        .contact-card {
          background: white;
          padding: 25px;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
        }

        .contact-card h2 {
          margin: 0 0 18px;
          color: #0b2946;
          font-size: 18px;
        }

        .contact-info-box {
          margin-bottom: 13px;
          padding: 14px;
          background: #f8fafc;
          border-radius: 7px;
        }

        .contact-info-box strong {
          display: block;
          margin-bottom: 4px;
          color: #0b2946;
          font-size: 11px;
        }

        .contact-info-box span {
          color: #6d7a86;
          font-size: 10px;
        }

        .contact-form {
          display: grid;
          gap: 14px;
        }

        .contact-field label {
          display: block;
          margin-bottom: 6px;
          color: #0b2946;
          font-size: 10px;
          font-weight: 700;
        }

        .contact-field input,
        .contact-field textarea {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          outline: none;
          font-size: 11px;
        }

        .contact-field textarea {
          min-height: 100px;
          resize: vertical;
        }

        .contact-field input:focus,
        .contact-field textarea:focus {
          border-color: #f6c20d;
        }

        .contact-submit {
          border: none;
          padding: 11px;
          border-radius: 6px;
          background: #f6c20d;
          color: #0b2946;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .contact-success {
          padding: 12px;
          background: #e5f6eb;
          color: #18763a;
          border-radius: 7px;
          font-size: 10px;
        }

        @media(max-width: 800px) {
          .contact-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="contact-page">
        <section className="contact-hero">
          <h1>Contact Us</h1>

          <p>
            Contact Makumbura Taxi Operations for booking assistance
            and taxi service information.
          </p>
        </section>

        <section className="contact-content">
          <div className="contact-card">
            <h2>Taxi Operations</h2>

            <div className="contact-info-box">
              <strong>📍 Location</strong>
              <span>Makumbura Multimodal Center, Kottawa</span>
            </div>

            <div className="contact-info-box">
              <strong>📞 Telephone</strong>
              <span>Taxi Operations Contact Number</span>
            </div>

            <div className="contact-info-box">
              <strong>✉ Email</strong>
              <span>Official MMC Taxi Service Email</span>
            </div>

            <div className="contact-info-box">
              <strong>🕒 Service</strong>
              <span>Contact Taxi Operations for availability</span>
            </div>
          </div>

          <div className="contact-card">
            <h2>Send a Message</h2>

            <form
              className="contact-form"
              onSubmit={handleSubmit}
            >
              <div className="contact-field">
                <label>Full Name</label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="contact-field">
                <label>Phone Number</label>

                <input
                  type="tel"
                  placeholder="07XXXXXXXX"
                  required
                />
              </div>

              <div className="contact-field">
                <label>Message</label>

                <textarea
                  placeholder="Enter your message..."
                  required
                />
              </div>

              <button className="contact-submit">
                Send Message
              </button>

              {sent && (
                <div className="contact-success">
                  Message recorded in frontend demo. Backend integration
                  will send it to Taxi Operations later.
                </div>
              )}
            </form>
          </div>
        </section>
      </main>
    </>
  );
}

export default Contact;