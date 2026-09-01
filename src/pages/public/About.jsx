function About() {
  return (
    <>
      <style>{`
        .about-page {
          min-height: 100vh;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .about-hero {
          padding: 70px 20px;
          text-align: center;
          background: #0b2946;
        }

        .about-hero h1 {
          margin: 0 0 12px;
          color: white;
          font-size: 40px;
          font-weight: 800;
        }

        .about-hero p {
          max-width: 720px;
          margin: auto;
          color: rgba(255,255,255,0.75);
          line-height: 1.7;
          font-size: 14px;
        }

        .about-content {
          width: 90%;
          max-width: 1100px;
          margin: auto;
          padding: 55px 0;
        }

        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
        }

        .about-card {
          background: white;
          padding: 28px;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
        }

        .about-card h2 {
          margin: 0 0 12px;
          color: #0b2946;
          font-size: 20px;
        }

        .about-card p {
          margin: 0;
          color: #687683;
          font-size: 12px;
          line-height: 1.8;
        }

        .about-features {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-top: 25px;
        }

        .about-feature {
          background: white;
          text-align: center;
          padding: 22px 15px;
          border: 1px solid #e2e7ec;
          border-radius: 9px;
        }

        .about-feature span {
          display: block;
          margin-bottom: 10px;
          font-size: 27px;
        }

        .about-feature h3 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 13px;
        }

        .about-feature p {
          margin: 0;
          color: #7a8792;
          font-size: 9px;
          line-height: 1.5;
        }

        @media(max-width: 850px) {
          .about-grid {
            grid-template-columns: 1fr;
          }

          .about-features {
            grid-template-columns: repeat(2,1fr);
          }
        }

        @media(max-width: 500px) {
          .about-features {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="about-page">
        <section className="about-hero">
          <h1>About MMC Taxi Service</h1>

          <p>
            A centralized taxi management service designed for
            Makumbura Multimodal Center to improve passenger booking,
            driver coordination and taxi operations.
          </p>
        </section>

        <section className="about-content">
          <div className="about-grid">
            <div className="about-card">
              <h2>Our Service</h2>

              <p>
                MMC Taxi Service connects passengers with registered
                taxi drivers through a managed booking process. Taxi
                Operations can handle website, telephone and on-site
                bookings from one system.
              </p>
            </div>

            <div className="about-card">
              <h2>Our Goal</h2>

              <p>
                The goal is to provide a safer, organized and more
                efficient taxi experience while allowing Makumbura
                staff to monitor bookings, drivers, vehicles and trip
                activities.
              </p>
            </div>
          </div>

          <div className="about-features">
            <div className="about-feature">
              <span>🚕</span>
              <h3>Verified Drivers</h3>
              <p>Drivers are managed through a verification process.</p>
            </div>

            <div className="about-feature">
              <span>📋</span>
              <h3>Managed Bookings</h3>
              <p>Website, phone and counter bookings in one system.</p>
            </div>

            <div className="about-feature">
              <span>📍</span>
              <h3>Trip Tracking</h3>
              <p>Driver location support after booking acceptance.</p>
            </div>

            <div className="about-feature">
              <span>🔔</span>
              <h3>Notifications</h3>
              <p>Booking and trip status updates for system users.</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default About;