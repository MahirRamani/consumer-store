"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit } from "lucide-react"

interface EditStudentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: any) => void
  isLoading: boolean
  student: {
    id: string
    name: string
    rollNumber: string
    standard: string
    year: number
  } | null
}

export default function EditStudentModal({ open, onOpenChange, onConfirm, isLoading, student }: EditStudentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    standard: "",
    year: "",
  })

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        rollNumber: student.rollNumber,
        standard: student.standard,
        year: student.year.toString(),
      })
    }
  }, [student])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim() && formData.rollNumber.trim() && formData.standard && formData.year) {
      onConfirm({
        name: formData.name.trim(),
        rollNumber: formData.rollNumber.trim(),
        standard: formData.standard,
        year: Number.parseInt(formData.year),
      })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setFormData({
      name: "",
      rollNumber: "",
      standard: "",
      year: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="w-5 h-5 mr-2" />
            Edit Student Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
              Student Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter student name"
              required
            />
          </div>

          <div>
            <Label htmlFor="rollNumber" className="text-sm font-medium text-gray-700 mb-2 block">
              Roll Number *
            </Label>
            <Input
              id="rollNumber"
              type="text"
              value={formData.rollNumber}
              onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              placeholder="Enter roll number"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="standard" className="text-sm font-medium text-gray-700 mb-2 block">
                Standard *
              </Label>
              <Select
                value={formData.standard}
                onValueChange={(value) => setFormData({ ...formData, standard: value })}
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
              <Label htmlFor="year" className="text-sm font-medium text-gray-700 mb-2 block">
                Year *
              </Label>
              <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
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
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-transparent"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !formData.name.trim() ||
                !formData.rollNumber.trim() ||
                !formData.standard ||
                !formData.year ||
                isLoading
              }
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isLoading ? "Updating..." : "Update Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
