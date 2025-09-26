"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Save, Loader2 } from "lucide-react"
import { clausesApi } from "@/services/api"

interface ClauseTemplate {
  id: number
  clause_code: string
  title: string
  type: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ClauseDetailModalProps {
  clause: ClauseTemplate | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface FormData {
  clause_code: string
  title: string
  type: string
  content: string
  is_active: boolean
}

interface FormErrors {
  clause_code?: string
  title?: string
  type?: string
  content?: string
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  })
}

export function ClauseDetailModal({ clause, isOpen, onClose, onSuccess }: ClauseDetailModalProps) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    clause_code: "",
    title: "",
    type: "",
    content: "",
    is_active: true,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!clause) return null

  const handleEditClick = () => {
    setFormData({
      clause_code: clause.clause_code,
      title: clause.title,
      type: clause.type,
      content: clause.content,
      is_active: clause.is_active,
    })
    setFormErrors({})
    setIsUpdateDialogOpen(true)
  }

  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!formData.clause_code.trim()) {
      errors.clause_code = "Clause code is required"
    }

    if (!formData.title.trim()) {
      errors.title = "Title is required"
    }

    if (!formData.type.trim()) {
      errors.type = "Type is required"
    }

    if (!formData.content.trim()) {
      errors.content = "Content is required"
    }

    if (formData.content.trim().length < 10) {
      errors.content = "Content must be at least 10 characters long"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpdateClause = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await clausesApi.updateClause(`${clause.id}`, formData)

      handleCloseUpdateDialog()
      onSuccess?.() // Ensure onSuccess is called after a successful update
      onClose()
    } catch (error) {
      console.error("Error updating clause:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseUpdateDialog = () => {
    setFormData({
      clause_code: "",
      title: "",
      type: "",
      content: "",
      is_active: true,
    })
    setFormErrors({})
    setIsSubmitting(false)
    setIsUpdateDialogOpen(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">{clause.title}</DialogTitle>
            <DialogDescription className="mt-2 text-muted-foreground">
              Clause Details and Information
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Clause ID</p>
                  <p className="text-gray-900">{clause.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Type</p>
                  <p className="text-gray-900">{clause.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <Badge
                    className={
                      clause.is_active
                        ? "bg-blue-500 text-white"
                        : "bg-red-500 text-white"
                    }
                  >
                    {clause.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Created At</p>
                  <p className="text-gray-900">{formatDate(clause.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Last Modified</p>
                  <p className="text-gray-900">{formatDate(clause.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Clause Content */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Clause Content</h3>
              <div className="whitespace-pre-wrap text-sm text-gray-900 bg-gray-50 p-4 rounded-md">
                {clause.content}
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent>
                    <p className="text-sm text-blue-600">This clause has been used in 0 contracts.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="text-sm text-green-600">Current version: 1.0</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button className="bg-white text-black hover:bg-gray-50" onClick={onClose}>
              Close
            </Button>
            <Button
              className="bg-gray-900 hover:bg-gray-800 text-white"
              style={{ backgroundColor: "#137fec", color: "#fff" }}
              onClick={handleEditClick}
            >
              Edit Clause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Update Clause</DialogTitle>
            <DialogDescription className="mt-2 text-muted-foreground">
              Modify the clause details below
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clause Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Clause Code *</label>
                <Input
                  value={formData.clause_code}
                  onChange={(e) => handleFormChange("clause_code", e.target.value)}
                  placeholder="e.g., PAYMENT_001"
                  className={`bg-white ${formErrors.clause_code ? "border-red-500" : "border-gray-300"}`}
                />
                {formErrors.clause_code && <p className="text-sm text-red-600">{formErrors.clause_code}</p>}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  placeholder="e.g., Standard Payment Terms"
                  className={`bg-white ${formErrors.title ? "border-red-500" : "border-gray-300"}`}
                />
                {formErrors.title && <p className="text-sm text-red-600">{formErrors.title}</p>}
              </div>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Type *</label>
              <Input
                value={formData.type}
                onChange={(e) => handleFormChange("type", e.target.value)}
                placeholder="e.g., Payment, Legal, Terms"
                className={`bg-white ${formErrors.type ? "border-red-500" : "border-gray-300"}`}
              />
              {formErrors.type && <p className="text-sm text-red-600">{formErrors.type}</p>}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => handleFormChange("content", e.target.value)}
                placeholder="Enter the detailed clause content..."
                rows={6}
                className={`w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 ${formErrors.content ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {formErrors.content && <p className="text-sm text-red-600">{formErrors.content}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button className="bg-white text-black hover:bg-gray-50" onClick={handleCloseUpdateDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateClause}
              disabled={isSubmitting}
              className="bg-gray-900 hover:bg-gray-800 text-white"
              style={{ backgroundColor: "#137fec", color: "#fff" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Clause
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
