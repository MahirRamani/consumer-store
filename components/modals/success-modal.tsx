"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Printer, X } from "lucide-react"

interface SuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionData: {
    student: string
    amount: number
    remainingBalance: number
    id: string
    items: Array<{ name: string; quantity: number; price: number }>
  } | null
  onClose: () => void
}

export default function SuccessModal({ open, onOpenChange, transactionData, onClose }: SuccessModalProps) {
  const handlePrintReceipt = () => {
    if (!transactionData) return

    const receiptContent = `
      HOSTEL STORE RECEIPT
      ====================
      
      Transaction ID: ${transactionData.id}
      Date: ${new Date().toLocaleDateString()}
      Time: ${new Date().toLocaleTimeString()}
      
      Student: ${transactionData.student}
      
      ITEMS:
      ${transactionData.items
        .map((item) => `${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}`)
        .join("\n")}
      
      ------------------
      Total: ₹${transactionData.amount.toFixed(2)}
      Remaining Balance: ₹${transactionData.remainingBalance.toFixed(2)}
      
      Thank you for your purchase!
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${transactionData.id}</title>
            <style>
              body { font-family: monospace; padding: 20px; line-height: 1.4; }
              .receipt { max-width: 300px; margin: 0 auto; }
              .center { text-align: center; }
              .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="center">
                <h2>HOSTEL STORE</h2>
                <p>RECEIPT</p>
              </div>
              <div class="line"></div>
              <p><strong>Transaction ID:</strong> ${transactionData.id}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
              <p><strong>Student:</strong> ${transactionData.student}</p>
              <div class="line"></div>
              <p><strong>ITEMS:</strong></p>
              ${transactionData.items
                .map(
                  (item) =>
                    `<p>${item.name} x${item.quantity}<br>₹${item.price.toFixed(2)} each = ₹${(item.price * item.quantity).toFixed(2)}</p>`,
                )
                .join("")}
              <div class="line"></div>
              <p><strong>Total: ₹${transactionData.amount.toFixed(2)}</strong></p>
              <p>Remaining Balance: ₹${transactionData.remainingBalance.toFixed(2)}</p>
              <div class="center">
                <p>Thank you for your purchase!</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (!transactionData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-green-600">
            <CheckCircle className="w-6 h-6 mr-2" />
            Transaction Successful
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Transaction ID</p>
              <p className="font-mono font-bold text-lg">{transactionData.id}</p>
            </div>
          </div>

          {/* Student Info */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Student:</span>
              <span className="font-medium">{transactionData.student}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Charged:</span>
              <span className="font-bold text-red-600">₹{transactionData.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Remaining Balance:</span>
              <span className="font-bold text-green-600">₹{transactionData.remainingBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="border-t pt-4">
            <p className="font-medium text-gray-900 mb-2">Items Purchased:</p>
            <div className="space-y-1">
              {transactionData.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button onClick={handlePrintReceipt} variant="outline" className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
            <Button onClick={onClose} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
