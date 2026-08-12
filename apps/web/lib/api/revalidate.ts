import { mutate } from "swr";

const PREFIXES = ["/transactions", "/dashboard", "/accounts", "/search"];

export function revalidateFinancialData() {
  return mutate((key) => typeof key === "string" && PREFIXES.some((p) => key.startsWith(p)));
}
