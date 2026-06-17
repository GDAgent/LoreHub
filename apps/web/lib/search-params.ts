export type SearchParamValue = string | string[] | undefined;

export function getSearchParamValue(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
