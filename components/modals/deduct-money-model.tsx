"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { IndianRupee } from 'lucide-react'

interface DeductMoneyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (amount: number) => void
  isLoading: boolean
}

export default function DeductMoneyModal({ open, onOpenChange, onConfirm, isLoading }: DeductMoneyModalProps) {
  const [amount, setAmount] = useState("")
  const [quickAmount, setQuickAmount] = useState("")

  const quickAmounts = [
    { value: "50", label: "₹50" },
    { value: "100", label: "₹100" },
    { value: "250", label: "₹250" },
    { value: "500", label: "₹500" },
    { value: "1000", label: "₹1000" },
    { value: "2000", label: "₹2000" },
  ]

  const handleQuickAmount = (value: string) => {
    setQuickAmount(value)
    setAmount(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const deductAmount = Number.parseFloat(amount)

    if (isNaN(deductAmount) || deductAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0.")
      return
    }

    if (deductAmount > 10000) {
      toast.error("Maximum top-up amount is ₹10,000.")
      return
    }

    onConfirm(deductAmount)
  }

  const handleClose = () => {
    if (!isLoading) {
      setAmount("")
      setQuickAmount("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <IndianRupee className="w-5 h-5 mr-2 text-green-500" />
            Deduct Money
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
                  variant={quickAmount === qa.value ? "default" : "outline"}
                  onClick={() => handleQuickAmount(qa.value)}
                  className={`text-sm ${quickAmount === qa.value ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
                >
                  {qa.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <Label htmlFor="customAmount">Custom Amount (₹)</Label>
            <Input
              id="customAmount"
              type="number"
              // step=""
              min="1"
              max="10000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setQuickAmount("")
              }}
              placeholder="Enter amount"
              className="text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum: ₹1, Maximum: ₹10,000</p>
          </div>

          {/* Amount Preview */}
          {amount && !isNaN(Number.parseFloat(amount)) && Number.parseFloat(amount) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount to deduct:</span>
                <span className="text-lg font-bold text-green-600">₹{Number.parseFloat(amount).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !amount || Number.parseFloat(amount) <= 0}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              <IndianRupee className="w-4 h-4 mr-2" />
              {isLoading ? "Processing..." : "Top Up Balance"}
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
