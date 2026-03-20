import "./App.css";
import { NavLink, Outlet } from "react-router-dom";
import { useBom } from "./context/useBom.js";

export default function App() {
  const { sellingSystem1Order } = useBom();

  return (
    <div className="appFrame">
      <div className="tabsBar" role="tablist" aria-label="System">
        <NavLink to="/cde" role="tab" className="tabButton">
          CDE
        </NavLink>
        <NavLink to="/buying-system" role="tab" className="tabButton">
          Inköpssystem
        </NavLink>
        <NavLink to="/selling-system-1" role="tab" className="tabButton">
          Säljsystem{sellingSystem1Order ? " •" : ""}
        </NavLink>
      </div>

      <div className="tabContent">
        <Outlet />
      </div>
    </div>
  );
}
