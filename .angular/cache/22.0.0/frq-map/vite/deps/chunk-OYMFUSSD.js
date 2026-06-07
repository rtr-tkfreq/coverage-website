import {
  abstract,
  extend
} from "./chunk-H44TNWIA.js";
import {
  boundingExtent,
  padNumber
} from "./chunk-EP5GWQGD.js";

// node_modules/ol/xml.js
var XML_SCHEMA_INSTANCE_URI = "http://www.w3.org/2001/XMLSchema-instance";
function createElementNS(namespaceURI, qualifiedName) {
  return getDocument().createElementNS(namespaceURI, qualifiedName);
}
function getAllTextContent(node, normalizeWhitespace) {
  return getAllTextContent_(node, normalizeWhitespace, []).join("");
}
function getAllTextContent_(node, normalizeWhitespace, accumulator) {
  if (node.nodeType == Node.CDATA_SECTION_NODE || node.nodeType == Node.TEXT_NODE) {
    if (normalizeWhitespace) {
      accumulator.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""));
    } else {
      accumulator.push(node.nodeValue);
    }
  } else {
    let n;
    for (n = node.firstChild; n; n = n.nextSibling) {
      getAllTextContent_(n, normalizeWhitespace, accumulator);
    }
  }
  return accumulator;
}
function isDocument(object) {
  return "documentElement" in object;
}
function getAttributeNS(node, namespaceURI, name) {
  return node.getAttributeNS(namespaceURI, name) || "";
}
function parse(xml) {
  return new DOMParser().parseFromString(xml, "application/xml");
}
function makeArrayExtender(valueReader, thisArg) {
  return (
    /**
     * @param {Node} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @this {*}
     */
    (function(node, objectStack) {
      const value = valueReader.call(thisArg ?? this, node, objectStack);
      if (value !== void 0) {
        const array = (
          /** @type {Array<*>} */
          objectStack[objectStack.length - 1]
        );
        extend(array, value);
      }
    })
  );
}
function makeArrayPusher(valueReader, thisArg) {
  return (
    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @this {*}
     */
    (function(node, objectStack) {
      const value = valueReader.call(thisArg ?? this, node, objectStack);
      if (value !== void 0) {
        const array = (
          /** @type {Array<*>} */
          objectStack[objectStack.length - 1]
        );
        array.push(value);
      }
    })
  );
}
function makeReplacer(valueReader, thisArg) {
  return (
    /**
     * @param {Node} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @this {*}
     */
    (function(node, objectStack) {
      const value = valueReader.call(thisArg ?? this, node, objectStack);
      if (value !== void 0) {
        objectStack[objectStack.length - 1] = value;
      }
    })
  );
}
function makeObjectPropertyPusher(valueReader, property, thisArg) {
  return (
    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @this {*}
     */
    (function(node, objectStack) {
      const value = valueReader.call(thisArg ?? this, node, objectStack);
      if (value !== void 0) {
        const object = (
          /** @type {!Object} */
          objectStack[objectStack.length - 1]
        );
        const name = property !== void 0 ? property : node.localName;
        let array;
        if (name in object) {
          array = object[name];
        } else {
          array = [];
          object[name] = array;
        }
        array.push(value);
      }
    })
  );
}
function makeObjectPropertySetter(valueReader, property, thisArg) {
  return (
    /**
     * @param {Element} node Node.
     * @param {Array<*>} objectStack Object stack.
     * @this {*}
     */
    (function(node, objectStack) {
      const value = valueReader.call(thisArg ?? this, node, objectStack);
      if (value !== void 0) {
        const object = (
          /** @type {!Object} */
          objectStack[objectStack.length - 1]
        );
        const name = property !== void 0 ? property : node.localName;
        object[name] = value;
      }
    })
  );
}
function makeChildAppender(nodeWriter, thisArg) {
  return (
    /**
     * @param {Element} node Node.
     * @param {*} value Value to be written.
     * @param {Array<*>} objectStack Object stack.
     * @this {*}
     */
    (function(node, value, objectStack) {
      nodeWriter.call(thisArg ?? this, node, value, objectStack);
      const parent = (
        /** @type {NodeStackItem} */
        objectStack[objectStack.length - 1]
      );
      const parentNode = parent.node;
      parentNode.appendChild(node);
    })
  );
}
function makeArraySerializer(nodeWriter, thisArg) {
  let serializersNS, nodeFactory;
  return function(node, value, objectStack) {
    if (serializersNS === void 0) {
      serializersNS = {};
      const serializers = {};
      serializers[node.localName] = nodeWriter;
      serializersNS[node.namespaceURI] = serializers;
      nodeFactory = makeSimpleNodeFactory(node.localName);
    }
    serialize(serializersNS, nodeFactory, value, objectStack);
  };
}
function makeSimpleNodeFactory(fixedNodeName, fixedNamespaceURI) {
  return (
    /**
     * @param {*} value Value.
     * @param {Array<*>} objectStack Object stack.
     * @param {string} [newNodeName] Node name.
     * @return {Node} Node.
     */
    (function(value, objectStack, newNodeName) {
      const context = (
        /** @type {NodeStackItem} */
        objectStack[objectStack.length - 1]
      );
      const node = context.node;
      let nodeName = fixedNodeName;
      if (nodeName === void 0) {
        nodeName = newNodeName;
      }
      const namespaceURI = fixedNamespaceURI !== void 0 ? fixedNamespaceURI : node.namespaceURI;
      return createElementNS(
        namespaceURI,
        /** @type {string} */
        nodeName
      );
    })
  );
}
var OBJECT_PROPERTY_NODE_FACTORY = makeSimpleNodeFactory();
function makeSequence(object, orderedKeys) {
  const length = orderedKeys.length;
  const sequence = new Array(length);
  for (let i = 0; i < length; ++i) {
    sequence[i] = object[orderedKeys[i]];
  }
  return sequence;
}
function makeStructureNS(namespaceURIs, structure, structureNS) {
  structureNS = structureNS !== void 0 ? structureNS : {};
  let i, ii;
  for (i = 0, ii = namespaceURIs.length; i < ii; ++i) {
    structureNS[namespaceURIs[i]] = structure;
  }
  return structureNS;
}
function parseNode(parsersNS, node, objectStack, thisArg) {
  let n;
  for (n = node.firstElementChild; n; n = n.nextElementSibling) {
    const parsers = parsersNS[n.namespaceURI];
    if (parsers !== void 0) {
      const parser = parsers[n.localName];
      if (parser !== void 0) {
        parser.call(thisArg, n, objectStack);
      }
    }
  }
}
function pushParseAndPop(object, parsersNS, node, objectStack, thisArg) {
  objectStack.push(object);
  parseNode(parsersNS, node, objectStack, thisArg);
  return (
    /** @type {T} */
    objectStack.pop()
  );
}
function serialize(serializersNS, nodeFactory, values, objectStack, keys, thisArg) {
  const length = (keys !== void 0 ? keys : values).length;
  let value, node;
  for (let i = 0; i < length; ++i) {
    value = values[i];
    if (value !== void 0) {
      node = nodeFactory.call(
        thisArg,
        value,
        objectStack,
        keys !== void 0 ? keys[i] : void 0
      );
      if (node !== void 0) {
        serializersNS[node.namespaceURI][node.localName].call(
          thisArg,
          node,
          value,
          objectStack
        );
      }
    }
  }
}
function pushSerializeAndPop(object, serializersNS, nodeFactory, values, objectStack, keys, thisArg) {
  objectStack.push(object);
  serialize(serializersNS, nodeFactory, values, objectStack, keys, thisArg);
  return (
    /** @type {O|undefined} */
    objectStack.pop()
  );
}
var xmlSerializer_ = void 0;
function getXMLSerializer() {
  if (xmlSerializer_ === void 0 && typeof XMLSerializer !== "undefined") {
    xmlSerializer_ = new XMLSerializer();
  }
  return xmlSerializer_;
}
var document_ = void 0;
function getDocument() {
  if (document_ === void 0 && typeof document !== "undefined") {
    document_ = document.implementation.createDocument("", "", null);
  }
  return document_;
}

// node_modules/ol/format/XML.js
var XML = class {
  /**
   * Read the source document.
   *
   * @param {Document|Element|string} source The XML source.
   * @return {Object|null} An object representing the source.
   * @api
   */
  read(source) {
    if (!source) {
      return null;
    }
    if (typeof source === "string") {
      const doc = parse(source);
      return this.readFromDocument(doc);
    }
    if (isDocument(source)) {
      return this.readFromDocument(
        /** @type {Document} */
        source
      );
    }
    return this.readFromNode(
      /** @type {Element} */
      source
    );
  }
  /**
   * @param {Document} doc Document.
   * @return {Object|null} Object
   */
  readFromDocument(doc) {
    for (let n = doc.firstChild; n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        return this.readFromNode(
          /** @type {Element} */
          n
        );
      }
    }
    return null;
  }
  /**
   * @abstract
   * @param {Element} node Node.
   * @return {Object|null} Object
   */
  readFromNode(node) {
    abstract();
  }
};
var XML_default = XML;

// node_modules/ol/format/xlink.js
var NAMESPACE_URI = "http://www.w3.org/1999/xlink";
function readHref(node) {
  return node.getAttributeNS(NAMESPACE_URI, "href");
}

// node_modules/ol/format/xsd.js
function readBoolean(node) {
  const s = getAllTextContent(node, false);
  return readBooleanString(s);
}
function readBooleanString(string) {
  const m = /^\s*(true|1)|(false|0)\s*$/.exec(string);
  if (m) {
    return m[1] !== void 0 || false;
  }
  return void 0;
}
function readDateTime(node) {
  const s = getAllTextContent(node, false);
  const dateTime = Date.parse(s);
  return isNaN(dateTime) ? void 0 : dateTime / 1e3;
}
function readDecimal(node) {
  const s = getAllTextContent(node, false);
  return readDecimalString(s);
}
function readDecimalString(string) {
  const m = /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*$/i.exec(string);
  if (m) {
    return parseFloat(m[1]);
  }
  return void 0;
}
function readPositiveInteger(node) {
  const s = getAllTextContent(node, false);
  return readNonNegativeIntegerString(s);
}
function readNonNegativeIntegerString(string) {
  const m = /^\s*(\d+)\s*$/.exec(string);
  if (m) {
    return parseInt(m[1], 10);
  }
  return void 0;
}
function readString(node) {
  return getAllTextContent(node, false).trim();
}
function writeBooleanTextNode(node, bool) {
  writeStringTextNode(node, bool ? "1" : "0");
}
function writeCDATASection(node, string) {
  node.appendChild(getDocument().createCDATASection(string));
}
function writeDateTimeTextNode(node, dateTime) {
  const date = new Date(dateTime * 1e3);
  const string = date.getUTCFullYear() + "-" + padNumber(date.getUTCMonth() + 1, 2) + "-" + padNumber(date.getUTCDate(), 2) + "T" + padNumber(date.getUTCHours(), 2) + ":" + padNumber(date.getUTCMinutes(), 2) + ":" + padNumber(date.getUTCSeconds(), 2) + "Z";
  node.appendChild(getDocument().createTextNode(string));
}
function writeDecimalTextNode(node, decimal) {
  const string = decimal.toPrecision();
  node.appendChild(getDocument().createTextNode(string));
}
function writeNonNegativeIntegerTextNode(node, nonNegativeInteger) {
  const string = nonNegativeInteger.toString();
  node.appendChild(getDocument().createTextNode(string));
}
var whiteSpaceStart = /^\s/;
var whiteSpaceEnd = /\s$/;
var cdataCharacters = /(\n|\t|\r|<|&| {2})/;
function writeStringTextNode(node, string) {
  if (typeof string === "string" && (whiteSpaceStart.test(string) || whiteSpaceEnd.test(string) || cdataCharacters.test(string))) {
    string.split("]]>").forEach((part, i, a) => {
      if (i < a.length - 1) {
        part += "]]";
      }
      if (i > 0) {
        part = ">" + part;
      }
      writeCDATASection(node, part);
    });
  } else {
    node.appendChild(getDocument().createTextNode(string));
  }
}

// node_modules/ol/format/OWS.js
var NAMESPACE_URIS = [null, "http://www.opengis.net/ows/1.1"];
var PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "ServiceIdentification": makeObjectPropertySetter(readServiceIdentification),
  "ServiceProvider": makeObjectPropertySetter(readServiceProvider),
  "OperationsMetadata": makeObjectPropertySetter(readOperationsMetadata)
});
var OWS = class extends XML_default {
  constructor() {
    super();
  }
  /**
   * @param {Element} node Node.
   * @return {Object|null} Object
   * @override
   */
  readFromNode(node) {
    const owsObject = pushParseAndPop({}, PARSERS, node, []);
    return owsObject ? owsObject : null;
  }
};
var ADDRESS_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "DeliveryPoint": makeObjectPropertySetter(readString),
  "City": makeObjectPropertySetter(readString),
  "AdministrativeArea": makeObjectPropertySetter(readString),
  "PostalCode": makeObjectPropertySetter(readString),
  "Country": makeObjectPropertySetter(readString),
  "ElectronicMailAddress": makeObjectPropertySetter(readString)
});
var ALLOWED_VALUES_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "Value": makeObjectPropertyPusher(readValue)
});
var CONSTRAINT_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "AllowedValues": makeObjectPropertySetter(readAllowedValues)
});
var CONTACT_INFO_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "Phone": makeObjectPropertySetter(readPhone),
  "Address": makeObjectPropertySetter(readAddress)
});
var DCP_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "HTTP": makeObjectPropertySetter(readHttp)
});
var HTTP_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "Get": makeObjectPropertyPusher(readGet),
  "Post": void 0
  // TODO
});
var OPERATION_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "DCP": makeObjectPropertySetter(readDcp)
});
var OPERATIONS_METADATA_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "Operation": readOperation
});
var PHONE_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "Voice": makeObjectPropertySetter(readString),
  "Facsimile": makeObjectPropertySetter(readString)
});
var REQUEST_METHOD_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "Constraint": makeObjectPropertyPusher(readConstraint)
});
var SERVICE_CONTACT_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "IndividualName": makeObjectPropertySetter(readString),
  "PositionName": makeObjectPropertySetter(readString),
  "ContactInfo": makeObjectPropertySetter(readContactInfo)
});
var SERVICE_IDENTIFICATION_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "Abstract": makeObjectPropertySetter(readString),
  "AccessConstraints": makeObjectPropertySetter(readString),
  "Fees": makeObjectPropertySetter(readString),
  "Title": makeObjectPropertySetter(readString),
  "ServiceTypeVersion": makeObjectPropertySetter(readString),
  "ServiceType": makeObjectPropertySetter(readString)
});
var SERVICE_PROVIDER_PARSERS = makeStructureNS(NAMESPACE_URIS, {
  "ProviderName": makeObjectPropertySetter(readString),
  "ProviderSite": makeObjectPropertySetter(readHref),
  "ServiceContact": makeObjectPropertySetter(readServiceContact)
});
function readAddress(node, objectStack) {
  return pushParseAndPop({}, ADDRESS_PARSERS, node, objectStack);
}
function readAllowedValues(node, objectStack) {
  return pushParseAndPop({}, ALLOWED_VALUES_PARSERS, node, objectStack);
}
function readConstraint(node, objectStack) {
  const name = node.getAttribute("name");
  if (!name) {
    return void 0;
  }
  return pushParseAndPop({ "name": name }, CONSTRAINT_PARSERS, node, objectStack);
}
function readContactInfo(node, objectStack) {
  return pushParseAndPop({}, CONTACT_INFO_PARSERS, node, objectStack);
}
function readDcp(node, objectStack) {
  return pushParseAndPop({}, DCP_PARSERS, node, objectStack);
}
function readGet(node, objectStack) {
  const href = readHref(node);
  if (!href) {
    return void 0;
  }
  return pushParseAndPop(
    { "href": href },
    REQUEST_METHOD_PARSERS,
    node,
    objectStack
  );
}
function readHttp(node, objectStack) {
  return pushParseAndPop({}, HTTP_PARSERS, node, objectStack);
}
function readOperation(node, objectStack) {
  const name = node.getAttribute("name");
  const value = pushParseAndPop({}, OPERATION_PARSERS, node, objectStack);
  if (!value) {
    return void 0;
  }
  const object = (
    /** @type {Object} */
    objectStack[objectStack.length - 1]
  );
  object[name] = value;
}
function readOperationsMetadata(node, objectStack) {
  return pushParseAndPop({}, OPERATIONS_METADATA_PARSERS, node, objectStack);
}
function readPhone(node, objectStack) {
  return pushParseAndPop({}, PHONE_PARSERS, node, objectStack);
}
function readServiceIdentification(node, objectStack) {
  return pushParseAndPop({}, SERVICE_IDENTIFICATION_PARSERS, node, objectStack);
}
function readServiceContact(node, objectStack) {
  return pushParseAndPop({}, SERVICE_CONTACT_PARSERS, node, objectStack);
}
function readServiceProvider(node, objectStack) {
  return pushParseAndPop({}, SERVICE_PROVIDER_PARSERS, node, objectStack);
}
function readValue(node, objectStack) {
  return readString(node);
}
var OWS_default = OWS;

// node_modules/ol/format/WMTSCapabilities.js
var NAMESPACE_URIS2 = [null, "http://www.opengis.net/wmts/1.0"];
var OWS_NAMESPACE_URIS = [null, "http://www.opengis.net/ows/1.1"];
var PARSERS2 = makeStructureNS(NAMESPACE_URIS2, {
  "Contents": makeObjectPropertySetter(readContents)
});
var WMTSCapabilities = class extends XML_default {
  constructor() {
    super();
    this.owsParser_ = new OWS_default();
  }
  /**
   * @param {Element} node Node.
   * @return {Object|null} Object
   * @override
   */
  readFromNode(node) {
    let version = node.getAttribute("version");
    if (version) {
      version = version.trim();
    }
    let WMTSCapabilityObject = this.owsParser_.readFromNode(node);
    if (!WMTSCapabilityObject) {
      return null;
    }
    WMTSCapabilityObject["version"] = version;
    WMTSCapabilityObject = pushParseAndPop(
      WMTSCapabilityObject,
      PARSERS2,
      node,
      []
    );
    return WMTSCapabilityObject ? WMTSCapabilityObject : null;
  }
};
var CONTENTS_PARSERS = makeStructureNS(NAMESPACE_URIS2, {
  "Layer": makeObjectPropertyPusher(readLayer),
  "TileMatrixSet": makeObjectPropertyPusher(readTileMatrixSet)
});
var LAYER_PARSERS = makeStructureNS(
  NAMESPACE_URIS2,
  {
    "Style": makeObjectPropertyPusher(readStyle),
    "Format": makeObjectPropertyPusher(readString),
    "TileMatrixSetLink": makeObjectPropertyPusher(readTileMatrixSetLink),
    "Dimension": makeObjectPropertyPusher(readDimensions),
    "ResourceURL": makeObjectPropertyPusher(readResourceUrl)
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    "Title": makeObjectPropertySetter(readString),
    "Abstract": makeObjectPropertySetter(readString),
    "WGS84BoundingBox": makeObjectPropertySetter(readBoundingBox),
    "BoundingBox": makeObjectPropertyPusher(readBoundingBoxWithCrs),
    "Identifier": makeObjectPropertySetter(readString)
  })
);
var STYLE_PARSERS = makeStructureNS(
  NAMESPACE_URIS2,
  {
    "LegendURL": makeObjectPropertyPusher(readLegendUrl)
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    "Title": makeObjectPropertySetter(readString),
    "Identifier": makeObjectPropertySetter(readString)
  })
);
var TMS_LINKS_PARSERS = makeStructureNS(NAMESPACE_URIS2, {
  "TileMatrixSet": makeObjectPropertySetter(readString),
  "TileMatrixSetLimits": makeObjectPropertySetter(readTileMatrixLimitsList)
});
var TMS_LIMITS_LIST_PARSERS = makeStructureNS(NAMESPACE_URIS2, {
  "TileMatrixLimits": makeArrayPusher(readTileMatrixLimits)
});
var TMS_LIMITS_PARSERS = makeStructureNS(NAMESPACE_URIS2, {
  "TileMatrix": makeObjectPropertySetter(readString),
  "MinTileRow": makeObjectPropertySetter(readPositiveInteger),
  "MaxTileRow": makeObjectPropertySetter(readPositiveInteger),
  "MinTileCol": makeObjectPropertySetter(readPositiveInteger),
  "MaxTileCol": makeObjectPropertySetter(readPositiveInteger)
});
var DIMENSION_PARSERS = makeStructureNS(
  NAMESPACE_URIS2,
  {
    "Default": makeObjectPropertySetter(readString),
    "Value": makeObjectPropertyPusher(readString)
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    "Identifier": makeObjectPropertySetter(readString)
  })
);
var WGS84_BBOX_READERS = makeStructureNS(OWS_NAMESPACE_URIS, {
  "LowerCorner": makeArrayPusher(readCoordinates),
  "UpperCorner": makeArrayPusher(readCoordinates)
});
var TMS_PARSERS = makeStructureNS(
  NAMESPACE_URIS2,
  {
    "WellKnownScaleSet": makeObjectPropertySetter(readString),
    "TileMatrix": makeObjectPropertyPusher(readTileMatrix)
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    "SupportedCRS": makeObjectPropertySetter(readString),
    "Identifier": makeObjectPropertySetter(readString),
    "BoundingBox": makeObjectPropertySetter(readBoundingBox)
  })
);
var TM_PARSERS = makeStructureNS(
  NAMESPACE_URIS2,
  {
    "TopLeftCorner": makeObjectPropertySetter(readCoordinates),
    "ScaleDenominator": makeObjectPropertySetter(readDecimal),
    "TileWidth": makeObjectPropertySetter(readPositiveInteger),
    "TileHeight": makeObjectPropertySetter(readPositiveInteger),
    "MatrixWidth": makeObjectPropertySetter(readPositiveInteger),
    "MatrixHeight": makeObjectPropertySetter(readPositiveInteger)
  },
  makeStructureNS(OWS_NAMESPACE_URIS, {
    "Identifier": makeObjectPropertySetter(readString)
  })
);
function readContents(node, objectStack) {
  return pushParseAndPop({}, CONTENTS_PARSERS, node, objectStack);
}
function readLayer(node, objectStack) {
  return pushParseAndPop({}, LAYER_PARSERS, node, objectStack);
}
function readTileMatrixSet(node, objectStack) {
  return pushParseAndPop({}, TMS_PARSERS, node, objectStack);
}
function readStyle(node, objectStack) {
  const style = pushParseAndPop({}, STYLE_PARSERS, node, objectStack);
  if (!style) {
    return void 0;
  }
  const isDefault = node.getAttribute("isDefault") === "true";
  style["isDefault"] = isDefault;
  return style;
}
function readTileMatrixSetLink(node, objectStack) {
  return pushParseAndPop({}, TMS_LINKS_PARSERS, node, objectStack);
}
function readDimensions(node, objectStack) {
  return pushParseAndPop({}, DIMENSION_PARSERS, node, objectStack);
}
function readResourceUrl(node, objectStack) {
  const format = node.getAttribute("format");
  const template = node.getAttribute("template");
  const resourceType = node.getAttribute("resourceType");
  const resource = {};
  if (format) {
    resource["format"] = format;
  }
  if (template) {
    resource["template"] = template;
  }
  if (resourceType) {
    resource["resourceType"] = resourceType;
  }
  return resource;
}
function readBoundingBox(node, objectStack) {
  const coordinates = pushParseAndPop(
    [],
    WGS84_BBOX_READERS,
    node,
    objectStack
  );
  if (coordinates.length != 2) {
    return void 0;
  }
  return boundingExtent(coordinates);
}
function readBoundingBoxWithCrs(node, objectStack) {
  const crs = node.getAttribute("crs");
  const coordinates = pushParseAndPop(
    [],
    WGS84_BBOX_READERS,
    node,
    objectStack
  );
  if (coordinates.length != 2) {
    return void 0;
  }
  return { extent: boundingExtent(coordinates), crs };
}
function readLegendUrl(node, objectStack) {
  const legend = {};
  legend["format"] = node.getAttribute("format");
  legend["href"] = readHref(node);
  return legend;
}
function readCoordinates(node, objectStack) {
  const coordinates = readString(node).split(/\s+/);
  if (!coordinates || coordinates.length != 2) {
    return void 0;
  }
  const x = +coordinates[0];
  const y = +coordinates[1];
  if (isNaN(x) || isNaN(y)) {
    return void 0;
  }
  return [x, y];
}
function readTileMatrix(node, objectStack) {
  return pushParseAndPop({}, TM_PARSERS, node, objectStack);
}
function readTileMatrixLimitsList(node, objectStack) {
  return pushParseAndPop([], TMS_LIMITS_LIST_PARSERS, node, objectStack);
}
function readTileMatrixLimits(node, objectStack) {
  return pushParseAndPop({}, TMS_LIMITS_PARSERS, node, objectStack);
}
var WMTSCapabilities_default = WMTSCapabilities;

export {
  XML_SCHEMA_INSTANCE_URI,
  createElementNS,
  getAllTextContent,
  isDocument,
  getAttributeNS,
  parse,
  makeArrayExtender,
  makeArrayPusher,
  makeReplacer,
  makeObjectPropertyPusher,
  makeObjectPropertySetter,
  makeChildAppender,
  makeArraySerializer,
  makeSimpleNodeFactory,
  OBJECT_PROPERTY_NODE_FACTORY,
  makeSequence,
  makeStructureNS,
  parseNode,
  pushParseAndPop,
  pushSerializeAndPop,
  getXMLSerializer,
  readBoolean,
  readBooleanString,
  readDateTime,
  readDecimal,
  readDecimalString,
  readPositiveInteger,
  readNonNegativeIntegerString,
  readString,
  writeBooleanTextNode,
  writeDateTimeTextNode,
  writeDecimalTextNode,
  writeNonNegativeIntegerTextNode,
  writeStringTextNode,
  XML_default,
  readHref,
  OWS_default,
  WMTSCapabilities_default
};
//# sourceMappingURL=chunk-OYMFUSSD.js.map
