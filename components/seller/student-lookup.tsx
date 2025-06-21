"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from 'lucide-react'
import { toast } from "sonner"
import type { Student } from "@/lib/types"

interface StudentLookupProps {
  selectedStudent: Student | null
  onStudentSelect: (student: Student | null) => void
}

export default function StudentLookup({ selectedStudent, onStudentSelect }: StudentLookupProps) {
  const [rollNumber, setRollNumber] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const searchStudent = async () => {
    if (!rollNumber.trim()) {
      toast.error("Please enter a roll number")
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/students/roll/${rollNumber.trim()}`)
      if (response.ok) {
        const student = await response.json()
        onStudentSelect(student)
        toast.success(`${student.name} selected successfully`)
      } else {
        toast.error("No student found with this roll number")
        onStudentSelect(null)
      }
    } catch (error) {
      toast.error("Failed to search for student")
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchStudent()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Student Lookup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-4">
          <Input
            placeholder="Enter roll number (e.g., STD2021045)"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 text-lg"
          />
          <Button
            onClick={searchStudent}
            disabled={isSearching}
            className="bg-green-500 hover:bg-green-600 text-white px-6"
          >
            <Search className="w-4 h-4 mr-2" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {selectedStudent && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold">
                  {selectedStudent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedStudent.name}</h4>
                  <p className="text-sm text-gray-600">{selectedStudent.rollNumber}</p>
                  <p className="text-xs text-gray-500">{selectedStudent.standard}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-green-500">₹{selectedStudent.balance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
