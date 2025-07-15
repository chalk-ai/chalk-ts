import {
  DataType,
  LargeUtf8,
  Int32,
  Int64,
  Bool,
  List,
  Field,
  Struct,
  vectorFromArray,
  Vector,
  Table,
  Float64,
} from "apache-arrow";
import { ChalkOnlineBulkQueryRequest } from "../_interface";

export const inferElementType = (element: unknown): DataType => {
  if (element == null) return new LargeUtf8(); // Default for null values

  if (typeof element === "string") return new LargeUtf8();
  if (typeof element === "boolean") return new Bool();
  if (typeof element === "number") {
    if (Number.isInteger(element)) {
      return element >= -2147483648 && element <= 2147483647
        ? new Int32()
        : new Int64();
    }
    return new Float64();
  }
  if (Array.isArray(element)) {
    // For nested arrays, infer type from first non-null element
    const firstNonNull = element.find((item) => item != null);
    const childType = inferElementType(firstNonNull);
    return new List(new Field("item", childType));
  }
  if (typeof element === "object") {
    // For objects, create struct type from keys
    const structFields = Object.keys(element).map((key) => {
      const fieldType = inferElementType(
        (element as Record<string, unknown>)[key]
      );
      return new Field(key, fieldType);
    });
    return new Struct(structFields);
  }

  return new LargeUtf8(); // Default fallback
};

/**
 * An improvement over the original arrow logic to construct a table from a map of arrays.
 * This one will check the elements for the first non-null element to infer a more complex shape.
 * Mixed-type (including struct schema) arrays still cannot be parsed though
 *
 * @param inputs
 */
export const tableFromArraysTyped = <
  TFeatureMap,
  TOutput extends keyof TFeatureMap
>(
  inputs: ChalkOnlineBulkQueryRequest<TFeatureMap, TOutput>["inputs"]
): Table => {
  const entries = Object.entries(inputs) as [string, unknown[]][];
  const vectorMap: Record<string, Vector> = {};
  for (const [key, col] of entries) {
    const firstNonNullElement = col.find((element) => element != null);
    if (col.length === 0 || firstNonNullElement == null) {
      vectorMap[key] = vectorFromArray(col);
      continue;
    }

    vectorMap[key] = vectorFromArray(
      col,
      inferElementType(firstNonNullElement)
    );
  }

  return new Table(vectorMap);
};
