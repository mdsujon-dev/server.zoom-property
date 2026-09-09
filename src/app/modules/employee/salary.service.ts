import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import User from "../auth/auth.model";

export interface ISalaryInput {
  amount: number;
  head?: string;
  salaryMonth?: string;
  method?: string;
  date?: string;
  reference?: string;
  note?: string;
}

const loadStaff = async (id: string) => {
  const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "Employee not found");
  return {
    _id: user._id,
    name: user.name,
    code: user.email,
    salary: user.salary,
    salaryType: user.salaryType,
    doc: user,
  };
};

const paySalary = async (staffId: string, input: ISalaryInput, createdBy?: string) => {
  throw new AppError(StatusCodes.NOT_IMPLEMENTED, "Salary transactions are disabled");
};

const returnSalary = async (staffId: string, input: ISalaryInput, createdBy?: string) => {
  throw new AppError(StatusCodes.NOT_IMPLEMENTED, "Salary transactions are disabled");
};

const getSalaryLedger = async (staffId: string) => {
  const staff = await loadStaff(staffId);
  return {
    staff: staff.doc,
    entries: [],
    totals: {
      agreed: staff.salary || 0,
      salaryType: staff.salaryType || "monthly",
      paidThisMonth: 0,
      paidThisYear: 0,
      returned: 0,
      thisMonth: new Date().toISOString().slice(0, 7),
    },
  };
};

export const SalaryService = {
  paySalary,
  returnSalary,
  getSalaryLedger,
};
