import Cookies from "js-cookie";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes";
import SplashScreen from "./pages/SplashScreen";  


function App() {
  const token = Cookies.get("token");

  return (
    <div className="overflow-y-scroll h-screen">
      {token && <Navbar />}
      <AppRoutes isAuthenticated={!!token} />
    </div>
  );
}

export default App;