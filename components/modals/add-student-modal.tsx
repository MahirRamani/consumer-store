"use client"

import type React from "react"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface AddStudentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddStudentModal({ open, onOpenChange }: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    standard: "",
    year: "",
    balance: 0,
  })
  const queryClient = useQueryClient()

  const addStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...studentData,
          year: Number.parseInt(studentData.year),
          balance: studentData.balance,
          status: "active",
        }),
      })
      if (!response.ok) throw new Error("Failed to add student")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
      toast.success("New student has been added successfully.")
      resetForm()
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Failed to add student. Please check the details and try again.")
    },
  })

  const resetForm = () => {
    setFormData({
      name: "",
      rollNumber: "",
      standard: "",
      year: "",
      balance: 0,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.rollNumber || !formData.standard || !formData.year) {
      toast.error("Please fill in all required fields.")
      return
    }

    addStudentMutation.mutate(formData)
  }

  const handleClose = () => {
    if (!addStudentMutation.isPending) {
      resetForm()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="studentName">Full Name *</Label>
            <Input
              id="studentName"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter student's full name"
              required
            />
          </div>

          <div>
            <Label htmlFor="rollNumber">Roll Number *</Label>
            <Input
              id="rollNumber"
              value={formData.rollNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, rollNumber: e.target.value }))}
              placeholder="e.g., STD2021045"
              required
            />
          </div>

          <div>
            <Label htmlFor="standard">Standard *</Label>
            <Select
              value={formData.standard}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, standard: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select standard" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st">1st Standard</SelectItem>
                <SelectItem value="2nd">2nd Standard</SelectItem>
                <SelectItem value="3rd">3rd Standard</SelectItem>
                <SelectItem value="4th">4th Standard</SelectItem>
                <SelectItem value="5th">5th Standard</SelectItem>
                <SelectItem value="6th">6th Standard</SelectItem>
                <SelectItem value="7th">7th Standard</SelectItem>
                <SelectItem value="8th">8th Standard</SelectItem>
                <SelectItem value="9th">9th Standard</SelectItem>
                <SelectItem value="10th">10th Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="year">Year *</Label>
            <Select value={formData.year} onValueChange={(value) => setFormData((prev) => ({ ...prev, year: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
                <SelectItem value="2019">2019</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="balance">Initial Balance (₹)</Label>
            <Input
              id="balance"
              type="number"
              step={1}
              // min={0}
              value={formData.balance}
              onChange={(e) => setFormData((prev) => ({ ...prev, balance: Number.parseInt(e.target.value)}))}
              placeholder="0"
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={addStudentMutation.isPending}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {addStudentMutation.isPending ? "Adding..." : "Add Student"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={addStudentMutation.isPending}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
