import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />

      <div className="container mt-5">
        <h1><b>Safe Rides,<br></br>
        <span style = {{ color: "#F7C300"}}>Trusted Service</span>
               ,<br></br>
               Anywhere,Anytime.
          </b></h1>
        <p>Book a taxi in seconds and reach your destination safely with <br></br>
the official Makumbura Multimodal Center (MMC) Taxi Service.</p>
      </div>
    </>
  );
}

export default App;