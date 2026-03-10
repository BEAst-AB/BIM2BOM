import "./App.css";
import { NavLink, Outlet } from "react-router-dom";
import { useBom } from "./context/useBom.js";

export default function App() {
  const { sellingSystem1Order, sellingSystem2Order } = useBom();

  return (
    <div className="appFrame">
      <div className="tabsBar" role="tablist" aria-label="Systems">
        <NavLink to="/interaxo" role="tab" className="tabButton">
          Interaxo
        </NavLink>
        <NavLink to="/cde" role="tab" className="tabButton">
          CDE
        </NavLink>
        <NavLink to="/buying-system" role="tab" className="tabButton">
          Buying System
        </NavLink>
        <NavLink to="/selling-system-1" role="tab" className="tabButton">
          Selling System 1{sellingSystem1Order ? " •" : ""}
        </NavLink>
        <NavLink to="/selling-system-2" role="tab" className="tabButton">
          Selling System 2{sellingSystem2Order ? " •" : ""}
        </NavLink>
      </div>

      <div className="tabContent">
        <Outlet />
      </div>
    </div>
  );
}
