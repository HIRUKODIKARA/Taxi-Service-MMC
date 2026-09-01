import { useState } from "react";

function PassengerProfile() {
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: "Nadeesha Perera",
    phone: "0712345678",
    email: "nadeesha@example.com",
    nic: "200112345678",
  });

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <style>{`
        .passenger-profile-page {
          min-height: 100vh;
          padding: 30px;
          background: #f4f7fa;
          font-family: Arial, Helvetica, sans-serif;
        }

        .passenger-profile-page h1 {
          margin: 0 0 6px;
          color: #0b2946;
          font-size: 28px;
        }

        .passenger-profile-page > p {
          margin: 0 0 22px;
          color: #7b8794;
          font-size: 12px;
        }

        .passenger-profile-card {
          max-width: 780px;
          background: white;
          border: 1px solid #e2e7ec;
          border-radius: 10px;
          padding: 24px;
        }

        .passenger-profile-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
          padding-bottom: 18px;
          border-bottom: 1px solid #edf0f3;
        }

        .passenger-profile-user {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .passenger-profile-avatar {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f6c20d;
          color: #0b2946;
          border-radius: 50%;
          font-size: 17px;
          font-weight: 800;
        }

        .passenger-profile-user h2 {
          margin: 0 0 4px;
          color: #0b2946;
          font-size: 17px;
        }

        .passenger-profile-user span {
          color: #89949e;
          font-size: 9px;
        }

        .passenger-edit-btn {
          border: none;
          background: #0b2946;
          color: white;
          padding: 9px 13px;
          border-radius: 6px;
          font-size: 9px;
          cursor: pointer;
          font-weight: 700;
        }

        .passenger-profile-grid {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 16px;
        }

        .passenger-profile-field label {
          display: block;
          margin-bottom: 6px;
          color: #0b2946;
          font-size: 10px;
          font-weight: 700;
        }

        .passenger-profile-field input {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #d9e0e6;
          border-radius: 6px;
          font-size: 11px;
          color: #53616e;
          background: ${editing ? "white" : "#f7f9fa"};
        }

        .passenger-save-btn {
          width: 100%;
          margin-top: 20px;
          border: none;
          background: #f6c20d;
          color: #0b2946;
          padding: 11px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        @media(max-width: 700px) {
          .passenger-profile-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="passenger-profile-page">
        <h1>My Profile</h1>

        <p>View and update your passenger account information.</p>

        <div className="passenger-profile-card">
          <div className="passenger-profile-top">
            <div className="passenger-profile-user">
              <div className="passenger-profile-avatar">
                NP
              </div>

              <div>
                <h2>{profile.name}</h2>
                <span>Passenger Account</span>
              </div>
            </div>

            <button
              className="passenger-edit-btn"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "Cancel Edit" : "Edit Profile"}
            </button>
          </div>

          <div className="passenger-profile-grid">
            <div className="passenger-profile-field">
              <label>Full Name</label>

              <input
                name="name"
                value={profile.name}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="passenger-profile-field">
              <label>Phone Number</label>

              <input
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="passenger-profile-field">
              <label>Email Address</label>

              <input
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="passenger-profile-field">
              <label>NIC Number</label>

              <input
                name="nic"
                value={profile.nic}
                disabled
              />
            </div>
          </div>

          {editing && (
            <button
              className="passenger-save-btn"
              onClick={() => {
                setEditing(false);
                alert("Profile saved in frontend demo.");
              }}
            >
              Save Changes
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export default PassengerProfile;