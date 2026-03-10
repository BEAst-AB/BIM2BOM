import { useContext } from "react";
import { BomContext } from "./BomContext.js";

export function useBom() {
  const context = useContext(BomContext);
  if (!context) {
    throw new Error("useBom must be used within BomProvider");
  }
  return context;
}
