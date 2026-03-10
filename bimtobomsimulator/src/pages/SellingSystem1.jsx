import { useBom } from "../context/useBom.js";
import SellingSystemComponent from "../components/SellingSystemComponent.jsx";

export default function SellingSystem1() {
  const { sellingSystem1Order, addIncomingOrder } = useBom();

  return (
    <SellingSystemComponent
      order={sellingSystem1Order}
      addIncomingOrder={addIncomingOrder}
      sellingSystemName="Selling System 1"
      companyTitle="Company 1"
    />
  );
}
