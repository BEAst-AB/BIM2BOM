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
  Seller,
  price,
});
