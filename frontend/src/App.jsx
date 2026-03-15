import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Practice from "./pages/Practice";
import Battle from "./pages/Battle";
import Profile from "./pages/Profile";

function App() {

  return (

    <BrowserRouter>

     <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/practice" element={<Practice />} />

  <Route path="/battle" element={<Battle />} />
  <Route path="/battle/:roomId" element={<Battle />} />
  <Route path="/profile" element={<Profile />} />
</Routes>
    </BrowserRouter>

  );

}

export default App;