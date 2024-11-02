import React, { useState } from 'react';
import { Receipt, Loader2 } from 'lucide-react';

interface ReceiptData {
  totalAmount?: number;
  date?: string;
  merchantName?: string;
  category?: string;
}

interface Props {
  onReceiptProcessed: (data: ReceiptData) => void;
}

export default function ReceiptProcessor({ onReceiptProcessed }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processReceipt = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("document", file);

    try {
      const response = await fetch("https://api.mindee.net/v1/products/mindee/invoices/v4/predict", {
        method: "POST",
        headers: {
          "Authorization": "Token e0a235bf8d12e428844b46f699ed2205"
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to process receipt: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Mindee API Response:', result);

      const prediction = result.document?.inference?.prediction;
      
      if (!prediction) {
        throw new Error('No prediction data found in response');
      }

      // Extract merchant name from supplier_name or company_registration fields
      let merchantName = '';
      if (prediction.supplier?.supplier_name?.value) {
        merchantName = prediction.supplier.supplier_name.value;
      } else if (prediction.supplier_name?.value) {
        merchantName = prediction.supplier_name.value;
      } else if (prediction.company_registration?.value) {
        merchantName = prediction.company_registration.value;
      }

      // Get the date in the correct format
      let date = new Date().toISOString().split('T')[0];
      if (prediction.date?.value) {
        try {
          const parsedDate = new Date(prediction.date.value);
          date = parsedDate.toISOString().split('T')[0];
        } catch (e) {
          console.warn('Failed to parse date:', e);
        }
      }

      // Get the total amount
      const totalAmount = prediction.total_incl_tax?.value || 
                         prediction.total_amount?.value || 
                         prediction.total?.value || 0;

      const receiptData: ReceiptData = {
        totalAmount,
        date,
        merchantName,
        category: 'Other'
      };

      console.log('Processed Receipt Data:', receiptData);
      onReceiptProcessed(receiptData);
    } catch (err) {
      console.error('Receipt processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processReceipt(file);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
        id="receipt-upload"
        disabled={isProcessing}
      />
      <label
        htmlFor="receipt-upload"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors ${
          isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Receipt className="h-5 w-5" />
        )}
        <span>{isProcessing ? 'Processing...' : 'Scan Receipt'}</span>
      </label>
      {error && (
        <div className="absolute top-full left-0 mt-2 text-sm text-red-500 bg-red-50 px-3 py-1 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}