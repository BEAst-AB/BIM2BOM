import { useBom } from "../context/useBom.js";
import SellingSystemComponent from "../components/SellingSystemComponent.jsx";

export default function SellingSystem2() {
  const { sellingSystem2Order, setSellingSystem2Order, addIncomingOrder } =
    useBom();

  return (
    <SellingSystemComponent
      order={sellingSystem2Order}
      addIncomingOrder={addIncomingOrder}
      clearOrder={() =>
        setSellingSystem2Order((prev) => (prev ? { ...prev, items: [] } : prev))
      }
      sellingSystemName="Selling System 2"
      companyTitle="Säljare 2"
    />
  );
}
