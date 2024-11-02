import React, { useState, useEffect } from 'react';
import { Plus, Download, FileText, Search, Trash2, DollarSign, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import ReceiptProcessor from './components/ReceiptProcessor';

const TRANSACTION_TYPES = [
  'Advertising',
  'Bank Charges & Interest',
  'Insurance',
  'Meals & Entertainment',
  'Professional Fees',
  'Travel',
  'Office Supplies',
  'Utilities',
  'Rent',
  'Other'
] as const;

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: typeof TRANSACTION_TYPES[number];
  notes?: string;
}

interface NewTransaction {
  date: string;
  description: string;
  amount: string | number;
  type: typeof TRANSACTION_TYPES[number];
  notes: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [newTransaction, setNewTransaction] = useState<NewTransaction>({
    date: '',
    description: '',
    amount: '',
    type: 'Other',
    notes: ''
  });

  const [filter, setFilter] = useState({
    search: '',
    startDate: '',
    endDate: '',
    type: ''
  });

  const [activeView, setActiveView] = useState<'transactions' | 'reports'>('transactions');

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleTransactionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReceiptProcessed = (receiptData: { totalAmount?: number; date?: string; merchantName?: string; category?: string }) => {
    if (receiptData.totalAmount && receiptData.date) {
      setNewTransaction(prev => ({
        ...prev,
        amount: receiptData.totalAmount,
        date: receiptData.date,
        description: receiptData.merchantName || '',
        type: (receiptData.category as typeof TRANSACTION_TYPES[number]) || 'Other'
      }));
    }
  };

  const addTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.date || !newTransaction.description || !newTransaction.amount || !newTransaction.type) {
      alert('Please fill in all required fields');
      return;
    }

    setTransactions(prev => [
      ...prev,
      {
        ...newTransaction,
        id: Date.now(),
        amount: Number(newTransaction.amount)
      }
    ]);

    setNewTransaction({
      date: '',
      description: '',
      amount: '',
      type: 'Other',
      notes: ''
    });
  };

  const deleteTransaction = (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(filter.search.toLowerCase()) ||
                         transaction.type.toLowerCase().includes(filter.search.toLowerCase());
    const matchesDateRange = (!filter.startDate || transaction.date >= filter.startDate) &&
                           (!filter.endDate || transaction.date <= filter.endDate);
    const matchesType = !filter.type || transaction.type === filter.type;
    
    return matchesSearch && matchesDateRange && matchesType;
  });

  const calculateTotals = () => {
    const expensesByType = filteredTransactions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalExpenses = Object.values(expensesByType).reduce((sum, amount) => sum + amount, 0);

    return {
      expensesByType,
      totalExpenses
    };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Bookkeeping System</h1>
          <button 
            onClick={() => setActiveView(activeView === 'transactions' ? 'reports' : 'transactions')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {activeView === 'transactions' ? <PieChart size={20} /> : <FileText size={20} />}
            {activeView === 'transactions' ? 'View Reports' : 'View Transactions'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-gray-600">Total Expenses</h3>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalExpenses)}</p>
          </div>
        </div>

        {activeView === 'transactions' ? (
          <>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Record Expense</h2>
                <ReceiptProcessor onReceiptProcessed={handleReceiptProcessed} />
              </div>
              <form onSubmit={addTransaction} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input
                    type="date"
                    name="date"
                    value={newTransaction.date}
                    onChange={handleTransactionChange}
                    className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="description"
                    value={newTransaction.description}
                    onChange={handleTransactionChange}
                    placeholder="Description"
                    className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <input
                    type="number"
                    name="amount"
                    value={newTransaction.amount}
                    onChange={handleTransactionChange}
                    placeholder="Amount"
                    step="0.01"
                    min="0"
                    className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <select
                    name="type"
                    value={newTransaction.type}
                    onChange={handleTransactionChange}
                    className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {TRANSACTION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <textarea
                    name="notes"
                    value={newTransaction.notes}
                    onChange={handleTransactionChange}
                    placeholder="Notes (optional)"
                    className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
                    >
                      <Plus size={20} /> Add Expense
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="border rounded p-2"
                />
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="border rounded p-2"
                />
                <input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="border rounded p-2"
                />
                <select
                  value={filter.type}
                  onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                  className="border rounded p-2"
                >
                  <option value="">All Types</option>
                  {TRANSACTION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-4 text-left">Date</th>
                      <th className="p-4 text-left">Description</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4 text-left">Type</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(transaction => (
                      <tr key={transaction.id} className="border-t">
                        <td className="p-4">{transaction.date}</td>
                        <td className="p-4">{transaction.description}</td>
                        <td className="p-4 text-right">{formatCurrency(transaction.amount)}</td>
                        <td className="p-4">{transaction.type}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Expenses by Category</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={Object.entries(totals.expensesByType).map(([name, value]) => ({ name, value }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}