// Types
export type ExpenseKind =
  | "fuel"
  | "insurance"
  | "maintenance"
  | "toll"
  | "parking"
  | "fine"
  | "wash"
  | "credit"
  | "leasing"
  | "tax"
  | "delete";

export interface FuelExpense {
  kind: "fuel";
  date: string; // ISO 8601
  mileage: number;
  amount: number; // cents
  liters: number;
  fuelType: string;
  isFull: boolean;
  pricePerLiter?: number;
  odbConsumption?: number;
}

export interface InsuranceExpense {
  kind: "insurance";
  date: string;
  amount: number;
  company: string;
  policyNumber?: string;
  periodStart: string;
  periodEnd: string;
}

export interface MaintenanceExpense {
  kind: "maintenance";
  date: string;
  mileage?: number;
  amount: number;
  description: string;
  category: "oil" | "tires" | "brakes" | "other";
}

export type SimpleExpense = {
  kind: "toll" | "parking" | "fine" | "wash" | "tax";
  date: string;
  amount: number;
  description?: string;
};

export type CreditExpense = {
  kind: "credit" | "leasing";
  date: string;
  amount: number;
  description?: string;
};

export type DeleteExpense = {
  kind: "delete";
  targetId: string;
};

export type Expense =
  | FuelExpense
  | InsuranceExpense
  | MaintenanceExpense
  | SimpleExpense
  | CreditExpense
  | DeleteExpense;

export interface ExpenseEnvelope {
  id: string; // hash chain
  vehicleId: string;
  parentId: string | null;
  timestamp: number;
  data: Expense;
}

export interface Vehicle {
  id: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  firstRegistrationDate: string;
  purchaseDate?: string;
  initialMileage: number;
  fuelTypes: string[];
}

export interface Profile {
  username: string;
  displayName?: string;
  preferences: Record<string, unknown>;
}
