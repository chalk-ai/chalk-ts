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
  Null,
} from "apache-arrow";
import { ChalkOnlineBulkQueryRequest } from "../_interface";

export const inferElementType = (element: unknown): DataType => {
  if (element == null) return new Null(); // Default for null values

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
    const structFields = Object.entries(element).map(([key, subElement]) => {
      const fieldType = inferElementType(subElement);
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

/**
 * Removes any arrow-specific types like Vector so that consumers do not have to interact with
 * Chalk-specific wire format
 *
 * @param datum a piece of data that may still be arrow-specific
 */
export const unwrapArrowSpecificTypes = <T>(datum: T): T => {
  if (typeof datum !== "object" || datum == null) {
    return datum;
  } else if (datum.constructor.name === "Vector" || datum instanceof Vector) {
    // the second check sometimes doesn't work, but the constructor still exists
    return (datum as unknown as Vector)
      .toArray()
      .map(unwrapArrowSpecificTypes) as T;
  } else if (Array.isArray(datum)) {
    return datum.map(unwrapArrowSpecificTypes) as T;
  } else {
    return Object.fromEntries(
      Object.entries(datum).map(([key, value]) => [
        key,
        unwrapArrowSpecificTypes(value),
      ])
    ) as T;
  }
};
