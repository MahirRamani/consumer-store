"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShoppingCart, AlertTriangle, CreditCard } from "lucide-react"
import type { Student, CartItem } from "@/lib/types"

interface ConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading: boolean
  selectedStudent: Student | null
  cartItems: CartItem[]
}

export default function ConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  selectedStudent,
  cartItems,
}: ConfirmationModalProps) {
  const subtotal = cartItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
  const remainingBalance = selectedStudent ? selectedStudent.balance - subtotal : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Confirm Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900">Student Details</h3>
            <p className="text-sm text-blue-700">
              <strong>Name:</strong> {selectedStudent?.name || 'N/A'}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Roll Number:</strong> {selectedStudent?.rollNumber || 'N/A'}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Current Balance:</strong> ₹{selectedStudent?.balance?.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Cart Items */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Items to Purchase</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {cartItems && cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No items in cart</p>
              )}
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-green-900">Total Amount:</span>
              <span className="text-xl font-bold text-green-600">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Remaining Balance:</span>
              <span className={`text-sm font-medium ${remainingBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Warning for low balance */}
          {remainingBalance < 100 && remainingBalance >= 0 && (
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-yellow-700">Student will have low balance after this transaction.</p>
            </div>
          )}

          {/* Insufficient balance warning */}
          {remainingBalance < 0 && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">Insufficient balance! Transaction cannot be completed.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={remainingBalance < 0 || isLoading || !cartItems || cartItems.length === 0}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isLoading ? "Processing..." : "Confirm Transaction"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}




// "use client"

// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { ShoppingCart, User, CreditCard, AlertTriangle } from "lucide-react"
// import type { Student, CartItem } from "@/lib/types"

// interface ConfirmationModalProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onConfirm: () => void
//   isLoading: boolean
//   selectedStudent: Student | null
//   cartItems: CartItem[]
// }

// export default function ConfirmationModal({
//   open,
//   onOpenChange,
//   onConfirm,
//   isLoading,
//   selectedStudent,
//   cartItems,
// }: ConfirmationModalProps) {
//   const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
//   const remainingBalance = selectedStudent ? selectedStudent.balance - total : 0
//   const hasInsufficientBalance = remainingBalance < 0

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-md">
//         <DialogHeader>
//           <DialogTitle className="flex items-center text-lg font-semibold">
//             <ShoppingCart className="w-5 h-5 mr-2 text-blue-500" />
//             Confirm Transaction
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-4">
//           {/* Student Info */}
//           {selectedStudent && (
//             <div className="bg-blue-50 p-4 rounded-lg">
//               <div className="flex items-center mb-2">
//                 <User className="w-4 h-4 mr-2 text-blue-600" />
//                 <span className="font-medium text-blue-900">Student Details</span>
//               </div>
//               <p className="text-sm text-blue-800">
//                 <strong>{selectedStudent.name}</strong> (Roll: {selectedStudent.rollNumber})
//               </p>
//               <p className="text-sm text-blue-700">Current Balance: ₹{selectedStudent.balance.toFixed(2)}</p>
//             </div>
//           )}

//           {/* Cart Items */}
//           <div className="bg-gray-50 p-4 rounded-lg">
//             <h4 className="font-medium text-gray-900 mb-3">Items to Purchase</h4>
//             <div className="space-y-2 max-h-32 overflow-y-auto">
//               {cartItems.map((item) => (
//                 <div key={item.productId} className="flex justify-between items-center text-sm">
//                   <span className="text-gray-700">
//                     {item.name} × {item.quantity}
//                   </span>
//                   <span className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Transaction Summary */}
//           <div className="bg-green-50 p-4 rounded-lg">
//             <div className="flex items-center mb-2">
//               <CreditCard className="w-4 h-4 mr-2 text-green-600" />
//               <span className="font-medium text-green-900">Transaction Summary</span>
//             </div>
//             <div className="space-y-1 text-sm">
//               <div className="flex justify-between">
//                 <span className="text-green-700">Total Amount:</span>
//                 <span className="font-bold text-green-900">₹{total.toFixed(2)}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-green-700">Remaining Balance:</span>
//                 <span className={`font-medium ${hasInsufficientBalance ? "text-red-600" : "text-green-900"}`}>
//                   ₹{remainingBalance.toFixed(2)}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Warning for insufficient balance */}
//           {hasInsufficientBalance && (
//             <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
//               <div className="flex items-center">
//                 <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
//                 <span className="text-sm font-medium text-red-800">Insufficient Balance</span>
//               </div>
//               <p className="text-xs text-red-700 mt-1">
//                 The student doesn't have enough balance to complete this transaction.
//               </p>
//             </div>
//           )}

//           {/* Action Buttons */}
//           <div className="flex space-x-3 pt-4">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => onOpenChange(false)}
//               className="flex-1"
//               disabled={isLoading}
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={onConfirm}
//               disabled={hasInsufficientBalance || isLoading}
//               className="flex-1 bg-green-500 hover:bg-green-600 text-white"
//             >
//               {isLoading ? "Processing..." : "Confirm Transaction"}
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }
