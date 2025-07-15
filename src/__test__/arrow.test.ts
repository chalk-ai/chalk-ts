import {
  LargeUtf8,
  Int32,
  Int64,
  Bool,
  List,
  Struct,
  Float64,
  Table,
} from "apache-arrow";
import { inferElementType, tableFromArraysTyped } from "../_utils/_arrow";

describe("inferElementType", () => {
  describe("primitive types", () => {
    test("should return LargeUtf8 for null", () => {
      const result = inferElementType(null);
      expect(result).toBeInstanceOf(LargeUtf8);
    });

    test("should return LargeUtf8 for undefined", () => {
      const result = inferElementType(undefined);
      expect(result).toBeInstanceOf(LargeUtf8);
    });

    test("should return LargeUtf8 for string", () => {
      const result = inferElementType("hello");
      expect(result).toBeInstanceOf(LargeUtf8);
    });

    test("should return Bool for boolean", () => {
      const result = inferElementType(true);
      expect(result).toBeInstanceOf(Bool);
    });

    test("should return Float64 for decimal number", () => {
      const result = inferElementType(3.14);
      expect(result).toBeInstanceOf(Float64);
    });

    test("should return Int32 for small integer", () => {
      const result = inferElementType(42);
      expect(result).toBeInstanceOf(Int32);
    });

    test("should return Int32 for max Int32 value", () => {
      const result = inferElementType(2147483647);
      expect(result).toBeInstanceOf(Int32);
    });

    test("should return Int32 for min Int32 value", () => {
      const result = inferElementType(-2147483648);
      expect(result).toBeInstanceOf(Int32);
    });

    test("should return Int64 for large positive integer", () => {
      const result = inferElementType(2147483648);
      expect(result).toBeInstanceOf(Int64);
    });

    test("should return Int64 for large negative integer", () => {
      const result = inferElementType(-2147483649);
      expect(result).toBeInstanceOf(Int64);
    });
  });

  describe("array types", () => {
    test("should return List of LargeUtf8 for string array", () => {
      const result = inferElementType(["a", "b", "c"]);
      expect(result).toBeInstanceOf(List);
      const listType = result as List;
      expect(listType.children[0].type).toBeInstanceOf(LargeUtf8);
    });

    test("should return List of Int32 for integer array", () => {
      const result = inferElementType([1, 2, 3]);
      expect(result).toBeInstanceOf(List);
      const listType = result as List;
      expect(listType.children[0].type).toBeInstanceOf(Int32);
    });

    test("should return List of Bool for boolean array", () => {
      const result = inferElementType([true, false, true]);
      expect(result).toBeInstanceOf(List);
      const listType = result as List;
      expect(listType.children[0].type).toBeInstanceOf(Bool);
    });

    test("should handle array with null elements", () => {
      const result = inferElementType([null, "hello", null]);
      expect(result).toBeInstanceOf(List);
      const listType = result as List;
      expect(listType.children[0].type).toBeInstanceOf(LargeUtf8);
    });

    test("should handle empty array", () => {
      const result = inferElementType([]);
      expect(result).toBeInstanceOf(List);
      const listType = result as List;
      expect(listType.children[0].type).toBeInstanceOf(LargeUtf8);
    });
  });

  describe("object types", () => {
    test("should return Struct for simple object", () => {
      const result = inferElementType({ mineral: "Quartz", hardness: 7 });
      expect(result).toBeInstanceOf(Struct);
      const structType = result as Struct;
      expect(structType.children).toHaveLength(2);
      expect(structType.children[0].name).toBe("mineral");
      expect(structType.children[0].type).toBeInstanceOf(LargeUtf8);
      expect(structType.children[1].name).toBe("hardness");
      expect(structType.children[1].type).toBeInstanceOf(Int32);
    });

    test("should return Struct for nested object", () => {
      const result = inferElementType({
        specimen: { mineral: "Pyrite", lustrous: true },
        count: 42,
      });
      expect(result).toBeInstanceOf(Struct);
      const structType = result as Struct;
      expect(structType.children).toHaveLength(2);
      expect(structType.children[0].name).toBe("specimen");
      expect(structType.children[0].type).toBeInstanceOf(Struct);
      expect(structType.children[1].name).toBe("count");
      expect(structType.children[1].type).toBeInstanceOf(Int32);
    });

    test("should return Struct even when fields are null", () => {
      const result = inferElementType({ mineral: "Talc", hardness: null });
      expect(result).toBeInstanceOf(Struct);
      const structType = result as Struct;
      expect(structType.children).toHaveLength(2);
      expect(structType.children[0].name).toBe("mineral");
      expect(structType.children[0].type).toBeInstanceOf(LargeUtf8);
      expect(structType.children[1].name).toBe("hardness");
      expect(structType.children[1].type).toBeInstanceOf(LargeUtf8);
    });

    test("should handle list of structs", () => {
      const result = inferElementType([
        { id: 1, mineral: "Anthracite" },
        { id: 2, mineral: "Beryl" },
      ]);
      expect(result).toBeInstanceOf(List);
      const listType = result as List;
      expect(listType.children[0].type).toBeInstanceOf(Struct);
      const structType = listType.children[0].type as Struct;
      expect(structType.children).toHaveLength(2);
      expect(structType.children[0].name).toBe("id");
      expect(structType.children[0].type).toBeInstanceOf(Int32);
      expect(structType.children[1].name).toBe("mineral");
      expect(structType.children[1].type).toBeInstanceOf(LargeUtf8);
    });
  });

  test("should return LargeUtf8 as fallback for unknown types", () => {
    const result = inferElementType(Symbol("test"));
    expect(result).toBeInstanceOf(LargeUtf8);
  });
});

describe("tableFromArraysTyped", () => {
  test("should create table from simple inputs", () => {
    const inputs = {
      minerals: ["Anthracite", "Beryl", "Calcite"],
      hardness: [2, 7.5, 3],
      gemstone: [false, true, false],
    };

    const table = tableFromArraysTyped(inputs);
    expect(table).toBeInstanceOf(Table);
    expect(table.numCols).toBe(3);
    expect(table.numRows).toBe(3);
    expect(table.schema.fields.map((f) => f.name)).toEqual([
      "minerals",
      "hardness",
      "gemstone",
    ]);
  });

  test("should handle empty arrays", () => {
    const inputs = {
      empty: [],
      minerals: ["Anthracite"],
    };

    const table = tableFromArraysTyped(inputs);
    expect(table).toBeInstanceOf(Table);
    expect(table.numCols).toBe(2);
  });

  test("should handle arrays with null values", () => {
    const inputs = {
      minerals: [null, "Beryl", null],
      hardness: [null, 7.5, 4],
    };

    const table = tableFromArraysTyped(inputs);
    expect(table).toBeInstanceOf(Table);
    expect(table.numCols).toBe(2);
    expect(table.numRows).toBe(3);
  });

  test("should handle arrays with all null values", () => {
    const inputs = {
      nulls: [null, null, null],
      minerals: ["Anthracite", "Beryl", "Calcite"],
    };

    const table = tableFromArraysTyped(inputs);
    expect(table).toBeInstanceOf(Table);
    expect(table.numCols).toBe(2);
    expect(table.numRows).toBe(3);
  });

  test("should handle complex nested data", () => {
    const inputs = {
      specimens: [
        { id: 1, mineral: "Anthracite", properties: ["carbon", "fuel"] },
        { id: 2, mineral: "Beryl", properties: ["gemstone"] },
      ],
      geology: [
        { formation: "Metamorphic", age: 300.5 },
        { formation: "Igneous", age: 200.0 },
      ],
    };

    const table = tableFromArraysTyped(inputs);
    expect(table).toBeInstanceOf(Table);
    expect(table.numCols).toBe(2);
    expect(table.numRows).toBe(2);
  });

  test("should handle list of structs", () => {
    const inputs = {
      minerals: [
        [
          { id: 1, name: "Anthracite", classification: "Organic" },
          { id: 2, name: "Beryl", classification: "Silicate" },
          { id: 3, name: "Calcite", classification: "Carbonate" },
        ],
      ],
    };

    const table = tableFromArraysTyped(inputs);
    expect(table).toBeInstanceOf(Table);
    expect(table.numCols).toBe(1);
    expect(table.numRows).toBe(1);

    const mineralsColumn = table.getChild("minerals");
    expect(mineralsColumn).toBeDefined();
    expect(mineralsColumn!.type).toBeInstanceOf(List);

    const listType = mineralsColumn!.type as List;
    expect(listType.children[0].type).toBeInstanceOf(Struct);
  });
});
