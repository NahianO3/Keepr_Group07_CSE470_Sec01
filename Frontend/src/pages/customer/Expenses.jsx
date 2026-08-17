import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  WalletCards,
  Receipt,
  Car,
  Refrigerator,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [appliances, setAppliances] = useState([]);

  const [selectedCategory, setSelectedCategory] =
    useState("");

  const [selectedAsset, setSelectedAsset] =
    useState("");

  const [assetType, setAssetType] =
    useState("all");

  const [summary, setSummary] = useState({
    total_amount: 0,
    expense_count: 0,
    by_category: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] =
    useState(null);

  const [form, setForm] = useState({
    maintenance_record_id: "",
    amount: "",
    expense_category: "",
    expense_date: "",
    description: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        expensesResponse,
        recordsResponse,
        vehiclesResponse,
        appliancesResponse,
        summaryResponse,
      ] = await Promise.all([
        api.get("/expenses"),
        api.get("/maintenance-records"),
        api.get("/vehicles"),
        api.get("/appliances"),
        api.get("/expenses/summary"),
      ]);

      setExpenses(
        expensesResponse.data?.data || []
      );

      setRecords(
        recordsResponse.data?.data || []
      );

      setVehicles(
        vehiclesResponse.data?.data || []
      );

      setAppliances(
        appliancesResponse.data?.data || []
      );

      setSummary(
        summaryResponse.data?.data || {
          total_amount: 0,
          expense_count: 0,
          by_category: [],
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load expense data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getVehicle = (id) =>
    vehicles.find(
      (vehicle) =>
        vehicle.id === Number(id)
    );

  const getAppliance = (id) =>
    appliances.find(
      (appliance) =>
        appliance.id === Number(id)
    );

  const getAssetName = (expense) => {
    if (expense.vehicle_id) {
      const vehicle = getVehicle(
        expense.vehicle_id
      );

      return vehicle
        ? `${vehicle.brand} ${vehicle.model}`
        : `Vehicle #${expense.vehicle_id}`;
    }

    if (expense.appliance_id) {
      const appliance = getAppliance(
        expense.appliance_id
      );

      return appliance?.name ||
        `Appliance #${expense.appliance_id}`;
    }

    return "Maintenance record";
  };

  const getAssetType = (expense) => {
    if (expense.vehicle_id) {
      return "vehicle";
    }

    if (expense.appliance_id) {
      return "appliance";
    }

    return "other";
  };

  const visibleExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (
        selectedCategory &&
        expense.expense_category !==
          selectedCategory
      ) {
        return false;
      }

      if (
        assetType !== "all" &&
        getAssetType(expense) !== assetType
      ) {
        return false;
      }

      if (selectedAsset) {
        if (assetType === "vehicle") {
          return (
            String(expense.vehicle_id) ===
            String(selectedAsset)
          );
        }

        if (assetType === "appliance") {
          return (
            String(expense.appliance_id) ===
            String(selectedAsset)
          );
        }
      }

      return true;
    });
  }, [
    expenses,
    selectedCategory,
    selectedAsset,
    assetType,
    vehicles,
    appliances,
  ]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        expenses
          .map(
            (expense) =>
              expense.expense_category
          )
          .filter(Boolean)
      ),
    ];
  }, [expenses]);

  const filteredTotal = useMemo(() => {
    return visibleExpenses.reduce(
      (total, expense) =>
        total + Number(expense.amount || 0),
      0
    );
  }, [visibleExpenses]);

  const openAdd = () => {
    setEditingExpense(null);

    setForm({
      maintenance_record_id:
        records[0]?.id || "",
      amount: "",
      expense_category: "",
      expense_date: "",
      description: "",
    });

    setShowForm(true);
    setError("");
  };

  const openEdit = (expense) => {
    setEditingExpense(expense);

    setForm({
      maintenance_record_id:
        expense.maintenance_record_id || "",
      amount: expense.amount ?? "",
      expense_category:
        expense.expense_category || "",
      expense_date:
        expense.expense_date || "",
      description:
        expense.description || "",
    });

    setShowForm(true);
    setError("");
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingExpense(null);
  };

  const saveExpense = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        maintenance_record_id: Number(
          form.maintenance_record_id
        ),
        amount: Number(form.amount),
        expense_category:
          form.expense_category.trim(),
        expense_date: form.expense_date,
        description:
          form.description.trim() || null,
      };

      if (editingExpense) {
        await api.put(
          `/expenses/${editingExpense.id}`,
          payload
        );
      } else {
        await api.post(
          "/expenses",
          payload
        );
      }

      setShowForm(false);
      setEditingExpense(null);

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save expense."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (expense) => {
    const confirmed = window.confirm(
      "Delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/expenses/${expense.id}`
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete expense."
      );
    }
  };

  const getRecordLabel = (record) => {
    if (record.vehicle_id) {
      const vehicle = getVehicle(
        record.vehicle_id
      );

      return vehicle
        ? `${vehicle.brand} ${vehicle.model}`
        : `Vehicle #${record.vehicle_id}`;
    }

    if (record.appliance_id) {
      const appliance = getAppliance(
        record.appliance_id
      );

      return appliance?.name ||
        `Appliance #${record.appliance_id}`;
    }

    return `Maintenance #${record.id}`;
  };

  const availableRecords = records.filter(
    (record) =>
      record.status === "Completed" ||
      record.maintenance_type === "DIY" ||
      record.maintenance_type === "Mechanic"
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              MAINTENANCE EXPENSES
            </span>

            <h1>
              Expenses
            </h1>

            <p>
              Track maintenance costs and see
              where your money is going.
            </p>
          </div>

          <button
            className="dashboard-primary-button"
            onClick={openAdd}
            disabled={
              availableRecords.length === 0
            }
          >
            <Plus size={18} />
            Add expense
          </button>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {/* SUMMARY */}

        <section className="expense-summary-grid">
          <SummaryCard
            icon={<WalletCards size={20} />}
            label="Total expenses"
            value={`৳${Number(
              summary.total_amount || 0
            ).toLocaleString()}`}
          />

          <SummaryCard
            icon={<Receipt size={20} />}
            label="Expense records"
            value={summary.expense_count || 0}
          />

          <SummaryCard
            icon={<Car size={20} />}
            label="Vehicle spending"
            value={`৳${expenses
              .filter(
                (expense) =>
                  expense.vehicle_id
              )
              .reduce(
                (total, expense) =>
                  total +
                  Number(
                    expense.amount || 0
                  ),
                0
              )
              .toLocaleString()}`}
          />

          <SummaryCard
            icon={<Refrigerator size={20} />}
            label="Appliance spending"
            value={`৳${expenses
              .filter(
                (expense) =>
                  expense.appliance_id
              )
              .reduce(
                (total, expense) =>
                  total +
                  Number(
                    expense.amount || 0
                  ),
                0
              )
              .toLocaleString()}`}
          />
        </section>

        {/* CATEGORY SUMMARY */}

        <section className="dashboard-section expense-summary-section">
          <div className="section-heading">
            <div>
              <span>
                CATEGORIES
              </span>

              <h2>
                Spending by category
              </h2>
            </div>
          </div>

          {summary.by_category?.length ===
          0 ? (
            <div className="empty-card small">
              <h3>
                No expense categories yet
              </h3>

              <p>
                Add maintenance expenses to
                see categorized spending.
              </p>
            </div>
          ) : (
            <div className="expense-category-grid">
              {summary.by_category.map(
                (category) => (
                  <div
                    className="expense-category-card"
                    key={
                      category.expense_category
                    }
                  >
                    <span>
                      {
                        category.expense_category
                      }
                    </span>

                    <strong>
                      ৳
                      {Number(
                        category.total_amount ||
                          0
                      ).toLocaleString()}
                    </strong>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* FILTERS */}

        <section className="expense-filter-bar">
          <div className="form-field">
            <label htmlFor="expense-asset-type">
              Asset
            </label>

            <select
              id="expense-asset-type"
              value={assetType}
              onChange={(event) => {
                setAssetType(
                  event.target.value
                );
                setSelectedAsset("");
              }}
            >
              <option value="all">
                All assets
              </option>

              <option value="vehicle">
                Vehicles
              </option>

              <option value="appliance">
                Appliances
              </option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="expense-asset">
              Specific asset
            </label>

            <select
              id="expense-asset"
              value={selectedAsset}
              onChange={(event) =>
                setSelectedAsset(
                  event.target.value
                )
              }
              disabled={
                assetType === "all"
              }
            >
              <option value="">
                All
              </option>

              {assetType === "vehicle" &&
                vehicles.map(
                  (vehicle) => (
                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      {vehicle.brand}{" "}
                      {vehicle.model}
                    </option>
                  )
                )}

              {assetType === "appliance" &&
                appliances.map(
                  (appliance) => (
                    <option
                      key={appliance.id}
                      value={appliance.id}
                    >
                      {appliance.name}
                    </option>
                  )
                )}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="expense-category">
              Category
            </label>

            <select
              id="expense-category"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(
                  event.target.value
                )
              }
            >
              <option value="">
                All categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        {/* FILTERED TOTAL */}

        <div className="expense-filtered-total">
          <span>
            Showing {visibleExpenses.length}{" "}
            expense
            {visibleExpenses.length === 1
              ? ""
              : "s"}
          </span>

          <strong>
            ৳
            {filteredTotal.toLocaleString()}
          </strong>
        </div>

        {/* HISTORY */}

        {loading ? (
          <div className="dashboard-loading">
            Loading expenses...
          </div>
        ) : visibleExpenses.length ===
          0 ? (
          <div className="empty-card">
            <WalletCards size={30} />

            <h3>
              No expenses found
            </h3>

            <p>
              Add a maintenance expense to
              start tracking costs.
            </p>

            <button
              className="dashboard-primary-button"
              onClick={openAdd}
              disabled={
                availableRecords.length === 0
              }
            >
              <Plus size={17} />
              Add expense
            </button>
          </div>
        ) : (
          <section className="expense-list">
            {visibleExpenses.map(
              (expense) => (
                <article
                  className="expense-card"
                  key={expense.id}
                >
                  <div className="expense-card-icon">
                    <WalletCards size={21} />
                  </div>

                  <div className="expense-card-content">
                    <div className="expense-card-top">
                      <div>
                        <span className="expense-category">
                          {
                            expense.expense_category
                          }
                        </span>

                        <h2>
                          {getAssetName(
                            expense
                          )}
                        </h2>

                        <p>
                          {
                            expense.maintenance_type
                          }{" "}
                          maintenance
                        </p>
                      </div>

                      <strong className="expense-amount">
                        ৳
                        {Number(
                          expense.amount || 0
                        ).toLocaleString()}
                      </strong>
                    </div>

                    <div className="expense-meta">
                      <div>
                        <span>
                          Date
                        </span>

                        <strong>
                          {
                            expense.expense_date
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Maintenance record
                        </span>

                        <strong>
                          #
                          {
                            expense.maintenance_record_id
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Description
                        </span>

                        <strong>
                          {
                            expense.description ||
                            "—"
                          }
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="expense-actions">
                    <button
                      type="button"
                      onClick={() =>
                        openEdit(expense)
                      }
                      title="Edit expense"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      className="delete-action"
                      onClick={() =>
                        deleteExpense(
                          expense
                        )
                      }
                      title="Delete expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              )
            )}
          </section>
        )}

        {/* FORM */}

        {showForm && (
          <div className="modal-backdrop">
            <div className="appliance-modal">
              <div className="modal-header">
                <div>
                  <span className="eyebrow">
                    MAINTENANCE EXPENSE
                  </span>

                  <h2>
                    {editingExpense
                      ? "Edit expense"
                      : "Add expense"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={closeForm}
                  disabled={saving}
                >
                  ×
                </button>
              </div>

              <form
                className="auth-form appliance-form"
                onSubmit={saveExpense}
              >
                <div className="form-grid">
                  <div className="form-field form-field-full">
                    <label>
                      Maintenance record
                    </label>

                    <select
                      value={
                        form.maintenance_record_id
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          maintenance_record_id:
                            event.target.value,
                        })
                      }
                      disabled={
                        saving ||
                        Boolean(
                          editingExpense
                        )
                      }
                      required
                    >
                      <option value="">
                        Select maintenance record
                      </option>

                      {availableRecords.map(
                        (record) => (
                          <option
                            key={record.id}
                            value={record.id}
                          >
                            #
                            {record.id} —{" "}
                            {getRecordLabel(
                              record
                            )}{" "}
                            —{" "}
                            {
                              record.maintenance_type
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>
                      Amount
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          amount:
                            event.target.value,
                        })
                      }
                      placeholder="4500"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Category
                    </label>

                    <input
                      type="text"
                      value={
                        form.expense_category
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          expense_category:
                            event.target.value,
                        })
                      }
                      placeholder="Parts"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Expense date
                    </label>

                    <input
                      type="date"
                      value={
                        form.expense_date
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          expense_date:
                            event.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Description
                    </label>

                    <input
                      type="text"
                      value={
                        form.description
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          description:
                            event.target.value,
                        })
                      }
                      placeholder="Oil filter and engine oil"
                    />
                  </div>
                </div>

                {error && (
                  <div className="form-error">
                    {error}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="dashboard-primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingExpense
                      ? "Save changes"
                      : "Add expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon stat-appliances">
        {icon}
      </div>

      <div className="stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}