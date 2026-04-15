import { createRoot } from "react-dom/client";
import { Navigate, RouterProvider, createHashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { BomProvider } from "./context/BomProvider.jsx";
import CDE from "./pages/CDE.jsx";
import BuyingSystem from "./pages/BuyingSystem.jsx";
import Interaxo from "./pages/Interaxo.jsx";
import SellingSystem1 from "./pages/SellingSystem1.jsx";
import SellingSystem2 from "./pages/SellingSystem2.jsx";

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/cde" replace /> },
      { path: "interaxo", element: <Interaxo /> },
      { path: "cde", element: <CDE /> },
      { path: "buying-system", element: <BuyingSystem /> },
      { path: "selling-system-1", element: <SellingSystem1 /> },
      { path: "selling-system-2", element: <SellingSystem2 /> },
      { path: "*", element: <Navigate to="/cde" replace /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <BomProvider>
    <RouterProvider router={router} />
  </BomProvider>,
);
