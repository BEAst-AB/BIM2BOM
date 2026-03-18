export const typeIdOptions = { Instance: 100, Type: 101, "Room Instance": 200 };
export const dataTypeOptions = {
  Bool: 1,
  Integer: 3,
  Double: 4,
  Text: 5,
  Measure: 6,
  URL: 7,
};
export const measureOptions = { "Not Measure": 1, Length: 2, Area: 3 };
export const baseUrl = "app.bimeye.com";

function extractGuid(value) {
  if (typeof value !== "string") return "No Match";
  const guidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return guidRegex.test(value) ? "Match" : "No Match";
}

function groupBy(items, key) {
  if (!Array.isArray(items)) return {};
  return items.reduce((acc, item) => {
    const groupKey =
      item && Object.prototype.hasOwnProperty.call(item, key)
        ? String(item[key])
        : "__missing__";
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});
}

export async function getDataGrid(
  projectGuid,
  access_token,
  typeId = 100,
  categories = [],
  models = [],
  states = [],
  levels = [],
  phases = [],
) {
  // Get parameters in project

  let parameters = await getParameters(projectGuid, access_token);

  // Create lookup dictionary to select parameter by name

  let lookup = {};

  for (const d of parameters) {
    lookup[d["id"]] = d;
  }

  let getMasterParam = await fetch(
    `https://${baseUrl}/services/bim/v1/project/${projectGuid}/parameter?search[typeId]=${typeId}&search[relation]=masterParameter`,
    {
      method: "GET",
      headers: {
        "content-type": "application/json",
        authorization: access_token,
      },
    },
  ).then((response) => {
    return response.json();
  });

  let parameterHeaders = {};

  for (const params of getMasterParam?.result ?? []) {
    parameterHeaders[params["name"]] = null;
  }

  let payload = {
    categories: categories,
    models: models,
    states: states,
    levels: levels,
    phases: phases,
  };
  let data = [];
  let i = 0;
  let limit = 1000;

  let getCount = await fetch(
    `https://${baseUrl}/services/bim/v1/project/${projectGuid}/worktable/count?search%5BtypeId%5D=${typeId}`,
    {
      body: JSON.stringify(payload),
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: access_token,
      },
    },
  ).then((response) => {
    return response.json();
  });
  let count = getCount["result"]["count"];
  while (i < count) {
    //console.log(i);
    let getData = await fetch(
      `https://${baseUrl}/services/bim/v1/project/${projectGuid}/worktable?search%5BtypeId%5D=${typeId}&limit=${limit}&skip=${i}`,
      {
        body: JSON.stringify(payload),
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: access_token,
        },
      },
    ).then((response) => {
      return response.json();
    });

    //console.log(getData);
    for (const row of getData?.result ?? []) {
      const rowData = { ...parameterHeaders };
      //console.log(rowData);

      for (const prop of row?.property ?? []) {
        const param = lookup[prop["parameterId"]];
        if (!param) continue;
        rowData[param["name"]] = prop["value"];
      }
      //console.log(rowData);
      data.push(rowData);
    }

    i = i + limit;
    if (i > count) {
      i = count;
    }
  }

  return data;
}

export async function getCategories(projectGuid, access_token) {
  let getData = await fetch(
    `https://${baseUrl}/services/bim/v1/project/${projectGuid}/category`,
    {
      method: "GET",
      headers: {
        authorization: access_token,
      },
    },
  ).then((response) => {
    return response.json();
  });

  return getData["result"];
}

export function getProjectGuidUrlBIMData(url) {
  let urlInfo = {};
  urlInfo["baseUrl"] = url.split("/")[2];
  if (url.split("/").length >= 5 && url.includes("project")) {
    console.log(url.split("/"));
    if (extractGuid(url.split("/")[4]) === "Match") {
      urlInfo["projectGuid"] = url.split("/")[4];
      //urlInfo['baseUrl'] = url.split('/')[2];
    }
  }

  return urlInfo;
}

export async function getParameters(projectGuid, access_token) {
  let getData = await fetch(
    `https://${baseUrl}/services/bim/v1/project/${projectGuid}/parameter`,
    {
      method: "GET",
      headers: {
        authorization: access_token,
      },
    },
  ).then((response) => {
    return response.json();
  });

  return getData["result"];
}

export async function setValue(
  projectGuid,
  access_token,
  typeId,
  parameter,
  objects,
) {
  //Get active parameters in project
  let parameters = await getParameters(projectGuid, access_token);

  //Get ActiveCategories in project
  let categoriesResult = await getCategories(projectGuid, access_token);
  const categories = Array.isArray(categoriesResult)
    ? categoriesResult
    : (categoriesResult?.categories ?? []);

  //Create lookup for category name
  let categoryLookupName = {};

  for (const c of categories) {
    categoryLookupName[c["name"]] = c;

    // Fix Category name for DuctAccessories
    if (c["name"] == "DuctAccessories") {
      categoryLookupName["DuctAccessories_XXXXX"] = c;
    }
  }

  //Create lookup for parameters Name and ID
  let lookup = {};
  let lookupName = {};

  for (const d of parameters) {
    lookup[d["id"]] = d;
    lookupName[d["name"]] = d;
  }

  //console.log(categoryLookupName);

  const groupedByValue = groupBy(objects, parameter);
  let payload = {
    objectTypeId: typeId,
    data: [],
    templates: [],
    templateTargets: [],
    images: [],
  };

  for (const value of Object.values(groupedByValue)) {
    const groupedByCategory = groupBy(value, "Global Category");
    //console.log(groupedByCategory);

    for (const category of Object.values(groupedByCategory)) {
      console.log(groupedByCategory);
      const dataItem = {
        parameterId: lookupName[parameter]["id"],
        propertyId: null,
        categoryId: null,
        guids: [],
        value: value[0][parameter],
      };
      //console.log(Object.keys(groupedByCategory)[0]);
      console.log(category);
      dataItem["categoryId"] =
        categoryLookupName[category[0]["Global Category"]]["id"];

      for (const guid of category) {
        console.log(guid);
        dataItem["guids"].push(guid["Global BIMEYE ID"]);
        payload["templateTargets"].push(guid["Global BIMEYE ID"]);
      }
      payload["data"].push(dataItem);
    }
  }

  //let payload = {"objectTypeId":typeId,"data":[{"parameterId":lookupName[parameter]['id'],"propertyId":null,"categoryId":8000,"guids":["fe83d891-5481-4a2e-936f-bdc7301da3dc","fd2e1e3d-ff35-42ce-8a3d-8b57416789ba"],"value":"0002"},{"parameterId":264808,"propertyId":null,"categoryId":35000,"guids":["fe6c95ff-a1a6-41a9-94c1-6072366c6efb","fdf2d686-600d-427e-af89-3848c8359eb5","fdb8e770-3632-40a2-80e9-2a6a8850bf8c","fdb51103-ac0c-43de-8948-83e3fc14b103"],"value":"0002"},{"parameterId":264808,"propertyId":null,"categoryId":22003,"guids":["fd78eeb1-454b-4c12-b807-d1b1a23a99fe"],"value":"0002"}],"templates":[],"templateTargets":["fe83d891-5481-4a2e-936f-bdc7301da3dc","fe6c95ff-a1a6-41a9-94c1-6072366c6efb","fdf2d686-600d-427e-af89-3848c8359eb5","fdb8e770-3632-40a2-80e9-2a6a8850bf8c","fdb51103-ac0c-43de-8948-83e3fc14b103","fd78eeb1-454b-4c12-b807-d1b1a23a99fe","fd2e1e3d-ff35-42ce-8a3d-8b57416789ba"],"images":[]};
  console.log(payload);

  if (payload["data"].length > 0) {
    let response = await fetch(
      `https://${baseUrl}/services/bim/v1/project/${projectGuid}/worktable`,
      {
        body: JSON.stringify(payload),
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: access_token,
        },
      },
    ).then((response) => {
      return response;
    });

    return response;
  }

  return "Nothing to do...";
}
