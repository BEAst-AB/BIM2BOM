import { useBom } from "../context/useBom.js";
import SellingSystemComponent from "../components/SellingSystemComponent.jsx";

export default function SellingSystem2() {
  const { sellingSystem2Order, addIncomingOrder } = useBom();

  return (
    <SellingSystemComponent
      order={sellingSystem2Order}
      addIncomingOrder={addIncomingOrder}
      sellingSystemName="Selling System 2"
      companyTitle="Company 2"
    />
  );
}
