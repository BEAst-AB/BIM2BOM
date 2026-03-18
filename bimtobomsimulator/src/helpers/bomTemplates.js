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
  status = "Unchaged",
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
  status,
  Seller,
  price,
});
