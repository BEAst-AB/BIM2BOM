import { useBom } from "../context/useBom.js";
import SellingSystemComponent from "../components/SellingSystemComponent.jsx";

export default function SellingSystem1() {
  const { sellingSystem1Order, setSellingSystem1Order, addIncomingOrder } =
    useBom();

  return (
    <SellingSystemComponent
      order={sellingSystem1Order}
      addIncomingOrder={addIncomingOrder}
      clearOrder={() =>
        setSellingSystem1Order((prev) => (prev ? { ...prev, items: [] } : prev))
      }
      sellingSystemName="Selling System 1"
      companyTitle="Company 1"
    />
  );
}
