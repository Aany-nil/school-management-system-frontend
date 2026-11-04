
import { useEffect, useState } from "react";
import {
  Wallet,
  CreditCard,
  CircleDollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Receipt,
} from "lucide-react";
import api from "../../services/api";

const Fee = () => {
  const [fees, setFees] = useState([]);

  const [summary, setSummary] = useState({
    totalFee: 0,
    paidAmount: 0,
    dueAmount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch Student Fee
  const fetchFees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/fee/student-fees");

      const feeData = response.data?.data;

      // Backend returns one fee object, not an array
      const feeRecords = feeData ? [feeData] : [];

      setFees(feeRecords);

      // Calculate Summary
      const totalFee = feeRecords.reduce(
        (sum, fee) => sum + Number(fee.totalFee || 0),
        0
      );

      const paidAmount = feeRecords.reduce(
        (sum, fee) => sum + Number(fee.paidAmount || 0),
        0
      );

      const dueAmount = feeRecords.reduce(
        (sum, fee) => sum + Number(fee.dueAmount || 0),
        0
      );

      setSummary({
        totalFee,
        paidAmount,
        dueAmount,
      });
    } catch (err) {
      console.error("Student Fee Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load fee information."
      );

      setFees([]);

      setSummary({
        totalFee: 0,
        paidAmount: 0,
        dueAmount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  // Currency Format
  const formatCurrency = (amount) => {
    return `৳ ${Number(amount || 0).toLocaleString("en-BD")}`;
  };

  // Date Format
  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-GB");
  };

  // Status Style
  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";

      case "Partial":
        return "bg-yellow-100 text-yellow-700";

      case "Due":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Status Icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Paid":
        return <CheckCircle size={16} />;

      case "Partial":
        return <Clock size={16} />;

      case "Due":
        return <AlertCircle size={16} />;

      default:
        return <Receipt size={16} />;
    }
  };

  // Summary Cards
  const cards = [
    {
      title: "Total Fee",
      amount: summary.totalFee,
      icon: <Wallet size={23} />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Paid Amount",
      amount: summary.paidAmount,
      icon: <CheckCircle size={23} />,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Due Amount",
      amount: summary.dueAmount,
      icon: <CircleDollarSign size={23} />,
      color: "bg-red-100 text-red-600",
    },
  ];

  // Payment Percentage
  const paymentPercentage =
    summary.totalFee > 0
      ? Math.min(
          (summary.paidAmount / summary.totalFee) * 100,
          100
        )
      : 0;

  // Loading Screen
  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw
            className="mx-auto text-blue-600"
            size={32}
          />

          <p className="mt-3 text-sm text-gray-500">
            Loading fee information...
          </p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center p-3 sm:p-5">
        <div className="w-full max-w-lg rounded-xl border border-red-200 bg-red-50 p-5 text-center sm:p-8">
          <AlertCircle
            className="mx-auto text-red-500"
            size={38}
          />

          <h2 className="mt-3 text-lg font-semibold text-red-700">
            Unable to Load Fees
          </h2>

          <p className="mt-2 break-words text-sm text-red-600">
            {error}
          </p>

          <button
            onClick={fetchFees}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-7">

        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl lg:text-3xl">
              Fee Management
            </h1>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              View your fee records and payment information.
            </p>
          </div>

          <button
            onClick={fetchFees}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="min-w-0 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words text-xs font-medium text-gray-500 sm:text-sm">
                    {card.title}
                  </p>

                  <h2 className="mt-2 break-words text-lg font-bold text-gray-800 sm:text-2xl">
                    {formatCurrency(card.amount)}
                  </h2>
                </div>

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-xl ${card.color}`}
                >
                  <span className="sm:hidden">
                    {card.title === "Total Fee" && <Wallet size={19} />}
                    {card.title === "Paid Amount" && <CheckCircle size={19} />}
                    {card.title === "Due Amount" && <CircleDollarSign size={19} />}
                  </span>

                  <span className="hidden sm:block">
                    {card.icon}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Information */}
        <div className="overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-md sm:p-6">
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-xl bg-white/20 p-2.5 sm:p-3">
              <CreditCard size={23} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold sm:text-lg">
                Payment Overview
              </h2>

              <p className="text-xs text-blue-100 sm:text-sm">
                Your overall fee payment information
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-2 text-sm">
              <span>Payment Progress</span>

              <span className="font-semibold">
                {Math.round(paymentPercentage)}%
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white"
                style={{
                  width: `${paymentPercentage}%`,
                }}
              />
            </div>

            <p className="mt-3 break-words text-xs text-blue-100 sm:text-sm">
              {formatCurrency(summary.paidAmount)} paid out of{" "}
              {formatCurrency(summary.totalFee)}
            </p>
          </div>
        </div>

        {/* Fee Records */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

          {/* Section Header */}
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
              My Fee Records
            </h2>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Total {fees.length} fee record(s)
            </p>
          </div>

          {/* Empty State */}
          {fees.length === 0 ? (
            <div className="p-8 text-center sm:p-10">
              <Receipt
                className="mx-auto text-gray-300"
                size={42}
              />

              <h3 className="mt-3 font-semibold text-gray-700">
                No Fee Records Found
              </h3>

              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                Your fee information has not been added yet.
              </p>
            </div>
          ) : (
            <>
              {/* Fee Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        SL
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        Date
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        Total Fee
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        Paid Amount
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        Due Amount
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {fees.map((fee, index) => (
                      <tr
                        key={fee._id || index}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 text-gray-600">
                          {index + 1}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                          {formatDate(fee.createdAt)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-800">
                          {formatCurrency(fee.totalFee)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-green-600">
                          {formatCurrency(fee.paidAmount)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-red-600">
                          {formatCurrency(fee.dueAmount)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                              fee.status
                            )}`}
                          >
                            {getStatusIcon(fee.status)}
                            {fee.status || "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-sm">
                <p>
                  Showing {fees.length} fee record(s)
                </p>

                <p>
                  Total Due:{" "}
                  <span className="font-semibold text-red-600">
                    {formatCurrency(summary.dueAmount)}
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Fee;
