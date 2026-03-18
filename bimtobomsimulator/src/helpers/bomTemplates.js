export const createBomResult = ({ cdeid = "", items } = {}) => ({
  cdeid: cdeid ?? "",
  items: Array.isArray(items) ? items : [],
});

export const createBeastProp = ({
  id = "",
  localID = "",
  GUID = "",
  Name = "",
  RevitID = "",
  propertySet = "",
  property,
  itemchildren,
  Unit = "m",
  Quantity = "",
  status = "Unchanged",
  Seller = "",
  price = "",
} = {}) => ({
  id,
  localID,
  GUID,
  Name,
  RevitID,
  propertySet,
  property: Array.isArray(property) ? property : [],
  itemchildren: Array.isArray(itemchildren) ? itemchildren : [],
  Unit,
  Quantity,
  status,
  Seller,
  price,
});
