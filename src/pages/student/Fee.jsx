
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

  const fetchFees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/fee/student-fees");
      const result = response.data;

      const feeData = result?.data?.fees || [];

      setFees(feeData);
      setSummary({
        totalFee: result?.data?.totalFee || 0,
        paidAmount: result?.data?.paidAmount || 0,
        dueAmount: result?.data?.dueAmount || 0,
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load fee information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const formatCurrency = (amount) => {
    return `৳ ${Number(amount || 0).toLocaleString("en-BD")}`;
  };

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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto animate-spin text-blue-600" size={35} />
          <p className="mt-3 text-gray-500">Loading fee information...</p>
        </div>
      </div>
    );
  }

  if (error && fees.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto text-red-500" size={40} />
        <h2 className="mt-3 text-lg font-semibold text-red-700">
          Unable to Load Fees
        </h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          onClick={fetchFees}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Fee",
      amount: summary.totalFee,
      icon: <Wallet size={24} />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Paid Amount",
      amount: summary.paidAmount,
      icon: <CheckCircle size={24} />,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Due Amount",
      amount: summary.dueAmount,
      icon: <CircleDollarSign size={24} />,
      color: "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
            Fee Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View your fee records and payment information.
          </p>
        </div>

        <button
          onClick={fetchFees}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-800">
                  {formatCurrency(card.amount)}
                </h2>
              </div>

              <div className={`rounded-xl p-3 ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Information */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-3">
            <CreditCard size={25} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Payment Overview</h2>
            <p className="text-sm text-blue-100">
              Your overall fee payment information
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span>Payment Progress</span>
            <span>
              {summary.totalFee > 0
                ? Math.round(
                    (summary.paidAmount / summary.totalFee) * 100
                  )
                : 0}
              %
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{
                width: `${
                  summary.totalFee > 0
                    ? Math.min(
                        (summary.paidAmount / summary.totalFee) * 100,
                        100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Fee Records */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800">
            My Fee Records
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Total {fees.length} fee record(s)
          </p>
        </div>

        {fees.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt className="mx-auto text-gray-300" size={45} />
            <h3 className="mt-3 font-semibold text-gray-700">
              No Fee Records Found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your fee information has not been added yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">SL</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Total Fee</th>
                  <th className="px-5 py-4">Paid Amount</th>
                  <th className="px-5 py-4">Due Amount</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {fees.map((fee, index) => (
                  <tr
                    key={fee._id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {fee.createdAt
                        ? new Date(fee.createdAt).toLocaleDateString("en-GB")
                        : "N/A"}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-gray-800">
                      {formatCurrency(fee.totalFee)}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-green-600">
                      {formatCurrency(fee.paidAmount)}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-red-600">
                      {formatCurrency(fee.dueAmount)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                          fee.status
                        )}`}
                      >
                        {getStatusIcon(fee.status)}
                        {fee.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fee;
