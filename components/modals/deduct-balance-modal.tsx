"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Minus } from "lucide-react"

interface DeductBalanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (amount: number, reason: string) => void
  isLoading: boolean
}

export default function DeductBalanceModal({ open, onOpenChange, onConfirm, isLoading }: DeductBalanceModalProps) {
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")

  const quickAmounts = [
    { value: "10", label: "₹10" },
    { value: "25", label: "₹25" },
    { value: "50", label: "₹50" },
    { value: "100", label: "₹100" },
    { value: "200", label: "₹200" },
    { value: "500", label: "₹500" },
  ]

  const handleQuickAmount = (value: string) => {
    setAmount(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const deductAmount = Number.parseFloat(amount)

    if (isNaN(deductAmount) || deductAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0.")
      return
    }

    if (deductAmount > 5000) {
      toast.error("Maximum deduction amount is ₹5,000.")
      return
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for the deduction.")
      return
    }

    onConfirm(deductAmount, reason.trim())
  }

  const handleClose = () => {
    if (!isLoading) {
      setAmount("")
      setReason("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Minus className="w-5 h-5 mr-2 text-red-500" />
            Deduct Balance
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Amount Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Quick Select Amount</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((qa) => (
                <Button
                  key={qa.value}
                  type="button"
                  variant={amount === qa.value ? "default" : "outline"}
                  onClick={() => handleQuickAmount(qa.value)}
                  className={`text-sm ${amount === qa.value ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                >
                  {qa.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <Label htmlFor="customAmount">Deduction Amount (₹)</Label>
            <Input
              id="customAmount"
              type="number"
              step="0.01"
              min="1"
              max="5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum: ₹1, Maximum: ₹5,000</p>
          </div>

          {/* Reason Input */}
          <div>
            <Label htmlFor="reason">Reason for Deduction *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for this deduction..."
              className="min-h-[80px]"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{reason.length}/200 characters</p>
          </div>

          {/* Amount Preview */}
          {amount && !isNaN(Number.parseFloat(amount)) && Number.parseFloat(amount) > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount to deduct:</span>
                <span className="text-lg font-bold text-red-600">-₹{Number.parseFloat(amount).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !amount || Number.parseFloat(amount) <= 0 || !reason.trim()}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              <Minus className="w-4 h-4 mr-2" />
              {isLoading ? "Processing..." : "Deduct Balance"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
