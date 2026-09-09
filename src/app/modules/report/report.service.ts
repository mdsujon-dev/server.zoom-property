export type ReportRange = {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

const financialReport = async (query: ReportRange) => {
  return {
    summary: {
      income: 0,
      expense: 0,
      net: 0,
      refunded: 0,
      entries: 0,
      byMonth: [],
    },
    meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    rows: [],
    allRows: [],
  };
};

const cashBookReport = async (query: ReportRange) => {
  return {
    summary: {
      opening: 0,
      openingSide: "debit",
      debitTotal: 0,
      creditTotal: 0,
      closing: 0,
      closingSide: "credit",
      grandDebit: 0,
      grandCredit: 0,
      entries: 0,
    },
    meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    rows: [],
    allRows: [],
  };
};

const profitLossReport = async (query: ReportRange) => {
  return {
    summary: {
      income: 0,
      expense: 0,
      net: 0,
      result: "profit",
      entries: 0,
    },
    income: [],
    expense: [],
  };
};

export const ReportService = {
  financialReport,
  cashBookReport,
  profitLossReport,
};
